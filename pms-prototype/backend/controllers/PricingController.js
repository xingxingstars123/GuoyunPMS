/**
 * 智能定价控制器
 */

const PricingService = require('../services/PricingService');

class PricingController {
  constructor() {
    this.pricingService = new PricingService();
  }

  /**
   * POST /api/pricing/calculate - 计算智能价格
   */
  async calculatePrice(req, res) {
    try {
      const { roomId, date, advanceDays } = req.body;
      
      if (!roomId || !date) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields: roomId, date' 
        });
      }

      const result = this.pricingService.calculateSmartPrice(roomId, date, advanceDays);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/pricing/future/:roomId - 获取未来N天的价格
   */
  async getFuturePrices(req, res) {
    try {
      const { roomId } = req.params;
      const { days } = req.query;
      
      const result = this.pricingService.calculateFuturePrices(
        parseInt(roomId), 
        days ? parseInt(days) : 30
      );
      
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * GET /api/pricing/trend/:roomId - 获取历史价格趋势
   */
  async getHistoricalTrend(req, res) {
    try {
      const { roomId } = req.params;
      const { days } = req.query;
      
      const result = this.pricingService.getHistoricalTrend(
        parseInt(roomId), 
        days ? parseInt(days) : 30
      );
      
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/pricing/recommend - 推荐最佳价格
   */
  async recommendPrice(req, res) {
    try {
      const { roomId, date } = req.body;
      
      if (!roomId || !date) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields: roomId, date' 
        });
      }

      const result = this.pricingService.recommendPrice(roomId, date);
      res.json({ success: true, data: result });
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new PricingController();
