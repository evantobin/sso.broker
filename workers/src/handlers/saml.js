// SAML request handlers

import { validateSignedEmailCode, generateSignedEmailCode } from '../crypto.js';
import { getSamlConfigs, getSamlProviderFromHost, generateSamlMetadata, parseSamlRequest, generateSamlResponse, signSamlResponse, showSamlConsentScreen } from '../saml.js';
import { getUserEmailFromOAuthProvider, getOAuthUrl } from '../oauth/index.js';
import { getProviderConfigs } from '../oidc.js';
import { jsonResponse, errorResponse, logRequest, logError } from '../utils.js';

// Handle SAML requests
export async function handleSamlRequest(request, env, url, pathname, host) {
  const providerKey = getSamlProviderFromHost(host);
  const samlConfigs = getSamlConfigs(env);
  const config = providerKey ? samlConfigs[providerKey] : null;
  
  // Validate provider configuration
  if (providerKey && !config) {
    logError(new Error(`Unknown SAML provider: ${providerKey}`), { providerKey, host }, env);
    return errorResponse(`Unknown SAML provider: ${providerKey}`, 404);
  }

  // SAML Metadata endpoint
  if (pathname === '/metadata') {
    if (!config) {
      return errorResponse('SAML provider not found for this subdomain', 404);
    }
    
    const metadata = generateSamlMetadata(providerKey, config);
    return new Response(metadata, {
      headers: {
        'Content-Type': 'application/xml',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400'
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
    const consent = url.searchParams.get('consent');
    
    
    // Handle consent responses
    if (consent) {
      try {
        if (consent === 'deny') {
          // Return SAML error response
          const errorResponse = `<?xml version="1.0" encoding="UTF-8"?>
<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" 
                xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                ID="_error_${Math.random().toString(36).substr(2, 9)}"
                Version="2.0"
                IssueInstant="${new Date().toISOString()}"
                InResponseTo="${url.searchParams.get('SAMLRequest') ? 'original_request' : 'unknown'}">
  <saml:Issuer>${config.entityId}</saml:Issuer>
  <samlp:Status>
    <samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Responder"/>
    <samlp:StatusMessage>User denied access</samlp:StatusMessage>
  </samlp:Status>
</samlp:Response>`;
          
          return new Response(errorResponse, {
            headers: {
              'Content-Type': 'application/xml',
              'Access-Control-Allow-Origin': '*',
              'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
              'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
              'Access-Control-Max-Age': '86400'
            }
          });
        }
        
        if (consent === 'allow') {
          // We need to parse the SAML request to get the proper data
          const samlRequest = url.searchParams.get('SAMLRequest');
          if (!samlRequest) {
            return errorResponse('Missing SAMLRequest parameter', 400);
          }
          
          let requestData;
          try {
            requestData = parseSamlRequest(samlRequest);
          } catch (error) {
            logError(error, { action: 'saml_consent_parsing', provider: providerKey }, env);
            return errorResponse('Failed to parse SAML request', 400);
          }
          
          // Create a state token containing the SAML request data
          const samlStateData = {
            samlRequestId: requestData.id,
            assertionConsumerServiceURL: requestData.assertionConsumerServiceURL,
            issuer: requestData.issuer,
            relayState: relayState,
            providerKey: providerKey
          };
          
          const stateToken = await generateSignedEmailCode(JSON.stringify(samlStateData), env.MASTER_SECRET);
          
          // Extract the OAuth provider from the SAML provider key (e.g., 'github-saml' -> 'github')
          const oauthProvider = providerKey.replace('-saml', '');
          
          // Get the OAuth provider configuration to use the correct client ID
          const providerConfigs = getProviderConfigs(env);
          const oauthConfig = providerConfigs[oauthProvider];
          
          if (!oauthConfig || !oauthConfig.clientId) {
            return errorResponse(`OAuth provider ${oauthProvider} not configured`, 500);
          }
          
          // Redirect to actual OAuth provider (not our own domain)
          // For SAML flows, use the current domain with /saml/oauth-callback
          const oauthUrl = getOAuthUrl(oauthProvider, oauthConfig, `${url.origin}/saml/oauth-callback`, stateToken);
          
          return Response.redirect(oauthUrl, 302);
        }
        
        return errorResponse('Invalid consent value', 400);
      } catch (error) {
        logError(error, { action: 'saml_consent_handling' }, env);
        return errorResponse('Internal server error during SAML consent handling', 500);
      }
    }
    
    // Initial SAML request - show consent screen
    if (!samlRequest) {
      return errorResponse('Missing SAMLRequest parameter', 400);
    }
    
    try {
      const requestData = parseSamlRequest(samlRequest);
      return await showSamlConsentScreen(url, requestData.issuer, requestData.assertionConsumerServiceURL, relayState, providerKey, env);
    } catch (error) {
      logError(error, { action: 'saml_sso', provider: providerKey }, env);
      return errorResponse('Failed to process SAML request', 500);
    }
  }

  // SAML OAuth callback endpoint
  if (pathname === '/saml/oauth-callback') {
    if (!config) {
      return errorResponse('SAML provider not found for this subdomain', 404);
    }
    
    try {
      const code = url.searchParams.get('code');
      const state = url.searchParams.get('state');
      const error = url.searchParams.get('error');
      
      if (error) {
        return errorResponse(`OAuth error: ${error}`, 400);
      }
      
      if (!code || !state) {
        return errorResponse('Missing code or state parameter', 400);
      }
      
      // Validate and decode the state token
      const stateValidation = await validateSignedEmailCode(state, env.MASTER_SECRET);
      
      if (!stateValidation.valid) {
        return errorResponse('Invalid state token', 400);
      }
      
      const samlStateData = JSON.parse(stateValidation.email);

      // Get user email from OAuth provider
      const oauthProvider = providerKey.replace('-saml', '');
      const providerConfigs = getProviderConfigs(env);
      const oauthConfig = providerConfigs[oauthProvider];
      
      if (!oauthConfig) {
        return errorResponse(`OAuth provider ${oauthProvider} not configured`, 500);
      }
      
      const userEmail = await getUserEmailFromOAuthProvider(oauthProvider, code, oauthConfig, `${url.origin}/saml/oauth-callback`);
      
      if (!userEmail) {
        return errorResponse('Failed to get user email from provider', 400);
      }
      
      // Generate SAML response with real user email
      const requestData = {
        id: samlStateData.samlRequestId,
        assertionConsumerServiceURL: samlStateData.assertionConsumerServiceURL,
        issuer: samlStateData.issuer
      };
      
      const samlResponse = await generateSamlResponse(requestData, userEmail, config);
      console.log('Generated SAML response length:', samlResponse.length);
      console.log('Config private key present:', !!config.privateKey);
      console.log('Config certificate present:', !!config.x509cert);
      
      const signedResponse = await signSamlResponse(samlResponse, config.privateKey, config.x509cert);
      console.log('Signed response length:', signedResponse.length);
      console.log('Signature in signed response:', signedResponse.includes('<ds:Signature'));
      
      // Return SAML response as HTML form for POST binding
      const htmlResponse = `
<!DOCTYPE html>
<html>
<head>
    <title>SAML Response</title>
</head>
<body onload="document.forms[0].submit()">
    <form method="post" action="${requestData.assertionConsumerServiceURL}">
        <input type="hidden" name="SAMLResponse" value="${btoa(signedResponse)}" />
        ${samlStateData.relayState ? `<input type="hidden" name="RelayState" value="${samlStateData.relayState}" />` : ''}
    </form>
</body>
</html>`;
      
      return new Response(htmlResponse, {
        headers: {
          'Content-Type': 'text/html',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
          'Access-Control-Max-Age': '86400'
        }
      });
    } catch (error) {
      logError(error, { action: 'saml_oauth_callback', provider: providerKey }, env);
      return errorResponse('Failed to process SAML OAuth callback', 500);
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
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400'
      }
    });
  }


  return null; // No SAML handler matched
}
