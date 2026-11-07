'use strict';

function intEnv(value, fallback, min, max) {
  const n = Number.parseInt(value, 10);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

function floatEnv(value, fallback, min, max) {
  const n = Number.parseFloat(value);
  if (Number.isNaN(n)) return fallback;
  return Math.min(max, Math.max(min, n));
}

/**
 * Reads the AI provider and usage-limit settings from environment variables.
 * Any OpenAI-compatible chat-completions provider can be used by changing
 * LLM_BASE_URL / LLM_MODEL / LLM_API_KEY. Nothing here is ever sent to the browser.
 */
function getConfig(env = process.env) {
  return {
    apiKey: (env.LLM_API_KEY || env.GROQ_API_KEY || '').trim(),
    baseUrl: (env.LLM_BASE_URL || 'https://api.groq.com/openai/v1').trim().replace(/\/+$/, ''),
    model: (env.LLM_MODEL || 'llama-3.3-70b-versatile').trim(),
    maxTokens: intEnv(env.LLM_MAX_TOKENS, 2048, 256, 8192),
    temperature: floatEnv(env.LLM_TEMPERATURE, 0.3, 0, 1.5),
    timeoutMs: intEnv(env.LLM_TIMEOUT_MS, 55000, 5000, 120000),
    perMinute: intEnv(env.TUTOR_RATE_PER_MINUTE, 8, 1, 120),
    perDay: intEnv(env.TUTOR_DAILY_LIMIT, 100, 1, 10000),
  };
}

module.exports = { getConfig };
