// Apple OAuth provider implementation

import { createJWT } from '../crypto.js';

export async function getAppleUserEmail(code, config, redirectUri = null) {
  try {
    // Validate required Apple configuration
    if (!config.teamId || !config.clientSecret || !config.keyId) {
      throw new Error('Apple OAuth requires teamId, clientSecret (private key), and keyId to be configured');
    }
    
    // Apple requires a JWT-signed client secret
    const clientSecret = await createJWT({
      iss: config.teamId, // Apple Team ID
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour expiration
      aud: 'https://appleid.apple.com',
      sub: config.clientId
    }, config.clientSecret, 'ES256', config.keyId);
    
    // Exchange code for tokens
    const tokenResponse = await fetch('https://appleid.apple.com/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: config.clientId,
        client_secret: clientSecret,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri || config.redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      console.error('Apple OAuth: Token exchange failed:', errorText);
      throw new Error(`Apple token exchange failed: ${tokenResponse.status} - ${errorText}`);
    }

    const tokenData = await tokenResponse.json();
    
    if (tokenData.error) {
      throw new Error(`Apple OAuth error: ${tokenData.error_description || tokenData.error}`);
    }

    const idToken = tokenData.id_token;

    if (!idToken) {
      throw new Error('No ID token received from Apple');
    }

    // Decode the ID token to get user information
    // Apple provides email in the ID token payload during initial authorization
    try {
      const payload = JSON.parse(atob(idToken.split('.')[1]));
      
      if (!payload.email) {
        throw new Error('No email address available from Apple account (email only provided on first authorization)');
      }

      return payload.email;
    } catch (error) {
      console.error('Apple OAuth: Failed to decode ID token:', error);
      throw new Error(`Failed to decode Apple ID token: ${error.message}`);
    }
  } catch (error) {
    console.error('Apple OAuth: Error in getAppleUserEmail:', error);
    throw error;
  }
}

export function getAppleOAuthUrl(config, redirectUri, state) {
  const url = new URL('https://appleid.apple.com/auth/authorize');
  url.searchParams.set('client_id', config.clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('state', state);
  url.searchParams.set('scope', config.scope);
  url.searchParams.set('response_type', 'code');
  url.searchParams.set('response_mode', 'form_post');
  return url.toString();
}
