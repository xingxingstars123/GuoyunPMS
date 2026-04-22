/**
 * OTA渠道对接路由
 */

const express = require('express');
const router = express.Router();
const OTAController = require('../controllers/OTAController');
const { authenticate, authorize } = require('../middleware/auth');

// 所有OTA路由需要MANAGER以上权限
router.use(authenticate, authorize(['ADMIN', 'MANAGER']));

// 获取渠道状态
router.get('/status', OTAController.getChannelStatus.bind(OTAController));

// 同步房态到OTA
router.post('/sync/inventory', OTAController.syncInventory.bind(OTAController));

// 同步价格到OTA
router.post('/sync/prices', OTAController.syncPrices.bind(OTAController));

// 拉取OTA订单
router.get('/orders', OTAController.fetchOrders.bind(OTAController));

// 确认OTA订单
router.post('/orders/:orderId/confirm', OTAController.confirmOrder.bind(OTAController));

module.exports = router;
