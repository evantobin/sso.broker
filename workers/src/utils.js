// Utility functions for the SSO broker
import Mustache from 'mustache';

// CORS headers for cross-origin requests
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400'
};

// JSON response helper
export function jsonResponse(obj, status = 200, additionalHeaders = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
      ...additionalHeaders
    }
  });
}

// Error response helper
export function errorResponse(message, status = 400, details = null) {
  const error = {
    error: message,
    status,
    timestamp: new Date().toISOString()
  };
  if (details) error.details = details;
  
  return jsonResponse(error, status);
}

export function logRequest(request, context = {}, env = {}) {
  // Only log in development/non-production environments
  if (env.ENVIRONMENT === 'production') {
    return;
  }
  
  console.log(JSON.stringify({
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers.entries()),
    timestamp: new Date().toISOString(),
    ...context
  }));
}

export function logError(error, context = {}, env = {}) {
  // Only log in development/non-production environments
  if (env.ENVIRONMENT === 'production') {
    return;
  }
  
  console.error(JSON.stringify({
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    ...context
  }));
}

// Render Mustache template
export async function renderTemplate(templatePath, data) {
  try {
    const { getTemplate } = await import('./template.js');
    const template = getTemplate(templatePath);
    
    if (!template) {
      throw new Error(`Template not found: ${templatePath}`);
    }
    
    return Mustache.render(template, data);
  } catch (error) {
    logError(error, { templatePath, data });
    throw new Error('Failed to render template');
  }
}