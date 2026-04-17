#!/bin/bash
# check-permissions.sh - 飞书权限检查脚本

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
    echo "飞书权限检查脚本"
    echo ""
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -a, --all               检查所有权限（默认）"
    echo "  -s, --scopes            检查应用权限范围"
    echo "  -g, --gateway           检查 Gateway 配置"
    echo "  -t, --tools             检查工具启用状态"
    echo "  -h, --help              显示此帮助信息"
    echo ""
    echo "示例:"
    echo "  $0 --all                 # 检查所有权限"
    echo "  $0 --scopes              # 只检查应用权限"
    echo "  $0 --gateway --tools     # 检查 Gateway 和工具"
    echo ""
}

# 默认检查所有
CHECK_ALL=true
CHECK_SCOPES=false
CHECK_GATEWAY=false
CHECK_TOOLS=false

# 解析参数
while [[ $# -gt 0 ]]; do
    case $1 in
        -a|--all)
            CHECK_ALL=true
            shift
            ;;
        -s|--scopes)
            CHECK_SCOPES=true
            CHECK_ALL=false
            shift
            ;;
        -g|--gateway)
            CHECK_GATEWAY=true
            CHECK_ALL=false
            shift
            ;;
        -t|--tools)
            CHECK_TOOLS=true
            CHECK_ALL=false
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

if $CHECK_ALL; then
    CHECK_SCOPES=true
    CHECK_GATEWAY=true
    CHECK_TOOLS=true
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔐 飞书权限检查"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# ==================== 1. 检查应用权限范围 ====================
if $CHECK_SCOPES; then
    log_info "1. 检查飞书应用权限范围..."
    
    SCOPES_RESPONSE=$(openclaw feishu_app_scopes 2>/dev/null || echo "{}")
    
    if [ "$SCOPES_RESPONSE" = "{}" ]; then
        log_error "  无法获取权限范围，请检查 Gateway 连接"
    else
        # 解析权限
        SCOPES=$(echo "$SCOPES_RESPONSE" | jq -r '.scopes // [] | join(", ")')
        
        # 检查必需权限
        REQUIRED_SCOPES=(
            "im:message:send_as_bot"
            "im:resource"
            "im:message"
        )
        
        RECOMMENDED_SCOPES=(
            "im:chat:read"
            "im:chat.members:bot_access"
            "drive:permission"
        )
        
        echo "  当前权限范围:"
        echo "  $SCOPES" | fold -w 80 -s | sed 's/^/    /'
        echo ""
        
        # 检查必需权限
        log_info "  检查必需权限:"
        ALL_REQUIRED_OK=true
        for scope in "${REQUIRED_SCOPES[@]}"; do
            if echo "$SCOPES" | grep -q "$scope"; then
                echo -e "    ✅ $scope"
            else
                echo -e "    ❌ $scope (缺失)"
                ALL_REQUIRED_OK=false
            fi
        done
        
        # 检查推荐权限
        log_info "  检查推荐权限:"
        for scope in "${RECOMMENDED_SCOPES[@]}"; do
            if echo "$SCOPES" | grep -q "$scope"; then
                echo -e "    ✅ $scope"
            else
                echo -e "    ⚠️  $scope (建议开通)"
            fi
        done
        
        if $ALL_REQUIRED_OK; then
            log_success "  ✅ 所有必需权限都已开通"
        else
            log_error "  ❌ 缺少必需权限，请到飞书开放平台开通"
            echo ""
            echo "  开通步骤:"
            echo "  1. 访问飞书开放平台"
            echo "  2. 进入你的应用"
            echo "  3. 权限管理 → 添加权限"
            echo "  4. 搜索并添加上述缺失的权限"
            echo "  5. 发布版本并等待审核"
        fi
    fi
    echo ""
fi

# ==================== 2. 检查 Gateway 配置 ====================
if $CHECK_GATEWAY; then
    log_info "2. 检查 Gateway 状态..."
    
    GATEWAY_STATUS=$(openclaw gateway status 2>/dev/null || echo "not running")
    
    if echo "$GATEWAY_STATUS" | grep -q "running"; then
        log_success "  ✅ Gateway 正在运行"
        
        # 检查配置
        CONFIG_FILE="$HOME/.openclaw/config.json"
        if [ -f "$CONFIG_FILE" ]; then
            log_info "  检查飞书配置..."
            
            # 检查基本配置
            if jq -e '.channels.feishu.enabled == true' "$CONFIG_FILE" >/dev/null 2>&1; then
                echo -e "    ✅ feishu.enabled = true"
            else
                echo -e "    ❌ feishu.enabled 未启用或配置错误"
            fi
            
            # 检查文件大小限制
            MEDIA_MAX=$(jq -r '.channels.feishu.mediaMaxMb // 30' "$CONFIG_FILE" 2>/dev/null)
            echo -e "    📊 mediaMaxMb = ${MEDIA_MAX}MB"
            
        else
            log_warning "  未找到配置文件: $CONFIG_FILE"
        fi
    else
        log_error "  ❌ Gateway 未运行"
        echo ""
        echo "  启动 Gateway:"
        echo "  openclaw gateway start"
        echo ""
        echo "  查看状态:"
        echo "  openclaw gateway status"
    fi
    echo ""
fi

# ==================== 3. 检查工具启用状态 ====================
if $CHECK_TOOLS; then
    log_info "3. 检查工具启用状态..."
    
    CONFIG_FILE="$HOME/.openclaw/config.json"
    if [ -f "$CONFIG_FILE" ]; then
        # 检查各个工具
        TOOLS=(
            "doc:文档操作工具"
            "drive:云盘操作工具"
            "perm:权限管理工具"
            "wiki:知识库工具"
        )
        
        for tool_info in "${TOOLS[@]}"; do
            tool_key=$(echo "$tool_info" | cut -d: -f1)
            tool_name=$(echo "$tool_info" | cut -d: -f2)
            
            if jq -e ".channels.feishu.tools.$tool_key == true" "$CONFIG_FILE" >/dev/null 2>&1; then
                echo -e "    ✅ $tool_name (已启用)"
            elif jq -e ".channels.feishu.tools.$tool_key == false" "$CONFIG_FILE" >/dev/null 2>&1; then
                echo -e "    ❌ $tool_name (已禁用)"
            else
                # 检查默认值
                case $tool_key in
                    "doc"|"drive"|"wiki")
                        echo -e "    ✅ $tool_name (默认启用)"
                        ;;
                    "perm")
                        echo -e "    ❌ $tool_name (默认禁用，需要手动启用)"
                        ;;
                    *)
                        echo -e "    ⚠️  $tool_name (未配置)"
                        ;;
                esac
            fi
        done
        
        # 特别提示权限工具
        if ! jq -e '.channels.feishu.tools.perm == true' "$CONFIG_FILE" >/dev/null 2>&1; then
            echo ""
            log_warning "  权限管理工具 (feishu_perm) 默认禁用"
            echo "  如需使用，请在配置文件中启用:"
            echo ""
            echo '  {
    "channels": {
        "feishu": {
            "tools": {
                "perm": true
            }
        }
    }
}'
            echo ""
            echo "  然后重启 Gateway:"
            echo "  openclaw gateway restart"
        fi
    else
        log_warning "  未找到配置文件，使用默认工具配置"
        echo "    ✅ 文档操作工具 (默认启用)"
        echo "    ✅ 云盘操作工具 (默认启用)"
        echo "    ❌ 权限管理工具 (默认禁用)"
        echo "    ✅ 知识库工具 (默认启用)"
    fi
    echo ""
fi

# ==================== 总结 ====================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 检查完成"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "💡 下一步建议:"
echo ""
echo "1. 确保所有必需权限都已开通"
echo "2. 确保 Gateway 正在运行"
echo "3. 根据需求启用相应工具"
echo "4. 测试文件发送功能:"
echo "   ./scripts/send-file.sh --file test.txt"
echo ""
echo "📚 参考文档:"
echo "  - OpenClaw 飞书文件发送完整操作指南"
echo "  - 飞书文档创建空白问题分析报告"
echo ""

exit 0