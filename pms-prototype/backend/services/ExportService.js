const XLSX = require('xlsx');
const { db } = require('../database');
const dayjs = require('dayjs');

class ExportService {
  /**
   * 导出订单数据为Excel
   * @param {Object} filters - 筛选条件
   * @returns {Buffer} Excel文件缓冲区
   */
  static exportOrders(filters = {}) {
    const { startDate, endDate, channel, status } = filters;
    
    // 构建查询
    let sql = `
      SELECT 
        o.order_no as '订单号',
        o.channel as '渠道',
        c.name as '客户姓名',
        c.phone as '联系电话',
        r.room_number as '房间号',
        r.room_type as '房型',
        o.check_in as '入住日期',
        o.check_out as '退房日期',
        o.total_price as '订单金额',
        o.status as '状态',
        o.created_at as '创建时间'
      FROM orders o
      LEFT JOIN customers c ON o.customer_id = c.id
      LEFT JOIN rooms r ON o.room_id = r.id
      WHERE 1=1
    `;
    
    const params = [];
    
    if (startDate) {
      sql += ' AND DATE(o.check_in) >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      sql += ' AND DATE(o.check_out) <= ?';
      params.push(endDate);
    }
    
    if (channel) {
      sql += ' AND o.channel = ?';
      params.push(channel);
    }
    
    if (status) {
      sql += ' AND o.status = ?';
      params.push(status);
    }
    
    sql += ' ORDER BY o.created_at DESC';
    
    const orders = db.prepare(sql).all(...params);
    
    // 状态映射
    const statusMap = {
      'pending': '待确认',
      'confirmed': '已确认',
      'pre_arrival': '预抵',
      'checked_in': '已入住',
      'pre_departure': '预离',
      'checked_out': '已退房',
      'cancelled': '已取消'
    };
    
    // 转换状态
    const processedOrders = orders.map(order => ({
      ...order,
      '状态': statusMap[order['状态']] || order['状态']
    }));
    
    // 创建工作簿
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(processedOrders);
    
    // 设置列宽
    ws['!cols'] = [
      { wch: 20 }, // 订单号
      { wch: 12 }, // 渠道
      { wch: 12 }, // 客户姓名
      { wch: 15 }, // 联系电话
      { wch: 10 }, // 房间号
      { wch: 12 }, // 房型
      { wch: 12 }, // 入住日期
      { wch: 12 }, // 退房日期
      { wch: 12 }, // 订单金额
      { wch: 10 }, // 状态
      { wch: 20 }  // 创建时间
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, '订单列表');
    
    // 添加统计工作表
    const stats = this.getOrderStats(filters);
    const statsWs = XLSX.utils.json_to_sheet([stats]);
    XLSX.utils.book_append_sheet(wb, statsWs, '统计汇总');
    
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }
  
  /**
   * 导出财务数据为Excel
   * @param {Object} filters - 筛选条件
   * @returns {Buffer} Excel文件缓冲区
   */
  static exportFinance(filters = {}) {
    const { year, month } = filters;
    const currentYear = year || dayjs().year();
    const currentMonth = month || dayjs().month() + 1;
    
    // 查询财务记录
    const records = db.prepare(`
      SELECT 
        date as '日期',
        type as '类型',
        category as '类别',
        amount as '金额',
        description as '说明',
        created_at as '创建时间'
      FROM financial_records
      WHERE strftime('%Y', date) = ?
        AND strftime('%m', date) = ?
      ORDER BY date DESC, created_at DESC
    `).all(String(currentYear), String(currentMonth).padStart(2, '0'));
    
    // 类型映射
    const typeMap = {
      'income': '收入',
      'expense': '支出'
    };
    
    const categoryMap = {
      'room_fee': '房费',
      'deposit': '押金',
      'other_income': '其他收入',
      'utilities': '水电费',
      'maintenance': '维修费',
      'supplies': '用品采购',
      'salary': '工资',
      'other_expense': '其他支出'
    };
    
    const processedRecords = records.map(record => ({
      ...record,
      '类型': typeMap[record['类型']] || record['类型'],
      '类别': categoryMap[record['类别']] || record['类别']
    }));
    
    // 创建工作簿
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(processedRecords);
    
    ws['!cols'] = [
      { wch: 12 }, // 日期
      { wch: 8 },  // 类型
      { wch: 12 }, // 类别
      { wch: 12 }, // 金额
      { wch: 30 }, // 说明
      { wch: 20 }  // 创建时间
    ];
    
    XLSX.utils.book_append_sheet(wb, ws, '财务明细');
    
    // 添加月度汇总
    const summary = this.getFinanceSummary(currentYear, currentMonth);
    const summaryWs = XLSX.utils.json_to_sheet([summary]);
    XLSX.utils.book_append_sheet(wb, summaryWs, '月度汇总');
    
    // 添加渠道统计
    const channelStats = db.prepare(`
      SELECT 
        o.channel as '渠道',
        COUNT(*) as '订单数',
        SUM(o.total_price) as '总营收'
      FROM orders o
      WHERE strftime('%Y-%m', o.check_in) = ?
        AND o.status != 'cancelled'
      GROUP BY o.channel
      ORDER BY '总营收' DESC
    `).all(`${currentYear}-${String(currentMonth).padStart(2, '0')}`);
    
    const channelWs = XLSX.utils.json_to_sheet(channelStats);
    XLSX.utils.book_append_sheet(wb, channelWs, '渠道统计');
    
    return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
  }
  
  /**
   * 获取订单统计
   */
  static getOrderStats(filters) {
    const { startDate, endDate, channel } = filters;
    
    let sql = 'SELECT COUNT(*) as total, SUM(total_price) as revenue FROM orders WHERE 1=1';
    const params = [];
    
    if (startDate) {
      sql += ' AND DATE(check_in) >= ?';
      params.push(startDate);
    }
    
    if (endDate) {
      sql += ' AND DATE(check_out) <= ?';
      params.push(endDate);
    }
    
    if (channel) {
      sql += ' AND channel = ?';
      params.push(channel);
    }
    
    const stats = db.prepare(sql).get(...params);
    
    return {
      '总订单数': stats.total,
      '总营收': stats.revenue || 0,
      '导出时间': dayjs().format('YYYY-MM-DD HH:mm:ss')
    };
  }
  
  /**
   * 获取财务汇总
   */
  static getFinanceSummary(year, month) {
    const income = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM financial_records
      WHERE type = 'income'
        AND strftime('%Y', date) = ?
        AND strftime('%m', date) = ?
    `).get(String(year), String(month).padStart(2, '0'));
    
    const expense = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM financial_records
      WHERE type = 'expense'
        AND strftime('%Y', date) = ?
        AND strftime('%m', date) = ?
    `).get(String(year), String(month).padStart(2, '0'));
    
    return {
      '年月': `${year}-${String(month).padStart(2, '0')}`,
      '总收入': income.total,
      '总支出': expense.total,
      '净利润': income.total - expense.total,
      '导出时间': dayjs().format('YYYY-MM-DD HH:mm:ss')
    };
  }
}

module.exports = ExportService;
