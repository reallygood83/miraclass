#!/bin/bash

# MiraClass 프로덕션 배포 스크립트
# 사용법: ./scripts/deploy.sh [환경]
# 예시: ./scripts/deploy.sh production

set -e  # 오류 발생 시 스크립트 중단

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로그 함수
log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 환경 변수 설정
ENVIRONMENT=${1:-production}
PROJECT_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR="$PROJECT_ROOT/backups/$DATE"

log_info "MiraClass 배포 시작 - 환경: $ENVIRONMENT"
log_info "프로젝트 루트: $PROJECT_ROOT"

# 환경 파일 확인
if [ ! -f "$PROJECT_ROOT/.env.$ENVIRONMENT" ]; then
    log_error ".env.$ENVIRONMENT 파일이 존재하지 않습니다."
    log_info "$PROJECT_ROOT/.env.production.example 파일을 참고하여 생성해주세요."
    exit 1
fi

# Docker 및 Docker Compose 확인
if ! command -v docker &> /dev/null; then
    log_error "Docker가 설치되어 있지 않습니다."
    exit 1
fi

if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose가 설치되어 있지 않습니다."
    exit 1
fi

# 사전 배포 체크
log_info "사전 배포 체크 수행 중..."

# Git 상태 확인
if [ -d "$PROJECT_ROOT/.git" ]; then
    if [ -n "$(git status --porcelain)" ]; then
        log_warning "커밋되지 않은 변경사항이 있습니다."
        read -p "계속 진행하시겠습니까? (y/N): " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            log_info "배포가 취소되었습니다."
            exit 1
        fi
    fi
    
    CURRENT_BRANCH=$(git branch --show-current)
    CURRENT_COMMIT=$(git rev-parse HEAD)
    log_info "현재 브랜치: $CURRENT_BRANCH"
    log_info "현재 커밋: $CURRENT_COMMIT"
fi

# 백업 디렉토리 생성
log_info "백업 디렉토리 생성: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# 기존 서비스 백업 (운영 중인 경우)
if docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" ps | grep -q "Up"; then
    log_info "기존 서비스 백업 중..."
    
    # 데이터베이스 백업
    log_info "PostgreSQL 백업 중..."
    docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" exec -T postgres pg_dump -U postgres connect_db_prod > "$BACKUP_DIR/postgres_backup.sql" || log_warning "PostgreSQL 백업 실패"
    
    # Neo4j 백업
    log_info "Neo4j 백업 중..."
    docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" exec -T neo4j neo4j-admin database dump neo4j --to-path=/backups || log_warning "Neo4j 백업 실패"
    
    # Redis 백업
    log_info "Redis 백업 중..."
    docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" exec -T redis redis-cli --rdb /backups/redis_backup.rdb || log_warning "Redis 백업 실패"
    
    log_success "백업 완료: $BACKUP_DIR"
fi

# 환경 파일 복사
log_info "환경 설정 파일 준비 중..."
cp "$PROJECT_ROOT/.env.$ENVIRONMENT" "$PROJECT_ROOT/.env"

# Docker 이미지 빌드
log_info "Docker 이미지 빌드 중..."
docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" build --no-cache

# 기존 서비스 중지 (Graceful shutdown)
if docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" ps | grep -q "Up"; then
    log_info "기존 서비스 중지 중..."
    docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" down --timeout 30
fi

# 새 서비스 시작
log_info "새 서비스 시작 중..."
docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" up -d

# 서비스 헬스체크
log_info "서비스 헬스체크 수행 중..."
sleep 30  # 서비스 시작 대기

# 각 서비스 상태 확인
services=("postgres" "neo4j" "redis" "backend" "ai-engine")
failed_services=()

for service in "${services[@]}"; do
    log_info "$service 상태 확인 중..."
    if docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" ps "$service" | grep -q "Up (healthy)\|Up"; then
        log_success "$service 정상 동작 중"
    else
        log_error "$service 시작 실패"
        failed_services+=("$service")
    fi
done

# API 엔드포인트 테스트
log_info "API 엔드포인트 테스트 중..."
if curl -f -s http://localhost:3001/health > /dev/null; then
    log_success "백엔드 API 정상 응답"
else
    log_error "백엔드 API 응답 실패"
    failed_services+=("backend-api")
fi

if curl -f -s http://localhost:5000/health > /dev/null; then
    log_success "AI 엔진 API 정상 응답"
else
    log_error "AI 엔진 API 응답 실패"
    failed_services+=("ai-engine-api")
fi

# 배포 결과 확인
if [ ${#failed_services[@]} -eq 0 ]; then
    log_success "배포 완료! 모든 서비스가 정상적으로 동작 중입니다."
    
    # 배포 정보 저장
    cat > "$PROJECT_ROOT/DEPLOYMENT_INFO.txt" << EOF
배포 정보
========
환경: $ENVIRONMENT
배포 시간: $(date)
브랜치: ${CURRENT_BRANCH:-"unknown"}
커밋: ${CURRENT_COMMIT:-"unknown"}
백업 위치: $BACKUP_DIR

서비스 상태:
EOF
    docker-compose -f "$PROJECT_ROOT/docker-compose.prod.yml" ps >> "$PROJECT_ROOT/DEPLOYMENT_INFO.txt"
    
    log_info "배포 정보가 DEPLOYMENT_INFO.txt에 저장되었습니다."
    
else
    log_error "배포 중 일부 서비스에서 문제가 발생했습니다: ${failed_services[*]}"
    log_info "로그를 확인해주세요: docker-compose -f docker-compose.prod.yml logs [서비스명]"
    
    # 롤백 옵션 제공
    read -p "이전 버전으로 롤백하시겠습니까? (y/N): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        log_info "롤백 수행 중..."
        # 여기에 롤백 로직 추가
        log_warning "롤백 기능은 아직 구현되지 않았습니다. 수동으로 이전 백업을 복원해주세요."
    fi
    
    exit 1
fi

# 정리 작업
log_info "정리 작업 수행 중..."
docker system prune -f

# 모니터링 알림 (선택사항)
if [ -n "$SLACK_WEBHOOK_URL" ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"MiraClass 배포 완료 - 환경: $ENVIRONMENT, 시간: $(date)\"}" \
        "$SLACK_WEBHOOK_URL" || log_warning "Slack 알림 전송 실패"
fi

log_success "배포 스크립트 실행 완료!"
log_info "서비스 URL:"
log_info "  - 대시보드: https://dashboard.connect.nsoz.kr"
log_info "  - API: https://api.connect.nsoz.kr"
log_info "  - 모니터링: http://localhost:9090 (Prometheus)"
log_info "  - 그라파나: http://localhost:3001 (Grafana)"

exit 0