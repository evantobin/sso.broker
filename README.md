# sso.broker

A secure, stateless OIDC and SAML broker that eliminates the complexity of setting up multiple OAuth providers. Get Apple Sign-In, Google OAuth, and GitHub authentication working in minutes, not hours.

## Why Use sso.broker?

### 🚀 **Skip the Setup Hassle**
Setting up OAuth with Apple, Google, and GitHub is notoriously complex:
- **Apple**: Requires Apple Developer account, complex certificate management, and private email handling
- **Google**: Multiple API configurations, OAuth consent screens, and domain verification
- **GitHub**: App registration, webhook setup, and email API integration

**sso.broker handles all of this for you** - just point your app to our endpoints and you're done.

### ⚡ **Get Started in 4 Steps**
1. Choose your protocol (OAuth or SAML)
2. Pick your provider (Apple, Google, or GitHub)
3. Copy the configuration code
4. Deploy and test

No complex setup, no multiple API keys to manage, no certificate headaches.

### 🔒 **Enterprise-Grade Security**
- **Stateless Architecture**: No databases, no data storage, no privacy concerns
- **Cryptographic Isolation**: Each app gets unique, signed credentials
- **Standards Compliant**: Full OIDC and SAML specification support
- **Zero Trust**: We never see or store your users' data

### 💰 **Cost Effective**
- **No Infrastructure**: Runs on Cloudflare's global edge network
- **No Database Costs**: Stateless design means no storage fees
- **No Maintenance**: We handle all provider updates and security patches
- **Free to Use**: Open source with no usage limits

### 🎯 **Perfect For**
- **Startups**: Get authentication working quickly without hiring OAuth experts
- **Side Projects**: Focus on your core features, not auth complexity
- **Enterprise**: Add social login to existing SAML infrastructure
- **Developers**: Who want to "just make it work" without the OAuth rabbit hole

## Traditional OAuth vs sso.broker

| Traditional OAuth Setup | sso.broker |
|------------------------|------------|
| 🕐 **Time**: 2-3 days per provider | ⚡ **Time**: 5 minutes total |
| 🔧 **Setup**: Multiple API keys, certificates, webhooks | 🎯 **Setup**: Copy-paste configuration |
| 💰 **Cost**: Developer time + infrastructure | 💸 **Cost**: Free |
| 🔒 **Security**: You manage all security | 🛡️ **Security**: Enterprise-grade, handled for you |
| 📚 **Learning**: Deep OAuth/SAML knowledge required | 🎓 **Learning**: Standard OIDC/SAML endpoints |
| 🐛 **Debugging**: Complex multi-provider issues | 🔍 **Debugging**: Single point of failure |
| 🔄 **Maintenance**: Provider API changes break your app | ✨ **Maintenance**: We handle all updates |

## Quick Start

**Want to see it in action?** Visit [sso.broker](https://sso.broker) and try the interactive setup guide.

**Ready to integrate?** Here's how simple it is:

```bash
# 1. Register your app (one-time setup)
curl -X POST https://github.sso.broker/register \
  -H "Content-Type: application/json" \
  -d '{"client_name": "My App", "redirect_uris": ["https://myapp.com/callback"]}'

# 2. Configure your OIDC client
{
  "issuer": "https://github.sso.broker",
  "authorization_endpoint": "https://github.sso.broker/authorize",
  "token_endpoint": "https://github.sso.broker/token"
}

# 3. That's it! Your users can now sign in with GitHub
```

**Total setup time: 5 minutes** ⏱️


## How It Works

### OIDC Flow

#### 1. **App Registration**
```bash
curl -X POST https://github.sso.broker/register \
  -H "Content-Type: application/json" \
  -d '{
    "client_name": "My App",
    "redirect_uris": ["https://myapp.com/callback"]
  }'
```

**Response:**
```json
{
  "client_id": "c<base64_encoded_client_data>",
  "client_secret": "s<base64_encoded_guid_signature>",
  "client_name": "My App",
  "redirect_uris": ["https://myapp.com/callback"]
}
```

#### 2. **Authorization Flow**
```bash
# User visits authorization URL
https://github.sso.broker/authorize?client_id=c<client_id>&redirect_uri=https://myapp.com/callback&state=random_state
```

#### 3. **Token Exchange**
```bash
curl -X POST https://github.sso.broker/token \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code" \
  -d "code=e<encrypted_email_code>" \
  -d "redirect_uri=https://myapp.com/callback" \
  -d "client_id=c<client_id>" \
  -d "client_secret=s<client_secret>"
```

**Response:**
```json
{
  "access_token": "e<encrypted_email_code>",
  "token_type": "Bearer",
  "expires_in": 3600,
  "id_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "scope": "user:email",
  "email": "user@example.com"
}
```

### SAML Flow

#### 1. **SAML Metadata**
```bash
# Get SAML metadata for a provider
curl https://github-saml.sso.broker/metadata
```

#### 2. **SAML SSO**
```bash
# Service Provider initiates SAML authentication
https://github-saml.sso.broker/saml/sso?SAMLRequest=<base64_encoded_request>&RelayState=<state>
```

#### 3. **SAML Response**
The IDP returns a SAML Response with user attributes via POST binding to the Service Provider's ACS URL.

## Security Features

### **Client Credentials**
- **Client ID**: Contains app name, redirect URIs, unique GUID, and cryptographic signature
- **Client Secret**: HMAC signature of the app's unique GUID
- **No Storage**: All credentials are stateless and cryptographically derived
- **Unique GUIDs**: Each app gets a globally unique identifier preventing name collisions

### **Email Encryption**
- **AES-GCM**: Email encrypted with app-specific client secret
- **Tamper-Proof**: Expiration timestamp included in encrypted payload
- **App Isolation**: Each app can only decrypt emails for its own users
- **Base64 Encoding**: Clean, URL-safe encoding for all encrypted data

### **JWT ID Tokens**
- **Standard Claims**: `iss`, `sub`, `aud`, `exp`, `iat`
- **Email Claims**: `email`, `email_verified`
- **HMAC-SHA256**: Signed with app's client secret
- **Audience Validation**: Scoped to specific client ID

## Project Structure

```
sso.broker/
├── workers/
│   ├── worker.js          # Main OIDC broker logic
│   ├── wrangler.toml      # Cloudflare Workers config
│   └── package.json       # Dependencies
├── frontend/
│   ├── src/
│   │   ├── App.tsx        # Main app with React Router setup
│   │   ├── App.css        # Responsive styling
│   │   ├── main.tsx       # App entry point with BrowserRouter
│   │   ├── pages/
│   │   │   ├── Home.tsx           # Main homepage with provider selection
│   │   │   ├── TermsOfService.tsx # Terms of Service page
│   │   │   └── PrivacyPolicy.tsx  # Privacy Policy page
│   │   └── components/
│   │       ├── OAuthInstructions.tsx  # OAuth setup instructions
│   │       ├── SAMLInstructions.tsx   # SAML setup instructions
│   │       └── AuthenticationStep.tsx # Authentication flow component
│   ├── package.json       # Frontend dependencies (includes react-router-dom)
│   └── vite.config.ts     # Vite configuration
├── deploy.sh              # Deployment script
└── README.md              # This file
```

## Getting Started

### Prerequisites
- Node.js 20.19+
- Cloudflare account
- OAuth app credentials for providers

### Local Development

1. **Workers Development:**
```bash
cd workers
npm install
npm run start
```

2. **Frontend Development:**
```bash
cd frontend
npm install
npm run dev
```

The frontend includes:
- **React Router**: Multi-page navigation with `/`, `/terms`, and `/privacy` routes
- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Dark Mode Support**: Automatically adapts to system preferences
- **Interactive Components**: Copy-to-clipboard functionality for code examples
- **Provider Selection**: Step-by-step OAuth and SAML setup instructions

### Environment Setup

1. **Set OAuth Client IDs** (hardcoded in `deploy.sh`):
   - Apple Client ID
   - Google Client ID  
   - GitHub Client ID

2. **Set Secrets** (via Wrangler):
```bash
cd workers
wrangler secret put APPLE_CLIENT_SECRET
wrangler secret put GOOGLE_CLIENT_SECRET
wrangler secret put GITHUB_CLIENT_SECRET
wrangler secret put MASTER_SECRET
```

## Deployment

### Automated Deployment
```bash
./deploy.sh
```

This script:
- Builds and deploys the frontend to Cloudflare Pages
- Deploys the worker to Cloudflare Workers
- Creates subdomain routes (`apple.sso.broker`, `google.sso.broker`, `github.sso.broker`)
- Sets up DNS records with Cloudflare proxying

### Manual Deployment

1. **Deploy Worker:**
```bash
cd workers
wrangler deploy
```

2. **Deploy Frontend:**
```bash
cd frontend
npm run build
# Upload dist/ to Cloudflare Pages
```

## API Endpoints

### **OIDC Endpoints** (on `*.sso.broker` subdomains)
- `GET /.well-known/openid-configuration` - OIDC discovery document
- `POST /register` - Dynamic client registration
- `GET /authorize` - Start OAuth flow (public endpoint)
- `GET /callback` - OAuth provider callback
- `POST /consent` - User consent handling
- `POST /token` - Exchange authorization code for tokens (requires client secret)

### **SAML Endpoints** (on `*-saml.sso.broker` subdomains)
- `GET /metadata` - SAML metadata document
- `GET /saml/sso` - SAML Single Sign-On endpoint
- `POST /saml/consent` - SAML consent handling
- `GET /saml/slo` - SAML Single Logout endpoint (not yet implemented)

## Frontend Features

### **Multi-Page Application**
- **Home Page** (`/`): Interactive provider selection with OAuth and SAML setup instructions
- **Terms of Service** (`/terms`): Comprehensive terms covering best-effort service, no warranties, and liability limitations
- **Privacy Policy** (`/privacy`): Detailed privacy policy emphasizing no data storage and stateless operation

### **User Experience**
- **Smart Navigation**: Dynamic header with "Back to Home" button on sub-pages
- **Copy-to-Clipboard**: One-click copying of code examples and configuration snippets
- **Syntax Highlighting**: Beautiful code examples with proper syntax highlighting
- **Responsive Design**: Optimized for all screen sizes and devices
- **Dark Mode**: Automatic theme switching based on system preferences

### **Interactive Components**
- **Provider Selection**: Step-by-step wizard for choosing OAuth vs SAML
- **Code Examples**: Live, copyable code snippets for each provider
- **Technical Details**: Comprehensive documentation with examples
- **Protocol-Specific Instructions**: Tailored guidance for OAuth and SAML implementations

## Technical Details

### **Email in Token Response**
The user's email is included directly in the token exchange response for immediate access:

```json
{
  "access_token": "email_access_token_...",
  "token_type": "Bearer", 
  "expires_in": 3600,
  "email": "user@example.com"
}
```

### **Cryptographic Security**
Client IDs are cryptographically signed and contain all necessary information for validation:
- No storage required - stateless validation
- Cryptographically signed for security
- Contains app name and redirect URIs
- Tamper-proof and verifiable

## Provider Configuration

### **OIDC Providers** (on `*.sso.broker` subdomains)

#### **Apple**
- **Scopes**: `openid`, `email`
- **Email Handling**: Uses private relay email if primary email is private
- **ID Token**: Decodes JWT for user identification

#### **Google**
- **Scopes**: `openid`, `email`, `profile`
- **Email**: Direct email retrieval from Google's userinfo API

#### **GitHub**
- **Scopes**: `user:email`
- **Email API**: Uses `/user/emails` endpoint for private emails
- **User Agent**: Required for GitHub API compliance

### **SAML Providers** (on `*-saml.sso.broker` subdomains)

#### **Apple SAML**
- **Entity ID**: `https://apple-saml.sso.broker`
- **Name ID Format**: `urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress`
- **Attributes**: Email address

#### **Google SAML**
- **Entity ID**: `https://google-saml.sso.broker`
- **Name ID Format**: `urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress`
- **Attributes**: Email address

#### **GitHub SAML**
- **Entity ID**: `https://github-saml.sso.broker`
- **Name ID Format**: `urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress`
- **Attributes**: Email address

## Legal & Compliance

### **Service Terms**
- **Best Effort Service**: No uptime or performance guarantees
- **No Warranties**: Service provided "as is" without warranties
- **No Liability**: No liability for damages or service interruptions
- **Service Changes**: Right to modify or discontinue service at any time

### **Privacy & Data**
- **No Data Storage**: Service does not store any personal information
- **Stateless Operation**: All authentication flows are stateless
- **No Tracking**: No user tracking or analytics collection
- **Transparent Operation**: Acts as a pass-through authentication broker

For complete terms, visit the [Terms of Service](/terms) and [Privacy Policy](/privacy) pages.

**Contact**: For questions or support, email us at [help@sso.broker](mailto:help@sso.broker).

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details