// Cloudflare Worker entry point for OIDC and SAML broker
// This is a scaffold for sso.broker

import { generateClientId, generateClientSecret, validateClientCredentials, validateSignedEmailCode } from './src/crypto.js';
import { getProviderConfigs, getProviderFromHost, getUserEmailFromProvider, showConsentScreen, generateIdToken } from './src/oidc.js';
import { getSamlConfigs, getSamlProviderFromHost, generateSamlMetadata, parseSamlRequest, generateSamlResponse, signSamlResponse, showSamlConsentScreen } from './src/saml.js';
import { CORS_HEADERS, jsonResponse, errorResponse, logRequest, logError } from './src/utils.js';

// Determine if this is a SAML request based on host and path
function isSamlRequest(host, pathname) {
  // Check if host is a SAML subdomain (contains -saml)
  const isSamlSubdomain = host.includes('.sso.broker') && host.includes('-saml');
  // Check if path is SAML-related
  const isSamlPath = pathname.startsWith('/saml/') || pathname === '/saml' || pathname === '/metadata';
  return isSamlSubdomain || isSamlPath;
}

// Determine if this is an OIDC request based on host and path
function isOidcRequest(host, pathname) {
  // Check if host is an OIDC subdomain (not SAML)
  const isOidcSubdomain = host.includes('.sso.broker') && !host.includes('-saml');
  // Check if path is OIDC-related
  const isOidcPath = pathname.startsWith('/.well-known/') || 
         pathname === '/register' || 
         pathname === '/authorize' || 
         pathname === '/callback' || 
         pathname === '/consent' || 
         pathname === '/token';
  return isOidcSubdomain || isOidcPath;
}

// Handle OIDC requests
async function handleOidcRequest(request, env, url, pathname, host) {
      const providerKey = getProviderFromHost(host);
      const providerConfigs = getProviderConfigs(env);
      const config = providerKey ? providerConfigs[providerKey] : null;
      
      // Validate provider configuration
      if (providerKey && !config) {
        logError(new Error(`Unknown provider: ${providerKey}`), { providerKey, host }, env);
        return errorResponse(`Unknown OIDC provider: ${providerKey}`, 404);
      }
      
      // Validate required environment variables for configured providers
      if (config && (!config.client_id || !config.client_secret)) {
        logError(new Error('Missing OAuth credentials'), { providerKey }, env);
        return errorResponse('OIDC provider not properly configured', 500);
      }

      // OIDC Discovery
      if (pathname === '/.well-known/openid-configuration') {
        if (!config) {
          return errorResponse('OIDC provider not found for this subdomain', 404);
        }
        
        return jsonResponse({
          issuer: url.origin,
          authorization_endpoint: url.origin + '/authorize',
          token_endpoint: url.origin + '/token',
          registration_endpoint: url.origin + '/register',
          response_types_supported: ['code'],
          subject_types_supported: ['public'],
          id_token_signing_alg_values_supported: ['RS256'],
          scopes_supported: config.scopes,
          claims_supported: ['sub', 'email']
        });
      }

      // Dynamic Client Registration
      if (pathname === '/register' && request.method === 'POST') {
        if (!config) {
          return errorResponse('OIDC provider not found for this subdomain', 404);
        }
        
        try {
          const body = await request.json();
          // Validate client metadata
          if (!body.redirect_uris || !Array.isArray(body.redirect_uris)) {
            return errorResponse('Invalid client metadata: redirect_uris is required', 400);
          }
          if (!body.client_name || typeof body.client_name !== 'string') {
            return errorResponse('Invalid client metadata: client_name is required', 400);
          }
          
          // Use a master secret for signing (you should set this as an environment variable)
          const masterSecret = env.MASTER_SECRET || 'default-master-secret-change-in-production';
          
          
          const clientId = await generateClientId(body.client_name, body.redirect_uris, masterSecret);
          
          // Extract the GUID from the client ID to generate the client secret
          const clientIdData = JSON.parse(atob(clientId.substring(1).replace(/[-_]/g, (match) => {
            switch (match) {
              case '-': return '+';
              case '_': return '/';
              default: return match;
            }
          }).replace(/=+$/, '')));
          const payload = JSON.parse(atob(clientIdData.p));
          const appGuid = payload.g;
          
          const clientSecret = await generateClientSecret(appGuid, masterSecret);
          
          logRequest(request, { action: 'client_registration', clientId, clientName: body.client_name }, env);
          
          return jsonResponse({ 
            client_id: clientId,
            client_secret: clientSecret,
            client_name: body.client_name,
            redirect_uris: body.redirect_uris
          });
        } catch (error) {
          logError(error, { action: 'client_registration' }, env);
          return errorResponse('Invalid JSON in request body', 400);
        }
      }

      // OAuth Provider Callback Endpoint
      if (pathname === '/callback') {
        if (!config) {
          return errorResponse('OIDC provider not found for this subdomain', 404);
        }
        
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        const error = url.searchParams.get('error');
        
        // Handle OAuth provider errors
        if (error) {
          logError(new Error(`OAuth provider error: ${error}`), { provider: providerKey, error }, env);
          return errorResponse(`OAuth provider error: ${error}`, 400);
        }
        
        if (!code) {
          return errorResponse('Missing authorization code from OAuth provider', 400);
        }
        
        if (!state) {
          return errorResponse('Missing state parameter from OAuth provider', 400);
        }
        
        try {
          // Parse the state to get original parameters
          let originalParams;
          try {
            originalParams = JSON.parse(state);
          } catch (e) {
            return errorResponse('Invalid state parameter', 400);
          }
          
          // Store the OAuth code in the state for later use
          const updatedState = JSON.stringify({
            ...originalParams,
            oauth_code: code
          });
          
          // Show consent screen with original parameters
          return await showConsentScreen(url, originalParams.client_id, updatedState, originalParams.original_redirect_uri, providerKey, env);
        } catch (error) {
          logError(error, { action: 'oauth_callback', provider: providerKey }, env);
          return errorResponse('Failed to process OAuth callback', 500);
        }
      }

      // Authorization Endpoint
      if (pathname === '/authorize') {
        if (!config) {
          return errorResponse('OIDC provider not found for this subdomain', 404);
        }
        
        const redirectUri = url.searchParams.get('redirect_uri');
        const state = url.searchParams.get('state');
        const clientId = url.searchParams.get('client_id');
        
        // Validate required parameters
        if (!redirectUri) {
          return errorResponse('Missing required parameter: redirect_uri', 400);
        }
        if (!clientId) {
          return errorResponse('Missing required parameter: client_id', 400);
        }
        
        try {
          // Validate client ID (without secret) and redirect URI
          const masterSecret = env.MASTER_SECRET || 'default-master-secret-change-in-production';
      const clientValidation = await validateClientCredentials(clientId, 'dummy', masterSecret);
          
          if (!clientValidation.valid) {
            return errorResponse(`Invalid client ID: ${clientValidation.error}`, 401);
          }
          
          // Validate redirect URI
          if (!clientValidation.redirectUris.includes(redirectUri)) {
            return errorResponse('Invalid redirect_uri', 400);
          }
          
          // Initial authorization request - redirect to OAuth provider
          const authUrl = new URL(config.authorization_endpoint);
          authUrl.searchParams.set('response_type', 'code');
          authUrl.searchParams.set('client_id', config.client_id);
          authUrl.searchParams.set('redirect_uri', url.origin + '/callback'); // Redirect to callback endpoint
          authUrl.searchParams.set('scope', config.scopes.join(' '));
          authUrl.searchParams.set('state', JSON.stringify({ 
            original_redirect_uri: redirectUri, 
            original_state: state,
            client_id: clientId 
          }));
          
          logRequest(request, { action: 'authorization_redirect', provider: providerKey, clientName: clientValidation.clientName }, env);
          
          return Response.redirect(authUrl.toString(), 302);
        } catch (error) {
          logError(error, { action: 'authorization_redirect', provider: providerKey }, env);
          return errorResponse('Failed to create authorization URL', 500);
        }
      }

      // Token Endpoint
      if (pathname === '/token' && request.method === 'POST') {
        if (!config) {
          return errorResponse('OIDC provider not found for this subdomain', 404);
        }
        
        try {
          const body = await request.text();
          const params = new URLSearchParams(body);
          const code = params.get('code');
          const redirectUri = params.get('redirect_uri');
          const grantType = params.get('grant_type');
          const clientId = params.get('client_id');
          const clientSecret = params.get('client_secret');
          
          // Validate required parameters
          if (!code) {
            return errorResponse('Missing required parameter: code', 400);
          }
          if (!redirectUri) {
            return errorResponse('Missing required parameter: redirect_uri', 400);
          }
          if (!clientId) {
            return errorResponse('Missing required parameter: client_id', 400);
          }
          if (!clientSecret) {
            return errorResponse('Missing required parameter: client_secret', 400);
          }
          if (grantType !== 'authorization_code') {
            return errorResponse('Invalid grant_type. Only authorization_code is supported', 400);
          }
          
          // Validate client credentials
          const masterSecret = env.MASTER_SECRET || 'default-master-secret-change-in-production';
          const clientValidation = await validateClientCredentials(clientId, clientSecret, masterSecret);
          
          if (!clientValidation.valid) {
            return errorResponse(`Invalid client credentials: ${clientValidation.error}`, 401);
          }
          
          // Validate redirect URI
          if (!clientValidation.redirectUris.includes(redirectUri)) {
            return errorResponse('Invalid redirect_uri', 400);
          }
          
          logRequest(request, { action: 'token_exchange', provider: providerKey }, env);
          
          // Check if this is a signed email code (from our consent screen)
          if (code.startsWith('e')) {
            // Validate the signed email code using the client secret
            const emailValidation = await validateSignedEmailCode(code, clientSecret);
            
            if (!emailValidation.valid) {
              return errorResponse(`Invalid email code: ${emailValidation.error}`, 401);
            }
            
            // Generate JWT ID token
        const idToken = await generateIdToken(emailValidation.email, clientId, clientSecret, url.origin);
            
            // Generate a token response with the email
            const tokenData = {
              access_token: code,
              token_type: 'Bearer',
              expires_in: 3600,
              id_token: idToken,
              scope: config.scopes.join(' '),
              email: emailValidation.email
            };
            
            logRequest(request, { action: 'email_code_token', provider: providerKey, email: emailValidation.email }, env);
            return jsonResponse(tokenData);
          }
          
          // Regular OAuth token exchange with provider
          const tokenRes = await fetch(config.token_endpoint, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: new URLSearchParams({
              grant_type: 'authorization_code',
              code,
              redirect_uri: url.origin + '/callback', // Use our callback URL
              client_id: config.client_id,
              client_secret: config.client_secret
            })
          });
          
          if (!tokenRes.ok) {
            const errorText = await tokenRes.text();
            logError(new Error(`Token exchange failed: ${tokenRes.status}`), { 
              provider: providerKey, 
              status: tokenRes.status,
              error: errorText 
            }, env);
            return errorResponse('Token exchange failed', tokenRes.status);
          }
          
          const tokenData = await tokenRes.json();
          return jsonResponse(tokenData);
        } catch (error) {
          logError(error, { action: 'token_exchange', provider: providerKey }, env);
          return errorResponse('Internal server error during token exchange', 500);
        }
      }

      // Consent Endpoint
      if (pathname === '/consent' && request.method === 'POST') {
        if (!config) {
          return errorResponse('OIDC provider not found for this subdomain', 404);
        }
        
        try {
          const formData = await request.formData();
          const action = formData.get('action');
          const clientId = formData.get('client_id');
          const state = formData.get('state');
          const redirectUri = formData.get('redirect_uri');
          
          if (!action || !clientId || !redirectUri) {
            return errorResponse('Missing required consent parameters', 400);
          }
          
          logRequest(request, { action: 'consent_decision', decision: action, clientId }, env);
          
          if (action === 'deny') {
            // Redirect back to client with error
            const errorUrl = new URL(redirectUri);
            errorUrl.searchParams.set('error', 'access_denied');
            errorUrl.searchParams.set('error_description', 'User denied consent');
            if (state) errorUrl.searchParams.set('state', state);
            
            return Response.redirect(errorUrl.toString(), 302);
          }
          
          if (action === 'allow') {
            // Parse the state to get original parameters
            let originalState;
            try {
              originalState = JSON.parse(state);
            } catch (e) {
              return errorResponse('Invalid state parameter', 400);
            }
            
            // Get user's email from OAuth provider
            const userEmail = await getUserEmailFromProvider(originalState.oauth_code, config, providerKey);
            
            if (!userEmail) {
              return errorResponse('Failed to retrieve user email from OAuth provider', 500);
            }
            
            // Generate client secret from app GUID and use it for email encryption
            const masterSecret = env.MASTER_SECRET || 'default-master-secret-change-in-production';
            
            // Extract app GUID from client ID
        const clientValidation = await validateClientCredentials(clientId, 'dummy', masterSecret);
            if (!clientValidation.valid) {
              return errorResponse('Invalid client ID', 400);
            }
            
            // Get GUID from client validation
            const appGuid = clientValidation.appGuid;
            const clientSecret = await generateClientSecret(appGuid, masterSecret);
            
            // Generate signed email code using client secret
            const signedEmailCode = await generateSignedEmailCode(userEmail, clientSecret);
            
            // Complete the OAuth flow by redirecting to client with signed email code
            const successUrl = new URL(originalState.original_redirect_uri);
            successUrl.searchParams.set('code', signedEmailCode);
            if (originalState.original_state) {
              successUrl.searchParams.set('state', originalState.original_state);
            }
            
            return Response.redirect(successUrl.toString(), 302);
          }
          
          return errorResponse('Invalid consent action', 400);
        } catch (error) {
          logError(error, { action: 'consent_handling' }, env);
          return errorResponse('Internal server error during consent handling', 500);
        }
  }

  return null; // No OIDC handler matched
}

// Handle SAML requests
async function handleSamlRequest(request, env, url, pathname, host) {
  const providerKey = getSamlProviderFromHost(host);
  const samlConfigs = getSamlConfigs(env);
  const config = providerKey ? samlConfigs[providerKey] : null;
  
  // Validate provider configuration
  if (providerKey && !config) {
    logError(new Error(`Unknown SAML provider: ${providerKey}`), { providerKey, host }, env);
    return errorResponse(`Unknown SAML provider: ${providerKey}`, 404);
  }

  // SAML Metadata endpoint
  if (pathname === '/saml/metadata' || pathname === '/metadata') {
    if (!config) {
      return errorResponse('SAML provider not found for this subdomain', 404);
    }
    
    const metadata = generateSamlMetadata(config, url.origin);
    
    return new Response(metadata, {
      headers: {
        'Content-Type': 'application/xml',
        ...CORS_HEADERS
      }
    });
  }

  // SAML SSO endpoint
  if (pathname === '/saml/sso') {
    if (!config) {
      return errorResponse('SAML provider not found for this subdomain', 404);
    }
    
    const samlRequest = url.searchParams.get('SAMLRequest');
    const relayState = url.searchParams.get('RelayState');
    
    if (!samlRequest) {
      return errorResponse('Missing SAMLRequest parameter', 400);
    }
    
    try {
      const requestData = parseSamlRequest(samlRequest);
      if (!requestData) {
        return errorResponse('Invalid SAML request', 400);
      }
      
      // Show consent screen for SAML authentication
      return await showSamlConsentScreen(url, requestData.entityId, requestData.acsUrl, relayState, providerKey, env);
    } catch (error) {
      logError(error, { action: 'saml_sso', provider: providerKey }, env);
      return errorResponse('Failed to process SAML request', 500);
    }
  }

  // SAML Consent endpoint
  if (pathname === '/saml/consent' && request.method === 'POST') {
    if (!config) {
      return errorResponse('SAML provider not found for this subdomain', 404);
    }
    
    try {
      const formData = await request.formData();
      const action = formData.get('action');
      const spEntityId = formData.get('sp_entity_id');
      const acsUrl = formData.get('acs_url');
      const relayState = formData.get('relay_state');
      
      if (!action || !spEntityId || !acsUrl) {
        return errorResponse('Missing required SAML consent parameters', 400);
      }
      
      logRequest(request, { action: 'saml_consent_decision', decision: action, spEntityId }, env);
      
      if (action === 'deny') {
        // Return SAML error response
        const errorResponse = `<?xml version="1.0" encoding="UTF-8"?>
<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" 
                xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                ID="${crypto.randomUUID()}"
                Version="2.0"
                IssueInstant="${new Date().toISOString()}"
                Destination="${acsUrl}">
  <saml:Issuer>${config.entityId}</saml:Issuer>
  <samlp:Status>
    <samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Responder"/>
    <samlp:StatusMessage>User denied authentication</samlp:StatusMessage>
  </samlp:Status>
</samlp:Response>`;
        
        return new Response(errorResponse, {
          headers: {
            'Content-Type': 'application/xml',
            ...CORS_HEADERS
          }
        });
      }
      
      if (action === 'allow') {
        // For demo purposes, use a placeholder email
        // In production, you'd get this from the OAuth provider
        const userEmail = 'user@example.com';
        
        const requestData = {
          entityId: spEntityId,
          acsUrl: acsUrl,
          inResponseTo: crypto.randomUUID() // In production, extract from original request
        };
        
        const samlResponse = await generateSamlResponse(config, userEmail, requestData, url.origin);
        const signedResponse = await signSamlResponse(samlResponse, config.privateKey);
        
        // Return SAML response as HTML form for POST binding
        const htmlResponse = `
<!DOCTYPE html>
<html>
<head>
    <title>SAML Response</title>
</head>
<body onload="document.forms[0].submit()">
    <form method="post" action="${acsUrl}">
        <input type="hidden" name="SAMLResponse" value="${btoa(signedResponse)}" />
        ${relayState ? `<input type="hidden" name="RelayState" value="${relayState}" />` : ''}
    </form>
</body>
</html>`;
        
        return new Response(htmlResponse, {
          headers: {
            'Content-Type': 'text/html',
            ...CORS_HEADERS
          }
        });
      }
      
      return errorResponse('Invalid SAML consent action', 400);
    } catch (error) {
      logError(error, { action: 'saml_consent_handling' }, env);
      return errorResponse('Internal server error during SAML consent handling', 500);
    }
  }

  // SAML SLO endpoint
  if (pathname === '/saml/slo') {
    if (!config) {
      return errorResponse('SAML provider not found for this subdomain', 404);
    }
    
    // For now, just return a simple logout response
    return new Response('SAML Single Logout not yet implemented', {
      status: 501,
      headers: CORS_HEADERS
    });
  }

  return null; // No SAML handler matched
}

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
      
      // Route to appropriate handler based on host and path
      if (isSamlRequest(host, pathname)) {
        const result = await handleSamlRequest(request, env, url, pathname, host);
        if (result) return result;
      } else if (isOidcRequest(host, pathname)) {
        const result = await handleOidcRequest(request, env, url, pathname, host);
        if (result) return result;
      }

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
