#!/bin/bash

# MiraClass 프로덕션 배포 스크립트
# 안전한 무중단 배포를 위한 자동화 스크립트

set -euo pipefail

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 로깅 함수
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

# 설정 변수
PROJECT_NAME="miraclass"
DOCKER_REGISTRY="your-registry.com"
ENVIRONMENT="production"
BACKUP_DIR="/var/backups/miraclass"
DEPLOY_DIR="/opt/miraclass"
LOG_DIR="/var/log/miraclass"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="${BACKUP_DIR}/backup_${DATE}.sql"
ROLLBACK_TAG=""
HEALTH_CHECK_TIMEOUT=300
HEALTH_CHECK_INTERVAL=10

# 기본값 설정
SKIP_BACKUP=false
SKIP_TESTS=false
FORCE_DEPLOY=false
ROLLBACK=false
VERSION="latest"
SERVICES="all"

# 도움말 함수
show_help() {
    cat << EOF
MiraClass 프로덕션 배포 스크립트

사용법: $0 [옵션]

옵션:
  -v, --version VERSION     배포할 버전 (기본값: latest)
  -s, --services SERVICES   배포할 서비스 (all, backend, frontend, ai-engine)
  -b, --skip-backup        데이터베이스 백업 건너뛰기
  -t, --skip-tests         테스트 건너뛰기
  -f, --force              강제 배포 (확인 없이)
  -r, --rollback TAG       지정된 태그로 롤백
  -h, --help               이 도움말 표시

예시:
  $0 --version v1.2.3 --services backend
  $0 --rollback v1.2.2
  $0 --force --skip-backup
EOF
}

# 명령행 인수 파싱
while [[ $# -gt 0 ]]; do
    case $1 in
        -v|--version)
            VERSION="$2"
            shift 2
            ;;
        -s|--services)
            SERVICES="$2"
            shift 2
            ;;
        -b|--skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        -t|--skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        -f|--force)
            FORCE_DEPLOY=true
            shift
            ;;
        -r|--rollback)
            ROLLBACK=true
            ROLLBACK_TAG="$2"
            shift 2
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            log_error "알 수 없는 옵션: $1"
            show_help
            exit 1
            ;;
    esac
done

# 필수 도구 확인
check_prerequisites() {
    log_info "필수 도구 확인 중..."
    
    local tools=("docker" "docker-compose" "git" "curl" "jq")
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "$tool이 설치되지 않았습니다."
            exit 1
        fi
    done
    
    # Docker 데몬 확인
    if ! docker info &> /dev/null; then
        log_error "Docker 데몬이 실행되지 않았습니다."
        exit 1
    fi
    
    log_success "모든 필수 도구가 준비되었습니다."
}

# 환경 변수 확인
check_environment() {
    log_info "환경 변수 확인 중..."
    
    if [[ ! -f ".env.prod" ]]; then
        log_error ".env.prod 파일이 없습니다."
        exit 1
    fi
    
    # 중요한 환경 변수 확인
    source .env.prod
    local required_vars=("POSTGRES_PASSWORD" "JWT_SECRET" "REDIS_PASSWORD")
    for var in "${required_vars[@]}"; do
        if [[ -z "${!var:-}" ]]; then
            log_error "환경 변수 $var가 설정되지 않았습니다."
            exit 1
        fi
    done
    
    log_success "환경 변수 확인 완료"
}

# 디렉토리 생성
setup_directories() {
    log_info "디렉토리 설정 중..."
    
    sudo mkdir -p "$BACKUP_DIR" "$LOG_DIR"
    sudo chown -R "$(whoami):$(whoami)" "$BACKUP_DIR" "$LOG_DIR"
    
    log_success "디렉토리 설정 완료"
}

# 데이터베이스 백업
backup_database() {
    if [[ "$SKIP_BACKUP" == "true" ]]; then
        log_warning "데이터베이스 백업을 건너뜁니다."
        return 0
    fi
    
    log_info "데이터베이스 백업 중..."
    
    # PostgreSQL 백업
    docker-compose -f docker-compose.prod.yml exec -T postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > "$BACKUP_FILE"
    
    if [[ $? -eq 0 ]]; then
        log_success "데이터베이스 백업 완료: $BACKUP_FILE"
        
        # 백업 파일 압축
        gzip "$BACKUP_FILE"
        log_success "백업 파일 압축 완료: ${BACKUP_FILE}.gz"
        
        # 오래된 백업 파일 정리 (30일 이상)
        find "$BACKUP_DIR" -name "backup_*.sql.gz" -mtime +30 -delete
        log_info "오래된 백업 파일 정리 완료"
    else
        log_error "데이터베이스 백업 실패"
        exit 1
    fi
}

# 이미지 빌드 및 푸시
build_and_push_images() {
    log_info "Docker 이미지 빌드 및 푸시 중..."
    
    local services_to_build=()
    
    case "$SERVICES" in
        "all")
            services_to_build=("backend" "ai-engine" "teacher-dashboard" "student-app")
            ;;
        "backend")
            services_to_build=("backend")
            ;;
        "frontend")
            services_to_build=("teacher-dashboard" "student-app")
            ;;
        "ai-engine")
            services_to_build=("ai-engine")
            ;;
        *)
            log_error "알 수 없는 서비스: $SERVICES"
            exit 1
            ;;
    esac
    
    for service in "${services_to_build[@]}"; do
        log_info "$service 이미지 빌드 중..."
        
        case "$service" in
            "backend")
                docker build -t "${DOCKER_REGISTRY}/${PROJECT_NAME}-backend:${VERSION}" ./backend
                ;;
            "ai-engine")
                docker build -t "${DOCKER_REGISTRY}/${PROJECT_NAME}-ai-engine:${VERSION}" ./ai-engine
                ;;
            "teacher-dashboard")
                docker build -t "${DOCKER_REGISTRY}/${PROJECT_NAME}-teacher-dashboard:${VERSION}" ./teacher-dashboard
                ;;
            "student-app")
                docker build -t "${DOCKER_REGISTRY}/${PROJECT_NAME}-student-app:${VERSION}" ./student-app
                ;;
        esac
        
        if [[ $? -eq 0 ]]; then
            log_success "$service 이미지 빌드 완료"
            
            # 이미지 푸시
            log_info "$service 이미지 푸시 중..."
            docker push "${DOCKER_REGISTRY}/${PROJECT_NAME}-${service}:${VERSION}"
            
            if [[ $? -eq 0 ]]; then
                log_success "$service 이미지 푸시 완료"
            else
                log_error "$service 이미지 푸시 실패"
                exit 1
            fi
        else
            log_error "$service 이미지 빌드 실패"
            exit 1
        fi
    done
}

# 테스트 실행
run_tests() {
    if [[ "$SKIP_TESTS" == "true" ]]; then
        log_warning "테스트를 건너뜁니다."
        return 0
    fi
    
    log_info "테스트 실행 중..."
    
    # 테스트 환경 시작
    docker-compose -f docker-compose.test.yml up -d
    
    # 서비스 준비 대기
    sleep 30
    
    # 통합 테스트 실행
    docker-compose -f docker-compose.test.yml exec -T integration-tests npm test
    
    local test_result=$?
    
    # 테스트 환경 정리
    docker-compose -f docker-compose.test.yml down -v
    
    if [[ $test_result -eq 0 ]]; then
        log_success "모든 테스트 통과"
    else
        log_error "테스트 실패"
        exit 1
    fi
}

# 서비스 헬스 체크
check_service_health() {
    local service_name="$1"
    local health_url="$2"
    local timeout="$3"
    
    log_info "$service_name 헬스 체크 중..."
    
    local elapsed=0
    while [[ $elapsed -lt $timeout ]]; do
        if curl -f -s "$health_url" > /dev/null; then
            log_success "$service_name 헬스 체크 통과"
            return 0
        fi
        
        sleep "$HEALTH_CHECK_INTERVAL"
        elapsed=$((elapsed + HEALTH_CHECK_INTERVAL))
        log_info "$service_name 헬스 체크 대기 중... (${elapsed}s/${timeout}s)"
    done
    
    log_error "$service_name 헬스 체크 실패 (타임아웃)"
    return 1
}

# 무중단 배포
deploy_services() {
    log_info "서비스 배포 시작..."
    
    # 현재 실행 중인 서비스 태그 저장 (롤백용)
    ROLLBACK_TAG=$(docker-compose -f docker-compose.prod.yml images --format "table {{.Service}}\t{{.Tag}}" | grep backend | awk '{print $2}' | head -1)
    
    # 환경 변수 업데이트
    export BACKEND_VERSION="$VERSION"
    export AI_ENGINE_VERSION="$VERSION"
    export FRONTEND_VERSION="$VERSION"
    export STUDENT_APP_VERSION="$VERSION"
    
    # 새 서비스 시작 (스케일링)
    log_info "새 서비스 인스턴스 시작 중..."
    docker-compose -f docker-compose.prod.yml up -d --scale backend=4 --scale ai-engine=4
    
    # 새 서비스 헬스 체크
    sleep 30
    
    local health_checks=(
        "backend:http://localhost/health"
        "ai-engine:http://localhost/ai/health"
    )
    
    for check in "${health_checks[@]}"; do
        IFS=':' read -r service_name health_url <<< "$check"
        if ! check_service_health "$service_name" "$health_url" "$HEALTH_CHECK_TIMEOUT"; then
            log_error "$service_name 배포 실패"
            rollback_deployment
            exit 1
        fi
    done
    
    # 기존 서비스 인스턴스 제거
    log_info "기존 서비스 인스턴스 제거 중..."
    docker-compose -f docker-compose.prod.yml up -d --scale backend=2 --scale ai-engine=2
    
    # 최종 헬스 체크
    sleep 10
    for check in "${health_checks[@]}"; do
        IFS=':' read -r service_name health_url <<< "$check"
        if ! check_service_health "$service_name" "$health_url" "60"; then
            log_error "최종 헬스 체크 실패"
            rollback_deployment
            exit 1
        fi
    done
    
    log_success "서비스 배포 완료"
}

# 롤백
rollback_deployment() {
    log_warning "배포 롤백 시작..."
    
    if [[ -z "$ROLLBACK_TAG" ]]; then
        log_error "롤백할 태그가 지정되지 않았습니다."
        return 1
    fi
    
    # 환경 변수 롤백
    export BACKEND_VERSION="$ROLLBACK_TAG"
    export AI_ENGINE_VERSION="$ROLLBACK_TAG"
    export FRONTEND_VERSION="$ROLLBACK_TAG"
    export STUDENT_APP_VERSION="$ROLLBACK_TAG"
    
    # 서비스 롤백
    docker-compose -f docker-compose.prod.yml up -d
    
    # 롤백 헬스 체크
    sleep 30
    if check_service_health "backend" "http://localhost/health" "120"; then
        log_success "롤백 완료"
    else
        log_error "롤백 실패"
        return 1
    fi
}

# 배포 후 정리
post_deploy_cleanup() {
    log_info "배포 후 정리 작업 중..."
    
    # 사용하지 않는 Docker 이미지 정리
    docker image prune -f
    
    # 로그 로테이션
    if [[ -f "/etc/logrotate.d/miraclass" ]]; then
        sudo logrotate -f /etc/logrotate.d/miraclass
    fi
    
    log_success "정리 작업 완료"
}

# 배포 알림
send_notification() {
    local status="$1"
    local message="$2"
    
    # Slack 웹훅 (환경 변수에서 설정)
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"[MiraClass] $status: $message\"}" \
            "$SLACK_WEBHOOK_URL"
    fi
    
    # 이메일 알림 (환경 변수에서 설정)
    if [[ -n "${NOTIFICATION_EMAIL:-}" ]]; then
        echo "$message" | mail -s "[MiraClass] $status" "$NOTIFICATION_EMAIL"
    fi
}

# 메인 함수
main() {
    log_info "MiraClass 프로덕션 배포 시작"
    log_info "버전: $VERSION, 서비스: $SERVICES"
    
    # 롤백 모드
    if [[ "$ROLLBACK" == "true" ]]; then
        log_warning "롤백 모드로 실행"
        ROLLBACK_TAG="$ROLLBACK_TAG"
        rollback_deployment
        send_notification "ROLLBACK" "버전 $ROLLBACK_TAG로 롤백 완료"
        exit 0
    fi
    
    # 확인 프롬프트
    if [[ "$FORCE_DEPLOY" != "true" ]]; then
        echo -e "\n${YELLOW}다음 설정으로 배포를 진행하시겠습니까?${NC}"
        echo "  - 버전: $VERSION"
        echo "  - 서비스: $SERVICES"
        echo "  - 백업 건너뛰기: $SKIP_BACKUP"
        echo "  - 테스트 건너뛰기: $SKIP_TESTS"
        echo -n "계속하시겠습니까? (y/N): "
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            log_info "배포가 취소되었습니다."
            exit 0
        fi
    fi
    
    # 배포 단계 실행
    check_prerequisites
    check_environment
    setup_directories
    backup_database
    
    if [[ "$SERVICES" != "frontend" ]]; then
        run_tests
    fi
    
    build_and_push_images
    deploy_services
    post_deploy_cleanup
    
    log_success "배포 완료!"
    send_notification "SUCCESS" "버전 $VERSION 배포 완료"
}

# 에러 핸들링
trap 'log_error "배포 중 오류 발생"; send_notification "ERROR" "배포 실패"; exit 1' ERR

# 스크립트 실행
main "$@"