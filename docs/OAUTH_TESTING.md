# OAuth Provider Testing Guide

This guide provides simple and comprehensive testing for OAuth authentication with sso.broker using the built-in test Service Provider.

## 🚀 Quick Start - Easy Testing

The easiest way to test OAuth flows is using the built-in test Service Provider:

### 1. Visit the Test Service Provider
Open your browser and go to:
```
https://test-oauth.sso.broker
```

### 2. Click a Test Button
You'll see three provider cards:
- 🍎 **Apple** - Test OAuth authentication with Apple ID
- 🔍 **Google** - Test OAuth authentication with Google  
- 🐙 **GitHub** - Test OAuth authentication with GitHub

Simply click any "Test OAuth Flow" button to start testing!

### 3. Complete the Flow
1. **Click** a provider button
2. **Authenticate** with the provider (Apple/Google/GitHub)
3. **View Results** - The OAuth response will be displayed with authorization code and parsed data

## 📋 What You'll See

After completing an OAuth flow, you'll see:
- ✅ **Success confirmation**
- 📊 **Authorization code** (for token exchange)
- 📄 **State parameter** (if provided)
- 🔗 **Callback URL** with all parameters
- ⏰ **Timestamp** of the response

## 🔧 Manual Testing (Advanced)

If you need to test with custom OAuth requests or integrate with your own application:

### Test Endpoint
Use this URL as your `redirect_uri`:
```
https://test-oauth.sso.broker/oauth/callback
```

### Manual OAuth Request
```bash
# Example OAuth authorization request
open "https://github.sso.broker/authorize?client_id=test-client&redirect_uri=https://test-oauth.sso.broker/oauth/callback&response_type=code&scope=openid%20email&state=test-state"
```

## 📊 Available OAuth Providers

### Apple OAuth
- **Authorization Endpoint**: `https://apple.sso.broker/authorize`
- **Token Endpoint**: `https://apple.sso.broker/token`
- **Test**: Use the Apple button on the test page

### Google OAuth
- **Authorization Endpoint**: `https://google.sso.broker/authorize`
- **Token Endpoint**: `https://google.sso.broker/token`
- **Test**: Use the Google button on the test page

### GitHub OAuth
- **Authorization Endpoint**: `https://github.sso.broker/authorize`
- **Token Endpoint**: `https://github.sso.broker/token`
- **Test**: Use the GitHub button on the test page

## 🔍 Testing Checklist

### ✅ Basic Connectivity
- [ ] Visit `https://test-oauth.sso.broker` - should show test page
- [ ] Check OIDC discovery endpoints return valid JSON
- [ ] Verify all provider buttons are clickable

### ✅ OAuth Flow Testing
- [ ] Click Apple test button - should redirect to Apple authentication
- [ ] Click Google test button - should redirect to Google authentication  
- [ ] Click GitHub test button - should redirect to GitHub authentication
- [ ] Complete authentication with each provider
- [ ] Verify OAuth response is received and parsed correctly

### ✅ Response Validation
- [ ] OAuth response contains valid authorization code
- [ ] State parameter is preserved (if provided)
- [ ] Error handling works for denied requests
- [ ] Callback URL contains all expected parameters

## 🔄 OAuth Flow Steps

1. **Authorization Request**: Client redirects user to authorization endpoint
2. **User Authentication**: User authenticates with the OAuth provider
3. **Authorization Code**: Provider redirects back with authorization code
4. **Token Exchange**: Client exchanges authorization code for access token
5. **API Access**: Client uses access token to access protected resources

## 🛠️ Integration Examples

### JavaScript/Node.js
```javascript
// Redirect to OAuth provider
const authUrl = `https://github.sso.broker/authorize?` +
  `client_id=your-client-id&` +
  `redirect_uri=https://test-oauth.sso.broker/oauth/callback&` +
  `response_type=code&` +
  `scope=openid%20email&` +
  `state=random-state-value`;

window.location.href = authUrl;
```

### cURL
```bash
# Exchange authorization code for token
curl -X POST https://github.sso.broker/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=AUTHORIZATION_CODE" \
  -d "client_id=your-client-id" \
  -d "client_secret=your-client-secret"
```

## 🚨 Error Handling

The test endpoint handles common OAuth errors:
- `access_denied` - User denied the authorization request
- `invalid_request` - The request is missing required parameters
- `invalid_scope` - The requested scope is invalid
- `server_error` - The authorization server encountered an error

All errors are displayed with detailed information on the callback page.

## 📚 Additional Resources

- [OAuth 2.0 Specification](https://tools.ietf.org/html/rfc6749)
- [OpenID Connect Specification](https://openid.net/connect/)
- [sso.broker Documentation](https://sso.broker/docs)
