#!/bin/bash

# MiraClass 모니터링 및 로그 관리 스크립트
# 시스템 상태 모니터링, 로그 분석, 알림 등을 제공

set -euo pipefail

# 색상 정의
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
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

log_debug() {
    echo -e "${PURPLE}[DEBUG]${NC} $1"
}

# 설정 변수
PROJECT_NAME="miraclass"
ENVIRONMENT="${ENVIRONMENT:-production}"
COMPOSE_FILE="docker-compose.${ENVIRONMENT}.yml"
LOG_DIR="/var/log/miraclass"
MONITOR_INTERVAL=30
ALERT_THRESHOLD_CPU=80
ALERT_THRESHOLD_MEMORY=85
ALERT_THRESHOLD_DISK=90
ALERT_THRESHOLD_RESPONSE_TIME=5000
REPORT_DIR="./reports"
DATE=$(date +"%Y%m%d_%H%M%S")

# 기본값 설정
MONITOR_MODE="status"
WATCH_LOGS=false
GENERATE_REPORT=false
SEND_ALERTS=false
CONTINUOUS_MODE=false
SERVICE_FILTER="all"
LOG_LEVEL="info"

# 도움말 함수
show_help() {
    cat << EOF
MiraClass 모니터링 및 로그 관리 스크립트

사용법: $0 [옵션]

모니터링 모드:
  status              서비스 상태 확인 (기본값)
  health              헬스 체크 수행
  performance         성능 모니터링
  logs                로그 분석
  resources           리소스 사용량 모니터링
  security            보안 로그 분석
  errors              에러 로그 분석
  report              종합 리포트 생성

옵션:
  -m, --mode MODE           모니터링 모드 선택
  -s, --service SERVICE     특정 서비스 필터링
  -w, --watch              로그 실시간 감시
  -c, --continuous         연속 모니터링 모드
  -r, --report             리포트 생성
  -a, --alerts             알림 활성화
  -l, --log-level LEVEL    로그 레벨 (debug, info, warn, error)
  -i, --interval SECONDS   모니터링 간격 (기본값: 30초)
  -h, --help               이 도움말 표시

예시:
  $0 --mode health --continuous
  $0 --mode logs --service backend --watch
  $0 --mode performance --report
  $0 --mode errors --alerts
EOF
}

# 명령행 인수 파싱
while [[ $# -gt 0 ]]; do
    case $1 in
        -m|--mode)
            MONITOR_MODE="$2"
            shift 2
            ;;
        -s|--service)
            SERVICE_FILTER="$2"
            shift 2
            ;;
        -w|--watch)
            WATCH_LOGS=true
            shift
            ;;
        -c|--continuous)
            CONTINUOUS_MODE=true
            shift
            ;;
        -r|--report)
            GENERATE_REPORT=true
            shift
            ;;
        -a|--alerts)
            SEND_ALERTS=true
            shift
            ;;
        -l|--log-level)
            LOG_LEVEL="$2"
            shift 2
            ;;
        -i|--interval)
            MONITOR_INTERVAL="$2"
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
    local tools=("docker" "docker-compose" "curl" "jq" "awk" "grep")
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "$tool이 설치되지 않았습니다."
            exit 1
        fi
    done
}

# 디렉토리 설정
setup_directories() {
    mkdir -p "$REPORT_DIR" "$LOG_DIR"
}

# 서비스 상태 확인
check_service_status() {
    log_info "서비스 상태 확인 중..."
    
    echo -e "\n${CYAN}=== Docker Compose 서비스 상태 ===${NC}"
    docker-compose -f "$COMPOSE_FILE" ps
    
    echo -e "\n${CYAN}=== 컨테이너 리소스 사용량 ===${NC}"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}\t{{.BlockIO}}"
    
    echo -e "\n${CYAN}=== 포트 바인딩 상태 ===${NC}"
    docker-compose -f "$COMPOSE_FILE" port backend 3000 2>/dev/null || echo "Backend: 포트 바인딩 없음"
    docker-compose -f "$COMPOSE_FILE" port ai-engine 3001 2>/dev/null || echo "AI Engine: 포트 바인딩 없음"
    docker-compose -f "$COMPOSE_FILE" port teacher-dashboard 3002 2>/dev/null || echo "Teacher Dashboard: 포트 바인딩 없음"
}

# 헬스 체크
perform_health_check() {
    log_info "헬스 체크 수행 중..."
    
    local services=("backend:3000/health" "ai-engine:3001/health")
    local failed_services=()
    
    echo -e "\n${CYAN}=== 서비스 헬스 체크 ===${NC}"
    
    for service_info in "${services[@]}"; do
        IFS=':' read -r service_name endpoint <<< "$service_info"
        
        local url="http://localhost:${endpoint}"
        local status_code
        local response_time
        
        # 응답 시간 측정
        local start_time=$(date +%s%3N)
        status_code=$(curl -s -o /dev/null -w "%{http_code}" "$url" || echo "000")
        local end_time=$(date +%s%3N)
        response_time=$((end_time - start_time))
        
        if [[ "$status_code" == "200" ]]; then
            echo -e "${GREEN}✓${NC} $service_name: OK (${response_time}ms)"
            
            # 응답 시간 알림
            if [[ $response_time -gt $ALERT_THRESHOLD_RESPONSE_TIME ]]; then
                log_warning "$service_name 응답 시간이 느립니다: ${response_time}ms"
                if [[ "$SEND_ALERTS" == "true" ]]; then
                    send_alert "PERFORMANCE" "$service_name 응답 시간 초과: ${response_time}ms"
                fi
            fi
        else
            echo -e "${RED}✗${NC} $service_name: FAILED (HTTP $status_code)"
            failed_services+=("$service_name")
            
            if [[ "$SEND_ALERTS" == "true" ]]; then
                send_alert "CRITICAL" "$service_name 헬스 체크 실패: HTTP $status_code"
            fi
        fi
    done
    
    # 데이터베이스 연결 확인
    echo -e "\n${CYAN}=== 데이터베이스 연결 확인 ===${NC}"
    
    # PostgreSQL
    if docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_isready -U miraclass &>/dev/null; then
        echo -e "${GREEN}✓${NC} PostgreSQL: 연결 가능"
    else
        echo -e "${RED}✗${NC} PostgreSQL: 연결 실패"
        failed_services+=("PostgreSQL")
    fi
    
    # Redis
    if docker-compose -f "$COMPOSE_FILE" exec -T redis redis-cli ping | grep -q "PONG"; then
        echo -e "${GREEN}✓${NC} Redis: 연결 가능"
    else
        echo -e "${RED}✗${NC} Redis: 연결 실패"
        failed_services+=("Redis")
    fi
    
    # Neo4j
    if curl -s -f "http://localhost:7474/db/data/" &>/dev/null; then
        echo -e "${GREEN}✓${NC} Neo4j: 연결 가능"
    else
        echo -e "${RED}✗${NC} Neo4j: 연결 실패"
        failed_services+=("Neo4j")
    fi
    
    # 실패한 서비스 요약
    if [[ ${#failed_services[@]} -gt 0 ]]; then
        echo -e "\n${RED}실패한 서비스: ${failed_services[*]}${NC}"
        return 1
    else
        echo -e "\n${GREEN}모든 서비스가 정상 작동 중입니다.${NC}"
        return 0
    fi
}

# 성능 모니터링
monitor_performance() {
    log_info "성능 모니터링 중..."
    
    echo -e "\n${CYAN}=== 시스템 리소스 사용량 ===${NC}"
    
    # CPU 사용량
    local cpu_usage=$(top -l 1 | grep "CPU usage" | awk '{print $3}' | sed 's/%//')
    echo "CPU 사용량: ${cpu_usage}%"
    
    if (( $(echo "$cpu_usage > $ALERT_THRESHOLD_CPU" | bc -l) )); then
        log_warning "CPU 사용량이 높습니다: ${cpu_usage}%"
        if [[ "$SEND_ALERTS" == "true" ]]; then
            send_alert "WARNING" "CPU 사용량 높음: ${cpu_usage}%"
        fi
    fi
    
    # 메모리 사용량
    local memory_info=$(vm_stat | grep -E "Pages (free|active|inactive|speculative|wired down)")
    local page_size=4096
    local free_pages=$(echo "$memory_info" | grep "Pages free" | awk '{print $3}' | sed 's/\.//')
    local active_pages=$(echo "$memory_info" | grep "Pages active" | awk '{print $3}' | sed 's/\.//')
    local inactive_pages=$(echo "$memory_info" | grep "Pages inactive" | awk '{print $3}' | sed 's/\.//')
    local wired_pages=$(echo "$memory_info" | grep "Pages wired down" | awk '{print $4}' | sed 's/\.//')
    
    local total_memory=$(((free_pages + active_pages + inactive_pages + wired_pages) * page_size / 1024 / 1024))
    local used_memory=$(((active_pages + inactive_pages + wired_pages) * page_size / 1024 / 1024))
    local memory_usage=$((used_memory * 100 / total_memory))
    
    echo "메모리 사용량: ${used_memory}MB / ${total_memory}MB (${memory_usage}%)"
    
    if [[ $memory_usage -gt $ALERT_THRESHOLD_MEMORY ]]; then
        log_warning "메모리 사용량이 높습니다: ${memory_usage}%"
        if [[ "$SEND_ALERTS" == "true" ]]; then
            send_alert "WARNING" "메모리 사용량 높음: ${memory_usage}%"
        fi
    fi
    
    # 디스크 사용량
    echo -e "\n${CYAN}=== 디스크 사용량 ===${NC}"
    df -h | grep -E "(Filesystem|/dev/)" | while read -r line; do
        if [[ "$line" =~ Filesystem ]]; then
            echo "$line"
        else
            local usage=$(echo "$line" | awk '{print $5}' | sed 's/%//')
            echo "$line"
            
            if [[ $usage -gt $ALERT_THRESHOLD_DISK ]]; then
                local mount_point=$(echo "$line" | awk '{print $9}')
                log_warning "디스크 사용량이 높습니다: $mount_point (${usage}%)"
                if [[ "$SEND_ALERTS" == "true" ]]; then
                    send_alert "WARNING" "디스크 사용량 높음: $mount_point (${usage}%)"
                fi
            fi
        fi
    done
    
    # Docker 컨테이너 성능
    echo -e "\n${CYAN}=== 컨테이너 성능 ===${NC}"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.MemPerc}}\t{{.NetIO}}\t{{.BlockIO}}"
}

# 로그 분석
analyze_logs() {
    log_info "로그 분석 중..."
    
    local log_files=()
    
    case "$SERVICE_FILTER" in
        "all")
            log_files=("backend" "ai-engine" "teacher-dashboard" "postgres" "redis" "neo4j")
            ;;
        *)
            log_files=("$SERVICE_FILTER")
            ;;
    esac
    
    for service in "${log_files[@]}"; do
        echo -e "\n${CYAN}=== $service 로그 분석 ===${NC}"
        
        # 최근 로그 라인 수
        local log_count=$(docker-compose -f "$COMPOSE_FILE" logs --tail=1000 "$service" 2>/dev/null | wc -l || echo "0")
        echo "최근 1000줄 중 로그 수: $log_count"
        
        # 에러 로그 수
        local error_count=$(docker-compose -f "$COMPOSE_FILE" logs --tail=1000 "$service" 2>/dev/null | grep -i "error\|exception\|fail" | wc -l || echo "0")
        echo "에러 로그 수: $error_count"
        
        # 경고 로그 수
        local warning_count=$(docker-compose -f "$COMPOSE_FILE" logs --tail=1000 "$service" 2>/dev/null | grep -i "warn\|warning" | wc -l || echo "0")
        echo "경고 로그 수: $warning_count"
        
        # 최근 에러 로그 표시
        if [[ $error_count -gt 0 ]]; then
            echo -e "\n${RED}최근 에러 로그:${NC}"
            docker-compose -f "$COMPOSE_FILE" logs --tail=100 "$service" 2>/dev/null | grep -i "error\|exception\|fail" | tail -5
        fi
        
        # 알림 발송
        if [[ $error_count -gt 10 && "$SEND_ALERTS" == "true" ]]; then
            send_alert "ERROR" "$service에서 많은 에러 발생: ${error_count}개"
        fi
    done
}

# 보안 로그 분석
analyze_security_logs() {
    log_info "보안 로그 분석 중..."
    
    echo -e "\n${CYAN}=== 보안 이벤트 분석 ===${NC}"
    
    # 실패한 로그인 시도
    local failed_logins=$(docker-compose -f "$COMPOSE_FILE" logs backend 2>/dev/null | grep -i "login.*fail\|authentication.*fail\|unauthorized" | wc -l || echo "0")
    echo "실패한 로그인 시도: $failed_logins"
    
    # 의심스러운 IP 주소
    echo -e "\n${CYAN}=== 의심스러운 활동 ===${NC}"
    docker-compose -f "$COMPOSE_FILE" logs nginx 2>/dev/null | grep -E "40[0-9]|50[0-9]" | awk '{print $1}' | sort | uniq -c | sort -nr | head -10
    
    # SQL 인젝션 시도
    local sql_injection_attempts=$(docker-compose -f "$COMPOSE_FILE" logs backend 2>/dev/null | grep -i "sql.*injection\|union.*select\|drop.*table" | wc -l || echo "0")
    echo "SQL 인젝션 시도: $sql_injection_attempts"
    
    # XSS 시도
    local xss_attempts=$(docker-compose -f "$COMPOSE_FILE" logs backend 2>/dev/null | grep -i "<script\|javascript:\|onerror=" | wc -l || echo "0")
    echo "XSS 시도: $xss_attempts"
    
    # 보안 알림
    if [[ $failed_logins -gt 50 && "$SEND_ALERTS" == "true" ]]; then
        send_alert "SECURITY" "많은 로그인 실패 시도: ${failed_logins}회"
    fi
    
    if [[ $sql_injection_attempts -gt 0 && "$SEND_ALERTS" == "true" ]]; then
        send_alert "SECURITY" "SQL 인젝션 시도 감지: ${sql_injection_attempts}회"
    fi
}

# 에러 로그 분석
analyze_error_logs() {
    log_info "에러 로그 상세 분석 중..."
    
    echo -e "\n${CYAN}=== 에러 패턴 분석 ===${NC}"
    
    # 가장 빈번한 에러
    echo "가장 빈번한 에러 메시지:"
    docker-compose -f "$COMPOSE_FILE" logs 2>/dev/null | grep -i "error\|exception" | awk -F'error|Error|ERROR|exception|Exception|EXCEPTION' '{print $2}' | sort | uniq -c | sort -nr | head -10
    
    # 시간대별 에러 분포
    echo -e "\n시간대별 에러 분포:"
    docker-compose -f "$COMPOSE_FILE" logs --since="24h" 2>/dev/null | grep -i "error\|exception" | awk '{print $1}' | cut -d'T' -f2 | cut -d':' -f1 | sort | uniq -c
    
    # 서비스별 에러 분포
    echo -e "\n서비스별 에러 분포:"
    for service in backend ai-engine teacher-dashboard; do
        local error_count=$(docker-compose -f "$COMPOSE_FILE" logs "$service" 2>/dev/null | grep -i "error\|exception" | wc -l || echo "0")
        echo "$service: $error_count"
    done
}

# 종합 리포트 생성
generate_report() {
    log_info "종합 리포트 생성 중..."
    
    local report_file="$REPORT_DIR/miraclass_report_$DATE.html"
    
    cat > "$report_file" << EOF
<!DOCTYPE html>
<html>
<head>
    <title>MiraClass 시스템 리포트 - $DATE</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        .header { background-color: #f0f0f0; padding: 20px; border-radius: 5px; }
        .section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; border-radius: 5px; }
        .success { color: green; }
        .warning { color: orange; }
        .error { color: red; }
        .info { color: blue; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        pre { background-color: #f5f5f5; padding: 10px; border-radius: 3px; overflow-x: auto; }
    </style>
</head>
<body>
    <div class="header">
        <h1>MiraClass 시스템 리포트</h1>
        <p>생성 시간: $(date)</p>
        <p>환경: $ENVIRONMENT</p>
    </div>
EOF
    
    # 서비스 상태 섹션
    echo '    <div class="section">' >> "$report_file"
    echo '        <h2>서비스 상태</h2>' >> "$report_file"
    echo '        <pre>' >> "$report_file"
    docker-compose -f "$COMPOSE_FILE" ps >> "$report_file" 2>/dev/null || echo "서비스 상태 정보 없음" >> "$report_file"
    echo '        </pre>' >> "$report_file"
    echo '    </div>' >> "$report_file"
    
    # 리소스 사용량 섹션
    echo '    <div class="section">' >> "$report_file"
    echo '        <h2>리소스 사용량</h2>' >> "$report_file"
    echo '        <pre>' >> "$report_file"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}" >> "$report_file" 2>/dev/null || echo "리소스 정보 없음" >> "$report_file"
    echo '        </pre>' >> "$report_file"
    echo '    </div>' >> "$report_file"
    
    # 에러 로그 요약
    echo '    <div class="section">' >> "$report_file"
    echo '        <h2>에러 로그 요약</h2>' >> "$report_file"
    echo '        <pre>' >> "$report_file"
    for service in backend ai-engine teacher-dashboard; do
        local error_count=$(docker-compose -f "$COMPOSE_FILE" logs "$service" 2>/dev/null | grep -i "error\|exception" | wc -l || echo "0")
        echo "$service: $error_count 에러" >> "$report_file"
    done
    echo '        </pre>' >> "$report_file"
    echo '    </div>' >> "$report_file"
    
    # 보안 이벤트 요약
    echo '    <div class="section">' >> "$report_file"
    echo '        <h2>보안 이벤트 요약</h2>' >> "$report_file"
    echo '        <pre>' >> "$report_file"
    local failed_logins=$(docker-compose -f "$COMPOSE_FILE" logs backend 2>/dev/null | grep -i "login.*fail\|authentication.*fail" | wc -l || echo "0")
    echo "실패한 로그인 시도: $failed_logins" >> "$report_file"
    echo '        </pre>' >> "$report_file"
    echo '    </div>' >> "$report_file"
    
    echo '</body></html>' >> "$report_file"
    
    log_success "리포트 생성 완료: $report_file"
}

# 알림 발송
send_alert() {
    local alert_type="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    
    log_warning "[$alert_type] $message"
    
    # Slack 웹훅
    if [[ -n "${SLACK_WEBHOOK_URL:-}" ]]; then
        local color="good"
        case "$alert_type" in
            "CRITICAL"|"ERROR") color="danger" ;;
            "WARNING") color="warning" ;;
            "SECURITY") color="#ff0000" ;;
        esac
        
        curl -X POST -H 'Content-type: application/json' \
            --data "{
                \"attachments\": [{
                    \"color\": \"$color\",
                    \"title\": \"MiraClass Alert - $alert_type\",
                    \"text\": \"$message\",
                    \"footer\": \"$timestamp\"
                }]
            }" \
            "$SLACK_WEBHOOK_URL" &>/dev/null
    fi
    
    # 이메일 알림
    if [[ -n "${NOTIFICATION_EMAIL:-}" ]]; then
        echo "[$timestamp] [$alert_type] $message" | mail -s "MiraClass Alert - $alert_type" "$NOTIFICATION_EMAIL" &>/dev/null || true
    fi
    
    # 로그 파일에 기록
    echo "[$timestamp] [$alert_type] $message" >> "$LOG_DIR/alerts.log"
}

# 로그 실시간 감시
watch_logs_realtime() {
    log_info "로그 실시간 감시 시작 (Ctrl+C로 종료)"
    
    case "$SERVICE_FILTER" in
        "all")
            docker-compose -f "$COMPOSE_FILE" logs -f
            ;;
        *)
            docker-compose -f "$COMPOSE_FILE" logs -f "$SERVICE_FILTER"
            ;;
    esac
}

# 연속 모니터링
continuous_monitoring() {
    log_info "연속 모니터링 시작 (간격: ${MONITOR_INTERVAL}초)"
    
    while true; do
        clear
        echo -e "${BLUE}=== MiraClass 연속 모니터링 ===${NC}"
        echo "시간: $(date)"
        echo "모드: $MONITOR_MODE"
        echo "간격: ${MONITOR_INTERVAL}초"
        echo ""
        
        case "$MONITOR_MODE" in
            "status")
                check_service_status
                ;;
            "health")
                perform_health_check
                ;;
            "performance")
                monitor_performance
                ;;
            "logs")
                analyze_logs
                ;;
            "security")
                analyze_security_logs
                ;;
            "errors")
                analyze_error_logs
                ;;
        esac
        
        echo -e "\n${YELLOW}다음 업데이트까지 ${MONITOR_INTERVAL}초...${NC}"
        sleep "$MONITOR_INTERVAL"
    done
}

# 메인 함수
main() {
    log_info "MiraClass 모니터링 시작"
    log_info "모드: $MONITOR_MODE, 서비스: $SERVICE_FILTER"
    
    check_prerequisites
    setup_directories
    
    # 로그 실시간 감시 모드
    if [[ "$WATCH_LOGS" == "true" ]]; then
        watch_logs_realtime
        return 0
    fi
    
    # 연속 모니터링 모드
    if [[ "$CONTINUOUS_MODE" == "true" ]]; then
        continuous_monitoring
        return 0
    fi
    
    # 단일 실행 모드
    case "$MONITOR_MODE" in
        "status")
            check_service_status
            ;;
        "health")
            perform_health_check
            ;;
        "performance")
            monitor_performance
            ;;
        "logs")
            analyze_logs
            ;;
        "resources")
            monitor_performance
            ;;
        "security")
            analyze_security_logs
            ;;
        "errors")
            analyze_error_logs
            ;;
        "report")
            check_service_status
            perform_health_check
            monitor_performance
            analyze_logs
            analyze_security_logs
            generate_report
            ;;
        *)
            log_error "알 수 없는 모니터링 모드: $MONITOR_MODE"
            show_help
            exit 1
            ;;
    esac
    
    # 리포트 생성
    if [[ "$GENERATE_REPORT" == "true" ]]; then
        generate_report
    fi
    
    log_success "모니터링 완료"
}

# 에러 핸들링
trap 'log_error "모니터링 중 오류 발생"; exit 1' ERR

# 인터럽트 핸들링 (Ctrl+C)
trap 'log_info "모니터링 중단됨"; exit 0' INT

# 스크립트 실행
main "$@"