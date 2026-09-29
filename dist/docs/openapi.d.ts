export declare const openApiSpec: {
    openapi: string;
    info: {
        title: string;
        version: string;
        description: string;
        contact: {
            name: string;
            url: string;
        };
    };
    servers: {
        url: string;
        description: string;
    }[];
    components: {
        securitySchemes: {
            bearerAuth: {
                type: string;
                scheme: string;
                bearerFormat: string;
            };
        };
        schemas: {
            ApiResponse: {
                type: string;
                properties: {
                    success: {
                        type: string;
                        example: boolean;
                    };
                    data: {
                        type: string;
                    };
                    meta: {
                        type: string;
                    };
                    requestId: {
                        type: string;
                    };
                };
            };
            DecisionRequest: {
                type: string;
                required: string[];
                properties: {
                    cargoType: {
                        type: string;
                        example: string;
                    };
                    quantity: {
                        type: string;
                        example: number;
                    };
                    quantityUnit: {
                        type: string;
                        example: string;
                    };
                    origin: {
                        type: string;
                        example: string;
                    };
                    destination: {
                        type: string;
                        example: string;
                    };
                    laycanStart: {
                        type: string;
                        format: string;
                        example: string;
                    };
                    laycanEnd: {
                        type: string;
                        format: string;
                        example: string;
                    };
                    contractHorizon: {
                        type: string;
                        enum: string[];
                        example: string;
                    };
                    riskTolerance: {
                        type: string;
                        enum: string[];
                        example: string;
                    };
                };
            };
        };
    };
    security: {
        bearerAuth: any[];
    }[];
    paths: {
        '/health': {
            get: {
                summary: string;
                tags: string[];
                security: any[];
                responses: {
                    '200': {
                        description: string;
                    };
                    '503': {
                        description: string;
                    };
                };
            };
        };
        '/auth/login': {
            post: {
                summary: string;
                tags: string[];
                security: any[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                required: string[];
                                properties: {
                                    email: {
                                        type: string;
                                        example: string;
                                    };
                                    password: {
                                        type: string;
                                        example: string;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    '200': {
                        description: string;
                    };
                };
            };
        };
        '/decision/analyze': {
            post: {
                summary: string;
                tags: string[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                $ref: string;
                            };
                        };
                    };
                };
                responses: {
                    '200': {
                        description: string;
                    };
                };
            };
        };
        '/decision/history': {
            get: {
                summary: string;
                tags: string[];
                responses: {
                    '200': {
                        description: string;
                    };
                };
            };
        };
        '/vessels': {
            get: {
                summary: string;
                tags: string[];
                responses: {
                    '200': {
                        description: string;
                    };
                };
            };
        };
        '/ports/east-coast': {
            get: {
                summary: string;
                tags: string[];
                responses: {
                    '200': {
                        description: string;
                    };
                };
            };
        };
        '/freight/rates': {
            get: {
                summary: string;
                tags: string[];
                responses: {
                    '200': {
                        description: string;
                    };
                };
            };
        };
        '/forecasts/run': {
            post: {
                summary: string;
                tags: string[];
                responses: {
                    '201': {
                        description: string;
                    };
                };
            };
        };
        '/contracts': {
            get: {
                summary: string;
                tags: string[];
                responses: {
                    '200': {
                        description: string;
                    };
                };
            };
        };
        '/contracts/{id}/approve': {
            post: {
                summary: string;
                tags: string[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    '200': {
                        description: string;
                    };
                };
            };
        };
        '/scenarios': {
            get: {
                summary: string;
                tags: string[];
                responses: {
                    '200': {
                        description: string;
                    };
                };
            };
        };
        '/risks/assess': {
            post: {
                summary: string;
                tags: string[];
                responses: {
                    '200': {
                        description: string;
                    };
                };
            };
        };
        '/copilot/chat': {
            post: {
                summary: string;
                tags: string[];
                requestBody: {
                    required: boolean;
                    content: {
                        'application/json': {
                            schema: {
                                type: string;
                                required: string[];
                                properties: {
                                    prompt: {
                                        type: string;
                                        example: string;
                                    };
                                };
                            };
                        };
                    };
                };
                responses: {
                    '200': {
                        description: string;
                    };
                };
            };
        };
        '/search': {
            get: {
                summary: string;
                tags: string[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    '200': {
                        description: string;
                    };
                };
            };
        };
        '/reports/generate': {
            post: {
                summary: string;
                tags: string[];
                responses: {
                    '202': {
                        description: string;
                    };
                };
            };
        };
        '/jobs/{id}': {
            get: {
                summary: string;
                tags: string[];
                parameters: {
                    name: string;
                    in: string;
                    required: boolean;
                    schema: {
                        type: string;
                    };
                }[];
                responses: {
                    '200': {
                        description: string;
                    };
                };
            };
        };
        '/audit': {
            get: {
                summary: string;
                tags: string[];
                responses: {
                    '200': {
                        description: string;
                    };
                };
            };
        };
    };
};
