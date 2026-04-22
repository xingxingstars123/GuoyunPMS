/**
 * 批量操作控制器
 */

const BulkOperationService = require('../services/BulkOperationService');

class BulkOperationController {
  constructor() {
    this.bulkOpService = new BulkOperationService();
  }

  /**
   * POST /api/bulk/rooms/status - 批量更新房间状态
   */
  async updateRoomStatus(req, res) {
    try {
      const { roomIds, status } = req.body;
      
      if (!roomIds || !status) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields: roomIds, status' 
        });
      }

      const result = this.bulkOpService.bulkUpdateRoomStatus(roomIds, status);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/bulk/rooms/prices - 批量更新房间价格
   */
  async updateRoomPrices(req, res) {
    try {
      const { updates } = req.body;
      
      if (!updates || !Array.isArray(updates)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required field: updates (array)' 
        });
      }

      const result = this.bulkOpService.bulkUpdateRoomPrices(updates);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/bulk/cleaning/create - 批量创建清洁任务
   */
  async createCleaningTasks(req, res) {
    try {
      const { roomIds, taskConfig } = req.body;
      
      if (!roomIds || !taskConfig) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields: roomIds, taskConfig' 
        });
      }

      const result = this.bulkOpService.bulkCreateCleaningTasks(roomIds, taskConfig);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/bulk/cleaning/status - 批量更新清洁任务状态
   */
  async updateCleaningTaskStatus(req, res) {
    try {
      const { taskIds, status } = req.body;
      
      if (!taskIds || !status) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields: taskIds, status' 
        });
      }

      const result = this.bulkOpService.bulkUpdateCleaningTaskStatus(taskIds, status);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/bulk/orders/status - 批量更新订单状态
   */
  async updateOrderStatus(req, res) {
    try {
      const { orderIds, status } = req.body;
      
      if (!orderIds || !status) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required fields: orderIds, status' 
        });
      }

      const result = this.bulkOpService.bulkUpdateOrderStatus(orderIds, status);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/bulk/orders/assign - 批量分配房间
   */
  async assignRooms(req, res) {
    try {
      const { orderIds } = req.body;
      
      if (!orderIds) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required field: orderIds' 
        });
      }

      const result = this.bulkOpService.bulkAssignRooms(orderIds);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * DELETE /api/bulk/orders - 批量删除订单
   */
  async deleteOrders(req, res) {
    try {
      const { orderIds } = req.body;
      
      if (!orderIds) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required field: orderIds' 
        });
      }

      const result = this.bulkOpService.bulkDeleteOrders(orderIds);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/bulk/rooms/import - 批量导入房间
   */
  async importRooms(req, res) {
    try {
      const { rooms } = req.body;
      
      if (!rooms || !Array.isArray(rooms)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required field: rooms (array)' 
        });
      }

      const result = this.bulkOpService.bulkImportRooms(rooms);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/bulk/orders/import - 批量导入订单
   */
  async importOrders(req, res) {
    try {
      const { orders } = req.body;
      
      if (!orders || !Array.isArray(orders)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required field: orders (array)' 
        });
      }

      const result = this.bulkOpService.bulkImportOrders(orders);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }

  /**
   * POST /api/bulk/rooms/attributes - 批量更新房间属性
   */
  async updateRoomAttributes(req, res) {
    try {
      const { updates } = req.body;
      
      if (!updates || !Array.isArray(updates)) {
        return res.status(400).json({ 
          success: false, 
          error: 'Missing required field: updates (array)' 
        });
      }

      const result = this.bulkOpService.bulkUpdateRoomAttributes(updates);
      res.json(result);
    } catch (error) {
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

module.exports = new BulkOperationController();
