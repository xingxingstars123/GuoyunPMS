/**
 * OTA渠道对接控制器
 */

const OTAService = require('../services/OTAService');

class OTAController {
  constructor() {
    this.otaService = new OTAService();
  }

  /**
   * GET /api/ota/status - 获取OTA渠道状态
   */
  async getChannelStatus(req, res) {
    try {
      const status = this.otaService.getChannelStatus();
      res.json({ success: true, data: status });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/ota/sync/inventory - 同步房态
   */
  async syncInventory(req, res) {
    try {
      const { channel, rooms } = req.body;
      
      if (!channel || !rooms) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields: channel, rooms' 
        });
      }

      const result = await this.otaService.syncRoomInventory(channel, rooms);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/ota/sync/prices - 同步价格
   */
  async syncPrices(req, res) {
    try {
      const { channel, prices } = req.body;
      
      if (!channel || !prices) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields: channel, prices' 
        });
      }

      const result = await this.otaService.syncRoomPrices(channel, prices);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/ota/orders - 拉取OTA订单
   */
  async fetchOrders(req, res) {
    try {
      const { channel, startDate, endDate } = req.query;
      
      if (!channel) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required field: channel' 
        });
      }

      const result = await this.otaService.fetchOrders(
        channel, 
        startDate ? new Date(startDate) : new Date(),
        endDate ? new Date(endDate) : new Date()
      );
      
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/ota/orders/:orderId/confirm - 确认OTA订单
   */
  async confirmOrder(req, res) {
    try {
      const { orderId } = req.params;
      const { channel } = req.body;
      
      if (!channel) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required field: channel' 
        });
      }

      const result = await this.otaService.confirmOrder(channel, orderId);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new OTAController();
