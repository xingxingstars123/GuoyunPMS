/**
 * 数据导出路由
 */

const express = require('express');
const router = express.Router();
const ExportController = require('../controllers/ExportController');
const { authenticate, authorize } = require('../middleware/auth');

// 所有导出路由需要MANAGER以上权限
router.use(authenticate, authorize(['ADMIN', 'MANAGER']));

// 导出订单
router.post('/orders', ExportController.exportOrders.bind(ExportController));

// 导出财务报表
router.post('/financial', ExportController.exportFinancialReport.bind(ExportController));

// 导出入住率报表
router.post('/occupancy', ExportController.exportOccupancyReport.bind(ExportController));

// 导出清洁任务报表
router.post('/cleaning', ExportController.exportCleaningReport.bind(ExportController));

// 获取导出文件列表
router.get('/files', ExportController.listFiles.bind(ExportController));

// 下载导出文件
router.get('/download/:filename', ExportController.downloadFile.bind(ExportController));

// 删除导出文件
router.delete('/files/:filename', ExportController.deleteFile.bind(ExportController));

module.exports = router;
