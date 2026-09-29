/**
 * JAL TARANG - OpenAPI 3.0 Specification
 * Comprehensive specification for the entire maritime intelligence platform.
 */

export const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'JAL TARANG — Maritime Decision Intelligence Platform API',
    version: '2.0.0',
    description: 'Enterprise Maritime Freight Forecasting, Vessel Chartering, Bulk Cargo Procurement & Decision Intelligence API. Built for Ministry of Steel / Steel Authority of India Limited (SAIL) — SIH Problem Statement 26006.',
    contact: {
      name: 'JAL TARANG Technical Architecture Team',
      url: 'https://sail.co.in'
    }
  },
  servers: [
    {
      url: 'http://localhost:8000/api/v1',
      description: 'Local Development Server'
    }
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT'
      }
    },
    schemas: {
      ApiResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: true },
          data: { type: 'object' },
          meta: { type: 'object' },
          requestId: { type: 'string' }
        }
      },
      DecisionRequest: {
        type: 'object',
        required: ['cargoType', 'quantity', 'origin', 'destination'],
        properties: {
          cargoType: { type: 'string', example: 'COKING_COAL' },
          quantity: { type: 'number', example: 100000 },
          quantityUnit: { type: 'string', example: 'MT' },
          origin: { type: 'string', example: 'Australia' },
          destination: { type: 'string', example: 'Paradip' },
          laycanStart: { type: 'string', format: 'date', example: '2026-10-01' },
          laycanEnd: { type: 'string', format: 'date', example: '2026-10-10' },
          contractHorizon: { type: 'string', enum: ['SPOT', 'SHORT_TERM', 'MEDIUM_TERM', 'COA'], example: 'MEDIUM_TERM' },
          riskTolerance: { type: 'string', enum: ['LOW', 'MEDIUM', 'HIGH'], example: 'MEDIUM' }
        }
      }
    }
  },
  security: [
    { bearerAuth: [] }
  ],
  paths: {
    '/health': {
      get: {
        summary: 'System health and database connectivity status',
        tags: ['System'],
        security: [],
        responses: {
          '200': { description: 'System healthy' },
          '503': { description: 'Database offline' }
        }
      }
    },
    '/auth/login': {
      post: {
        summary: 'Authenticate user and issue JWT tokens',
        tags: ['Authentication'],
        security: [],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'chartering.manager@sail.in' },
                  password: { type: 'string', example: 'Password123!' }
                }
              }
            }
          }
        },
        responses: {
          '200': { description: 'Authenticated successfully' }
        }
      }
    },
    '/decision/analyze': {
      post: {
        summary: 'Execute the 16-step JAL TARANG Central Decision Intelligence Pipeline',
        tags: ['Decision Intelligence'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/DecisionRequest' }
            }
          }
        },
        responses: {
          '200': { description: 'Decision recommendation, economics, and risk matrix calculated' }
        }
      }
    },
    '/decision/history': {
      get: {
        summary: 'List historical decision recommendations and analytical traces',
        tags: ['Decision Intelligence'],
        responses: { '200': { description: 'List of past decisions' } }
      }
    },
    '/vessels': {
      get: {
        summary: 'List bulk carrier fleet with filter options',
        tags: ['Vessels'],
        responses: { '200': { description: 'Vessel list' } }
      }
    },
    '/ports/east-coast': {
      get: {
        summary: 'Get East Coast India target discharge ports (Paradip, Vizag, Dhamra, Haldia, Gopalpur)',
        tags: ['Ports & Geography'],
        responses: { '200': { description: 'Port constraints and status' } }
      }
    },
    '/freight/rates': {
      get: {
        summary: 'Retrieve historical freight rates and market indices',
        tags: ['Freight Intelligence'],
        responses: { '200': { description: 'Freight rates list' } }
      }
    },
    '/forecasts/run': {
      post: {
        summary: 'Trigger ML forecast run across 7D to 180D horizons',
        tags: ['Forecasting'],
        responses: { '201': { description: 'Forecast curve generated' } }
      }
    },
    '/contracts': {
      get: {
        summary: 'List freight and charter contracts',
        tags: ['Contracts'],
        responses: { '200': { description: 'Contracts list' } }
      }
    },
    '/contracts/{id}/approve': {
      post: {
        summary: 'Approve charter or affreightment contract',
        tags: ['Contracts'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Contract approved' } }
      }
    },
    '/scenarios': {
      get: {
        summary: 'List disruption simulation scenarios (Fuel Spike, Congestion, Port Closure)',
        tags: ['Scenarios & Stress Testing'],
        responses: { '200': { description: 'Scenario catalog' } }
      }
    },
    '/risks/assess': {
      post: {
        summary: 'Evaluate composite voyage and port risk scores',
        tags: ['Risk Engine'],
        responses: { '200': { description: 'Risk assessment result' } }
      }
    },
    '/copilot/chat': {
      post: {
        summary: 'Ask MARINEX AI Copilot grounded maritime intelligence queries',
        tags: ['AI Copilot'],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['prompt'],
                properties: {
                  prompt: { type: 'string', example: 'What are the maximum draft restrictions at Paradip port?' }
                }
              }
            }
          }
        },
        responses: { '200': { description: 'Grounded copilot answer with tool evidence' } }
      }
    },
    '/search': {
      get: {
        summary: 'Global multi-entity search across ports, vessels, freight codes, cargo, and routes',
        tags: ['Search'],
        parameters: [{ name: 'q', in: 'query', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Search results' } }
      }
    },
    '/reports/generate': {
      post: {
        summary: 'Queue asynchronous generation of market brief or economics report',
        tags: ['Reports'],
        responses: { '202': { description: 'Report queued in BullMQ' } }
      }
    },
    '/jobs/{id}': {
      get: {
        summary: 'Monitor background BullMQ job status and progress',
        tags: ['Background Jobs'],
        parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
        responses: { '200': { description: 'Job status' } }
      }
    },
    '/audit': {
      get: {
        summary: 'Query enterprise audit trails and decision actions',
        tags: ['Governance & Audit'],
        responses: { '200': { description: 'Audit log entries' } }
      }
    }
  }
};
