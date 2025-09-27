// Request routing logic for OIDC and SAML

// Determine if this is a SAML request based on host and path
export function isSamlRequest(host, pathname) {
  // Special case: test-saml.sso.broker is a mock SP, not an IdP
  if (host === 'test-saml.sso.broker') {
    return false;
  }
  
  // Check if host is a SAML subdomain (contains -saml)
  const isSamlSubdomain = host.includes('.sso.broker') && host.includes('-saml');
  // Check if path is SAML-related
  const isSamlPath = pathname.startsWith('/saml/') || pathname === '/saml' || pathname === '/metadata';
  return isSamlSubdomain || isSamlPath;
}

// Determine if this is an OIDC request based on host and path
export function isOidcRequest(host, pathname) {
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

// Route request to appropriate handler
export async function routeRequest(request, env, url, pathname, host) {
  // Special handling for test-saml.sso.broker (mock SP)
  if (host === 'test-saml.sso.broker') {
    const { handleTestSamlRequest } = await import('./handlers/test-saml.js');
    const result = await handleTestSamlRequest(request, env, url, pathname, host);
    if (result) return result;
  }
  
  // Route to appropriate handler based on host and path
  if (isSamlRequest(host, pathname)) {
    const { handleSamlRequest } = await import('./handlers/saml.js');
    const result = await handleSamlRequest(request, env, url, pathname, host);
    if (result) return result;
  } else if (isOidcRequest(host, pathname)) {
    const { handleOidcRequest } = await import('./handlers/oidc.js');
    const result = await handleOidcRequest(request, env, url, pathname, host);
    if (result) return result;
  }

  return null; // No handler matched
}
