#!/bin/bash
# 群聊响应检查脚本
# 在响应任何群聊消息前必须调用此脚本
# 返回0表示允许响应，非0表示禁止响应

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 日志文件
LOG_FILE="/root/.openclaw/workspace/memory/group-response.log"

# 记录日志
log_message() {
    local level="$1"
    local message="$2"
    local timestamp=$(date '+%Y-%m-%d %H:%M:%S')
    echo "[$timestamp] [$level] $message" >> "$LOG_FILE"
    
    # 同时输出到stderr（供调试）
    if [ "$level" = "ERROR" ]; then
        echo -e "${RED}[检查失败] $message${NC}" >&2
    elif [ "$level" = "WARN" ]; then
        echo -e "${YELLOW}[检查警告] $message${NC}" >&2
    else
        echo -e "${GREEN}[检查通过] $message${NC}" >&2
    fi
}

# 检查是否被@
check_mentions_me() {
    # 这里需要根据实际消息内容判断
    # 临时实现：假设通过环境变量传递消息内容
    local message="${MESSAGE_CONTENT:-}"
    
    if [ -z "$message" ]; then
        log_message "WARN" "消息内容为空，无法检查@"
        return 1
    fi
    
    # 检查是否包含@OpenClaw或@钟洋助理等标识
    # 这里需要根据实际配置调整
    if echo "$message" | grep -qi "@OpenClaw\|@钟洋助理\|@钟洋的助理"; then
        log_message "INFO" "消息中包含@我的标识"
        return 0
    else
        log_message "WARN" "消息中未找到@我的标识"
        return 1
    fi
}

# 检查是否@了其他机器人
check_mentions_other_bot() {
    local message="${MESSAGE_CONTENT:-}"
    
    if [ -z "$message" ]; then
        return 1
    fi
    
    # 检查是否包含@老钟助手
    if echo "$message" | grep -qi "@老钟助手\|@钟征助手\|@钟征的机器人"; then
        log_message "WARN" "消息中包含@其他机器人（老钟助手）"
        return 0
    else
        return 1
    fi
}

# 检查发送者
check_sender() {
    local sender="${MESSAGE_SENDER:-}"
    
    if [ -z "$sender" ]; then
        log_message "WARN" "发送者信息为空"
        return 0  # 无法检查，默认允许
    fi
    
    # 记录发送者信息（用于调试）
    log_message "INFO" "消息发送者: $sender"
    return 0
}

# 检查群聊类型
check_chat_type() {
    local chat_type="${CHAT_TYPE:-}"
    
    if [ "$chat_type" = "group" ]; then
        log_message "INFO" "这是群聊消息"
        return 0
    elif [ "$chat_type" = "direct" ]; then
        log_message "INFO" "这是私聊消息，直接允许"
        return 0
    else
        log_message "WARN" "未知聊天类型: $chat_type"
        return 0  # 无法检查，默认允许
    fi
}

# 检查是否是私聊
is_direct_chat() {
    local chat_type="${CHAT_TYPE:-}"
    [ "$chat_type" = "direct" ]
}

# 主检查函数
main_check() {
    log_message "INFO" "开始群聊响应检查"
    
    # 1. 检查聊天类型
    check_chat_type
    
    # 2. 如果是私聊，直接允许（不检查@）
    if is_direct_chat; then
        log_message "INFO" "私聊消息，跳过@检查"
        echo "ALLOW: 私聊消息" >&2
        return 0
    fi
    
    # 3. 检查发送者
    check_sender
    
    # 4. 检查是否被@
    if ! check_mentions_me; then
        log_message "ERROR" "检查失败：消息没有@我"
        echo "REJECT: 消息没有@我" >&2
        return 1
    fi
    
    # 5. 检查是否@了其他机器人
    if check_mentions_other_bot; then
        log_message "ERROR" "检查失败：消息@了其他机器人（老钟助手）"
        echo "REJECT: 消息@了其他机器人" >&2
        return 2
    fi
    
    # 6. 检查是否是钟征@老钟助手的场景
    local sender="${MESSAGE_SENDER:-}"
    local message="${MESSAGE_CONTENT:-}"
    
    if [ "$sender" = "钟征" ] && echo "$message" | grep -qi "@老钟助手"; then
        log_message "ERROR" "检查失败：钟征@老钟助手，我不应该响应"
        echo "REJECT: 钟征@老钟助手场景" >&2
        return 3
    fi
    
    # 7. 额外安全检查：确保不是误判
    # 如果消息同时@了我和老钟助手，也要拒绝
    if echo "$message" | grep -qi "@老钟助手" && echo "$message" | grep -qi "@OpenClaw\|@钟洋助理"; then
        log_message "ERROR" "检查失败：消息同时@了我和老钟助手，避免混淆"
        echo "REJECT: 同时@多机器人" >&2
        return 4
    fi
    
    # 所有检查通过
    log_message "INFO" "所有检查通过，允许响应"
    echo "ALLOW: 检查通过" >&2
    return 0
}

# 测试函数
test_scenarios() {
    echo "=== 测试群聊响应检查 ==="
    
    # 测试1：正常@我
    echo -e "\n测试1：正常@我"
    export MESSAGE_SENDER="钟洋"
    export MESSAGE_CONTENT="@OpenClaw 你好"
    export CHAT_TYPE="group"
    main_check
    local result1=$?
    
    # 测试2：钟征@老钟助手
    echo -e "\n测试2：钟征@老钟助手"
    export MESSAGE_SENDER="钟征"
    export MESSAGE_CONTENT="@老钟助手 处理一下"
    export CHAT_TYPE="group"
    main_check
    local result2=$?
    
    # 测试3：未@我
    echo -e "\n测试3：未@我"
    export MESSAGE_SENDER="爱华"
    export MESSAGE_CONTENT="大家晚上好"
    export CHAT_TYPE="group"
    main_check
    local result3=$?
    
    # 测试4：私聊消息
    echo -e "\n测试4：私聊消息"
    export MESSAGE_SENDER="钟洋"
    export MESSAGE_CONTENT="测试消息"
    export CHAT_TYPE="direct"
    main_check
    local result4=$?
    
    echo -e "\n=== 测试结果 ==="
    echo "测试1（正常@我）: $([ $result1 -eq 0 ] && echo "通过" || echo "失败")"
    echo "测试2（钟征@老钟助手）: $([ $result2 -ne 0 ] && echo "正确拒绝" || echo "错误通过")"
    echo "测试3（未@我）: $([ $result3 -ne 0 ] && echo "正确拒绝" || echo "错误通过")"
    echo "测试4（私聊）: $([ $result4 -eq 0 ] && echo "通过" || echo "失败")"
    
    # 显示日志
    echo -e "\n=== 检查日志 ==="
    tail -20 "$LOG_FILE" 2>/dev/null || echo "日志文件不存在"
}

# 根据参数执行
case "${1:-}" in
    "test")
        test_scenarios
        ;;
    "check")
        main_check
        exit $?
        ;;
    "log")
        tail -50 "$LOG_FILE" 2>/dev/null || echo "日志文件不存在"
        ;;
    "clear-log")
        > "$LOG_FILE"
        echo "日志已清空"
        ;;
    *)
        echo "用法: $0 [command]"
        echo "命令:"
        echo "  test      - 测试各种场景"
        echo "  check     - 执行检查（需要在环境中设置变量）"
        echo "  log       - 查看日志"
        echo "  clear-log - 清空日志"
        echo ""
        echo "环境变量:"
        echo "  MESSAGE_SENDER  - 消息发送者"
        echo "  MESSAGE_CONTENT - 消息内容"
        echo "  CHAT_TYPE       - 聊天类型 (group/direct)"
        exit 1
        ;;
esac