#!/bin/bash
# send-file.sh - 飞书文件发送脚本

set -e

# 颜色输出
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# 显示帮助
show_help() {
    echo "飞书文件发送脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -f, --file FILE         要发送的文件路径（必需）"
    echo "  -t, --target TARGET     目标（格式：user:ou_xxx 或 chat:oc_xxx）"
    echo "  -m, --message TEXT      附带的消息文本（可选）"
    echo "  -c, --channel CHANNEL   渠道（默认：feishu）"
    echo "  -d, --dry-run           只检查不发送"
    echo "  -h, --help              显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 --file report.pdf                     # 发送到当前对话"
    echo "  $0 -f presentation.pptx -t chat:oc_123   # 发送到指定群聊"
    echo "  $0 -f data.xlsx -m \"最新数据\"          # 附带消息发送"
    echo ""
}

# 解析参数
FILE_PATH=""
TARGET=""
MESSAGE=""
CHANNEL="feishu"
DRY_RUN=false

while [[ $# -gt 0 ]]; do
    case $1 in
        -f|--file)
            FILE_PATH="$2"
            shift 2
            ;;
        -t|--target)
            TARGET="$2"
            shift 2
            ;;
        -m|--message)
            MESSAGE="$2"
            shift 2
            ;;
        -c|--channel)
            CHANNEL="$2"
            shift 2
            ;;
        -d|--dry-run)
            DRY_RUN=true
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            log_error "未知参数: $1"
            show_help
            exit 1
            ;;
    esac
done

# 验证参数
if [ -z "$FILE_PATH" ]; then
    log_error "文件路径不能为空"
    show_help
    exit 1
fi

if [ ! -f "$FILE_PATH" ]; then
    log_error "文件不存在: $FILE_PATH"
    exit 1
fi

# 检查文件大小
FILE_SIZE=$(stat -c%s "$FILE_PATH" 2>/dev/null || stat -f%z "$FILE_PATH" 2>/dev/null)
MAX_SIZE=$((30 * 1024 * 1024))  # 30MB

if [ "$FILE_SIZE" -gt "$MAX_SIZE" ]; then
    SIZE_MB=$((FILE_SIZE / 1024 / 1024))
    log_warning "文件大小超过30MB限制: ${SIZE_MB}MB"
    log_info "请压缩文件或修改 Gateway 配置中的 mediaMaxMb"
fi

# 获取文件信息
FILE_NAME=$(basename "$FILE_PATH")
FILE_EXT="${FILE_NAME##*.}"
FILE_SIZE_KB=$((FILE_SIZE / 1024))

log_info "准备发送文件:"
log_info "  文件名: $FILE_NAME"
log_info "  文件类型: .$FILE_EXT"
log_info "  文件大小: ${FILE_SIZE_KB}KB ($((FILE_SIZE/1024/1024))MB)"
log_info "  目标: ${TARGET:-当前对话}"
log_info "  渠道: $CHANNEL"

if [ -n "$MESSAGE" ]; then
    log_info "  附带消息: $MESSAGE"
fi

if $DRY_RUN; then
    log_success "✅ 检查完成（dry-run 模式）"
    exit 0
fi

# ==================== 发送文件 ====================
log_info "开始发送文件..."

# 构建命令
SEND_CMD="openclaw message send --channel \"$CHANNEL\" --filePath \"$FILE_PATH\""

if [ -n "$TARGET" ]; then
    SEND_CMD="$SEND_CMD --target \"$TARGET\""
fi

if [ -n "$MESSAGE" ]; then
    SEND_CMD="$SEND_CMD --message \"$MESSAGE\""
fi

log_info "执行命令: $SEND_CMD"

# 执行发送
if eval $SEND_CMD; then
    log_success "✅ 文件发送成功！"
    
    # 显示发送详情
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "📤 文件发送完成"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "📄 文件: $FILE_NAME"
    echo "📊 大小: ${FILE_SIZE_KB}KB"
    echo "🎯 目标: ${TARGET:-当前对话}"
    
    if [ -n "$MESSAGE" ]; then
        echo "💬 消息: $MESSAGE"
    fi
    
    echo ""
    echo "⚠️  注意：文本和文件会作为两条消息分别发送"
    echo "   （飞书 API 限制，一条消息只能是一种类型）"
    echo ""
else
    log_error "❌ 文件发送失败"
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "🔍 问题排查建议"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
    echo "1. ✅ 检查飞书应用权限："
    echo "   - im:message:send_as_bot"
    echo "   - im:resource"
    echo "   - im:message"
    echo ""
    echo "2. ✅ 检查机器人是否已加入目标群聊"
    echo ""
    echo "3. ✅ 检查文件大小是否超过限制（默认30MB）"
    echo ""
    echo "4. ✅ 检查 Gateway 网关是否正在运行："
    echo "   openclaw gateway status"
    echo ""
    echo "5. ✅ 查看实时日志："
    echo "   openclaw logs --follow"
    echo ""
    exit 1
fi

exit 0