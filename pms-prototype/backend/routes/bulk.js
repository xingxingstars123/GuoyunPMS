/**
 * 批量操作路由
 */

const express = require('express');
const router = express.Router();
const BulkOperationController = require('../controllers/BulkOperationController');
const { authenticate, authorize } = require('../middleware/auth');

// 所有批量操作需要MANAGER以上权限
router.use(authenticate, authorize(['ADMIN', 'MANAGER']));

// 批量更新房间状态
router.post('/rooms/status', BulkOperationController.updateRoomStatus.bind(BulkOperationController));

// 批量更新房间价格
router.post('/rooms/prices', BulkOperationController.updateRoomPrices.bind(BulkOperationController));

// 批量更新房间属性
router.post('/rooms/attributes', BulkOperationController.updateRoomAttributes.bind(BulkOperationController));

// 批量导入房间
router.post('/rooms/import', BulkOperationController.importRooms.bind(BulkOperationController));

// 批量创建清洁任务
router.post('/cleaning/create', BulkOperationController.createCleaningTasks.bind(BulkOperationController));

// 批量更新清洁任务状态
router.post('/cleaning/status', BulkOperationController.updateCleaningTaskStatus.bind(BulkOperationController));

// 批量更新订单状态
router.post('/orders/status', BulkOperationController.updateOrderStatus.bind(BulkOperationController));

// 批量分配房间
router.post('/orders/assign', BulkOperationController.assignRooms.bind(BulkOperationController));

// 批量导入订单
router.post('/orders/import', BulkOperationController.importOrders.bind(BulkOperationController));

// 批量删除订单
router.delete('/orders', BulkOperationController.deleteOrders.bind(BulkOperationController));

module.exports = router;
