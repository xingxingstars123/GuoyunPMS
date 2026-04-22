/**
 * 数据导出控制器
 */

const ExportService = require('../services/ExportService');
const path = require('path');

class ExportController {
  constructor() {
    this.exportService = new ExportService();
  }

  /**
   * POST /api/export/orders - 导出订单数据
   */
  async exportOrders(req, res) {
    try {
      const { filters, format } = req.body;
      const result = await this.exportService.exportOrders(filters, format);
      
      // 返回下载链接
      res.json({
        success: true,
        ...result,
        downloadUrl: `/api/export/download/${result.filename}`
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/export/financial - 导出财务报表
   */
  async exportFinancialReport(req, res) {
    try {
      const { startDate, endDate, format } = req.body;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields: startDate, endDate' 
        });
      }

      const result = await this.exportService.exportFinancialReport(startDate, endDate, format);
      
      res.json({
        success: true,
        ...result,
        downloadUrl: `/api/export/download/${result.filename}`
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/export/occupancy - 导出入住率报表
   */
  async exportOccupancyReport(req, res) {
    try {
      const { startDate, endDate, format } = req.body;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields: startDate, endDate' 
        });
      }

      const result = await this.exportService.exportOccupancyReport(startDate, endDate, format);
      
      res.json({
        success: true,
        ...result,
        downloadUrl: `/api/export/download/${result.filename}`
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/export/cleaning - 导出清洁任务报表
   */
  async exportCleaningReport(req, res) {
    try {
      const { startDate, endDate, format } = req.body;
      
      if (!startDate || !endDate) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields: startDate, endDate' 
        });
      }

      const result = await this.exportService.exportCleaningReport(startDate, endDate, format);
      
      res.json({
        success: true,
        ...result,
        downloadUrl: `/api/export/download/${result.filename}`
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/export/files - 获取导出文件列表
   */
  async listFiles(req, res) {
    try {
      const files = this.exportService.listExportFiles();
      res.json({ success: true, data: files });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/export/download/:filename - 下载导出文件
   */
  async downloadFile(req, res) {
    try {
      const { filename } = req.params;
      const filepath = path.join(this.exportService.exportDir, filename);
      
      res.download(filepath, filename, (err) => {
        if (err) {
          res.status(404).json({ success: false, error: 'File not found' });
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * DELETE /api/export/files/:filename - 删除导出文件
   */
  async deleteFile(req, res) {
    try {
      const { filename } = req.params;
      const result = this.exportService.deleteExportFile(filename);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new ExportController();
