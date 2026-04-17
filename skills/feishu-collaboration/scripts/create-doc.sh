#!/bin/bash
# create-doc.sh - 飞书文档创建三步法自动化脚本

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
    echo "飞书文档创建三步法自动化脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -t, --title TEXT        文档标题（必需）"
    echo "  -c, --content FILE      内容文件路径（必需）"
    echo "  -f, --folder TOKEN      文件夹token（可选）"
    echo "  -o, --output FILE       输出文档信息到文件（可选）"
    echo "  -h, --help              显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 --title \"项目文档\" --content content.md"
    echo "  $0 -t \"会议纪要\" -c notes.md -f folder_token"
    echo ""
}

# 解析参数
TITLE=""
CONTENT_FILE=""
FOLDER_TOKEN=""
OUTPUT_FILE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        -t|--title)
            TITLE="$2"
            shift 2
            ;;
        -c|--content)
            CONTENT_FILE="$2"
            shift 2
            ;;
        -f|--folder)
            FOLDER_TOKEN="$2"
            shift 2
            ;;
        -o|--output)
            OUTPUT_FILE="$2"
            shift 2
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
if [ -z "$TITLE" ]; then
    log_error "文档标题不能为空"
    show_help
    exit 1
fi

if [ -z "$CONTENT_FILE" ] || [ ! -f "$CONTENT_FILE" ]; then
    log_error "内容文件不存在或未指定: $CONTENT_FILE"
    show_help
    exit 1
fi

# 读取内容
CONTENT=$(cat "$CONTENT_FILE")
if [ -z "$CONTENT" ]; then
    log_warning "内容文件为空，将创建空白文档"
fi

log_info "开始创建飞书文档: $TITLE"

# ==================== 步骤1: 创建空文档 ====================
log_info "步骤1: 创建空文档..."

CREATE_CMD="openclaw feishu_doc create --title \"$TITLE\""
if [ -n "$FOLDER_TOKEN" ]; then
    CREATE_CMD="$CREATE_CMD --folder_token \"$FOLDER_TOKEN\""
fi

log_info "执行命令: $CREATE_CMD"
CREATE_RESPONSE=$(eval $CREATE_CMD 2>/dev/null || echo "{}")

# 解析响应
DOC_TOKEN=$(echo "$CREATE_RESPONSE" | jq -r '.document_id // empty')
DOC_URL=$(echo "$CREATE_RESPONSE" | jq -r '.url // empty')

if [ -z "$DOC_TOKEN" ] || [ "$DOC_TOKEN" = "null" ]; then
    log_error "文档创建失败"
    echo "响应: $CREATE_RESPONSE"
    exit 1
fi

log_success "文档创建成功"
log_info "文档Token: $DOC_TOKEN"
log_info "文档URL: ${DOC_URL:-https://feishu.cn/docx/$DOC_TOKEN}"

# ==================== 步骤2: 写入内容 ====================
log_info "步骤2: 写入内容..."

# 检查内容长度
CONTENT_LENGTH=${#CONTENT}
if [ $CONTENT_LENGTH -eq 0 ]; then
    log_warning "内容为空，跳过写入步骤"
    BLOCKS_ADDED=0
else
    # 临时文件存储内容
    TEMP_FILE=$(mktemp)
    echo "$CONTENT" > "$TEMP_FILE"
    
    WRITE_CMD="openclaw feishu_doc write --doc_token \"$DOC_TOKEN\" --content \"$CONTENT\""
    log_info "执行命令: $WRITE_CMD"
    
    WRITE_RESPONSE=$(eval $WRITE_CMD 2>/dev/null || echo "{}")
    BLOCKS_ADDED=$(echo "$WRITE_RESPONSE" | jq -r '.blocks_added // 0')
    
    rm -f "$TEMP_FILE"
    
    if [ "$BLOCKS_ADDED" -eq 0 ]; then
        log_warning "内容写入可能失败，blocks_added=0"
        echo "响应: $WRITE_RESPONSE"
    else
        log_success "内容写入完成"
        log_info "添加了 $BLOCKS_ADDED 个内容块"
    fi
fi

# ==================== 步骤3: 验证非空 ====================
log_info "步骤3: 验证文档非空..."

READ_CMD="openclaw feishu_doc read --doc_token \"$DOC_TOKEN\""
log_info "执行命令: $READ_CMD"
READ_RESPONSE=$(eval $READ_CMD 2>/dev/null || echo "{}")

BLOCK_COUNT=$(echo "$READ_RESPONSE" | jq -r '.block_count // 0')
TITLE_FROM_READ=$(echo "$READ_RESPONSE" | jq -r '.title // empty')

if [ "$BLOCK_COUNT" -le 1 ]; then
    log_error "文档可能为空，block_count=$BLOCK_COUNT"
    log_info "响应: $READ_RESPONSE"
    exit 1
fi

log_success "文档验证通过"
log_info "文档标题: ${TITLE_FROM_READ:-$TITLE}"
log_info "总块数: $BLOCK_COUNT"

# ==================== 输出结果 ====================
FINAL_URL="${DOC_URL:-https://feishu.cn/docx/$DOC_TOKEN}"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 飞书文档创建完成！"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📄 文档标题: $TITLE"
echo "🔗 文档链接: $FINAL_URL"
echo "🆔 文档Token: $DOC_TOKEN"
echo "📊 内容块数: $BLOCKS_ADDED"
echo "📈 总块数: $BLOCK_COUNT"
echo "📁 文件夹: ${FOLDER_TOKEN:-未指定}"
echo ""

# 保存到输出文件
if [ -n "$OUTPUT_FILE" ]; then
    cat > "$OUTPUT_FILE" << EOF
{
  "title": "$TITLE",
  "doc_token": "$DOC_TOKEN",
  "url": "$FINAL_URL",
  "blocks_added": $BLOCKS_ADDED,
  "block_count": $BLOCK_COUNT,
  "folder_token": "${FOLDER_TOKEN:-}",
  "created_at": "$(date -Iseconds)"
}
EOF
    log_info "文档信息已保存到: $OUTPUT_FILE"
fi

# 复制链接到剪贴板（如果可用）
if command -v xclip &> /dev/null; then
    echo -n "$FINAL_URL" | xclip -selection clipboard
    log_info "文档链接已复制到剪贴板"
elif command -v pbcopy &> /dev/null; then
    echo -n "$FINAL_URL" | pbcopy
    log_info "文档链接已复制到剪贴板"
fi

exit 0