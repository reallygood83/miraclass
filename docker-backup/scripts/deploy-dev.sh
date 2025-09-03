#!/bin/bash

# MiraClass 개발 환경 배포 스크립트
# 빠른 개발 및 테스트를 위한 자동화 스크립트

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
ENVIRONMENT="development"
COMPOSE_FILE="docker-compose.dev.yml"
LOG_DIR="./logs"
DATE=$(date +"%Y%m%d_%H%M%S")

# 기본값 설정
CLEAN_BUILD=false
SKIP_TESTS=false
WATCH_MODE=false
SERVICES="all"
PORT_BACKEND=3000
PORT_AI_ENGINE=3001
PORT_DASHBOARD=3002
PORT_STUDENT_APP=3003

# 도움말 함수
show_help() {
    cat << EOF
MiraClass 개발 환경 배포 스크립트

사용법: $0 [옵션]

옵션:
  -s, --services SERVICES   시작할 서비스 (all, backend, frontend, ai-engine, db)
  -c, --clean              클린 빌드 (캐시 무시)
  -t, --skip-tests         테스트 건너뛰기
  -w, --watch              파일 변경 감지 모드
  -p, --ports              포트 설정 표시
  --backend-port PORT      백엔드 포트 (기본값: 3000)
  --ai-port PORT           AI 엔진 포트 (기본값: 3001)
  --dashboard-port PORT    대시보드 포트 (기본값: 3002)
  --app-port PORT          학생 앱 포트 (기본값: 3003)
  -h, --help               이 도움말 표시

예시:
  $0 --services backend --watch
  $0 --clean --skip-tests
  $0 --services db
EOF
}

# 명령행 인수 파싱
while [[ $# -gt 0 ]]; do
    case $1 in
        -s|--services)
            SERVICES="$2"
            shift 2
            ;;
        -c|--clean)
            CLEAN_BUILD=true
            shift
            ;;
        -t|--skip-tests)
            SKIP_TESTS=true
            shift
            ;;
        -w|--watch)
            WATCH_MODE=true
            shift
            ;;
        -p|--ports)
            echo "포트 설정:"
            echo "  백엔드: $PORT_BACKEND"
            echo "  AI 엔진: $PORT_AI_ENGINE"
            echo "  교사 대시보드: $PORT_DASHBOARD"
            echo "  학생 앱: $PORT_STUDENT_APP"
            echo "  PostgreSQL: 5432"
            echo "  Redis: 6379"
            echo "  Neo4j: 7474 (HTTP), 7687 (Bolt)"
            exit 0
            ;;
        --backend-port)
            PORT_BACKEND="$2"
            shift 2
            ;;
        --ai-port)
            PORT_AI_ENGINE="$2"
            shift 2
            ;;
        --dashboard-port)
            PORT_DASHBOARD="$2"
            shift 2
            ;;
        --app-port)
            PORT_STUDENT_APP="$2"
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
    
    local tools=("docker" "docker-compose" "node" "npm")
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

# 환경 설정
setup_environment() {
    log_info "개발 환경 설정 중..."
    
    # 로그 디렉토리 생성
    mkdir -p "$LOG_DIR"
    
    # .env.dev 파일 확인
    if [[ ! -f ".env.dev" ]]; then
        log_warning ".env.dev 파일이 없습니다. 기본 설정으로 생성합니다."
        create_dev_env_file
    fi
    
    # 포트 환경 변수 설정
    export BACKEND_PORT="$PORT_BACKEND"
    export AI_ENGINE_PORT="$PORT_AI_ENGINE"
    export DASHBOARD_PORT="$PORT_DASHBOARD"
    export STUDENT_APP_PORT="$PORT_STUDENT_APP"
    
    log_success "환경 설정 완료"
}

# 개발용 환경 변수 파일 생성
create_dev_env_file() {
    cat > .env.dev << EOF
# MiraClass 개발 환경 설정

# 애플리케이션 설정
NODE_ENV=development
APP_NAME=MiraClass
APP_VERSION=1.0.0
APP_URL=http://localhost:3000

# 서버 설정
BACKEND_PORT=3000
AI_ENGINE_PORT=3001
DASHBOARD_PORT=3002
STUDENT_APP_PORT=3003

# 데이터베이스 설정
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=miraclass_dev
POSTGRES_USER=miraclass
POSTGRES_PASSWORD=dev_password

# Redis 설정
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=dev_redis_password

# Neo4j 설정
NEO4J_URI=bolt://localhost:7687
NEO4J_USER=neo4j
NEO4J_PASSWORD=dev_neo4j_password

# JWT 설정
JWT_SECRET=dev_jwt_secret_key_change_in_production
JWT_EXPIRES_IN=24h
JWT_REFRESH_EXPIRES_IN=7d

# AI 설정
OPENAI_API_KEY=your_openai_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# 로깅 설정
LOG_LEVEL=debug
LOG_FORMAT=dev

# 개발 도구 설정
HOT_RELOAD=true
WATCH_FILES=true
DEBUG_MODE=true
EOF
    
    log_success ".env.dev 파일이 생성되었습니다."
}

# 의존성 설치
install_dependencies() {
    log_info "의존성 설치 중..."
    
    local services_to_install=()
    
    case "$SERVICES" in
        "all")
            services_to_install=("backend" "ai-engine" "teacher-dashboard" "student-app")
            ;;
        "backend")
            services_to_install=("backend")
            ;;
        "frontend")
            services_to_install=("teacher-dashboard" "student-app")
            ;;
        "ai-engine")
            services_to_install=("ai-engine")
            ;;
        "db")
            log_info "데이터베이스만 시작하므로 의존성 설치를 건너뜁니다."
            return 0
            ;;
        *)
            log_error "알 수 없는 서비스: $SERVICES"
            exit 1
            ;;
    esac
    
    for service in "${services_to_install[@]}"; do
        if [[ -d "$service" && -f "$service/package.json" ]]; then
            log_info "$service 의존성 설치 중..."
            (cd "$service" && npm install)
            
            if [[ $? -eq 0 ]]; then
                log_success "$service 의존성 설치 완료"
            else
                log_error "$service 의존성 설치 실패"
                exit 1
            fi
        fi
    done
}

# 데이터베이스 초기화
init_database() {
    log_info "데이터베이스 초기화 중..."
    
    # 데이터베이스 서비스 시작
    docker-compose -f "$COMPOSE_FILE" up -d postgres redis neo4j
    
    # 데이터베이스 준비 대기
    log_info "데이터베이스 서비스 준비 대기 중..."
    sleep 30
    
    # PostgreSQL 초기화
    if [[ -f "database/init.sql" ]]; then
        log_info "PostgreSQL 스키마 초기화 중..."
        docker-compose -f "$COMPOSE_FILE" exec -T postgres psql -U miraclass -d miraclass_dev < database/init.sql
    fi
    
    # 테스트 데이터 삽입
    if [[ -f "database/seed.sql" ]]; then
        log_info "테스트 데이터 삽입 중..."
        docker-compose -f "$COMPOSE_FILE" exec -T postgres psql -U miraclass -d miraclass_dev < database/seed.sql
    fi
    
    log_success "데이터베이스 초기화 완료"
}

# 테스트 실행
run_tests() {
    if [[ "$SKIP_TESTS" == "true" ]]; then
        log_warning "테스트를 건너뜁니다."
        return 0
    fi
    
    log_info "개발 환경 테스트 실행 중..."
    
    local services_to_test=()
    
    case "$SERVICES" in
        "all")
            services_to_test=("backend" "ai-engine")
            ;;
        "backend")
            services_to_test=("backend")
            ;;
        "ai-engine")
            services_to_test=("ai-engine")
            ;;
        *)
            log_info "테스트할 서비스가 없습니다."
            return 0
            ;;
    esac
    
    for service in "${services_to_test[@]}"; do
        if [[ -d "$service" && -f "$service/package.json" ]]; then
            log_info "$service 테스트 실행 중..."
            (cd "$service" && npm test)
            
            if [[ $? -eq 0 ]]; then
                log_success "$service 테스트 통과"
            else
                log_warning "$service 테스트 실패 (개발 환경에서는 계속 진행)"
            fi
        fi
    done
}

# 서비스 시작
start_services() {
    log_info "서비스 시작 중..."
    
    # 클린 빌드 옵션
    local build_args=""
    if [[ "$CLEAN_BUILD" == "true" ]]; then
        log_info "클린 빌드 수행 중..."
        docker-compose -f "$COMPOSE_FILE" build --no-cache
        build_args="--build"
    fi
    
    # 서비스별 시작
    case "$SERVICES" in
        "all")
            docker-compose -f "$COMPOSE_FILE" up -d $build_args
            ;;
        "backend")
            docker-compose -f "$COMPOSE_FILE" up -d postgres redis backend $build_args
            ;;
        "frontend")
            docker-compose -f "$COMPOSE_FILE" up -d teacher-dashboard student-app $build_args
            ;;
        "ai-engine")
            docker-compose -f "$COMPOSE_FILE" up -d postgres redis ai-engine $build_args
            ;;
        "db")
            docker-compose -f "$COMPOSE_FILE" up -d postgres redis neo4j
            ;;
        *)
            log_error "알 수 없는 서비스: $SERVICES"
            exit 1
            ;;
    esac
    
    # 서비스 준비 대기
    log_info "서비스 준비 대기 중..."
    sleep 20
    
    log_success "서비스 시작 완료"
}

# 서비스 상태 확인
check_services() {
    log_info "서비스 상태 확인 중..."
    
    # Docker Compose 서비스 상태
    docker-compose -f "$COMPOSE_FILE" ps
    
    echo ""
    log_info "서비스 URL:"
    
    if [[ "$SERVICES" == "all" || "$SERVICES" == "backend" ]]; then
        echo "  - 백엔드 API: http://localhost:$PORT_BACKEND"
        echo "  - API 문서: http://localhost:$PORT_BACKEND/docs"
    fi
    
    if [[ "$SERVICES" == "all" || "$SERVICES" == "ai-engine" ]]; then
        echo "  - AI 엔진: http://localhost:$PORT_AI_ENGINE"
    fi
    
    if [[ "$SERVICES" == "all" || "$SERVICES" == "frontend" ]]; then
        echo "  - 교사 대시보드: http://localhost:$PORT_DASHBOARD"
        echo "  - 학생 앱: http://localhost:$PORT_STUDENT_APP"
    fi
    
    if [[ "$SERVICES" == "all" || "$SERVICES" == "db" ]]; then
        echo "  - PostgreSQL: localhost:5432"
        echo "  - Redis: localhost:6379"
        echo "  - Neo4j: http://localhost:7474"
    fi
}

# 로그 모니터링
watch_logs() {
    if [[ "$WATCH_MODE" != "true" ]]; then
        return 0
    fi
    
    log_info "로그 모니터링 모드 시작 (Ctrl+C로 종료)"
    
    case "$SERVICES" in
        "all")
            docker-compose -f "$COMPOSE_FILE" logs -f
            ;;
        "backend")
            docker-compose -f "$COMPOSE_FILE" logs -f backend
            ;;
        "frontend")
            docker-compose -f "$COMPOSE_FILE" logs -f teacher-dashboard student-app
            ;;
        "ai-engine")
            docker-compose -f "$COMPOSE_FILE" logs -f ai-engine
            ;;
        "db")
            docker-compose -f "$COMPOSE_FILE" logs -f postgres redis neo4j
            ;;
    esac
}

# 개발 도구 설정
setup_dev_tools() {
    log_info "개발 도구 설정 중..."
    
    # VS Code 설정 디렉토리 생성
    mkdir -p .vscode
    
    # launch.json 생성 (디버깅 설정)
    if [[ ! -f ".vscode/launch.json" ]]; then
        cat > .vscode/launch.json << 'EOF'
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "Debug Backend",
            "type": "node",
            "request": "attach",
            "port": 9229,
            "address": "localhost",
            "localRoot": "${workspaceFolder}/backend",
            "remoteRoot": "/app",
            "protocol": "inspector"
        },
        {
            "name": "Debug AI Engine",
            "type": "node",
            "request": "attach",
            "port": 9230,
            "address": "localhost",
            "localRoot": "${workspaceFolder}/ai-engine",
            "remoteRoot": "/app",
            "protocol": "inspector"
        }
    ]
}
EOF
        log_success "VS Code 디버깅 설정 생성 완료"
    fi
    
    # settings.json 생성
    if [[ ! -f ".vscode/settings.json" ]]; then
        cat > .vscode/settings.json << 'EOF'
{
    "editor.formatOnSave": true,
    "editor.codeActionsOnSave": {
        "source.fixAll.eslint": true
    },
    "eslint.workingDirectories": [
        "backend",
        "ai-engine",
        "teacher-dashboard",
        "student-app"
    ],
    "typescript.preferences.importModuleSpecifier": "relative",
    "files.exclude": {
        "**/node_modules": true,
        "**/dist": true,
        "**/.next": true
    }
}
EOF
        log_success "VS Code 설정 생성 완료"
    fi
}

# 정리 함수
cleanup() {
    log_info "개발 환경 정리 중..."
    docker-compose -f "$COMPOSE_FILE" down
    log_success "정리 완료"
}

# 메인 함수
main() {
    log_info "MiraClass 개발 환경 배포 시작"
    log_info "서비스: $SERVICES, 클린 빌드: $CLEAN_BUILD, 워치 모드: $WATCH_MODE"
    
    check_prerequisites
    setup_environment
    setup_dev_tools
    
    if [[ "$SERVICES" != "db" ]]; then
        install_dependencies
        run_tests
    fi
    
    if [[ "$SERVICES" == "all" || "$SERVICES" == "db" ]]; then
        init_database
    fi
    
    start_services
    check_services
    
    log_success "개발 환경 배포 완료!"
    
    # 워치 모드
    if [[ "$WATCH_MODE" == "true" ]]; then
        watch_logs
    else
        echo ""
        log_info "로그 확인: docker-compose -f $COMPOSE_FILE logs -f"
        log_info "서비스 중지: docker-compose -f $COMPOSE_FILE down"
        log_info "워치 모드: $0 --watch"
    fi
}

# 에러 핸들링
trap 'log_error "개발 환경 배포 중 오류 발생"; cleanup; exit 1' ERR

# 인터럽트 핸들링 (Ctrl+C)
trap 'log_info "배포 중단됨"; cleanup; exit 0' INT

# 스크립트 실행
main "$@"