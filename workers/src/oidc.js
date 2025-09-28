// OIDC (OpenID Connect) functionality for the SSO broker
import { validateClientCredentials } from './crypto.js';

// Provider configurations
export function getProviderConfigs(env) {
  return {
    'apple': {
      clientId: env.APPLE_CLIENT_ID || '',
      clientSecret: env.APPLE_CLIENT_SECRET || '', // This contains the private key
      redirectUri: env.APPLE_REDIRECT_URI || 'https://apple.sso.broker/callback',
      authorization_endpoint: 'https://appleid.apple.com/auth/authorize',
      scope: 'name email',
      scopes: ['name', 'email'],
      responseType: 'code',
      teamId: env.APPLE_TEAM_ID || '',
      keyId: env.APPLE_KEY_ID || ''
    },
    'google': {
      clientId: env.GOOGLE_CLIENT_ID || '',
      clientSecret: env.GOOGLE_CLIENT_SECRET || '',
      redirectUri: env.GOOGLE_REDIRECT_URI || 'https://google.sso.broker/callback',
      authorization_endpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
      scope: 'openid email profile',
      scopes: ['openid', 'email', 'profile'],
      responseType: 'code'
    },
    'github': {
      clientId: env.GITHUB_CLIENT_ID || '',
      clientSecret: env.GITHUB_CLIENT_SECRET || '',
      redirectUri: env.GITHUB_REDIRECT_URI || 'https://github.sso.broker/callback',
      authorization_endpoint: 'https://github.com/login/oauth/authorize',
      scope: 'user:email',
      scopes: ['user:email'],
      responseType: 'code'
    }
  };
}

// Get provider from hostname
export function getProviderFromHost(host) {
  const match = host.match(/^([^.]+)\.sso\.broker/);
  if (match) {
    return match[1];
  }
  return null;
}

// Note: getUserEmailFromProvider is now handled by the modular OAuth system
// This function is kept for backward compatibility but should be removed
// Use getUserEmailFromOAuthProvider from ./oauth/index.js instead

// Show consent screen
export async function showConsentScreen(url, clientId, state, redirectUri, providerKey, env) {
  // Extract client name from the signed client ID
  let clientName = 'Unknown App';
  try {
    const masterSecret = env.MASTER_SECRET || 'default-master-secret-change-in-production';
    const clientValidation = await validateClientCredentials(clientId, 'dummy', masterSecret);
    if (clientValidation.valid) {
      clientName = clientValidation.clientName;
    } else {
      // Try to extract name without signature verification for debugging
      try {
        const clientIdWithoutPrefix = clientId.startsWith('c') ? clientId.substring(1) : clientId;
        let clientIdBase64 = clientIdWithoutPrefix.replace(/[-_]/g, (match) => {
          switch (match) {
            case '-': return '+';
            case '_': return '/';
            default: return match;
          }
        });
        while (clientIdBase64.length % 4) {
          clientIdBase64 += '=';
        }
        const clientIdData = JSON.parse(atob(clientIdBase64));
        const payload = JSON.parse(atob(clientIdData.p)); // Use 'p' for payload
        clientName = payload.n || 'Unknown App'; // Use 'n' for name
      } catch (decodeError) {
      }
    }
  } catch (error) {
    // If we can't extract the name, fall back to showing the client ID
    clientName = clientId;
  }

  // Import renderTemplate function
  const { renderTemplate } = await import('./utils.js');
  
  // Prepare template data
  const templateData = {
    title: 'Authorization',
    heading: 'Authorize Application',
    description: 'This application wants to access your account information.',
    appName: clientName,
    oidc: true,
    providerKey: providerKey,
    redirectUri: redirectUri,
    allowUrl: `${url.origin}/consent?consent=allow&state=${encodeURIComponent(state)}`,
    denyUrl: `${url.origin}/consent?consent=deny&state=${encodeURIComponent(state)}`
  };

  // Render the template
  const html = await renderTemplate('consent.html', templateData);

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

// Generate JWT ID token
export function generateIdToken(userEmail, clientId, issuer, env) {
  const header = {
    alg: 'HS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const payload = {
    iss: issuer,
    sub: userEmail,
    aud: clientId,
    exp: now + 3600, // 1 hour
    iat: now,
    email: userEmail,
    email_verified: true
  };

  const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  const signature = btoa(encodedHeader + '.' + encodedPayload).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}
