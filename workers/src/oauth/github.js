// GitHub OAuth provider implementation

export async function getGitHubUserEmail(code, config) {
  // Exchange code for access token
  const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code: code,
    }),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    throw new Error(`GitHub token exchange failed: ${tokenResponse.status} - ${errorText}`);
  }

  const tokenData = await tokenResponse.json();
  
  if (tokenData.error) {
    throw new Error(`GitHub OAuth error: ${tokenData.error_description || tokenData.error}`);
  }

  const accessToken = tokenData.access_token;

  if (!accessToken) {
    throw new Error('No access token received from GitHub');
  }

  // Get user info
  const userResponse = await fetch('https://api.github.com/user', {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'sso-broker/1.0',
    },
  });

  if (!userResponse.ok) {
    const errorText = await userResponse.text();
    throw new Error(`GitHub user info fetch failed: ${userResponse.status} - ${errorText}`);
  }

  const userData = await userResponse.json();
  
  // GitHub users can have private emails, so we need to check if email is available
  if (!userData.email) {
    // Try to get emails from the emails endpoint
    const emailsResponse = await fetch('https://api.github.com/user/emails', {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'sso-broker/1.0',
      },
    });

    if (emailsResponse.ok) {
      const emailsData = await emailsResponse.json();
      const primaryEmail = emailsData.find(email => email.primary);
      if (primaryEmail) {
        return primaryEmail.email;
      }
      // If no primary email, use the first verified email
      const verifiedEmail = emailsData.find(email => email.verified);
      if (verifiedEmail) {
        return verifiedEmail.email;
      }
    }
    
    throw new Error('No email address available from GitHub account');
  }

  return userData.email;
}

export function getGitHubOAuthUrl(config, redirectUri, state) {
  const url = new URL('https://github.com/login/oauth/authorize');
  url.searchParams.set('client_id', config.clientId);
  url.searchParams.set('redirect_uri', redirectUri);
  url.searchParams.set('state', state);
  url.searchParams.set('scope', config.scope);
  return url.toString();
}
