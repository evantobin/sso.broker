// Test OAuth Service Provider handler
// This is a mock SP that only handles OAuth response callbacks for testing

import { errorResponse, logError } from '../utils.js';

// Handle requests to test-oauth.sso.broker (mock SP)
export async function handleTestOAuthRequest(request, env, url, pathname, host) {
  // Homepage with test buttons for all providers
  if (pathname === '/' || pathname === '') {
    // Import template
    const { TEST_OAUTH_HOMEPAGE_TEMPLATE } = await import('../template.js');
    
    // Use the template directly
    const homepageHtml = TEST_OAUTH_HOMEPAGE_TEMPLATE;

    return new Response(homepageHtml, {
      headers: {
        'Content-Type': 'text/html',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  // Only handle the /oauth/callback endpoint
  if (pathname === '/oauth/callback') {
    // Handle GET requests (OAuth callback with code)
    if (request.method === 'GET') {
      try {
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        const error = url.searchParams.get('error');
        const errorDescription = url.searchParams.get('error_description');
        
        // Handle OAuth errors
        if (error) {
          const oauthData = {
            error,
            errorDescription,
            state,
            timestamp: new Date().toISOString()
          };

          // Import template and render with error data
          const { OAUTH_CALLBACK_TEMPLATE } = await import('../template.js');
          const Mustache = (await import('mustache')).default;
          
          const html = Mustache.render(OAUTH_CALLBACK_TEMPLATE, {
            success: false,
            message: `OAuth Error: ${error}`,
            data: oauthData,
            hasData: true
          });

          return new Response(html, {
            headers: {
              'Content-Type': 'text/html',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
              'Access-Control-Max-Age': '86400'
            }
          });
        }
        
        if (!code) {
          return errorResponse('Missing authorization code from OAuth provider', 400);
        }

        // Parse state to get provider info
        let providerInfo = {};
        if (state) {
          try {
            providerInfo = JSON.parse(state);
          } catch (e) {
            // State might not be JSON, that's okay
            providerInfo = { rawState: state };
          }
        }

        // Try to exchange authorization code for token
        let tokenData = null;
        let tokenError = null;
        
        if (code && providerInfo.provider && providerInfo.client_id) {
          try {
            // For the test page, we'll show a note that token exchange requires the client secret
            // In a real application, the client would exchange the code for tokens
            tokenData = {
              note: "Enter your client secret below to exchange the authorization code for tokens.",
              authorization_code: code,
              client_id: providerInfo.client_id,
              redirect_uri: 'https://test-oauth.sso.broker/oauth/callback',
              token_endpoint: `${url.origin}/token`,
              provider: providerInfo.provider
            };
          } catch (error) {
            tokenError = `Token exchange error: ${error.message}`;
          }
        }

        const oauthData = {
          code,
          state: providerInfo,
          timestamp: new Date().toISOString(),
          url: url.toString(),
          tokenData,
          tokenError
        };

        // Import template and render with OAuth data
        const { OAUTH_CALLBACK_TEMPLATE } = await import('../template.js');
        const Mustache = (await import('mustache')).default;
        
        const html = Mustache.render(OAUTH_CALLBACK_TEMPLATE, {
          success: true,
          message: 'OAuth Response received and processed successfully',
          data: oauthData,
          hasData: true
        });

        return new Response(html, {
          headers: {
            'Content-Type': 'text/html',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
            'Access-Control-Max-Age': '86400'
          }
        });

      } catch (error) {
        logError(error, { action: 'test_oauth_callback' }, env);
        return errorResponse('Failed to process OAuth response: ' + error.message, 500);
      }
    }
    
    // Handle POST requests (show test page)
    if (request.method === 'POST') {
      // Import template
      const { OAUTH_CALLBACK_TEMPLATE } = await import('../template.js');
      const Mustache = (await import('mustache')).default;
      
      // Render template with no data
      const html = Mustache.render(OAUTH_CALLBACK_TEMPLATE, {
        hasData: false,
        message: 'This endpoint is ready to receive OAuth responses'
      });

      return new Response(html, {
        headers: {
          'Content-Type': 'text/html',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          'Access-Control-Max-Age': '86400'
        }
      });
    }

  }


  // For any other path on test-oauth.sso.broker, return 404
  return errorResponse('Not Found - This is a mock OAuth Service Provider. Only /oauth/callback and /token-exchange are available.', 404);

}
