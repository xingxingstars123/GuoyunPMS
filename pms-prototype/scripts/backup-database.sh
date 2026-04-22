#!/bin/bash

###############################################################################
# GuoyunPMS 数据库自动备份脚本
# 功能:
# - 自动备份SQLite数据库
# - 压缩备份文件
# - 保留最近N天的备份
# - 支持远程备份到S3/OSS
###############################################################################

set -e  # 遇到错误立即退出

# 配置
DB_PATH="${DB_PATH:-/app/database/pms.db}"
BACKUP_DIR="${BACKUP_DIR:-/app/backups}"
RETENTION_DAYS="${RETENTION_DAYS:-7}"  # 保留天数
S3_BUCKET="${S3_BUCKET:-}"  # S3存储桶(可选)
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="pms_backup_${TIMESTAMP}.db"
COMPRESSED_FILE="${BACKUP_FILE}.gz"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# 检查数据库文件是否存在
if [ ! -f "$DB_PATH" ]; then
    log_error "Database file not found: $DB_PATH"
    exit 1
fi

# 创建备份目录
mkdir -p "$BACKUP_DIR"

log_info "Starting database backup..."

# 备份数据库
log_info "Copying database file..."
cp "$DB_PATH" "$BACKUP_DIR/$BACKUP_FILE"

# 验证备份文件
if [ ! -f "$BACKUP_DIR/$BACKUP_FILE" ]; then
    log_error "Backup file not created!"
    exit 1
fi

# 压缩备份文件
log_info "Compressing backup..."
gzip "$BACKUP_DIR/$BACKUP_FILE"

BACKUP_SIZE=$(du -h "$BACKUP_DIR/$COMPRESSED_FILE" | cut -f1)
log_info "Backup created: $COMPRESSED_FILE (Size: $BACKUP_SIZE)"

# 上传到S3(如果配置了)
if [ -n "$S3_BUCKET" ]; then
    log_info "Uploading to S3: s3://$S3_BUCKET/backups/"
    
    if command -v aws &> /dev/null; then
        aws s3 cp "$BACKUP_DIR/$COMPRESSED_FILE" "s3://$S3_BUCKET/backups/$COMPRESSED_FILE"
        log_info "Upload to S3 completed"
    else
        log_warn "AWS CLI not found, skipping S3 upload"
    fi
fi

# 清理旧备份
log_info "Cleaning up old backups (keeping last $RETENTION_DAYS days)..."
find "$BACKUP_DIR" -name "pms_backup_*.db.gz" -type f -mtime +$RETENTION_DAYS -delete

BACKUP_COUNT=$(find "$BACKUP_DIR" -name "pms_backup_*.db.gz" -type f | wc -l)
log_info "Cleanup completed. Remaining backups: $BACKUP_COUNT"

# 显示备份列表
log_info "Recent backups:"
find "$BACKUP_DIR" -name "pms_backup_*.db.gz" -type f -printf "%T@ %p\n" | sort -rn | head -5 | awk '{print $2}' | xargs -I {} basename {}

log_info "Backup process completed successfully!"

# 返回备份文件路径(用于脚本集成)
echo "$BACKUP_DIR/$COMPRESSED_FILE"
