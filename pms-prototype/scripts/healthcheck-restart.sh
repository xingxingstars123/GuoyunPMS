#!/bin/bash

###############################################################################
# GuoyunPMS 健康检查和自动重启脚本
# 功能:
# - 检查服务健康状态
# - 自动重启失败的服务
# - 发送告警通知
# - 记录健康检查日志
###############################################################################

set -e

# 配置
API_URL="${API_URL:-http://localhost:3101}"
HEALTH_ENDPOINT="${API_URL}/api/health"
MAX_RETRIES="${MAX_RETRIES:-3}"
RETRY_INTERVAL="${RETRY_INTERVAL:-10}"  # 秒
LOG_FILE="${LOG_FILE:-/var/log/guoyunpms/healthcheck.log}"
ALERT_WEBHOOK="${ALERT_WEBHOOK:-}"  # 告警Webhook URL(飞书/钉钉/Slack)

# PM2配置(如果使用PM2管理进程)
PM2_APP_NAME="${PM2_APP_NAME:-guoyunpms}"

# Docker配置(如果使用Docker)
DOCKER_CONTAINER="${DOCKER_CONTAINER:-guoyunpms-backend}"

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# 创建日志目录
mkdir -p "$(dirname "$LOG_FILE")"

log_message() {
    local level=$1
    shift
    local message="$@"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" | tee -a "$LOG_FILE"
}

log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
    log_message "INFO" "$1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
    log_message "WARN" "$1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
    log_message "ERROR" "$1"
}

# 发送告警通知
send_alert() {
    local message=$1
    
    if [ -n "$ALERT_WEBHOOK" ]; then
        curl -X POST "$ALERT_WEBHOOK" \
            -H "Content-Type: application/json" \
            -d "{\"msg_type\":\"text\",\"content\":{\"text\":\"🚨 GuoyunPMS Alert: $message\"}}" \
            > /dev/null 2>&1 || log_warn "Failed to send alert"
    fi
}

# 健康检查函数
check_health() {
    local url=$1
    local response
    local http_code
    
    response=$(curl -s -w "\n%{http_code}" "$url" 2>&1)
    http_code=$(echo "$response" | tail -n1)
    
    if [ "$http_code" = "200" ]; then
        log_info "Health check passed (HTTP $http_code)"
        return 0
    else
        log_error "Health check failed (HTTP $http_code)"
        return 1
    fi
}

# PM2重启函数
restart_pm2() {
    log_warn "Attempting to restart PM2 app: $PM2_APP_NAME"
    
    if command -v pm2 &> /dev/null; then
        pm2 restart "$PM2_APP_NAME"
        sleep 5
        
        if pm2 list | grep -q "$PM2_APP_NAME.*online"; then
            log_info "PM2 app restarted successfully"
            return 0
        else
            log_error "PM2 app failed to restart"
            return 1
        fi
    else
        log_error "PM2 not found"
        return 1
    fi
}

# Docker重启函数
restart_docker() {
    log_warn "Attempting to restart Docker container: $DOCKER_CONTAINER"
    
    if command -v docker &> /dev/null; then
        docker restart "$DOCKER_CONTAINER"
        sleep 10
        
        if docker ps | grep -q "$DOCKER_CONTAINER"; then
            log_info "Docker container restarted successfully"
            return 0
        else
            log_error "Docker container failed to restart"
            return 1
        fi
    else
        log_error "Docker not found"
        return 1
    fi
}

# 主函数
main() {
    log_info "Starting health check..."
    
    local retry_count=0
    local health_ok=false
    
    # 重试机制
    while [ $retry_count -lt $MAX_RETRIES ]; do
        if check_health "$HEALTH_ENDPOINT"; then
            health_ok=true
            break
        fi
        
        retry_count=$((retry_count + 1))
        
        if [ $retry_count -lt $MAX_RETRIES ]; then
            log_warn "Retry $retry_count/$MAX_RETRIES in ${RETRY_INTERVAL}s..."
            sleep $RETRY_INTERVAL
        fi
    done
    
    # 如果所有重试都失败,尝试重启服务
    if [ "$health_ok" = false ]; then
        log_error "Health check failed after $MAX_RETRIES retries"
        send_alert "Service unhealthy after $MAX_RETRIES checks. Attempting restart..."
        
        # 尝试重启(优先使用Docker,其次PM2)
        if [ -n "$DOCKER_CONTAINER" ] && command -v docker &> /dev/null; then
            if restart_docker; then
                send_alert "Service restarted successfully (Docker)"
                
                # 验证重启后的健康状态
                sleep 10
                if check_health "$HEALTH_ENDPOINT"; then
                    log_info "Service healthy after restart"
                    exit 0
                else
                    log_error "Service still unhealthy after restart"
                    send_alert "⚠️ CRITICAL: Service unhealthy after restart!"
                    exit 1
                fi
            else
                send_alert "❌ CRITICAL: Failed to restart service (Docker)"
                exit 1
            fi
        elif [ -n "$PM2_APP_NAME" ] && command -v pm2 &> /dev/null; then
            if restart_pm2; then
                send_alert "Service restarted successfully (PM2)"
                
                sleep 10
                if check_health "$HEALTH_ENDPOINT"; then
                    log_info "Service healthy after restart"
                    exit 0
                else
                    log_error "Service still unhealthy after restart"
                    send_alert "⚠️ CRITICAL: Service unhealthy after restart!"
                    exit 1
                fi
            else
                send_alert "❌ CRITICAL: Failed to restart service (PM2)"
                exit 1
            fi
        else
            log_error "No restart mechanism available (Docker or PM2)"
            send_alert "❌ CRITICAL: Service unhealthy and cannot auto-restart!"
            exit 1
        fi
    fi
    
    log_info "Health check completed successfully"
    exit 0
}

# 执行主函数
main
