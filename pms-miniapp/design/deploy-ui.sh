#!/bin/bash

# 国韵民宿 PMS - UI优化部署脚本

echo "🏨 国韵民宿 PMS UI 优化部署"
echo "================================"
echo ""

# 颜色定义
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 项目根目录
PROJECT_ROOT="/root/.openclaw/workspace/pms-miniapp"

# 1. 备份原文件
echo -e "${BLUE}📦 步骤 1/4: 备份原文件...${NC}"
if [ -f "$PROJECT_ROOT/pages/index/index.vue" ]; then
    cp "$PROJECT_ROOT/pages/index/index.vue" "$PROJECT_ROOT/pages/index/index-backup-$(date +%Y%m%d%H%M%S).vue"
    echo -e "${GREEN}✅ 首页已备份${NC}"
fi

if [ -f "$PROJECT_ROOT/pages.json" ]; then
    cp "$PROJECT_ROOT/pages.json" "$PROJECT_ROOT/pages-backup-$(date +%Y%m%d%H%M%S).json"
    echo -e "${GREEN}✅ pages.json已备份${NC}"
fi

if [ -f "$PROJECT_ROOT/App.vue" ]; then
    cp "$PROJECT_ROOT/App.vue" "$PROJECT_ROOT/App-backup-$(date +%Y%m%d%H%M%S).vue"
    echo -e "${GREEN}✅ App.vue已备份${NC}"
fi
echo ""

# 2. 应用新的首页
echo -e "${BLUE}🎨 步骤 2/4: 应用新的首页设计...${NC}"
if [ -f "$PROJECT_ROOT/pages/index/index-optimized.vue" ]; then
    cp "$PROJECT_ROOT/pages/index/index-optimized.vue" "$PROJECT_ROOT/pages/index/index.vue"
    echo -e "${GREEN}✅ 首页已更新${NC}"
else
    echo -e "${YELLOW}⚠️  优化后的首页文件不存在，跳过${NC}"
fi
echo ""

# 3. 检查图标文件
echo -e "${BLUE}🖼️  步骤 3/4: 检查TabBar图标...${NC}"
ICON_DIR="$PROJECT_ROOT/static/images"
ICONS=("home" "message" "calendar" "finance" "mine")

for icon in "${ICONS[@]}"; do
    if [ -f "$ICON_DIR/${icon}.svg" ] && [ -f "$ICON_DIR/${icon}-active.svg" ]; then
        echo -e "${GREEN}✅ ${icon} 图标已生成${NC}"
    else
        echo -e "${YELLOW}⚠️  ${icon} 图标缺失，请检查${NC}"
    fi
done
echo ""

# 4. 验证主题文件
echo -e "${BLUE}🎨 步骤 4/4: 验证主题系统...${NC}"
if [ -f "$PROJECT_ROOT/common/theme.scss" ]; then
    echo -e "${GREEN}✅ 主题文件存在${NC}"
else
    echo -e "${YELLOW}⚠️  主题文件不存在${NC}"
fi
echo ""

# 完成
echo "================================"
echo -e "${GREEN}🎉 部署完成!${NC}"
echo ""
echo -e "${BLUE}📝 接下来的步骤:${NC}"
echo "1. 将SVG图标转换为PNG (81x81px)"
echo "2. 在HBuilderX或微信开发者工具中预览"
echo "3. 检查tabBar图标显示"
echo "4. 测试首页交互效果"
echo ""
echo -e "${BLUE}📚 查看完整设计文档:${NC}"
echo "   cat design/UI-DESIGN-GUIDE.md"
echo ""
echo -e "${BLUE}🎨 在浏览器预览图标:${NC}"
echo "   open design/tabbar-icons.html"
echo ""
