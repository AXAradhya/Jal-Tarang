/**
 * JAL TARANG — OpenRouter LLM Gateway Client
 */

import { config } from '../../../config/index.js';

export async function queryOpenRouter(
  userPrompt: string,
  systemPrompt: string,
  modelName: string = config.openRouter.model
): Promise<string | null> {
  const apiKey = config.openRouter.apiKey;
  if (!apiKey) {
    console.warn('[CopilotService] OpenRouter API key is missing. Skipping LLM call.');
    return null;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 12000); // 12-second abort timeout

  try {
    const response = await fetch(config.openRouter.apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://jal-tarang.internal',
        'X-Title': 'JAL TARANG AI Copilot',
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

    const json: any = await response.json();
    const content = json?.choices?.[0]?.message?.content;
    return content && typeof content === 'string' && content.trim().length > 0 ? content.trim() : null;
  } catch (err: any) {
    clearTimeout(timeoutId);
    console.warn(`[CopilotService] OpenRouter request failed (${err.name || 'Error'}): ${err.message}`);
    return null;
  }
}
