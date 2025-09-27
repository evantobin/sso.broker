# SAML Provider Testing Guide

This guide provides simple and comprehensive testing for SAML authentication with sso.broker using the built-in test Service Provider.

## 🚀 Quick Start - Easy Testing

The easiest way to test SAML flows is using the built-in test Service Provider:

### 1. Visit the Test Service Provider
Open your browser and go to:
```
https://test-saml.sso.broker
```

### 2. Click a Test Button
You'll see three provider cards:
- 🍎 **Apple** - Test SAML authentication with Apple ID
- 🔍 **Google** - Test SAML authentication with Google  
- 🐙 **GitHub** - Test SAML authentication with GitHub

Simply click any "Test SAML Flow" button to start testing!

### 3. Complete the Flow
1. **Click** a provider button
2. **Authenticate** with the provider (Apple/Google/GitHub)
3. **View Results** - The SAML response will be displayed with parsed data

## 📋 What You'll See

After completing a SAML flow, you'll see:
- ✅ **Success confirmation**
- 📊 **Extracted SAML data** (response ID, subject, issuer, etc.)
- 📄 **Raw XML response**
- 🔗 **URL parameters** (if any)

## 🔧 Manual Testing (Advanced)

If you need to test with custom SAML requests or integrate with your own application:

### Test Endpoint
Use this URL as your `AssertionConsumerServiceURL`:
```
https://test-saml.sso.broker/saml/callback
```

### Manual SAML Request
```bash
# Generate a test SAML request
SAML_REQUEST=$(echo '<?xml version="1.0" encoding="UTF-8"?><samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol" xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion" ID="_test123" Version="2.0" IssueInstant="2024-01-15T10:30:00Z" Destination="https://github-saml.sso.broker/saml/sso" AssertionConsumerServiceURL="https://test-saml.sso.broker/saml/callback" ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST"><saml:Issuer>https://test-saml.sso.broker</saml:Issuer><samlp:NameIDPolicy Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress" AllowCreate="true"/></samlp:AuthnRequest>' | base64 | tr -d '\n')

# Open in browser
open "https://github-saml.sso.broker/saml/sso?SAMLRequest=$SAML_REQUEST"
```

## 📊 Available SAML Providers

### Apple SAML
- **Metadata**: `https://apple-saml.sso.broker/metadata`
- **SSO Endpoint**: `https://apple-saml.sso.broker/saml/sso`
- **Test**: Use the Apple button on the test page

### Google SAML
- **Metadata**: `https://google-saml.sso.broker/metadata`
- **SSO Endpoint**: `https://google-saml.sso.broker/saml/sso`
- **Test**: Use the Google button on the test page

### GitHub SAML
- **Metadata**: `https://github-saml.sso.broker/metadata`
- **SSO Endpoint**: `https://github-saml.sso.broker/saml/sso`
- **Test**: Use the GitHub button on the test page

## 🔍 Testing Checklist

### ✅ Basic Connectivity
- [ ] Visit `https://test-saml.sso.broker` - should show test page
- [ ] Check metadata endpoints return valid XML
- [ ] Verify all provider buttons are clickable

### ✅ SAML Flow Testing
- [ ] Click Apple test button - should redirect to Apple authentication
- [ ] Click Google test button - should redirect to Google authentication  
- [ ] Click GitHub test button - should redirect to GitHub authentication
- [ ] Complete authentication with each provider
- [ ] Verify SAML response is received and parsed correctly

### ✅ Response Validation
- [ ] SAML response contains valid response ID
- [ ] Subject (user email) is extracted correctly
- [ ] Issuer matches the SAML provider
- [ ] Raw XML is displayed for inspection

## 🛠️ Integration Testing

### For Your Application
1. **Set AssertionConsumerServiceURL** to `https://test-saml.sso.broker/saml/callback`
2. **Generate SAML Request** with your app's entity ID
3. **Redirect user** to the appropriate SAML IdP
4. **Check callback** for the SAML response

### Example Integration
```javascript
// In your application
const samlRequest = generateSamlRequest({
  entityId: 'https://your-app.com',
  assertionConsumerServiceURL: 'https://test-saml.sso.broker/saml/callback',
  destination: 'https://github-saml.sso.broker/saml/sso'
});

// Redirect user to SAML IdP
window.location.href = `https://github-saml.sso.broker/saml/sso?SAMLRequest=${btoa(samlRequest)}`;
```

## 🐛 Troubleshooting

### Common Issues

**"No SAML response received"**
- Check that you're using the correct `AssertionConsumerServiceURL`
- Verify the SAML request is properly formatted
- Ensure you completed the full authentication flow

**"Invalid SAML response"**
- Check the raw XML for parsing errors
- Verify the response is properly base64 encoded
- Ensure the response contains required SAML elements

**"Provider not found"**
- Verify the SAML provider subdomain is correct
- Check that the provider is properly configured
- Ensure DNS is set up correctly

### Debug Information
The test endpoint provides detailed information:
- **Response ID**: Unique identifier for the SAML response
- **InResponseTo**: Matches the original request ID
- **Issuer**: The SAML Identity Provider
- **Subject**: The authenticated user's email
- **Raw XML**: Full SAML response for debugging

## 📚 Additional Resources

- **SAML Specification**: [OASIS SAML 2.0](https://docs.oasis-open.org/security/saml/v2.0/)
- **Metadata Format**: [SAML Metadata](https://docs.oasis-open.org/security/saml/v2.0/saml-metadata-2.0-os.pdf)
- **sso.broker Documentation**: Check the main README for setup instructions

---

**Need Help?** The test Service Provider at `https://test-saml.sso.broker` provides an interactive interface for testing and debugging SAML flows.