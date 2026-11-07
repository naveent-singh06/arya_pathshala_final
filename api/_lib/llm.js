'use strict';

const { ProviderError } = require('./errors');

/**
 * Parses one line of an OpenAI-compatible server-sent-events stream.
 * Returns null (ignore), { done: true }, or { text, finishReason }.
 */
function parseSseLine(line) {
  if (!line || !line.startsWith('data:')) return null;
  const payload = line.slice(5).trim();
  if (!payload) return null;
  if (payload === '[DONE]') return { done: true };
  let json;
  try {
    json = JSON.parse(payload);
  } catch (e) {
    return null;
  }
  const choice = json && json.choices && json.choices[0];
  if (!choice) return null;
  const text = choice.delta && typeof choice.delta.content === 'string' ? choice.delta.content : '';
  return { text, finishReason: choice.finish_reason || null };
}

async function readErrorBody(response) {
  try {
    return (await response.text()).slice(0, 500);
  } catch (e) {
    return '';
  }
}

/**
 * Streams a chat completion from any OpenAI-compatible provider.
 * Yields { type: 'delta', text } for each piece of text and finally
 * { type: 'done', finishReason } ('stop' = complete, 'length' = cut off at the token limit).
 * Throws ProviderError on failure.
 */
async function* streamChatCompletion({ config, messages, signal, fetchImpl = fetch }) {
  const controller = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    controller.abort();
  }, config.timeoutMs);
  const onAbort = () => controller.abort();
  if (signal) {
    if (signal.aborted) controller.abort();
    else signal.addEventListener('abort', onAbort, { once: true });
  }

  try {
    let response;
    try {
      response = await fetchImpl(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model: config.model,
          messages,
          stream: true,
          temperature: config.temperature,
          max_tokens: config.maxTokens,
        }),
        signal: controller.signal,
      });
    } catch (e) {
      const kind = timedOut ? 'timeout' : 'network';
      throw new ProviderError(`Could not reach the AI provider (${kind}).`, { kind });
    }

    if (!response.ok) {
      const detail = await readErrorBody(response);
      throw new ProviderError(`AI provider responded with HTTP ${response.status}.`, {
        status: response.status,
        kind: 'http',
        detail,
      });
    }

    const decoder = new TextDecoder();
    let buffer = '';
    let finishReason = null;

    const handleLine = (rawLine) => {
      const event = parseSseLine(rawLine.trim());
      if (!event) return null;
      if (event.done) return { done: true };
      if (event.finishReason) finishReason = event.finishReason;
      return event.text ? { text: event.text } : null;
    };

    try {
      for await (const chunk of response.body) {
        buffer += decoder.decode(chunk, { stream: true });
        let newline;
        while ((newline = buffer.indexOf('\n')) >= 0) {
          const line = buffer.slice(0, newline);
          buffer = buffer.slice(newline + 1);
          const result = handleLine(line);
          if (result && result.done) {
            yield { type: 'done', finishReason: finishReason || 'stop' };
            return;
          }
          if (result && result.text) yield { type: 'delta', text: result.text };
        }
      }
      buffer += decoder.decode();
      if (buffer.trim()) {
        const result = handleLine(buffer);
        if (result && result.text) yield { type: 'delta', text: result.text };
      }
    } catch (e) {
      if (e instanceof ProviderError) throw e;
      const kind = timedOut ? 'timeout' : 'stream';
      throw new ProviderError(`The AI response stream failed (${kind}).`, { kind });
    }

    yield { type: 'done', finishReason: finishReason || 'stop' };
  } finally {
    clearTimeout(timer);
    if (signal) signal.removeEventListener('abort', onAbort);
  }
}

module.exports = { streamChatCompletion, parseSseLine };
