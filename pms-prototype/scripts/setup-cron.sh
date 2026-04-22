#!/bin/bash

###############################################################################
# GuoyunPMS Cron任务配置脚本
# 自动配置定时任务:
# - 每日数据库备份(凌晨2点)
# - 健康检查(每5分钟)
# - 日志清理(每周)
###############################################################################

set -e

# 颜色输出
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

# 获取脚本绝对路径
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

log_info "Setting up cron jobs for GuoyunPMS..."
log_info "Project root: $PROJECT_ROOT"

# 定义cron任务
CRON_JOBS="
# GuoyunPMS定时任务 (自动生成 - 请勿手动编辑此区域)

# 每日凌晨2点备份数据库
0 2 * * * $SCRIPT_DIR/backup-database.sh >> /var/log/guoyunpms/backup.log 2>&1

# 每5分钟健康检查
*/5 * * * * $SCRIPT_DIR/healthcheck-restart.sh >> /var/log/guoyunpms/healthcheck.log 2>&1

# 每周日凌晨3点清理7天前的日志
0 3 * * 0 find /var/log/guoyunpms -name '*.log' -mtime +7 -delete

# 每天凌晨4点清理旧的备份文件(保留30天)
0 4 * * * find $PROJECT_ROOT/backups -name 'pms_backup_*.db.gz' -mtime +30 -delete

# GuoyunPMS定时任务结束
"

# 创建日志目录
mkdir -p /var/log/guoyunpms
mkdir -p "$PROJECT_ROOT/backups"

# 检查当前用户的crontab
CURRENT_USER=$(whoami)
log_info "Configuring cron jobs for user: $CURRENT_USER"

# 备份现有的crontab
if crontab -l > /dev/null 2>&1; then
    log_info "Backing up existing crontab..."
    crontab -l > "$SCRIPT_DIR/crontab.backup.$(date +%Y%m%d_%H%M%S)"
fi

# 移除旧的GuoyunPMS cron任务
log_info "Removing old GuoyunPMS cron jobs..."
(crontab -l 2>/dev/null | grep -v "GuoyunPMS" || true) | crontab - || true

# 添加新的cron任务
log_info "Adding new cron jobs..."
(crontab -l 2>/dev/null || true; echo "$CRON_JOBS") | crontab -

# 验证cron任务
log_info "Verifying cron jobs..."
if crontab -l | grep -q "GuoyunPMS"; then
    log_info "✅ Cron jobs installed successfully!"
    echo ""
    echo "Installed cron jobs:"
    crontab -l | grep -A 10 "GuoyunPMS"
else
    log_warn "⚠️  Failed to install cron jobs"
    exit 1
fi

# 设置环境变量(可选)
cat > "$SCRIPT_DIR/cron-env.sh" << 'EOF'
#!/bin/bash
# GuoyunPMS Cron环境变量
export DB_PATH=/app/database/pms.db
export BACKUP_DIR=/app/backups
export RETENTION_DAYS=7
export API_URL=http://localhost:3101
export LOG_FILE=/var/log/guoyunpms/healthcheck.log
EOF

chmod +x "$SCRIPT_DIR/cron-env.sh"

log_info "Environment variables file created: $SCRIPT_DIR/cron-env.sh"

echo ""
log_info "Setup completed! Cron schedule:"
echo "  - Database backup:  Daily at 2:00 AM"
echo "  - Health check:     Every 5 minutes"
echo "  - Log cleanup:      Weekly on Sunday at 3:00 AM"
echo "  - Backup cleanup:   Daily at 4:00 AM (keep 30 days)"
echo ""
log_info "To view cron jobs: crontab -l"
log_info "To edit manually:  crontab -e"
log_info "To remove all:     crontab -r"
