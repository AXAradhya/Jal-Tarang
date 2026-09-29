/**
 * JAL TARANG - Interactive Swagger UI Renderer
 * Renders an interactive Swagger UI web interface directly at /api/v1/docs without heavy npm bindings.
 */

import { Request, Response } from 'express';
import { openApiSpec } from './openapi.js';

export function renderSwaggerUi(req: Request, res: Response) {
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>JAL TARANG — Interactive API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui.css" />
  <link rel="icon" type="image/png" href="https://unpkg.com/swagger-ui-dist@5.11.0/favicon-32x32.png" />
  <style>
    body { margin: 0; padding: 0; background: #0f172a; }
    .topbar { display: none; }
    .swagger-ui { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .swagger-ui .info .title { color: #0284c7; }
    .swagger-ui .scheme-container { background: #f8fafc; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-bundle.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.11.0/swagger-ui-standalone-preset.js"></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        spec: ${JSON.stringify(openApiSpec)},
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIStandalonePreset
        ],
        layout: "BaseLayout"
      });
    };
  </script>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html');
  return res.send(html);
}

export function serveOpenApiJson(req: Request, res: Response) {
  return res.json(openApiSpec);
}
