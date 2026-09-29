import { Request, Response } from 'express';
export declare function renderSwaggerUi(req: Request, res: Response): Response<any, Record<string, any>>;
export declare function serveOpenApiJson(req: Request, res: Response): Response<any, Record<string, any>>;
