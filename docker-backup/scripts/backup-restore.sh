#!/bin/bash

# MiraClass 백업 및 복구 스크립트
# 데이터베이스, 파일, 설정 등의 백업과 복구를 자동화

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
BACKUP_DIR="${BACKUP_DIR:-/var/backups/miraclass}"
REMOTE_BACKUP_DIR="${REMOTE_BACKUP_DIR:-}"
S3_BUCKET="${S3_BACKUP_BUCKET:-}"
DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_RETENTION_DAYS=30
COMPRESSION_LEVEL=6

# 기본값 설정
OPERATION="backup"
BACKUP_TYPE="full"
RESTORE_FILE=""
FORCE_RESTORE=false
SKIP_CONFIRMATION=false
UPLOAD_TO_S3=false
UPLOAD_TO_REMOTE=false
ENCRYPT_BACKUP=false
ENCRYPTION_KEY=""
VERIFY_BACKUP=true
CLEANUP_OLD_BACKUPS=true

# 도움말 함수
show_help() {
    cat << EOF
MiraClass 백업 및 복구 스크립트

사용법: $0 [옵션]

작업:
  backup              백업 수행 (기본값)
  restore             복구 수행
  list                백업 목록 표시
  verify              백업 파일 검증
  cleanup             오래된 백업 정리

백업 타입:
  full                전체 백업 (기본값)
  database            데이터베이스만 백업
  files               파일만 백업
  config              설정 파일만 백업

옵션:
  -o, --operation OP        작업 선택 (backup, restore, list, verify, cleanup)
  -t, --type TYPE           백업 타입 선택
  -f, --file FILE           복구할 백업 파일 경로
  -d, --backup-dir DIR      백업 디렉토리 (기본값: /var/backups/miraclass)
  -r, --retention DAYS      백업 보존 기간 (기본값: 30일)
  -c, --compression LEVEL   압축 레벨 (1-9, 기본값: 6)
  -s, --s3                  S3에 업로드
  -u, --upload-remote       원격 서버에 업로드
  -e, --encrypt             백업 암호화
  -k, --encryption-key KEY  암호화 키
  --force                   강제 복구 (확인 없이)
  --skip-confirmation       확인 건너뛰기
  --no-verify               백업 검증 건너뛰기
  --no-cleanup              오래된 백업 정리 건너뛰기
  -h, --help                이 도움말 표시

예시:
  $0 --operation backup --type full --s3
  $0 --operation restore --file /path/to/backup.tar.gz
  $0 --operation backup --type database --encrypt
  $0 --operation cleanup --retention 7
EOF
}

# 명령행 인수 파싱
while [[ $# -gt 0 ]]; do
    case $1 in
        -o|--operation)
            OPERATION="$2"
            shift 2
            ;;
        -t|--type)
            BACKUP_TYPE="$2"
            shift 2
            ;;
        -f|--file)
            RESTORE_FILE="$2"
            shift 2
            ;;
        -d|--backup-dir)
            BACKUP_DIR="$2"
            shift 2
            ;;
        -r|--retention)
            BACKUP_RETENTION_DAYS="$2"
            shift 2
            ;;
        -c|--compression)
            COMPRESSION_LEVEL="$2"
            shift 2
            ;;
        -s|--s3)
            UPLOAD_TO_S3=true
            shift
            ;;
        -u|--upload-remote)
            UPLOAD_TO_REMOTE=true
            shift
            ;;
        -e|--encrypt)
            ENCRYPT_BACKUP=true
            shift
            ;;
        -k|--encryption-key)
            ENCRYPTION_KEY="$2"
            shift 2
            ;;
        --force)
            FORCE_RESTORE=true
            shift
            ;;
        --skip-confirmation)
            SKIP_CONFIRMATION=true
            shift
            ;;
        --no-verify)
            VERIFY_BACKUP=false
            shift
            ;;
        --no-cleanup)
            CLEANUP_OLD_BACKUPS=false
            shift
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
    
    local tools=("docker" "docker-compose" "tar" "gzip")
    
    # 암호화 사용 시 gpg 필요
    if [[ "$ENCRYPT_BACKUP" == "true" ]]; then
        tools+=("gpg")
    fi
    
    # S3 업로드 시 aws cli 필요
    if [[ "$UPLOAD_TO_S3" == "true" ]]; then
        tools+=("aws")
    fi
    
    # 원격 업로드 시 rsync 필요
    if [[ "$UPLOAD_TO_REMOTE" == "true" ]]; then
        tools+=("rsync")
    fi
    
    for tool in "${tools[@]}"; do
        if ! command -v "$tool" &> /dev/null; then
            log_error "$tool이 설치되지 않았습니다."
            exit 1
        fi
    done
    
    log_success "모든 필수 도구가 준비되었습니다."
}

# 환경 설정
setup_environment() {
    log_info "환경 설정 중..."
    
    # 백업 디렉토리 생성
    mkdir -p "$BACKUP_DIR"
    
    # 환경 변수 파일 확인
    if [[ ! -f ".env.${ENVIRONMENT}" ]]; then
        log_error ".env.${ENVIRONMENT} 파일이 없습니다."
        exit 1
    fi
    
    # 환경 변수 로드
    source ".env.${ENVIRONMENT}"
    
    # 암호화 키 설정
    if [[ "$ENCRYPT_BACKUP" == "true" && -z "$ENCRYPTION_KEY" ]]; then
        if [[ -n "${BACKUP_ENCRYPTION_KEY:-}" ]]; then
            ENCRYPTION_KEY="$BACKUP_ENCRYPTION_KEY"
        else
            log_error "암호화 키가 설정되지 않았습니다."
            exit 1
        fi
    fi
    
    log_success "환경 설정 완료"
}

# 서비스 상태 확인
check_services() {
    log_info "서비스 상태 확인 중..."
    
    if ! docker-compose -f "$COMPOSE_FILE" ps | grep -q "Up"; then
        log_warning "일부 서비스가 실행되지 않고 있습니다."
        docker-compose -f "$COMPOSE_FILE" ps
        
        if [[ "$SKIP_CONFIRMATION" != "true" ]]; then
            echo -n "계속하시겠습니까? (y/N): "
            read -r response
            if [[ ! "$response" =~ ^[Yy]$ ]]; then
                log_info "작업이 취소되었습니다."
                exit 0
            fi
        fi
    fi
}

# PostgreSQL 백업
backup_postgresql() {
    log_info "PostgreSQL 백업 중..."
    
    local backup_file="$BACKUP_DIR/postgres_${DATE}.sql"
    
    # 데이터베이스 백업
    docker-compose -f "$COMPOSE_FILE" exec -T postgres pg_dump \
        -U "$POSTGRES_USER" \
        -d "$POSTGRES_DB" \
        --verbose \
        --no-owner \
        --no-privileges \
        > "$backup_file"
    
    if [[ $? -eq 0 ]]; then
        log_success "PostgreSQL 백업 완료: $backup_file"
        
        # 압축
        gzip -"$COMPRESSION_LEVEL" "$backup_file"
        log_success "PostgreSQL 백업 압축 완료: ${backup_file}.gz"
        
        echo "${backup_file}.gz"
    else
        log_error "PostgreSQL 백업 실패"
        return 1
    fi
}

# Redis 백업
backup_redis() {
    log_info "Redis 백업 중..."
    
    local backup_file="$BACKUP_DIR/redis_${DATE}.rdb"
    
    # Redis 백업
    docker-compose -f "$COMPOSE_FILE" exec -T redis redis-cli --rdb "$backup_file"
    
    if [[ $? -eq 0 ]]; then
        log_success "Redis 백업 완료: $backup_file"
        
        # 압축
        gzip -"$COMPRESSION_LEVEL" "$backup_file"
        log_success "Redis 백업 압축 완료: ${backup_file}.gz"
        
        echo "${backup_file}.gz"
    else
        log_error "Redis 백업 실패"
        return 1
    fi
}

# Neo4j 백업
backup_neo4j() {
    log_info "Neo4j 백업 중..."
    
    local backup_file="$BACKUP_DIR/neo4j_${DATE}.dump"
    
    # Neo4j 백업
    docker-compose -f "$COMPOSE_FILE" exec -T neo4j neo4j-admin dump \
        --database=neo4j \
        --to="$backup_file"
    
    if [[ $? -eq 0 ]]; then
        log_success "Neo4j 백업 완료: $backup_file"
        
        # 압축
        gzip -"$COMPRESSION_LEVEL" "$backup_file"
        log_success "Neo4j 백업 압축 완료: ${backup_file}.gz"
        
        echo "${backup_file}.gz"
    else
        log_error "Neo4j 백업 실패"
        return 1
    fi
}

# 파일 백업
backup_files() {
    log_info "파일 백업 중..."
    
    local backup_file="$BACKUP_DIR/files_${DATE}.tar.gz"
    local files_to_backup=()
    
    # 백업할 디렉토리/파일 목록
    local backup_paths=(
        "uploads"
        "storage"
        "logs"
        "certificates"
        ".env.${ENVIRONMENT}"
    )
    
    # 존재하는 경로만 백업 목록에 추가
    for path in "${backup_paths[@]}"; do
        if [[ -e "$path" ]]; then
            files_to_backup+=("$path")
        fi
    done
    
    if [[ ${#files_to_backup[@]} -eq 0 ]]; then
        log_warning "백업할 파일이 없습니다."
        return 0
    fi
    
    # 파일 백업
    tar -czf "$backup_file" \
        --exclude='*.log' \
        --exclude='node_modules' \
        --exclude='.git' \
        --exclude='tmp' \
        "${files_to_backup[@]}"
    
    if [[ $? -eq 0 ]]; then
        log_success "파일 백업 완료: $backup_file"
        echo "$backup_file"
    else
        log_error "파일 백업 실패"
        return 1
    fi
}

# 설정 파일 백업
backup_config() {
    log_info "설정 파일 백업 중..."
    
    local backup_file="$BACKUP_DIR/config_${DATE}.tar.gz"
    local config_files=()
    
    # 백업할 설정 파일 목록
    local config_paths=(
        "docker-compose.${ENVIRONMENT}.yml"
        ".env.${ENVIRONMENT}"
        "nginx.conf"
        "database/init.sql"
        "database/seed.sql"
        "scripts"
        "config"
    )
    
    # 존재하는 설정 파일만 백업 목록에 추가
    for path in "${config_paths[@]}"; do
        if [[ -e "$path" ]]; then
            config_files+=("$path")
        fi
    done
    
    if [[ ${#config_files[@]} -eq 0 ]]; then
        log_warning "백업할 설정 파일이 없습니다."
        return 0
    fi
    
    # 설정 파일 백업
    tar -czf "$backup_file" "${config_files[@]}"
    
    if [[ $? -eq 0 ]]; then
        log_success "설정 파일 백업 완료: $backup_file"
        echo "$backup_file"
    else
        log_error "설정 파일 백업 실패"
        return 1
    fi
}

# 전체 백업
perform_full_backup() {
    log_info "전체 백업 시작..."
    
    local backup_files=()
    local final_backup_file="$BACKUP_DIR/miraclass_full_${DATE}.tar.gz"
    
    # 각 구성 요소 백업
    case "$BACKUP_TYPE" in
        "full")
            backup_files+=($(backup_postgresql))
            backup_files+=($(backup_redis))
            backup_files+=($(backup_neo4j))
            backup_files+=($(backup_files))
            backup_files+=($(backup_config))
            ;;
        "database")
            backup_files+=($(backup_postgresql))
            backup_files+=($(backup_redis))
            backup_files+=($(backup_neo4j))
            ;;
        "files")
            backup_files+=($(backup_files))
            ;;
        "config")
            backup_files+=($(backup_config))
            ;;
        *)
            log_error "알 수 없는 백업 타입: $BACKUP_TYPE"
            return 1
            ;;
    esac
    
    # 개별 백업 파일들을 하나로 통합
    if [[ ${#backup_files[@]} -gt 0 ]]; then
        log_info "백업 파일 통합 중..."
        
        # 메타데이터 파일 생성
        local metadata_file="$BACKUP_DIR/metadata_${DATE}.json"
        cat > "$metadata_file" << EOF
{
    "backup_date": "$(date -Iseconds)",
    "backup_type": "$BACKUP_TYPE",
    "environment": "$ENVIRONMENT",
    "project_name": "$PROJECT_NAME",
    "backup_files": [
EOF
        
        for i in "${!backup_files[@]}"; do
            local file="${backup_files[$i]}"
            local filename=$(basename "$file")
            local filesize=$(stat -f%z "$file" 2>/dev/null || echo "0")
            local checksum=$(shasum -a 256 "$file" | awk '{print $1}')
            
            echo "        {" >> "$metadata_file"
            echo "            \"filename\": \"$filename\"," >> "$metadata_file"
            echo "            \"size\": $filesize," >> "$metadata_file"
            echo "            \"checksum\": \"$checksum\"" >> "$metadata_file"
            
            if [[ $i -eq $((${#backup_files[@]} - 1)) ]]; then
                echo "        }" >> "$metadata_file"
            else
                echo "        }," >> "$metadata_file"
            fi
        done
        
        echo "    ]" >> "$metadata_file"
        echo "}" >> "$metadata_file"
        
        # 최종 백업 파일 생성
        tar -czf "$final_backup_file" -C "$BACKUP_DIR" \
            $(basename "$metadata_file") \
            $(for file in "${backup_files[@]}"; do basename "$file"; done)
        
        if [[ $? -eq 0 ]]; then
            log_success "통합 백업 파일 생성 완료: $final_backup_file"
            
            # 개별 백업 파일 정리
            rm -f "$metadata_file" "${backup_files[@]}"
            
            # 암호화
            if [[ "$ENCRYPT_BACKUP" == "true" ]]; then
                encrypt_backup "$final_backup_file"
                final_backup_file="${final_backup_file}.gpg"
            fi
            
            # 백업 검증
            if [[ "$VERIFY_BACKUP" == "true" ]]; then
                verify_backup "$final_backup_file"
            fi
            
            # 원격 업로드
            if [[ "$UPLOAD_TO_S3" == "true" ]]; then
                upload_to_s3 "$final_backup_file"
            fi
            
            if [[ "$UPLOAD_TO_REMOTE" == "true" ]]; then
                upload_to_remote "$final_backup_file"
            fi
            
            log_success "백업 완료: $final_backup_file"
        else
            log_error "통합 백업 파일 생성 실패"
            return 1
        fi
    else
        log_error "백업할 데이터가 없습니다."
        return 1
    fi
}

# 백업 암호화
encrypt_backup() {
    local backup_file="$1"
    log_info "백업 파일 암호화 중..."
    
    gpg --symmetric --cipher-algo AES256 --compress-algo 1 \
        --s2k-mode 3 --s2k-digest-algo SHA512 --s2k-count 65536 \
        --passphrase "$ENCRYPTION_KEY" --batch --yes \
        "$backup_file"
    
    if [[ $? -eq 0 ]]; then
        rm -f "$backup_file"
        log_success "백업 파일 암호화 완료: ${backup_file}.gpg"
    else
        log_error "백업 파일 암호화 실패"
        return 1
    fi
}

# 백업 검증
verify_backup() {
    local backup_file="$1"
    log_info "백업 파일 검증 중..."
    
    if [[ "$backup_file" == *.gpg ]]; then
        # 암호화된 파일 검증
        if gpg --quiet --batch --passphrase "$ENCRYPTION_KEY" --decrypt "$backup_file" | tar -tzf - &>/dev/null; then
            log_success "암호화된 백업 파일 검증 완료"
        else
            log_error "암호화된 백업 파일 검증 실패"
            return 1
        fi
    else
        # 일반 파일 검증
        if tar -tzf "$backup_file" &>/dev/null; then
            log_success "백업 파일 검증 완료"
        else
            log_error "백업 파일 검증 실패"
            return 1
        fi
    fi
}

# S3 업로드
upload_to_s3() {
    local backup_file="$1"
    
    if [[ -z "$S3_BUCKET" ]]; then
        log_error "S3 버킷이 설정되지 않았습니다."
        return 1
    fi
    
    log_info "S3에 백업 파일 업로드 중..."
    
    local s3_key="miraclass/backups/$(basename "$backup_file")"
    
    aws s3 cp "$backup_file" "s3://$S3_BUCKET/$s3_key" \
        --storage-class STANDARD_IA \
        --metadata "project=miraclass,environment=$ENVIRONMENT,backup_type=$BACKUP_TYPE"
    
    if [[ $? -eq 0 ]]; then
        log_success "S3 업로드 완료: s3://$S3_BUCKET/$s3_key"
    else
        log_error "S3 업로드 실패"
        return 1
    fi
}

# 원격 서버 업로드
upload_to_remote() {
    local backup_file="$1"
    
    if [[ -z "$REMOTE_BACKUP_DIR" ]]; then
        log_error "원격 백업 디렉토리가 설정되지 않았습니다."
        return 1
    fi
    
    log_info "원격 서버에 백업 파일 업로드 중..."
    
    rsync -avz --progress "$backup_file" "$REMOTE_BACKUP_DIR/"
    
    if [[ $? -eq 0 ]]; then
        log_success "원격 서버 업로드 완료"
    else
        log_error "원격 서버 업로드 실패"
        return 1
    fi
}

# 백업 목록 표시
list_backups() {
    log_info "백업 목록 조회 중..."
    
    echo -e "\n${CYAN}=== 로컬 백업 파일 ===${NC}"
    if [[ -d "$BACKUP_DIR" ]]; then
        ls -lah "$BACKUP_DIR"/*.tar.gz "$BACKUP_DIR"/*.gpg 2>/dev/null | \
            awk '{print $9 "\t" $5 "\t" $6 " " $7 " " $8}' | \
            column -t -s $'\t' -N "파일명,크기,날짜"
    else
        echo "백업 디렉토리가 없습니다: $BACKUP_DIR"
    fi
    
    # S3 백업 목록
    if [[ "$UPLOAD_TO_S3" == "true" && -n "$S3_BUCKET" ]]; then
        echo -e "\n${CYAN}=== S3 백업 파일 ===${NC}"
        aws s3 ls "s3://$S3_BUCKET/miraclass/backups/" --human-readable
    fi
}

# 백업 복구
restore_backup() {
    if [[ -z "$RESTORE_FILE" ]]; then
        log_error "복구할 백업 파일이 지정되지 않았습니다."
        return 1
    fi
    
    if [[ ! -f "$RESTORE_FILE" ]]; then
        log_error "백업 파일을 찾을 수 없습니다: $RESTORE_FILE"
        return 1
    fi
    
    log_info "백업 복구 시작: $RESTORE_FILE"
    
    # 확인 프롬프트
    if [[ "$FORCE_RESTORE" != "true" ]]; then
        echo -e "\n${RED}경고: 이 작업은 현재 데이터를 덮어씁니다!${NC}"
        echo "복구할 파일: $RESTORE_FILE"
        echo "환경: $ENVIRONMENT"
        echo -n "정말로 복구하시겠습니까? (yes/no): "
        read -r response
        if [[ "$response" != "yes" ]]; then
            log_info "복구가 취소되었습니다."
            return 0
        fi
    fi
    
    # 임시 디렉토리 생성
    local temp_dir=$(mktemp -d)
    local restore_dir="$temp_dir/restore"
    mkdir -p "$restore_dir"
    
    # 백업 파일 압축 해제
    log_info "백업 파일 압축 해제 중..."
    
    if [[ "$RESTORE_FILE" == *.gpg ]]; then
        # 암호화된 파일 복호화 및 압축 해제
        if [[ -z "$ENCRYPTION_KEY" ]]; then
            log_error "암호화 키가 설정되지 않았습니다."
            rm -rf "$temp_dir"
            return 1
        fi
        
        gpg --quiet --batch --passphrase "$ENCRYPTION_KEY" --decrypt "$RESTORE_FILE" | \
            tar -xzf - -C "$restore_dir"
    else
        # 일반 파일 압축 해제
        tar -xzf "$RESTORE_FILE" -C "$restore_dir"
    fi
    
    if [[ $? -ne 0 ]]; then
        log_error "백업 파일 압축 해제 실패"
        rm -rf "$temp_dir"
        return 1
    fi
    
    # 메타데이터 확인
    local metadata_file=$(find "$restore_dir" -name "metadata_*.json" | head -1)
    if [[ -n "$metadata_file" ]]; then
        log_info "백업 메타데이터 확인 중..."
        local backup_env=$(jq -r '.environment' "$metadata_file")
        local backup_type=$(jq -r '.backup_type' "$metadata_file")
        
        echo "백업 환경: $backup_env"
        echo "백업 타입: $backup_type"
        
        if [[ "$backup_env" != "$ENVIRONMENT" ]]; then
            log_warning "백업 환경($backup_env)과 현재 환경($ENVIRONMENT)이 다릅니다."
        fi
    fi
    
    # 서비스 중지
    log_info "서비스 중지 중..."
    docker-compose -f "$COMPOSE_FILE" down
    
    # 데이터베이스 복구
    log_info "데이터베이스 복구 중..."
    
    # PostgreSQL 복구
    local postgres_backup=$(find "$restore_dir" -name "postgres_*.sql.gz" | head -1)
    if [[ -n "$postgres_backup" ]]; then
        log_info "PostgreSQL 복구 중..."
        docker-compose -f "$COMPOSE_FILE" up -d postgres
        sleep 30
        
        gunzip -c "$postgres_backup" | \
            docker-compose -f "$COMPOSE_FILE" exec -T postgres psql -U "$POSTGRES_USER" -d "$POSTGRES_DB"
        
        if [[ $? -eq 0 ]]; then
            log_success "PostgreSQL 복구 완료"
        else
            log_error "PostgreSQL 복구 실패"
        fi
    fi
    
    # Redis 복구
    local redis_backup=$(find "$restore_dir" -name "redis_*.rdb.gz" | head -1)
    if [[ -n "$redis_backup" ]]; then
        log_info "Redis 복구 중..."
        docker-compose -f "$COMPOSE_FILE" up -d redis
        sleep 10
        
        gunzip -c "$redis_backup" | \
            docker-compose -f "$COMPOSE_FILE" exec -T redis redis-cli --pipe
        
        if [[ $? -eq 0 ]]; then
            log_success "Redis 복구 완료"
        else
            log_error "Redis 복구 실패"
        fi
    fi
    
    # Neo4j 복구
    local neo4j_backup=$(find "$restore_dir" -name "neo4j_*.dump.gz" | head -1)
    if [[ -n "$neo4j_backup" ]]; then
        log_info "Neo4j 복구 중..."
        docker-compose -f "$COMPOSE_FILE" up -d neo4j
        sleep 30
        
        local temp_dump="$temp_dir/neo4j.dump"
        gunzip -c "$neo4j_backup" > "$temp_dump"
        
        docker-compose -f "$COMPOSE_FILE" exec -T neo4j neo4j-admin load \
            --from="$temp_dump" --database=neo4j --force
        
        if [[ $? -eq 0 ]]; then
            log_success "Neo4j 복구 완료"
        else
            log_error "Neo4j 복구 실패"
        fi
    fi
    
    # 파일 복구
    local files_backup=$(find "$restore_dir" -name "files_*.tar.gz" | head -1)
    if [[ -n "$files_backup" ]]; then
        log_info "파일 복구 중..."
        tar -xzf "$files_backup" -C .
        
        if [[ $? -eq 0 ]]; then
            log_success "파일 복구 완료"
        else
            log_error "파일 복구 실패"
        fi
    fi
    
    # 설정 파일 복구
    local config_backup=$(find "$restore_dir" -name "config_*.tar.gz" | head -1)
    if [[ -n "$config_backup" ]]; then
        log_info "설정 파일 복구 중..."
        tar -xzf "$config_backup" -C .
        
        if [[ $? -eq 0 ]]; then
            log_success "설정 파일 복구 완료"
        else
            log_error "설정 파일 복구 실패"
        fi
    fi
    
    # 서비스 재시작
    log_info "서비스 재시작 중..."
    docker-compose -f "$COMPOSE_FILE" up -d
    
    # 임시 디렉토리 정리
    rm -rf "$temp_dir"
    
    log_success "백업 복구 완료"
}

# 오래된 백업 정리
cleanup_old_backups() {
    log_info "오래된 백업 정리 중... (${BACKUP_RETENTION_DAYS}일 이상)"
    
    # 로컬 백업 정리
    local deleted_count=0
    while IFS= read -r -d '' file; do
        rm -f "$file"
        ((deleted_count++))
        log_debug "삭제됨: $(basename "$file")"
    done < <(find "$BACKUP_DIR" -name "*.tar.gz" -o -name "*.gpg" -mtime +"$BACKUP_RETENTION_DAYS" -print0 2>/dev/null)
    
    log_success "로컬 백업 정리 완료: ${deleted_count}개 파일 삭제"
    
    # S3 백업 정리
    if [[ "$UPLOAD_TO_S3" == "true" && -n "$S3_BUCKET" ]]; then
        log_info "S3 백업 정리 중..."
        
        local cutoff_date=$(date -d "$BACKUP_RETENTION_DAYS days ago" +%Y-%m-%d)
        aws s3api list-objects-v2 --bucket "$S3_BUCKET" --prefix "miraclass/backups/" \
            --query "Contents[?LastModified<='$cutoff_date'].Key" --output text | \
        while read -r key; do
            if [[ -n "$key" ]]; then
                aws s3 rm "s3://$S3_BUCKET/$key"
                log_debug "S3에서 삭제됨: $key"
            fi
        done
        
        log_success "S3 백업 정리 완료"
    fi
}

# 메인 함수
main() {
    log_info "MiraClass 백업/복구 도구 시작"
    log_info "작업: $OPERATION, 타입: $BACKUP_TYPE"
    
    check_prerequisites
    setup_environment
    
    case "$OPERATION" in
        "backup")
            check_services
            perform_full_backup
            
            if [[ "$CLEANUP_OLD_BACKUPS" == "true" ]]; then
                cleanup_old_backups
            fi
            ;;
        "restore")
            restore_backup
            ;;
        "list")
            list_backups
            ;;
        "verify")
            if [[ -n "$RESTORE_FILE" ]]; then
                verify_backup "$RESTORE_FILE"
            else
                log_error "검증할 백업 파일을 지정해주세요."
                exit 1
            fi
            ;;
        "cleanup")
            cleanup_old_backups
            ;;
        *)
            log_error "알 수 없는 작업: $OPERATION"
            show_help
            exit 1
            ;;
    esac
    
    log_success "작업 완료"
}

# 에러 핸들링
trap 'log_error "백업/복구 중 오류 발생"; exit 1' ERR

# 스크립트 실행
main "$@"