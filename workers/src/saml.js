// SAML IDP functionality for the SSO broker
import { validateSignedEmailCode } from './crypto.js';
import * as samlify from 'samlify';

// SAML provider configurations
export function getSamlConfigs(env) {
  return {
    'apple-saml': {
      entityId: 'urn:apple-saml.sso.broker',
      ssoUrl: 'https://apple-saml.sso.broker/saml/sso',
      sloUrl: 'https://apple-saml.sso.broker/saml/slo',
      x509cert: env.SAML_CERT || '',
      privateKey: env.SAML_PRIVATE_KEY || '',
      nameIdFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress'
    },
    'google-saml': {
      entityId: 'urn:google-saml.sso.broker',
      ssoUrl: 'https://google-saml.sso.broker/saml/sso',
      sloUrl: 'https://google-saml.sso.broker/saml/slo',
      x509cert: env.SAML_CERT || '',
      privateKey: env.SAML_PRIVATE_KEY || '',
      nameIdFormat: 'urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress'
    },
    'github-saml': {
      entityId: 'urn:github-saml.sso.broker',
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

// Parse SAML request using simple string parsing
export function parseSamlRequest(samlRequest) {
  try {
    
    // Clean the base64 string by removing only whitespace characters
    // The original string is already properly padded, we just need to remove spaces
    let cleanRequest = decodeURIComponent(samlRequest);
    
    // Decode the base64 SAML request
    const decoded = atob(cleanRequest);
    
    // Simple XML parsing using string methods
    const extractAttribute = (xml, attrName) => {
      const regex = new RegExp(`${attrName}="([^"]*)"`);
      const match = xml.match(regex);
      return match ? match[1] : null;
    };
    
    const extractElement = (xml, tagName) => {
      const regex = new RegExp(`<${tagName}[^>]*>([^<]*)</${tagName}>`);
      const match = xml.match(regex);
      return match ? match[1] : null;
    };
    
    // Extract AuthnRequest attributes
    const id = extractAttribute(decoded, 'ID');
    const issueInstant = extractAttribute(decoded, 'IssueInstant');
    const destination = extractAttribute(decoded, 'Destination');
    const assertionConsumerServiceURL = extractAttribute(decoded, 'AssertionConsumerServiceURL');
    
    // Extract Issuer element (try both with and without saml: prefix)
    let issuer = extractElement(decoded, 'saml:Issuer');
    if (!issuer) {
      issuer = extractElement(decoded, 'Issuer');
    }
    
    if (!id) {
      throw new Error('Invalid SAML request - missing ID attribute');
    }
    
    // Log parsed values for debugging
    console.log('SAML Request parsed:', {
      id,
      issueInstant,
      destination,
      assertionConsumerServiceURL,
      issuer
    });
    
    return {
      id,
      issueInstant,
      destination,
      assertionConsumerServiceURL,
      issuer
    };
  } catch (error) {
    console.error('SAML parsing error:', {
      originalRequest: samlRequest,
      error: error.message,
      stack: error.stack
    });
    throw new Error('Failed to parse SAML request: ' + error.message);
  }
}

// Generate SAML response using SAMLify
export async function generateSamlResponse(request, userEmail, config, originalRequest = null) {
  try {
    // Create Service Provider configuration (this represents the SP we're responding to)
    const spConfig = {
      entityID: originalRequest && originalRequest.issuer ? originalRequest.issuer : config.entityId,
      authnRequestsSigned: false,
      wantAssertionsSigned: false,
      wantMessageSigned: false,
      wantLogoutResponseSigned: false,
      wantLogoutRequestSigned: false,
      wantAssertionsEncrypted: false,
      wantNameIdEncrypted: false,
      isAssertionEncrypted: false,
      assertionConsumerService: [{
        Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
        Location: request.assertionConsumerServiceURL
      }]
    };

    // Create Identity Provider configuration (this represents us)
    const idpConfig = {
      entityID: config.entityId,
      privateKey: config.privateKey,
      privateKeyPass: '', // No password for private key
      isAssertionEncrypted: false,
      encPrivateKey: config.privateKey,
      x509cert: config.x509cert,
      signingCert: config.x509cert,
      encryptCert: config.x509cert,
      nameIDFormat: originalRequest && originalRequest.issuer === 'urn:federation:MicrosoftOnline' 
        ? 'urn:oasis:names:tc:SAML:2.0:nameid-format:persistent'
        : config.nameIdFormat,
      // Add required SSO service configuration
      singleSignOnService: [{
        Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
        Location: config.ssoUrl
      }],
      singleLogoutService: [{
        Binding: 'urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST',
        Location: config.sloUrl
      }],
      // Configure attributes that this IDP can provide
      attributes: originalRequest && originalRequest.issuer === 'urn:federation:MicrosoftOnline' 
        ? [
            { name: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress', nameFormat: 'urn:oasis:names:tc:SAML:2.0:attrname-format:uri' },
            { name: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name', nameFormat: 'urn:oasis:names:tc:SAML:2.0:attrname-format:uri' },
            { name: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier', nameFormat: 'urn:oasis:names:tc:SAML:2.0:attrname-format:uri' }
          ]
        : [
            { name: 'email', nameFormat: 'urn:oasis:names:tc:SAML:2.0:attrname-format:basic' },
            { name: 'name', nameFormat: 'urn:oasis:names:tc:SAML:2.0:attrname-format:basic' }
          ]
    };

    // Create Service Provider instance (the SP we're responding to)
    const sp = samlify.ServiceProvider(spConfig);
    
    // Create Identity Provider instance (us)
    const idp = samlify.IdentityProvider(idpConfig);

    // Prepare user attributes in the format SAMLify expects
    let attributes = {};
    if (originalRequest && originalRequest.issuer === 'urn:federation:MicrosoftOnline') {
      // Microsoft-specific attributes
      attributes = {
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress': [userEmail],
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name': [userEmail.split('@')[0]],
        'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier': [userEmail]
      };
    } else {
      // Generic attributes
      attributes = {
        email: [userEmail],
        name: [userEmail.split('@')[0]]
      };
    }

    // Create template callback for custom attributes (required for SAMLify to include attributes)
    const createTemplateCallback = (idp, sp, email) => template => {
      const assertionConsumerServiceUrl = request.assertionConsumerServiceURL;
      const nameIDFormat = idp.entitySetting.nameIDFormat;
      const selectedNameIDFormat = Array.isArray(nameIDFormat) ? nameIDFormat[0] : nameIDFormat;

      const id = generateResponseId();
      const now = new Date();
      const fiveMinutesLater = new Date(now.getTime() + 5 * 60 * 1000);

      const tagValues = {
        ID: id,
        AssertionID: generateResponseId(),
        Destination: assertionConsumerServiceUrl,
        Audience: sp.entityMeta.getEntityID(),
        EntityID: sp.entityMeta.getEntityID(),
        SubjectRecipient: assertionConsumerServiceUrl,
        Issuer: idp.entityMeta.getEntityID(),
        IssueInstant: now.toISOString(),
        AssertionConsumerServiceURL: assertionConsumerServiceUrl,
        StatusCode: 'urn:oasis:names:tc:SAML:2.0:status:Success',
        ConditionsNotBefore: now.toISOString(),
        ConditionsNotOnOrAfter: fiveMinutesLater.toISOString(),
        SubjectConfirmationDataNotOnOrAfter: fiveMinutesLater.toISOString(),
        NameIDFormat: selectedNameIDFormat,
        NameID: email,
        InResponseTo: request.id,
        AuthnStatement: '',
        // Custom attributes
        email: email,
        name: email.split('@')[0],
        nameidentifier: email,
        upn: email
      };

      return {
        id,
        context: samlify.SamlLib.replaceTagsByValue(template, tagValues)
      };
    };

    // Create login response template with attributes
    const loginResponseTemplate = {
      context: '<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="{ID}" Version="2.0" IssueInstant="{IssueInstant}" Destination="{Destination}" InResponseTo="{InResponseTo}"><saml:Issuer>{Issuer}</saml:Issuer><samlp:Status><samlp:StatusCode Value="{StatusCode}"/></samlp:Status><saml:Assertion ID="{AssertionID}" Version="2.0" IssueInstant="{IssueInstant}" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"><saml:Issuer>{Issuer}</saml:Issuer><saml:Subject><saml:NameID Format="{NameIDFormat}">{NameID}</saml:NameID><saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer"><saml:SubjectConfirmationData NotOnOrAfter="{SubjectConfirmationDataNotOnOrAfter}" Recipient="{SubjectRecipient}" InResponseTo="{InResponseTo}"/></saml:SubjectConfirmation></saml:Subject><saml:Conditions NotBefore="{ConditionsNotBefore}" NotOnOrAfter="{ConditionsNotOnOrAfter}"><saml:AudienceRestriction><saml:Audience>{Audience}</saml:Audience></saml:AudienceRestriction></saml:Conditions><saml:AuthnStatement AuthnInstant="{IssueInstant}" SessionIndex="{ID}"><saml:AuthnContext><saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport</saml:AuthnContextClassRef></saml:AuthnContext></saml:AuthnStatement><saml:AttributeStatement><saml:Attribute Name="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:uri"><saml:AttributeValue xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xs:string">{email}</saml:AttributeValue></saml:Attribute><saml:Attribute Name="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:uri"><saml:AttributeValue xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xs:string">{name}</saml:AttributeValue></saml:Attribute><saml:Attribute Name="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:uri"><saml:AttributeValue xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xs:string">{nameidentifier}</saml:AttributeValue></saml:Attribute><saml:Attribute Name="http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:uri"><saml:AttributeValue xmlns:xs="http://www.w3.org/2001/XMLSchema" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xsi:type="xs:string">{upn}</saml:AttributeValue></saml:Attribute></saml:AttributeStatement></saml:Assertion></samlp:Response>',
      attributes: originalRequest && originalRequest.issuer === 'urn:federation:MicrosoftOnline' 
        ? [
            { name: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress', valueTag: 'email', nameFormat: 'urn:oasis:names:tc:SAML:2.0:attrname-format:uri', valueXsiType: 'xs:string' },
            { name: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name', valueTag: 'name', nameFormat: 'urn:oasis:names:tc:SAML:2.0:attrname-format:uri', valueXsiType: 'xs:string' },
            { name: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier', valueTag: 'nameidentifier', nameFormat: 'urn:oasis:names:tc:SAML:2.0:attrname-format:uri', valueXsiType: 'xs:string' },
            { name: 'http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn', valueTag: 'upn', nameFormat: 'urn:oasis:names:tc:SAML:2.0:attrname-format:uri', valueXsiType: 'xs:string' }
          ]
        : [
            { name: 'email', valueTag: 'email', nameFormat: 'urn:oasis:names:tc:SAML:2.0:attrname-format:basic', valueXsiType: 'xs:string' },
            { name: 'name', valueTag: 'name', nameFormat: 'urn:oasis:names:tc:SAML:2.0:attrname-format:basic', valueXsiType: 'xs:string' }
          ]
    };

    // Update IDP with the template
    idp.entitySetting.loginResponseTemplate = loginResponseTemplate;

    console.log('SAML Response: Using custom template approach for attributes');

    // Generate SAML response using the template callback
    const user = { email: userEmail };
    const { context } = await idp.createLoginResponse(sp, null, samlify.Constants.wording.binding.post, user, createTemplateCallback(idp, sp, userEmail));

    console.log('SAML Response: Generated response length:', context.length);
    console.log('SAML Response: Contains email?', context.includes(userEmail));
    console.log('SAML Response: Contains InResponseTo?', context.includes(`InResponseTo="${request.id}"`));

    return context;
  } catch (error) {
    console.error('SAML response generation error:', error);
    throw new Error('Failed to generate SAML response: ' + error.message);
  }
}

// Note: SAML signing is now handled by SAMLify automatically

// Generate a unique response ID
function generateResponseId() {
  return 'id_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

// Show SAML consent screen
export async function showSamlConsentScreen(url, spEntityId, acsUrl, relayState, providerKey, env, samlRequest = null) {
  // Import renderTemplate function
  const { renderTemplate } = await import('./utils.js');
  
  // Construct proper consent URLs
  const baseUrl = url.origin + url.pathname;
  
  // Create new URLSearchParams for consent URLs
  // Start with existing query params if any, otherwise start fresh
  const allowParams = new URLSearchParams(url.searchParams);
  allowParams.set('consent', 'allow');
  allowParams.set('RelayState', relayState || '');
  // Include SAMLRequest if it was provided (from POST request)
  if (samlRequest) {
    allowParams.set('SAMLRequest', samlRequest);
  }
  
  const denyParams = new URLSearchParams(url.searchParams);
  denyParams.set('consent', 'deny');
  denyParams.set('RelayState', relayState || '');
  // Include SAMLRequest if it was provided (from POST request)
  if (samlRequest) {
    denyParams.set('SAMLRequest', samlRequest);
  }
  
  // Prepare template data
  const templateData = {
    title: 'SAML Authentication',
    heading: 'Authorize Service Provider',
    description: 'This service provider wants to access your account information.',
    appName: spEntityId,
    saml: true,
    providerKey: providerKey,
    spEntityId: spEntityId,
    acsUrl: acsUrl,
    relayState: relayState,
    allowUrl: `${baseUrl}?${allowParams.toString()}`,
    denyUrl: `${baseUrl}?${denyParams.toString()}`
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
