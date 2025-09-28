// SAML request handlers

import { validateSignedEmailCode, generateSignedEmailCode } from '../crypto.js';
import { getSamlConfigs, getSamlProviderFromHost, generateSamlMetadata, parseSamlRequest, generateSamlResponse, showSamlConsentScreen } from '../saml.js';
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
    
    let samlRequest, relayState, consent;
    
    // Handle both GET and POST requests
    if (request.method === 'POST') {
      try {
        const formData = await request.formData();
        samlRequest = formData.get('SAMLRequest');
        relayState = formData.get('RelayState');
        consent = formData.get('consent');
      } catch (e) {
        logError(new Error('Failed to parse form data from POST request'), { provider: providerKey, error: e.message }, env);
        return errorResponse('Failed to parse SAML request data', 400);
      }
    } else {
      // GET request - parameters in query string
      samlRequest = url.searchParams.get('SAMLRequest');
      relayState = url.searchParams.get('RelayState');
      consent = url.searchParams.get('consent');
    }
    
    // Log RelayState for debugging
    if (relayState) {
      console.log(`SAML SSO: RelayState received: ${relayState.substring(0, 100)}${relayState.length > 100 ? '...' : ''}`);
    } else {
      console.log('SAML SSO: No RelayState provided');
    }
    
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
                InResponseTo="${samlRequest ? 'original_request' : 'unknown'}">
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
          
          // Handle case where AssertionConsumerServiceURL is not provided (e.g., Microsoft)
          let acsUrl = requestData.assertionConsumerServiceURL;
          if (!acsUrl) {
            if (requestData.issuer === 'urn:federation:MicrosoftOnline') {
              // Extract Entra ID tenant from URL parameter
              const entraTenant = url.searchParams.get('entra');
              if (entraTenant) {
                acsUrl = `https://login.microsoftonline.com/${entraTenant}/saml2`;
                console.log(`SAML SSO: Using Entra ID tenant from URL parameter: ${entraTenant}`);
              } else {
                // Fallback to hardcoded tenant if no parameter provided
                acsUrl = 'https://login.microsoftonline.com/1f1db437-f143-46be-9006-3bb7127491fd/saml2';
                console.log('SAML SSO: No entra parameter found, using default tenant');
              }
            } else {
              if (requestData.issuer) {
                acsUrl = 'https://' + requestData.issuer.replace(/^urn:/, '').replace(/:/g, '.') + '/saml/acs';
              } else {
                acsUrl = 'https://saml.acs.fallback/saml/acs';
                console.warn('SAML Consent: No issuer found, using generic ACS URL fallback');
              }
            }
          }
          
          // Create a state token containing the SAML request data
          const samlStateData = {
            samlRequestId: requestData.id,
            assertionConsumerServiceURL: acsUrl,
            issuer: requestData.issuer,
            relayState: relayState,
            providerKey: providerKey,
            entraTenant: url.searchParams.get('entra') // Store the tenant ID for later use
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
          try {
            const oauthUrl = getOAuthUrl(oauthProvider, oauthConfig, `${url.origin}/saml/oauth-callback`, stateToken);
            
            return Response.redirect(oauthUrl, 302);
          } catch (error) {
            return errorResponse(`Failed to generate OAuth URL for ${oauthProvider}: ${error.message}`, 500);
          }
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
      
      // Check if destination matches the expected provider
      const expectedDestination = `https://${providerKey}.sso.broker/saml/sso`;
      if (requestData.destination !== expectedDestination) {
        console.warn(`SAML SSO: Destination mismatch for ${providerKey}. Expected: ${expectedDestination}, Got: ${requestData.destination}`);
      }
      
      // Handle case where AssertionConsumerServiceURL is not provided (e.g., Microsoft)
      let acsUrl = requestData.assertionConsumerServiceURL;
      if (!acsUrl) {
        // For Microsoft and other providers that don't include ACS URL in request,
        // we'll use a default or extract from issuer
        if (requestData.issuer === 'urn:federation:MicrosoftOnline') {
          // Microsoft typically uses this ACS URL pattern
          acsUrl = 'https://login.microsoftonline.com/common/saml2';
        } else {
          // Fallback to a generic ACS URL
          if (requestData.issuer) {
            acsUrl = 'https://' + requestData.issuer.replace(/^urn:/, '').replace(/:/g, '.') + '/saml/acs';
          } else {
            // If no issuer, use a generic fallback
            acsUrl = 'https://saml.acs.fallback/saml/acs';
            console.warn('SAML SSO: No issuer found, using generic ACS URL fallback');
          }
        }
        console.log(`SAML SSO: No ACS URL provided, using fallback: ${acsUrl}`);
      }
      
      return await showSamlConsentScreen(url, requestData.issuer, acsUrl, relayState, providerKey, env, samlRequest);
    } catch (error) {
      console.error(`SAML SSO: Error processing initial request for ${providerKey}:`, error);
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
      let code, state, error;
      
      // Handle different response modes
      if (request.method === 'POST') {
        // Apple uses form_post response mode - data is in POST body
        try {
          const formData = await request.formData();
          code = formData.get('code');
          state = formData.get('state');
          error = formData.get('error');
        } catch (e) {
          logError(new Error('Failed to parse form data from POST request'), { provider: providerKey, error: e.message }, env);
          return errorResponse('Failed to parse callback data', 400);
        }
      } else {
        // Other providers use query parameters
        code = url.searchParams.get('code');
        state = url.searchParams.get('state');
        error = url.searchParams.get('error');
      }
      
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
      
      // Log RelayState from state data for debugging
      if (samlStateData.relayState) {
        console.log(`SAML OAuth Callback: RelayState from state: ${samlStateData.relayState.substring(0, 100)}${samlStateData.relayState.length > 100 ? '...' : ''}`);
      } else {
        console.log('SAML OAuth Callback: No RelayState in state data');
      }

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
      
      // Update ACS URL with dynamic tenant if we have one
      if (samlStateData.entraTenant && samlStateData.issuer === 'urn:federation:MicrosoftOnline') {
        requestData.assertionConsumerServiceURL = `https://login.microsoftonline.com/${samlStateData.entraTenant}/saml2`;
        console.log(`SAML Response: Using dynamic tenant for ACS URL: ${samlStateData.entraTenant}`);
      }
      
      // Create original request data for Microsoft compatibility
      const originalRequest = {
        issuer: samlStateData.issuer
      };
      
      const samlResponse = await generateSamlResponse(requestData, userEmail, config, originalRequest);
      
      // Log final RelayState for debugging
      if (samlStateData.relayState) {
        console.log(`SAML Response: Including RelayState: ${samlStateData.relayState.substring(0, 100)}${samlStateData.relayState.length > 100 ? '...' : ''}`);
      } else {
        console.log('SAML Response: No RelayState to include');
      }
      
      // Return SAML response as HTML form for POST binding
      const htmlResponse = `
<!DOCTYPE html>
<html>
<head>
    <title>SAML Response</title>
</head>
<body onload="document.forms[0].submit()">
    <form method="post" action="${requestData.assertionConsumerServiceURL}">
        <input type="hidden" name="SAMLResponse" value="${samlResponse}" />
        ${samlStateData.relayState ? `<input type="hidden" name="RelayState" value="${samlStateData.relayState.replace(/"/g, '&quot;')}" />` : ''}
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
