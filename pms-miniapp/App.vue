<script>
export default {
  onLaunch: function() {
    console.log('🏨 国韵民宿 PMS 启动')
  },
  onShow: function() {
    console.log('App Show')
  },
  onHide: function() {
    console.log('App Hide')
  }
}
</script>

<style lang="scss">
/* 导入主题 */
@import "@/common/theme.scss";

/* 全局样式重置 */
page {
  background-color: $bg-secondary;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 
               'Microsoft YaHei', 'Helvetica Neue', Helvetica, Arial, sans-serif;
  font-size: $font-md;
  color: $text-primary;
  line-height: 1.6;
}

/* 全局滚动优化 */
::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}

/* 通用按钮样式 */
.btn-primary {
  background: $primary-gradient;
  color: white;
  border: none;
  border-radius: $radius-md;
  padding: $spacing-md $spacing-lg;
  font-size: $font-md;
  font-weight: 600;
  transition: all 0.3s;
  
  &:active {
    opacity: 0.8;
    transform: scale(0.98);
  }
}

.btn-secondary {
  background: white;
  color: $primary-color;
  border: 2rpx solid $primary-color;
  border-radius: $radius-md;
  padding: $spacing-md $spacing-lg;
  font-size: $font-md;
  font-weight: 600;
  transition: all 0.3s;
  
  &:active {
    background: $bg-secondary;
  }
}

/* 通用卡片样式 */
.card {
  background: white;
  border-radius: $radius-lg;
  padding: $spacing-lg;
  box-shadow: $shadow-md;
  margin-bottom: $spacing-md;
}

.card-title {
  font-size: $font-lg;
  font-weight: bold;
  color: $text-primary;
  margin-bottom: $spacing-md;
}

/* 通用列表样式 */
.list-item {
  background: white;
  padding: $spacing-lg;
  border-bottom: 1rpx solid $border-light;
  transition: background 0.3s;
  
  &:active {
    background: $bg-tertiary;
  }
  
  &:last-child {
    border-bottom: none;
  }
}

/* 徽章样式 */
.badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 32rpx;
  height: 32rpx;
  padding: 0 8rpx;
  background: $danger-color;
  color: white;
  font-size: $font-xs;
  font-weight: bold;
  border-radius: $radius-full;
}

.badge-dot {
  width: 16rpx;
  height: 16rpx;
  background: $danger-color;
  border-radius: 50%;
}

/* 状态标签 */
.tag {
  display: inline-block;
  padding: 6rpx 16rpx;
  font-size: $font-sm;
  border-radius: $radius-sm;
  font-weight: 500;
}

.tag-primary {
  background: rgba(74, 144, 226, 0.1);
  color: $primary-color;
}

.tag-success {
  background: rgba(46, 204, 113, 0.1);
  color: $success-color;
}

.tag-warning {
  background: rgba(243, 156, 18, 0.1);
  color: $warning-color;
}

.tag-danger {
  background: rgba(255, 71, 87, 0.1);
  color: $danger-color;
}

/* 分割线 */
.divider {
  height: 1rpx;
  background: $border-color;
  margin: $spacing-md 0;
}

.divider-text {
  position: relative;
  text-align: center;
  color: $text-tertiary;
  font-size: $font-sm;
  
  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    width: 30%;
    height: 1rpx;
    background: $border-color;
  }
  
  &::before {
    left: 0;
  }
  
  &::after {
    right: 0;
  }
}

/* 加载状态 */
.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-xl;
  
  .loading-icon {
    width: 80rpx;
    height: 80rpx;
    border: 6rpx solid $border-light;
    border-top-color: $primary-color;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  .loading-text {
    margin-top: $spacing-md;
    color: $text-secondary;
    font-size: $font-sm;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: $spacing-xl * 2;
  
  .empty-icon {
    font-size: 120rpx;
    margin-bottom: $spacing-lg;
  }
  
  .empty-text {
    color: $text-tertiary;
    font-size: $font-md;
  }
}

/* 安全区适配 */
.safe-area-bottom {
  padding-bottom: constant(safe-area-inset-bottom);
  padding-bottom: env(safe-area-inset-bottom);
}

/* 文本工具类 */
.text-primary { color: $text-primary; }
.text-secondary { color: $text-secondary; }
.text-tertiary { color: $text-tertiary; }
.text-disabled { color: $text-disabled; }

.text-xs { font-size: $font-xs; }
.text-sm { font-size: $font-sm; }
.text-md { font-size: $font-md; }
.text-lg { font-size: $font-lg; }
.text-xl { font-size: $font-xl; }

.text-center { text-align: center; }
.text-left { text-align: left; }
.text-right { text-align: right; }

.font-bold { font-weight: bold; }
.font-normal { font-weight: normal; }

/* 间距工具类 */
.m-0 { margin: 0; }
.m-xs { margin: $spacing-xs; }
.m-sm { margin: $spacing-sm; }
.m-md { margin: $spacing-md; }
.m-lg { margin: $spacing-lg; }

.p-0 { padding: 0; }
.p-xs { padding: $spacing-xs; }
.p-sm { padding: $spacing-sm; }
.p-md { padding: $spacing-md; }
.p-lg { padding: $spacing-lg; }

.mt-xs { margin-top: $spacing-xs; }
.mt-sm { margin-top: $spacing-sm; }
.mt-md { margin-top: $spacing-md; }
.mt-lg { margin-top: $spacing-lg; }

.mb-xs { margin-bottom: $spacing-xs; }
.mb-sm { margin-bottom: $spacing-sm; }
.mb-md { margin-bottom: $spacing-md; }
.mb-lg { margin-bottom: $spacing-lg; }

.pt-xs { padding-top: $spacing-xs; }
.pt-sm { padding-top: $spacing-sm; }
.pt-md { padding-top: $spacing-md; }
.pt-lg { padding-top: $spacing-lg; }

.pb-xs { padding-bottom: $spacing-xs; }
.pb-sm { padding-bottom: $spacing-sm; }
.pb-md { padding-bottom: $spacing-md; }
.pb-lg { padding-bottom: $spacing-lg; }
</style>
