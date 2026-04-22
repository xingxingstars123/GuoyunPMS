/**
 * Swagger API文档配置
 */

const swaggerUi = require('swagger-ui-express');

const swaggerDocument = {
  openapi: '3.0.0',
  info: {
    title: 'GuoyunPMS API 文档',
    version: '2.0.0',
    description: '国云PMS酒店管理系统API文档',
    contact: {
      name: 'GuoyunPMS Team',
      email: 'dev@guoyunpms.com'
    }
  },
  servers: [
    {
      url: 'http://localhost:3000',
      description: '开发服务器'
    },
    {
      url: 'https://api.guoyunpms.com',
      description: '生产服务器'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'integer', example: 1 },
          username: { type: 'string', example: 'admin' },
          role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'STAFF', 'CLEANER'], example: 'ADMIN' },
          created_at: { type: 'string', format: 'date-time' },
          last_login: { type: 'string', format: 'date-time' }
        }
      },
      Room: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          room_number: { type: 'string', example: '101' },
          room_type: { type: 'string', example: '标准间' },
          status: { type: 'string', enum: ['available', 'occupied', 'cleaning', 'maintenance'], example: 'available' },
          base_price: { type: 'number', example: 299 }
        }
      },
      Order: {
        type: 'object',
        properties: {
          id: { type: 'integer' },
          room_id: { type: 'integer' },
          guest_name: { type: 'string', example: '张三' },
          guest_phone: { type: 'string', example: '13800138000' },
          check_in_date: { type: 'string', format: 'date' },
          check_out_date: { type: 'string', format: 'date' },
          total_price: { type: 'number', example: 597 },
          status: { type: 'string', enum: ['pending', 'confirmed', 'checked_in', 'checked_out', 'cancelled'] }
        }
      },
      Error: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string', example: '错误信息' }
        }
      }
    }
  },
  paths: {
    '/api/auth/register': {
      post: {
        tags: ['认证'],
        summary: '用户注册',
        description: '创建新用户账号(需要管理员权限)',
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                  username: { type: 'string', example: 'newuser' },
                  password: { type: 'string', minLength: 6, example: 'password123' },
                  role: { type: 'string', enum: ['ADMIN', 'MANAGER', 'STAFF', 'CLEANER'], default: 'STAFF' }
                }
              }
            }
          }
        },
        responses: {
          201: {
            description: '注册成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: { $ref: '#/components/schemas/User' }
                  }
                }
              }
            }
          },
          400: {
            description: '注册失败',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/auth/login': {
      post: {
        tags: ['认证'],
        summary: '用户登录',
        description: '使用用户名和密码登录,返回JWT token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['username', 'password'],
                properties: {
                  username: { type: 'string', example: 'admin' },
                  password: { type: 'string', example: 'admin123' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: '登录成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' },
                        user: { $ref: '#/components/schemas/User' }
                      }
                    }
                  }
                }
              }
            }
          },
          401: {
            description: '登录失败',
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/Error' }
              }
            }
          }
        }
      }
    },
    '/api/auth/refresh': {
      post: {
        tags: ['认证'],
        summary: '刷新Token',
        description: '使用旧token获取新token',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['token'],
                properties: {
                  token: { type: 'string', example: 'old_token_here' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: '刷新成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean', example: true },
                    data: {
                      type: 'object',
                      properties: {
                        token: { type: 'string' }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/ota/sync-inventory': {
      post: {
        tags: ['OTA对接'],
        summary: '同步房态到OTA平台',
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['channel', 'rooms'],
                properties: {
                  channel: { type: 'string', enum: ['ctrip', 'meituan', 'booking'], example: 'ctrip' },
                  rooms: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        room_number: { type: 'string' },
                        status: { type: 'string' },
                        date: { type: 'string', format: 'date' }
                      }
                    }
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: '同步成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    channel: { type: 'string' },
                    synced: { type: 'integer' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/pricing/calculate': {
      post: {
        tags: ['智能定价'],
        summary: '计算智能价格',
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['roomId', 'date'],
                properties: {
                  roomId: { type: 'integer', example: 1 },
                  date: { type: 'string', format: 'date', example: '2026-05-01' },
                  advanceDays: { type: 'integer', default: 7, example: 7 }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: '计算成功',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    roomId: { type: 'integer' },
                    date: { type: 'string' },
                    basePrice: { type: 'number' },
                    finalPrice: { type: 'number' },
                    occupancy: { type: 'number' },
                    isWeekend: { type: 'boolean' },
                    isHoliday: { type: 'boolean' },
                    multiplier: { type: 'number' }
                  }
                }
              }
            }
          }
        }
      }
    },
    '/api/export/orders': {
      post: {
        tags: ['数据导出'],
        summary: '导出订单数据',
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  format: { type: 'string', enum: ['excel', 'csv', 'pdf'], default: 'excel' },
                  startDate: { type: 'string', format: 'date' },
                  endDate: { type: 'string', format: 'date' }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: '文件生成成功',
            content: {
              'application/octet-stream': {
                schema: {
                  type: 'string',
                  format: 'binary'
                }
              }
            }
          }
        }
      }
    },
    '/api/bulk/batch-checkin': {
      post: {
        tags: ['批量操作'],
        summary: '批量入住',
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['orderIds'],
                properties: {
                  orderIds: {
                    type: 'array',
                    items: { type: 'integer' },
                    example: [1, 2, 3]
                  }
                }
              }
            }
          }
        },
        responses: {
          200: {
            description: '批量入住结果',
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    success: { type: 'boolean' },
                    processed: { type: 'integer' },
                    succeeded: { type: 'integer' },
                    failed: { type: 'integer' },
                    results: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          orderId: { type: 'integer' },
                          success: { type: 'boolean' },
                          error: { type: 'string' }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  },
  tags: [
    { name: '认证', description: '用户认证相关接口' },
    { name: 'OTA对接', description: 'OTA平台对接接口' },
    { name: '智能定价', description: '智能定价引擎接口' },
    { name: '数据导出', description: '数据导出接口' },
    { name: '批量操作', description: '批量操作接口' }
  ]
};

module.exports = { swaggerUi, swaggerDocument };
