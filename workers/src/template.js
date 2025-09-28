// Template loader for all HTML templates
// This file imports all templates and exports them for other modules to use

// Import all HTML templates as raw text
import consentTemplate from './templates/consent.html' assert { type: 'raw' };
import samlCallbackTemplate from './templates/saml-callback.html' assert { type: 'raw' };
import testSamlHomepageTemplate from './templates/test-saml-homepage.html' assert { type: 'raw' };
import testOAuthHomepageTemplate from './templates/test-oauth-homepage.html' assert { type: 'raw' };
import oauthCallbackTemplate from './templates/oauth-callback.html' assert { type: 'raw' };

// Export templates as named exports
export const CONSENT_TEMPLATE = consentTemplate;
export const SAML_CALLBACK_TEMPLATE = samlCallbackTemplate;
export const TEST_SAML_HOMEPAGE_TEMPLATE = testSamlHomepageTemplate;
export const TEST_OAUTH_HOMEPAGE_TEMPLATE = testOAuthHomepageTemplate;
export const OAUTH_CALLBACK_TEMPLATE = oauthCallbackTemplate;

// Export all templates as an object
export const templates = {
  consent: consentTemplate,
  samlCallback: samlCallbackTemplate,
  testSamlHomepage: testSamlHomepageTemplate,
  testOAuthHomepage: testOAuthHomepageTemplate,
  oauthCallback: oauthCallbackTemplate
};

// Export default as the templates object
export default templates;

// Helper function to get template by name
export function getTemplate(templateName) {
  const templateMap = {
    'consent.html': consentTemplate,
    'saml-callback.html': samlCallbackTemplate,
    'test-saml-homepage.html': testSamlHomepageTemplate,
    'test-oauth-homepage.html': testOAuthHomepageTemplate,
    'oauth-callback.html': oauthCallbackTemplate
  };
  
  return templateMap[templateName] || null;
}
