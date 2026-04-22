/**
 * 智能定价路由
 */

const express = require('express');
const router = express.Router();
const PricingController = require('../controllers/PricingController');
const { authenticate, authorize } = require('../middleware/auth');

// 所有定价路由需要MANAGER以上权限
router.use(authenticate, authorize(['ADMIN', 'MANAGER']));

// 计算智能价格
router.post('/calculate', PricingController.calculatePrice.bind(PricingController));

// 获取未来价格
router.get('/future/:roomId', PricingController.getFuturePrices.bind(PricingController));

// 获取历史趋势
router.get('/trend/:roomId', PricingController.getHistoricalTrend.bind(PricingController));

// 推荐最佳价格
router.post('/recommend', PricingController.recommendPrice.bind(PricingController));

module.exports = router;
