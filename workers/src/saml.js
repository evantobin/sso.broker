// SAML IDP functionality for the SSO broker
import { validateSignedEmailCode } from './crypto.js';

// SAML provider configurations
export function getSamlConfigs(env) {
  return {
    'apple-saml': {
      entityId: 'apple-saml.sso.broker',
      ssoUrl: 'https://apple-saml.sso.broker/saml/sso',
      sloUrl: 'https://apple-saml.sso.broker/saml/slo',
      x509cert: env.SAML_CERT || '',
      privateKey: env.SAML_PRIVATE_KEY || '',
      nameIdFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress'
    },
    'google-saml': {
      entityId: 'google-saml.sso.broker',
      ssoUrl: 'https://google-saml.sso.broker/saml/sso',
      sloUrl: 'https://google-saml.sso.broker/saml/slo',
      x509cert: env.SAML_CERT || '',
      privateKey: env.SAML_PRIVATE_KEY || '',
      nameIdFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress'
    },
    'github-saml': {
      entityId: 'github-saml.sso.broker',
      ssoUrl: 'https://github-saml.sso.broker/saml/sso',
      sloUrl: 'https://github-saml.sso.broker/saml/slo',
      x509cert: env.SAML_CERT || '',
      privateKey: env.SAML_PRIVATE_KEY || '',
      nameIdFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress'
    }
  };
}

// Get SAML provider from hostname
export function getSamlProviderFromHost(host) {
  const match = host.match(/^([^.]+)\.sso\.broker/);
  if (match && match[1].includes('-saml')) {
    return match[1];
  }
  return null;
}

// Generate SAML metadata
export function generateSamlMetadata(providerKey, config) {
  const metadata = `<?xml version="1.0" encoding="UTF-8"?>
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" entityID="${config.entityId}">
  <md:IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <md:KeyDescriptor use="signing">
      <ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
        <ds:X509Data>
          <ds:X509Certificate>${config.x509cert}</ds:X509Certificate>
        </ds:X509Data>
      </ds:KeyInfo>
    </md:KeyDescriptor>
    <md:SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${config.ssoUrl}"/>
    <md:SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="${config.sloUrl}"/>
    <md:NameIDFormat>${config.nameIdFormat}</md:NameIDFormat>
  </md:IDPSSODescriptor>
</md:EntityDescriptor>`;
  
  return metadata;
}

// Parse SAML request
export function parseSamlRequest(samlRequest) {
  try {
    const decoded = atob(samlRequest);
    const parser = new DOMParser();
    const doc = parser.parseFromString(decoded, 'text/xml');
    
    const authnRequest = doc.querySelector('AuthnRequest');
    if (!authnRequest) {
      throw new Error('Invalid SAML request');
    }
    
    return {
      id: authnRequest.getAttribute('ID'),
      issueInstant: authnRequest.getAttribute('IssueInstant'),
      destination: authnRequest.getAttribute('Destination'),
      assertionConsumerServiceURL: authnRequest.getAttribute('AssertionConsumerServiceURL'),
      issuer: authnRequest.querySelector('Issuer')?.textContent
    };
  } catch (error) {
    throw new Error('Failed to parse SAML request');
  }
}

// Generate SAML response
export function generateSamlResponse(request, userEmail, config) {
  const now = new Date();
  const notBefore = new Date(now.getTime() - 60000); // 1 minute before
  const notOnOrAfter = new Date(now.getTime() + 300000); // 5 minutes after
  
  const response = `<?xml version="1.0" encoding="UTF-8"?>
<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" 
                xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                ID="_${Math.random().toString(36).substr(2, 9)}"
                Version="2.0"
                IssueInstant="${now.toISOString()}"
                Destination="${request.assertionConsumerServiceURL}"
                InResponseTo="${request.id}">
  <saml:Issuer>${config.entityId}</saml:Issuer>
  <samlp:Status>
    <samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/>
  </samlp:Status>
  <saml:Assertion xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                  ID="_${Math.random().toString(36).substr(2, 9)}"
                  Version="2.0"
                  IssueInstant="${now.toISOString()}">
    <saml:Issuer>${config.entityId}</saml:Issuer>
    <saml:Subject>
      <saml:NameID Format="${config.nameIdFormat}">${userEmail}</saml:NameID>
      <saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
        <saml:SubjectConfirmationData NotOnOrAfter="${notOnOrAfter.toISOString()}"
                                      Recipient="${request.assertionConsumerServiceURL}"
                                      InResponseTo="${request.id}"/>
      </saml:SubjectConfirmation>
    </saml:Subject>
    <saml:Conditions NotBefore="${notBefore.toISOString()}"
                     NotOnOrAfter="${notOnOrAfter.toISOString()}">
      <saml:AudienceRestriction>
        <saml:Audience>${request.issuer}</saml:Audience>
      </saml:AudienceRestriction>
    </saml:Conditions>
    <saml:AuthnStatement AuthnInstant="${now.toISOString()}"
                         SessionIndex="_${Math.random().toString(36).substr(2, 9)}">
      <saml:AuthnContext>
        <saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport</saml:AuthnContextClassRef>
      </saml:AuthnContext>
    </saml:AuthnStatement>
    <saml:AttributeStatement>
      <saml:Attribute Name="email" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
        <saml:AttributeValue>${userEmail}</saml:AttributeValue>
      </saml:Attribute>
      <saml:Attribute Name="name" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
        <saml:AttributeValue>${userEmail.split('@')[0]}</saml:AttributeValue>
      </saml:Attribute>
    </saml:AttributeStatement>
  </saml:Assertion>
</samlp:Response>`;
  
  return response;
}

// Sign SAML response (simplified - in production use proper XML signature)
export function signSamlResponse(samlResponse, privateKey) {
  // In production, implement proper XML signature with the private key
  return samlResponse;
}

// Show SAML consent screen
export async function showSamlConsentScreen(url, spEntityId, acsUrl, relayState, providerKey, env) {
  // Import renderTemplate function
  const { renderTemplate } = await import('./utils.js');
  
  // Prepare template data
  const templateData = {
    title: 'SAML Authentication',
    heading: 'Authorize Service Provider',
    description: 'This service provider wants to access your account information.',
    appName: spEntityId,
    protocol: 'saml',
    providerKey: providerKey,
    spEntityId: spEntityId,
    acsUrl: acsUrl,
    allowUrl: `${url}?consent=allow&relayState=${relayState}`,
    denyUrl: `${url}?consent=deny&relayState=${relayState}`
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
