# SAML Provider Testing Guide

This guide provides sample requests and responses for testing SAML providers with sso.broker.

## Available SAML Providers

- **Apple SAML**: `https://apple-saml.sso.broker`
- **Google SAML**: `https://google-saml.sso.broker`
- **GitHub SAML**: `https://github-saml.sso.broker`

## 1. SAML Metadata

### Get SAML Metadata
```bash
curl -X GET https://apple-saml.sso.broker/metadata
```

**Response:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<md:EntityDescriptor xmlns:md="urn:oasis:names:tc:SAML:2.0:metadata" entityID="apple-saml.sso.broker">
  <md:IDPSSODescriptor protocolSupportEnumeration="urn:oasis:names:tc:SAML:2.0:protocol">
    <md:KeyDescriptor use="signing">
      <ds:KeyInfo xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
        <ds:X509Data>
          <ds:X509Certificate>MIIDqzCCApOgAwIBAgIUUqjMY7rsDVajc5Unh0mLTFEG06MwDQYJKoZIhvcNAQEL...</ds:X509Certificate>
        </ds:X509Data>
      </ds:KeyInfo>
    </md:KeyDescriptor>
    <md:SingleSignOnService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="https://apple-saml.sso.broker/saml/sso"/>
    <md:SingleLogoutService Binding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST" Location="https://apple-saml.sso.broker/saml/slo"/>
    <md:NameIDFormat>urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress</md:NameIDFormat>
  </md:IDPSSODescriptor>
</md:EntityDescriptor>
```

## 2. SAML Authentication Request

### ⚠️ Important: User Interaction Required

**SAML authentication requires user consent**, so you cannot test the complete flow with curl alone. The flow requires:

1. **Browser-based testing** for the consent step
2. **Manual user interaction** to approve the authentication
3. **Real SAML Response** generation after consent

### What You CAN Test with curl

#### Metadata Retrieval (No User Interaction)
```bash
# This works with curl - no user interaction needed
curl -X GET https://apple-saml.sso.broker/metadata
```

#### AuthnRequest Initiation (Returns Consent Page)
```bash
# This will return HTML consent page - not a complete SAML flow
curl -X GET "https://apple-saml.sso.broker/saml/sso?SAMLRequest=$(echo '<?xml version="1.0" encoding="UTF-8"?>
<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                    xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                    ID="_8e8dc5f69a98cc4c1ff3427e5ce34606fd672f91e6"
                    Version="2.0"
                    IssueInstant="2024-01-15T10:30:00Z"
                    Destination="https://apple-saml.sso.broker/saml/sso"
                    AssertionConsumerServiceURL="https://your-app.com/saml/callback"
                    ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">
  <saml:Issuer>https://your-app.com</saml:Issuer>
  <samlp:NameIDPolicy Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress" AllowCreate="true"/>
</samlp:AuthnRequest>' | base64 -w 0)"
```

**Expected Response:** HTML consent page (not a SAML Response)

## 3. SAML Consent Flow (Browser Testing Required)

### 🌐 Browser-Based Testing (Recommended)

Since SAML requires user consent, the most effective testing approach is browser-based:

#### Step 1: Generate and Open SAML Request in Browser
```bash
# Generate the AuthnRequest and open directly in browser
SAML_REQUEST=$(echo '<?xml version="1.0" encoding="UTF-8"?>
<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                    xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                    ID="_test123"
                    Version="2.0"
                    IssueInstant="2024-01-15T10:30:00Z"
                    Destination="https://apple-saml.sso.broker/saml/sso"
                    AssertionConsumerServiceURL="https://your-app.com/saml/callback"
                    ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">
  <saml:Issuer>https://your-app.com</saml:Issuer>
  <samlp:NameIDPolicy Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress" AllowCreate="true"/>
</samlp:AuthnRequest>' | base64 -w 0)

# Open the SAML request directly in your default browser
open "https://apple-saml.sso.broker/saml/sso?SAMLRequest=$SAML_REQUEST"
```

#### Step 2: Complete the Flow
1. The browser will open automatically to the consent page
2. Enter an email address and click "Approve"
3. The system will generate a SAML Response and POST it to your `AssertionConsumerServiceURL`

### 🔧 Alternative: Programmatic Testing (Limited)

#### Test Consent Endpoint Directly
```bash
# This simulates the consent submission (for testing the endpoint)
curl -X POST https://apple-saml.sso.broker/saml/consent \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=test@example.com&consent=true&requestId=_test123&issuer=https://your-app.com&assertionConsumerServiceURL=https://your-app.com/saml/callback"
```

**Note:** This requires a valid `requestId` from an active SAML session, so it's mainly useful for testing the consent endpoint itself, not the complete flow.

## 4. SAML Response

### Expected SAML Response Structure
```xml
<?xml version="1.0" encoding="UTF-8"?>
<samlp:Response xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                ID="_response123"
                Version="2.0"
                IssueInstant="2024-01-15T10:35:00Z"
                Destination="https://your-app.com/saml/callback"
                InResponseTo="_test123">
  <saml:Issuer>apple-saml.sso.broker</saml:Issuer>
  <samlp:Status>
    <samlp:StatusCode Value="urn:oasis:names:tc:SAML:2.0:status:Success"/>
  </samlp:Status>
  <saml:Assertion ID="_assertion123"
                  Version="2.0"
                  IssueInstant="2024-01-15T10:35:00Z">
    <saml:Issuer>apple-saml.sso.broker</saml:Issuer>
    <ds:Signature xmlns:ds="http://www.w3.org/2000/09/xmldsig#">
      <!-- Digital signature -->
    </ds:Signature>
    <saml:Subject>
      <saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">test@example.com</saml:NameID>
      <saml:SubjectConfirmation Method="urn:oasis:names:tc:SAML:2.0:cm:bearer">
        <saml:SubjectConfirmationData NotOnOrAfter="2024-01-15T10:40:00Z"
                                      Recipient="https://your-app.com/saml/callback"
                                      InResponseTo="_test123"/>
      </saml:SubjectConfirmation>
    </saml:Subject>
    <saml:Conditions NotBefore="2024-01-15T10:35:00Z"
                     NotOnOrAfter="2024-01-15T10:40:00Z">
      <saml:AudienceRestriction>
        <saml:Audience>https://your-app.com</saml:Audience>
      </saml:AudienceRestriction>
    </saml:Conditions>
    <saml:AuthnStatement AuthnInstant="2024-01-15T10:35:00Z"
                         SessionIndex="_session123">
      <saml:AuthnContext>
        <saml:AuthnContextClassRef>urn:oasis:names:tc:SAML:2.0:ac:classes:PasswordProtectedTransport</saml:AuthnContextClassRef>
      </saml:AuthnContext>
    </saml:AuthnStatement>
    <saml:AttributeStatement>
      <saml:Attribute Name="email" NameFormat="urn:oasis:names:tc:SAML:2.0:attrname-format:basic">
        <saml:AttributeValue>test@example.com</saml:AttributeValue>
      </saml:Attribute>
    </saml:AttributeStatement>
  </saml:Assertion>
</samlp:Response>
```

## 5. Testing with Different Providers

### Apple SAML
```bash
# Get metadata (curl works for this)
curl https://apple-saml.sso.broker/metadata

# Test authentication (opens in browser)
SAML_REQUEST=$(echo '<?xml version="1.0" encoding="UTF-8"?>
<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                    xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                    ID="_apple_test"
                    Version="2.0"
                    IssueInstant="2024-01-15T10:30:00Z"
                    Destination="https://apple-saml.sso.broker/saml/sso"
                    AssertionConsumerServiceURL="https://your-app.com/saml/callback"
                    ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">
  <saml:Issuer>https://your-app.com</saml:Issuer>
  <samlp:NameIDPolicy Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress" AllowCreate="true"/>
</samlp:AuthnRequest>' | base64 -w 0)

open "https://apple-saml.sso.broker/saml/sso?SAMLRequest=$SAML_REQUEST"
```

### Google SAML
```bash
# Get metadata (curl works for this)
curl https://google-saml.sso.broker/metadata

# Test authentication (opens in browser)
SAML_REQUEST=$(echo '<?xml version="1.0" encoding="UTF-8"?>
<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                    xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                    ID="_google_test"
                    Version="2.0"
                    IssueInstant="2024-01-15T10:30:00Z"
                    Destination="https://google-saml.sso.broker/saml/sso"
                    AssertionConsumerServiceURL="https://your-app.com/saml/callback"
                    ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">
  <saml:Issuer>https://your-app.com</saml:Issuer>
  <samlp:NameIDPolicy Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress" AllowCreate="true"/>
</samlp:AuthnRequest>' | base64 -w 0)

open "https://google-saml.sso.broker/saml/sso?SAMLRequest=$SAML_REQUEST"
```

### GitHub SAML
```bash
# Get metadata (curl works for this)
curl https://github-saml.sso.broker/metadata

# Test authentication (opens in browser)
SAML_REQUEST=$(echo '<?xml version="1.0" encoding="UTF-8"?>
<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                    xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                    ID="_github_test"
                    Version="2.0"
                    IssueInstant="2024-01-15T10:30:00Z"
                    Destination="https://github-saml.sso.broker/saml/sso"
                    AssertionConsumerServiceURL="https://your-app.com/saml/callback"
                    ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">
  <saml:Issuer>https://your-app.com</saml:Issuer>
  <samlp:NameIDPolicy Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress" AllowCreate="true"/>
</samlp:AuthnRequest>' | base64 -w 0)

open "https://github-saml.sso.broker/saml/sso?SAMLRequest=$SAML_REQUEST"
```

## 6. SAML Logout (SLO)

### Initiate Logout
```bash
curl -X GET "https://apple-saml.sso.broker/saml/slo?SAMLRequest=$(echo '<?xml version="1.0" encoding="UTF-8"?>
<samlp:LogoutRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                     xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                     ID="_logout123"
                     Version="2.0"
                     IssueInstant="2024-01-15T10:30:00Z"
                     Destination="https://apple-saml.sso.broker/saml/slo">
  <saml:Issuer>https://your-app.com</saml:Issuer>
  <saml:NameID Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress">test@example.com</saml:NameID>
  <samlp:SessionIndex>_session123</samlp:SessionIndex>
</samlp:LogoutRequest>' | base64 -w 0)"
```

## 7. Testing Checklist

### ✅ What You CAN Test with curl
- [ ] **Metadata endpoint** returns valid XML
- [ ] **SSO endpoint** responds to AuthnRequest (returns consent page)
- [ ] **Certificate format** is correct (no PEM markers)
- [ ] **Invalid AuthnRequest** returns appropriate error
- [ ] **Malformed XML** is handled gracefully

### 🌐 What Requires Browser Testing
- [ ] **Complete authentication flow** (consent → SAML Response)
- [ ] **SAML Response generation** after user consent
- [ ] **Response signature verification** (requires real response)
- [ ] **Time-based conditions** validation
- [ ] **Audience restriction** validation
- [ ] **Email attribute** inclusion in response

### 🔧 What Requires Integration Testing
- [ ] **Certificate validation** in your SAML library
- [ ] **Response signature verification** in your application
- [ ] **End-to-end flow** with your SAML Service Provider
- [ ] **Error handling** in your application

## 8. Testing Approaches

### 🚀 Quick Start Testing
```bash
# Test basic connectivity (curl works for this)
curl https://apple-saml.sso.broker/metadata

# Test complete SAML flow (opens in browser)
SAML_REQUEST=$(echo '<?xml version="1.0" encoding="UTF-8"?>
<samlp:AuthnRequest xmlns:samlp="urn:oasis:names:tc:SAML:2.0:protocol"
                    xmlns:saml="urn:oasis:names:tc:SAML:2.0:assertion"
                    ID="_test123"
                    Version="2.0"
                    IssueInstant="2024-01-15T10:30:00Z"
                    Destination="https://apple-saml.sso.broker/saml/sso"
                    AssertionConsumerServiceURL="https://your-app.com/saml/callback"
                    ProtocolBinding="urn:oasis:names:tc:SAML:2.0:bindings:HTTP-POST">
  <saml:Issuer>https://your-app.com</saml:Issuer>
  <samlp:NameIDPolicy Format="urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress" AllowCreate="true"/>
</samlp:AuthnRequest>' | base64 -w 0)

open "https://apple-saml.sso.broker/saml/sso?SAMLRequest=$SAML_REQUEST"
```

### 🌐 Complete Flow Testing (Browser)
1. **Generate and open test URL** using the `open` command above
2. **Browser opens automatically** to the consent page
3. **Enter email and approve** to complete the flow
4. **Check your callback URL** for the SAML Response

### 🔧 Integration Testing (Your App)
1. **Set up SAML Service Provider** in your application
2. **Configure metadata** from sso.broker
3. **Test complete flow** from your app to sso.broker and back
4. **Verify SAML Response** parsing and validation

### 🧪 Automated Testing (Limited)
```bash
# Test metadata endpoint
curl -s https://apple-saml.sso.broker/metadata | xmllint --format -

# Test error handling
curl -s "https://apple-saml.sso.broker/saml/sso?SAMLRequest=invalid" | grep -i error

# Test certificate format
curl -s https://apple-saml.sso.broker/metadata | grep -o '<ds:X509Certificate>[^<]*</ds:X509Certificate>' | head -1
```

## 9. Common Issues

### Certificate Format
**Problem**: Certificate shows as "undefined" in metadata
**Solution**: Ensure certificate is base64-encoded without PEM markers

### Entity ID Mismatch
**Problem**: "Invalid issuer" errors
**Solution**: Use correct entity ID format: `provider-saml.sso.broker` (no https://)

### Response Validation
**Problem**: SAML Response rejected by SP
**Solution**: Verify signature, timestamps, and audience restrictions

## 9. Integration Examples

### Spring Security SAML
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {
    
    @Bean
    public SAMLEntryPoint samlEntryPoint() {
        SAMLEntryPoint entryPoint = new SAMLEntryPoint();
        entryPoint.setDefaultProfileOptions(getDefaultProfileOptions());
        return entryPoint;
    }
    
    private ProfileOptions getDefaultProfileOptions() {
        ProfileOptions options = new ProfileOptions();
        options.setIncludeScoping(false);
        return options;
    }
}
```

### Node.js SAML
```javascript
const saml2 = require('saml2-js');

const spOptions = {
  entity_id: "https://your-app.com",
  private_key: fs.readFileSync("private-key.pem").toString(),
  certificate: fs.readFileSync("certificate.pem").toString(),
  assert_endpoint: "https://your-app.com/saml/callback",
  allow_unencrypted_assertion: true
};

const idpOptions = {
  sso_login_url: "https://apple-saml.sso.broker/saml/sso",
  sso_logout_url: "https://apple-saml.sso.broker/saml/slo",
  certificates: ["MIIDqzCCApOgAwIBAgIUUqjMY7rsDVajc5Unh0mLTFEG06MwDQYJKoZIhvcNAQEL..."]
};

const sp = new saml2.ServiceProvider(spOptions);
const idp = new saml2.IdentityProvider(idpOptions);
```

This guide provides comprehensive testing examples for all SAML providers supported by sso.broker.
