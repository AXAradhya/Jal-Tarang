"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.queryOpenRouter = queryOpenRouter;
const index_js_1 = require("../../../config/index.js");
async function queryOpenRouter(userPrompt, systemPrompt, modelName = index_js_1.config.openRouter.model) {
    const apiKey = index_js_1.config.openRouter.apiKey;
    if (!apiKey) {
        console.warn('[CopilotService] OpenRouter API key is missing. Skipping LLM call.');
        return null;
    }
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);
    try {
        const response = await fetch(index_js_1.config.openRouter.apiUrl, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': 'https://sagar-drishti.internal',
                'X-Title': 'SAGAR DRISHTI AI Copilot',
            },
            body: JSON.stringify({
                model: modelName,
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: userPrompt }
                ],
                temperature: 0.3,
                max_tokens: 1500,
            }),
            signal: controller.signal
        });
        clearTimeout(timeoutId);
        if (!response.ok) {
            const errText = await response.text();
            console.warn(`[CopilotService] OpenRouter returned HTTP ${response.status}: ${errText}`);
            return null;
        }
        const json = await response.json();
        const content = json?.choices?.[0]?.message?.content;
        return content && typeof content === 'string' && content.trim().length > 0 ? content.trim() : null;
    }
    catch (err) {
        clearTimeout(timeoutId);
        console.warn(`[CopilotService] OpenRouter request failed (${err.name || 'Error'}): ${err.message}`);
        return null;
    }
}
//# sourceMappingURL=queryOpenRouter.js.map