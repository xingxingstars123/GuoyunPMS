#!/bin/bash
# 时序事实查询脚本
# 用法：./query-facts.sh [选项] [查询参数]

# 获取脚本所在目录
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FACTS_FILE="${SCRIPT_DIR}/../knowledge/facts.jsonl"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# 帮助信息
show_help() {
    echo -e "${BLUE}时序事实查询工具${NC}"
    echo "用法: $0 [选项]"
    echo ""
    echo "选项:"
    echo "  -h, --help                显示此帮助信息"
    echo "  -l, --list                列出所有事实"
    echo "  -e, --entity <名称>       按实体查询"
    echo "  -r, --relation <关系>     按关系查询"
    echo "  -c, --category <分类>     按分类查询"
    echo "  -d, --date <日期>         查询指定日期有效的事实 (YYYY-MM-DD)"
    echo "  -a, --active              只查询当前有效的事实 (ended=null)"
    echo "  -s, --search <关键词>     全文搜索"
    echo "  -j, --json                输出原始JSON格式"
    echo ""
    echo "示例:"
    echo "  $0 --entity OpenClaw --active"
    echo "  $0 --relation 掌握技能"
    echo "  $0 --date 2026-04-15"
    echo "  $0 --search 记忆体系"
}

# 检查jq是否安装
check_jq() {
    if ! command -v jq &> /dev/null; then
        echo -e "${RED}错误: jq 未安装${NC}"
        echo "请安装 jq: apt-get install jq 或 yum install jq"
        exit 1
    fi
}

# 检查文件是否存在
check_file() {
    if [ ! -f "$FACTS_FILE" ]; then
        echo -e "${RED}错误: 事实文件不存在: $FACTS_FILE${NC}"
        exit 1
    fi
}

# 格式化输出
format_output() {
    if [ "$JSON_OUTPUT" = true ]; then
        cat
    else
        jq -r '[
            .id,
            .entity,
            .relation,
            .target,
            .valid_from,
            (.ended // "至今"),
            .category
        ] | @tsv' | column -t -s $'\t' | while IFS=$'\t' read -r id entity relation target valid_from ended category; do
            if [ "$ended" = "至今" ]; then
                echo -e "${GREEN}${id}${NC}\t${entity}\t${relation}\t${target}\t${valid_from}\t${ended}\t${category}"
            else
                echo -e "${YELLOW}${id}${NC}\t${entity}\t${relation}\t${target}\t${valid_from}\t${ended}\t${category}"
            fi
        done
    fi
}

# 查询当前有效的事实
query_active() {
    jq 'select(.ended == null)' "$FACTS_FILE"
}

# 按实体查询
query_entity() {
    local entity="$1"
    jq --arg e "$entity" 'select(.entity == $e)' "$FACTS_FILE"
}

# 按关系查询
query_relation() {
    local relation="$1"
    jq --arg r "$relation" 'select(.relation == $r)' "$FACTS_FILE"
}

# 按分类查询
query_category() {
    local category="$1"
    jq --arg c "$category" 'select(.category == $c)' "$FACTS_FILE"
}

# 按日期查询
query_date() {
    local date="$1"
    jq --arg d "$date" 'select(.valid_from <= $d and (.ended == null or .ended > $d))' "$FACTS_FILE"
}

# 全文搜索
query_search() {
    local keyword="$1"
    jq --arg k "$keyword" 'select(.entity | contains($k) or .relation | contains($k) or .target | contains($k) or .category | contains($k))' "$FACTS_FILE"
}

# 列出所有事实
list_all() {
    cat "$FACTS_FILE"
}

# 主函数
main() {
    check_jq
    check_file
    
    JSON_OUTPUT=false
    
    if [ $# -eq 0 ]; then
        show_help
        exit 0
    fi
    
    while [[ $# -gt 0 ]]; do
        case $1 in
            -h|--help)
                show_help
                exit 0
                ;;
            -l|--list)
                list_all | format_output
                exit 0
                ;;
            -e|--entity)
                if [ -n "$2" ]; then
                    query_entity "$2" | format_output
                    shift 2
                else
                    echo -e "${RED}错误: --entity 需要参数${NC}"
                    exit 1
                fi
                ;;
            -r|--relation)
                if [ -n "$2" ]; then
                    query_relation "$2" | format_output
                    shift 2
                else
                    echo -e "${RED}错误: --relation 需要参数${NC}"
                    exit 1
                fi
                ;;
            -c|--category)
                if [ -n "$2" ]; then
                    query_category "$2" | format_output
                    shift 2
                else
                    echo -e "${RED}错误: --category 需要参数${NC}"
                    exit 1
                fi
                ;;
            -d|--date)
                if [ -n "$2" ]; then
                    query_date "$2" | format_output
                    shift 2
                else
                    echo -e "${RED}错误: --date 需要参数${NC}"
                    exit 1
                fi
                ;;
            -a|--active)
                query_active | format_output
                shift
                ;;
            -s|--search)
                if [ -n "$2" ]; then
                    query_search "$2" | format_output
                    shift 2
                else
                    echo -e "${RED}错误: --search 需要参数${NC}"
                    exit 1
                fi
                ;;
            -j|--json)
                JSON_OUTPUT=true
                shift
                ;;
            *)
                echo -e "${RED}未知选项: $1${NC}"
                show_help
                exit 1
                ;;
        esac
    done
}

# 执行主函数
main "$@"