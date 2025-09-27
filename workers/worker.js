// Cloudflare Worker entry point for OIDC and SAML broker
// This is a scaffold for sso.broker

import { routeRequest } from './src/routing.js';
import { CORS_HEADERS, errorResponse, logRequest, logError } from './src/utils.js';

export default {
  async fetch(request, env, ctx) {
    try {
      const url = new URL(request.url);
      const pathname = url.pathname;
      const host = url.host;
      
      // Handle CORS preflight requests
      if (request.method === 'OPTIONS') {
        return new Response(null, {
          status: 204,
          headers: CORS_HEADERS
        });
      }
      
      // Log the request
      logRequest(request, { pathname, host }, env);
      
      // Route to appropriate handler
      const result = await routeRequest(request, env, url, pathname, host);
      if (result) return result;

      // Default response
      return new Response('SSO Broker is running. Supports both OIDC and SAML.', { 
        status: 200,
        headers: CORS_HEADERS
      });
      
    } catch (error) {
      // Global error handler
      logError(error, { 
        url: request.url, 
        method: request.method,
        userAgent: request.headers.get('User-Agent')
      }, env);
      
      return errorResponse('Internal server error', 500, {
        requestId: crypto.randomUUID()
      });
    }
  }
};
