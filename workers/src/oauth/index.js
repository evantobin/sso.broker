// OAuth provider router and utilities

import { getGitHubUserEmail, getGitHubOAuthUrl } from './github.js';
import { getGoogleUserEmail, getGoogleOAuthUrl } from './google.js';
import { getAppleUserEmail, getAppleOAuthUrl } from './apple.js';

// Provider-specific OAuth token exchange functions
export async function getUserEmailFromOAuthProvider(provider, code, config) {
  try {
    switch (provider) {
      case 'github':
        return await getGitHubUserEmail(code, config);
      case 'google':
        return await getGoogleUserEmail(code, config);
      case 'apple':
        return await getAppleUserEmail(code, config);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  } catch (error) {
    console.error(`Error getting user email from ${provider}:`, error);
    throw error;
  }
}

// Provider-specific OAuth URL generation
export function getOAuthUrl(provider, config, redirectUri, state) {
  switch (provider) {
    case 'github':
      return getGitHubOAuthUrl(config, redirectUri, state);
    case 'google':
      return getGoogleOAuthUrl(config, redirectUri, state);
    case 'apple':
      return getAppleOAuthUrl(config, redirectUri, state);
    default:
      throw new Error(`Unsupported provider: ${provider}`);
  }
}
