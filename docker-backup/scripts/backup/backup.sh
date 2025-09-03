#!/bin/bash

# MiraClass 백업 스크립트
# 사용법: ./scripts/backup/backup.sh [백업타입]
# 백업타입: daily, weekly, monthly, manual

set -e

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# 로그 함수
log_info() {
    echo -e "${BLUE}[INFO]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $(date '+%Y-%m-%d %H:%M:%S') - $1"
}

# 환경 변수 설정
BACKUP_TYPE=${1:-daily}
PROJECT_ROOT=$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_BASE_DIR="$PROJECT_ROOT/backups"
BACKUP_DIR="$BACKUP_BASE_DIR/$BACKUP_TYPE/$DATE"
LOG_FILE="$BACKUP_BASE_DIR/logs/backup_$DATE.log"

# 로그 디렉토리 생성
mkdir -p "$BACKUP_BASE_DIR/logs"
mkdir -p "$BACKUP_DIR"

# 로그 파일로 출력 리다이렉션
exec 1> >(tee -a "$LOG_FILE")
exec 2> >(tee -a "$LOG_FILE" >&2)

log_info "MiraClass 백업 시작 - 타입: $BACKUP_TYPE"
log_info "백업 디렉토리: $BACKUP_DIR"

# 환경 변수 로드
if [ -f "$PROJECT_ROOT/.env.production" ]; then
    source "$PROJECT_ROOT/.env.production"
elif [ -f "$PROJECT_ROOT/.env" ]; then
    source "$PROJECT_ROOT/.env"
else
    log_error "환경 변수 파일을 찾을 수 없습니다."
    exit 1
fi

# Docker Compose 파일 확인
COMPOSE_FILE="$PROJECT_ROOT/docker-compose.prod.yml"
if [ ! -f "$COMPOSE_FILE" ]; then
    COMPOSE_FILE="$PROJECT_ROOT/docker-compose.yml"
fi

if [ ! -f "$COMPOSE_FILE" ]; then
    log_error "Docker Compose 파일을 찾을 수 없습니다."
    exit 1
fi

# 백업 함수들
backup_postgres() {
    log_info "PostgreSQL 백업 시작"
    
    local postgres_backup_dir="$BACKUP_DIR/postgres"
    mkdir -p "$postgres_backup_dir"
    
    # 전체 데이터베이스 백업
    if docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$postgres_backup_dir/full_backup.sql"; then
        log_success "PostgreSQL 전체 백업 완료"
    else
        log_error "PostgreSQL 전체 백업 실패"
        return 1
    fi
    
    # 스키마만 백업
    if docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_dump -U "$POSTGRES_USER" -s "$POSTGRES_DB" > "$postgres_backup_dir/schema_only.sql"; then
        log_success "PostgreSQL 스키마 백업 완료"
    else
        log_warning "PostgreSQL 스키마 백업 실패"
    fi
    
    # 데이터만 백업
    if docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_dump -U "$POSTGRES_USER" -a "$POSTGRES_DB" > "$postgres_backup_dir/data_only.sql"; then
        log_success "PostgreSQL 데이터 백업 완료"
    else
        log_warning "PostgreSQL 데이터 백업 실패"
    fi
    
    # 백업 파일 압축
    cd "$postgres_backup_dir"
    tar -czf "postgres_backup_$DATE.tar.gz" *.sql
    rm *.sql
    
    log_success "PostgreSQL 백업 압축 완료"
}

backup_neo4j() {
    log_info "Neo4j 백업 시작"
    
    local neo4j_backup_dir="$BACKUP_DIR/neo4j"
    mkdir -p "$neo4j_backup_dir"
    
    # Neo4j 데이터베이스 덤프
    if docker-compose -f "$COMPOSE_FILE" exec -T neo4j neo4j-admin database dump neo4j --to-path=/tmp; then
        # 덤프 파일을 호스트로 복사
        docker cp $(docker-compose -f "$COMPOSE_FILE" ps -q neo4j):/tmp/neo4j.dump "$neo4j_backup_dir/neo4j_$DATE.dump"
        log_success "Neo4j 백업 완료"
    else
        log_error "Neo4j 백업 실패"
        return 1
    fi
    
    # 그래프 통계 내보내기
    if docker-compose -f "$COMPOSE_FILE" exec -T neo4j cypher-shell -u "$NEO4J_USERNAME" -p "$NEO4J_PASSWORD" "CALL db.stats.retrieve('GRAPH')" > "$neo4j_backup_dir/graph_stats_$DATE.txt"; then
        log_success "Neo4j 통계 백업 완료"
    else
        log_warning "Neo4j 통계 백업 실패"
    fi
}

backup_redis() {
    log_info "Redis 백업 시작"
    
    local redis_backup_dir="$BACKUP_DIR/redis"
    mkdir -p "$redis_backup_dir"
    
    # Redis RDB 백업
    if docker-compose -f "$COMPOSE_FILE" exec -T redis redis-cli -a "$REDIS_PASSWORD" --rdb "$redis_backup_dir/redis_$DATE.rdb" BGSAVE; then
        # RDB 파일 복사
        docker cp $(docker-compose -f "$COMPOSE_FILE" ps -q redis):/data/dump.rdb "$redis_backup_dir/redis_$DATE.rdb"
        log_success "Redis 백업 완료"
    else
        log_error "Redis 백업 실패"
        return 1
    fi
    
    # Redis 설정 백업
    if docker-compose -f "$COMPOSE_FILE" exec -T redis redis-cli -a "$REDIS_PASSWORD" CONFIG GET '*' > "$redis_backup_dir/redis_config_$DATE.txt"; then
        log_success "Redis 설정 백업 완료"
    else
        log_warning "Redis 설정 백업 실패"
    fi
}

backup_application_data() {
    log_info "애플리케이션 데이터 백업 시작"
    
    local app_backup_dir="$BACKUP_DIR/application"
    mkdir -p "$app_backup_dir"
    
    # 업로드된 파일들 백업
    if [ -d "$PROJECT_ROOT/uploads" ]; then
        cp -r "$PROJECT_ROOT/uploads" "$app_backup_dir/"
        log_success "업로드 파일 백업 완료"
    fi
    
    # AI 모델 백업
    if [ -d "$PROJECT_ROOT/ai-engine/models" ]; then
        cp -r "$PROJECT_ROOT/ai-engine/models" "$app_backup_dir/"
        log_success "AI 모델 백업 완료"
    fi
    
    # 로그 파일 백업
    if [ -d "$PROJECT_ROOT/logs" ]; then
        cp -r "$PROJECT_ROOT/logs" "$app_backup_dir/"
        log_success "로그 파일 백업 완료"
    fi
    
    # 설정 파일 백업
    cp "$PROJECT_ROOT/.env.production" "$app_backup_dir/" 2>/dev/null || true
    cp "$PROJECT_ROOT/docker-compose.prod.yml" "$app_backup_dir/" 2>/dev/null || true
    cp -r "$PROJECT_ROOT/nginx" "$app_backup_dir/" 2>/dev/null || true
    
    log_success "애플리케이션 데이터 백업 완료"
}

upload_to_s3() {
    if [ -n "$AWS_ACCESS_KEY_ID" ] && [ -n "$BACKUP_S3_BUCKET" ]; then
        log_info "S3 업로드 시작"
        
        # AWS CLI 확인
        if ! command -v aws &> /dev/null; then
            log_warning "AWS CLI가 설치되어 있지 않습니다. S3 업로드를 건너뜁니다."
            return 0
        fi
        
        # 백업 파일 압축
        cd "$BACKUP_BASE_DIR"
        tar -czf "miraclass_backup_${BACKUP_TYPE}_$DATE.tar.gz" "$BACKUP_TYPE/$DATE"
        
        # S3 업로드
        if aws s3 cp "miraclass_backup_${BACKUP_TYPE}_$DATE.tar.gz" "s3://$BACKUP_S3_BUCKET/miraclass/"; then
            log_success "S3 업로드 완료"
            rm "miraclass_backup_${BACKUP_TYPE}_$DATE.tar.gz"
        else
            log_error "S3 업로드 실패"
        fi
    else
        log_info "S3 설정이 없습니다. 로컬 백업만 수행합니다."
    fi
}

cleanup_old_backups() {
    log_info "오래된 백업 정리 시작"
    
    case $BACKUP_TYPE in
        "daily")
            # 7일 이상 된 일일 백업 삭제
            find "$BACKUP_BASE_DIR/daily" -type d -mtime +7 -exec rm -rf {} + 2>/dev/null || true
            ;;
        "weekly")
            # 4주 이상 된 주간 백업 삭제
            find "$BACKUP_BASE_DIR/weekly" -type d -mtime +28 -exec rm -rf {} + 2>/dev/null || true
            ;;
        "monthly")
            # 12개월 이상 된 월간 백업 삭제
            find "$BACKUP_BASE_DIR/monthly" -type d -mtime +365 -exec rm -rf {} + 2>/dev/null || true
            ;;
    esac
    
    log_success "오래된 백업 정리 완료"
}

send_notification() {
    local status=$1
    local message="MiraClass 백업 $status - 타입: $BACKUP_TYPE, 시간: $(date)"
    
    # Slack 알림
    if [ -n "$SLACK_WEBHOOK_URL" ]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"$message\"}" \
            "$SLACK_WEBHOOK_URL" 2>/dev/null || log_warning "Slack 알림 전송 실패"
    fi
    
    # 이메일 알림 (선택사항)
    if [ -n "$EMAIL_NOTIFICATION" ] && command -v mail &> /dev/null; then
        echo "$message" | mail -s "MiraClass 백업 알림" "$EMAIL_NOTIFICATION" || log_warning "이메일 알림 전송 실패"
    fi
}

# 메인 백업 실행
main() {
    local start_time=$(date +%s)
    local failed_services=()
    
    # 서비스 상태 확인
    if ! docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        log_error "서비스가 실행 중이지 않습니다."
        exit 1
    fi
    
    # 각 백업 수행
    backup_postgres || failed_services+=("postgres")
    backup_neo4j || failed_services+=("neo4j")
    backup_redis || failed_services+=("redis")
    backup_application_data || failed_services+=("application")
    
    # S3 업로드
    upload_to_s3
    
    # 오래된 백업 정리
    cleanup_old_backups
    
    # 백업 정보 저장
    cat > "$BACKUP_DIR/backup_info.txt" << EOF
백업 정보
========
백업 타입: $BACKUP_TYPE
백업 시간: $(date)
백업 위치: $BACKUP_DIR
실패한 서비스: ${failed_services[*]:-"없음"}

백업 크기:
EOF
    du -sh "$BACKUP_DIR"/* >> "$BACKUP_DIR/backup_info.txt" 2>/dev/null || true
    
    local end_time=$(date +%s)
    local duration=$((end_time - start_time))
    
    if [ ${#failed_services[@]} -eq 0 ]; then
        log_success "백업 완료! 소요 시간: ${duration}초"
        send_notification "완료"
    else
        log_error "백업 중 일부 서비스에서 실패: ${failed_services[*]}"
        send_notification "부분 실패"
        exit 1
    fi
}

# 스크립트 실행
main "$@"