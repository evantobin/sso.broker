// Test SAML Service Provider handler
// This is a mock SP that only handles SAML response callbacks for testing

import { errorResponse, logError } from '../utils.js';

// Handle requests to test-saml.sso.broker (mock SP)
export async function handleTestSamlRequest(request, env, url, pathname, host) {
  // Homepage with test buttons for all providers
  if (pathname === '/' || pathname === '') {
    // Import template
    const { TEST_SAML_HOMEPAGE_TEMPLATE } = await import('../template.js');
    
    // Use the template directly
    const homepageHtml = TEST_SAML_HOMEPAGE_TEMPLATE;

    return new Response(homepageHtml, {
      headers: {
        'Content-Type': 'text/html',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400'
      }
    });
  }

  // Only handle the /saml/callback endpoint
  if (pathname === '/saml/callback') {
    // Handle POST requests (actual SAML responses)
    if (request.method === 'POST') {
      try {
        const formData = await request.formData();
        const samlResponse = formData.get('SAMLResponse');
        const relayState = formData.get('RelayState');
        
        if (!samlResponse) {
          return errorResponse('Missing SAMLResponse parameter', 400);
        }

        // Decode the SAML response
        const decodedXml = atob(samlResponse);
        
        // Simple XML parsing to extract key data
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

        // Extract SAML response data
        const responseId = extractAttribute(decodedXml, 'ID');
        const inResponseTo = extractAttribute(decodedXml, 'InResponseTo');
        const issuer = extractElement(decodedXml, 'saml:Issuer');
        const subject = extractElement(decodedXml, 'saml:NameID');
        
        const samlData = {
          responseId,
          inResponseTo,
          issuer,
          subject,
          relayState,
          timestamp: new Date().toISOString()
        };

        // Import template and render with SAML data
        const { SAML_CALLBACK_TEMPLATE } = await import('../template.js');
        const Mustache = (await import('mustache')).default;
        
        const html = Mustache.render(SAML_CALLBACK_TEMPLATE, {
          success: true,
          message: 'SAML Response received and processed successfully',
          data: samlData,
          rawXml: decodedXml,
          hasData: true
        });

        return new Response(html, {
          headers: {
            'Content-Type': 'text/html',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
            'Access-Control-Max-Age': '86400'
          }
        });

      } catch (error) {
        logError(error, { action: 'test_saml_callback' }, env);
        return errorResponse('Failed to process SAML response: ' + error.message, 500);
      }
    }
    
    // Handle GET requests (show test page)
    if (request.method === 'GET') {
      // Import template
      const { SAML_CALLBACK_TEMPLATE } = await import('../template.js');
      const Mustache = (await import('mustache')).default;
      
      // Render template with no data
      const html = Mustache.render(SAML_CALLBACK_TEMPLATE, {
        hasData: false,
        message: 'This endpoint is ready to receive SAML responses'
      });

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
  }

  // For any other path on test-saml.sso.broker, return 404
  return errorResponse('Not Found - This is a mock SAML Service Provider. Only /saml/callback is available.', 404);
}
