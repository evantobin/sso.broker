// Template loader for all HTML templates
// This file imports all templates and exports them for other modules to use

// Import all HTML templates as raw text
import consentTemplate from './templates/consent.html' assert { type: 'raw' };
import samlCallbackTemplate from './templates/saml-callback.html' assert { type: 'raw' };
import testSamlHomepageTemplate from './templates/test-saml-homepage.html' assert { type: 'raw' };

// Export templates as named exports
export const CONSENT_TEMPLATE = consentTemplate;
export const SAML_CALLBACK_TEMPLATE = samlCallbackTemplate;
export const TEST_SAML_HOMEPAGE_TEMPLATE = testSamlHomepageTemplate;

// Export all templates as an object
export const templates = {
  consent: consentTemplate,
  samlCallback: samlCallbackTemplate,
  testSamlHomepage: testSamlHomepageTemplate
};

// Export default as the templates object
export default templates;

// Helper function to get template by name
export function getTemplate(templateName) {
  const templateMap = {
    'consent.html': consentTemplate,
    'saml-callback.html': samlCallbackTemplate,
    'test-saml-homepage.html': testSamlHomepageTemplate
  };
  
  return templateMap[templateName] || null;
}
