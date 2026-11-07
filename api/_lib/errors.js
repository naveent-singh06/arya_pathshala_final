'use strict';

/** An error that maps directly to an HTTP response. */
class HttpError extends Error {
  constructor(status, code, message, headers = {}) {
    super(message);
    this.name = 'HttpError';
    this.status = status;
    this.code = code;
    this.headers = headers;
  }
}

/** Raised when the upstream LLM provider fails. Never shown to students verbatim. */
class ProviderError extends Error {
  constructor(message, { status = null, kind = 'unknown', detail = '' } = {}) {
    super(message);
    this.name = 'ProviderError';
    this.status = status;
    this.kind = kind; // 'timeout' | 'network' | 'http' | 'stream'
    this.detail = detail;
  }
}

/** Raised when required server configuration (env vars) is missing or invalid. */
class ConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfigError';
  }
}

module.exports = { HttpError, ProviderError, ConfigError };
