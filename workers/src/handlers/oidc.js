// OIDC request handlers

import { generateClientId, generateClientSecret, validateClientCredentials } from '../crypto.js';
import { getProviderConfigs, getProviderFromHost, showConsentScreen, generateIdToken } from '../oidc.js';
import { getUserEmailFromOAuthProvider, getOAuthUrl } from '../oauth/index.js';
import { jsonResponse, errorResponse, logRequest, logError } from '../utils.js';

// Handle OIDC requests
export async function handleOidcRequest(request, env, url, pathname, host) {
  const providerKey = getProviderFromHost(host);
  const providerConfigs = getProviderConfigs(env);
  const config = providerKey ? providerConfigs[providerKey] : null;
  
  // Validate provider configuration
  if (providerKey && !config) {
    logError(new Error(`Unknown provider: ${providerKey}`), { providerKey, host }, env);
    return errorResponse(`Unknown OIDC provider: ${providerKey}`, 404);
  }
  
  // Validate required environment variables for configured providers
  if (config && (!config.clientId || !config.clientSecret)) {
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
      authUrl.searchParams.set('client_id', config.clientId);
      authUrl.searchParams.set('redirect_uri', url.origin + '/callback');
      authUrl.searchParams.set('state', JSON.stringify({
        client_id: clientId,
        original_redirect_uri: redirectUri,
        original_state: state
      }));
      authUrl.searchParams.set('scope', config.scope);
      
      return Response.redirect(authUrl.toString(), 302);
    } catch (error) {
      logError(error, { action: 'authorization', provider: providerKey }, env);
      return errorResponse('Authorization failed', 500);
    }
  }

  // Consent Endpoint
  if (pathname === '/consent') {
    if (!config) {
      return errorResponse('OIDC provider not found for this subdomain', 404);
    }
    
    const consent = url.searchParams.get('consent');
    const state = url.searchParams.get('state');
    
    if (!consent || !state) {
      return errorResponse('Missing consent or state parameter', 400);
    }
    
    try {
      // Parse the state to get original parameters
      let originalParams;
      try {
        originalParams = JSON.parse(state);
      } catch (e) {
        return errorResponse('Invalid state parameter', 400);
      }
      
      if (consent === 'deny') {
        // Redirect back to client with error
        const errorUrl = new URL(originalParams.original_redirect_uri);
        errorUrl.searchParams.set('error', 'access_denied');
        errorUrl.searchParams.set('error_description', 'User denied the request');
        if (originalParams.original_state) {
          errorUrl.searchParams.set('state', originalParams.original_state);
        }
        return Response.redirect(errorUrl.toString(), 302);
      }
      
      if (consent === 'allow') {
        // Get user email from OAuth provider
        const userEmail = await getUserEmailFromOAuthProvider(providerKey, originalParams.oauth_code, config);
        
        if (!userEmail) {
          return errorResponse('Failed to get user email from provider', 400);
        }
        
        // Generate authorization code
        const authCode = crypto.randomUUID();
        
        // Store the authorization code (in production, use a proper storage solution)
        // For now, we'll encode the user email in the code
        const codeData = {
          userEmail: userEmail,
          clientId: originalParams.client_id,
          timestamp: Date.now()
        };
        const encodedCode = btoa(JSON.stringify(codeData));
        
        // Redirect back to client with authorization code
        const successUrl = new URL(originalParams.original_redirect_uri);
        successUrl.searchParams.set('code', encodedCode);
        if (originalParams.original_state) {
          successUrl.searchParams.set('state', originalParams.original_state);
        }
        return Response.redirect(successUrl.toString(), 302);
      }
      
      return errorResponse('Invalid consent value', 400);
    } catch (error) {
      logError(error, { action: 'consent_handling', provider: providerKey }, env);
      return errorResponse('Consent handling failed', 500);
    }
  }

  // Token Endpoint
  if (pathname === '/token' && request.method === 'POST') {
    if (!config) {
      return errorResponse('OIDC provider not found for this subdomain', 404);
    }
    
    try {
      const body = await request.formData();
      const grantType = body.get('grant_type');
      const code = body.get('code');
      const clientId = body.get('client_id');
      const clientSecret = body.get('client_secret');
      
      if (grantType !== 'authorization_code') {
        return errorResponse('Unsupported grant type', 400);
      }
      
      if (!code || !clientId || !clientSecret) {
        return errorResponse('Missing required parameters', 400);
      }
      
      // Validate client credentials
      const masterSecret = env.MASTER_SECRET || 'default-master-secret-change-in-production';
      const clientValidation = await validateClientCredentials(clientId, clientSecret, masterSecret);
      
      if (!clientValidation.valid) {
        return errorResponse(`Invalid client credentials: ${clientValidation.error}`, 401);
      }
      
      // Decode the authorization code
      let codeData;
      try {
        codeData = JSON.parse(atob(code));
      } catch (e) {
        return errorResponse('Invalid authorization code', 400);
      }
      
      // Check if code is expired (5 minutes)
      if (Date.now() - codeData.timestamp > 300000) {
        return errorResponse('Authorization code expired', 400);
      }
      
      // Generate ID token
      const idToken = generateIdToken(codeData.userEmail, clientId, url.origin, env);
      
      return jsonResponse({
        access_token: 'dummy_access_token',
        token_type: 'Bearer',
        expires_in: 3600,
        id_token: idToken
      });
    } catch (error) {
      logError(error, { action: 'token_exchange', provider: providerKey }, env);
      return errorResponse('Token exchange failed', 500);
    }
  }

  return null; // No OIDC handler matched
}
