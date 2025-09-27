// OIDC (OpenID Connect) functionality for the SSO broker
import { validateClientCredentials } from './crypto.js';

// Provider configurations
export function getProviderConfigs(env) {
  return {
    'apple': {
      clientId: env.APPLE_CLIENT_ID || '',
      clientSecret: env.APPLE_CLIENT_SECRET || '',
      redirectUri: env.APPLE_REDIRECT_URI || 'https://apple.sso.broker/callback',
      scope: 'name email',
      responseType: 'code'
    },
    'google': {
      clientId: env.GOOGLE_CLIENT_ID || '',
      clientSecret: env.GOOGLE_CLIENT_SECRET || '',
      redirectUri: env.GOOGLE_REDIRECT_URI || 'https://google.sso.broker/callback',
      scope: 'openid email profile',
      responseType: 'code'
    },
    'github': {
      clientId: env.GITHUB_CLIENT_ID || '',
      clientSecret: env.GITHUB_CLIENT_SECRET || '',
      redirectUri: env.GITHUB_REDIRECT_URI || 'https://github.sso.broker/callback',
      scope: 'user:email',
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

// Get user email from provider
export async function getUserEmailFromProvider(provider, code, env) {
  const configs = getProviderConfigs(env);
  const config = configs[provider];
  
  if (!config) {
    throw new Error(`Unknown provider: ${provider}`);
  }

  try {
    // Exchange code for access token
    const tokenResponse = await fetch(`https://oauth2.googleapis.com/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: config.redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error(`Token exchange failed: ${tokenResponse.status}`);
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get user info
    const userResponse = await fetch(`https://www.googleapis.com/oauth2/v2/userinfo`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      throw new Error(`User info fetch failed: ${userResponse.status}`);
    }

    const userData = await userResponse.json();
    return userData.email;
  } catch (error) {
    console.error('Error getting user email:', error);
    return null;
  }
}

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
    protocol: 'oidc',
    providerKey: providerKey,
    redirectUri: redirectUri,
    allowUrl: `${url}?consent=allow&state=${state}`,
    denyUrl: `${url}?consent=deny&state=${state}`
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
