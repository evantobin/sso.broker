#!/bin/bash

# sso.broker Complete Deployment Script
set -e

echo "🚀 Deploying sso.broker..."

# Configuration
DOMAIN="sso.broker"
ACCOUNT_ID="8f44c3760fd7f6aa617b39467f513b48"

# Check if Cloudflare API token is set
if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "❌ CLOUDFLARE_API_TOKEN environment variable is not set."
    echo "Please set it with: export CLOUDFLARE_API_TOKEN='your-token-here'"
    exit 1
fi

# Test API token
echo "🔐 Testing Cloudflare API token..."
TOKEN_TEST=$(curl -s "https://api.cloudflare.com/client/v4/user/tokens/verify" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json")

TOKEN_VALID=$(echo "$TOKEN_TEST" | jq -r '.success')
if [ "$TOKEN_VALID" = "true" ]; then
    echo "✅ API token is valid"
else
    echo "❌ API token is invalid or has insufficient permissions:"
    echo "$TOKEN_TEST" | jq -r '.errors[]?.message // "Unknown error"'
    echo ""
    echo "Please check:"
    echo "1. Token is correct and not expired"
    echo "2. Token has 'Zone:Edit' and 'DNS:Edit' permissions"
    echo "3. Token is for the correct Cloudflare account"
    exit 1
fi

# Check if Wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler is not installed. Installing..."
    npm install -g wrangler
fi

echo "🔨 Building frontend..."
cd ../frontend
npm install
npm run build
cd ../scripts

echo "🚀 Deploying Cloudflare Worker..."
cd ../workers
wrangler deploy
cd ../scripts

echo "🌐 Deploying frontend to Cloudflare Pages..."
cd ../frontend
wrangler pages deploy dist --project-name=sso-broker-frontend --branch main
cd ../scripts

echo "🔧 Setting up worker routes..."

# Get zone ID for the domain
ZONE_ID=$(curl -s "https://api.cloudflare.com/client/v4/zones?name=$DOMAIN" -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" | jq -r '.result[0].id')

if [ "$ZONE_ID" = "null" ] || [ -z "$ZONE_ID" ]; then
    echo "❌ Domain $DOMAIN not found in Cloudflare. Please add it to your Cloudflare account first."
    exit 1
fi

echo "Creating worker routes..."

# Apple subdomain route
echo "Creating apple subdomain route..."
APPLE_ROUTE_RESULT=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/workers/routes" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data "{\"pattern\":\"apple.$DOMAIN/*\",\"script\":\"sso-broker\"}")

APPLE_ROUTE_SUCCESS=$(echo "$APPLE_ROUTE_RESULT" | jq -r '.success')
if [ "$APPLE_ROUTE_SUCCESS" = "true" ]; then
    echo "✅ Apple subdomain route created successfully"
else
    echo "❌ Failed to create apple subdomain route:"
    echo "$APPLE_ROUTE_RESULT" | jq -r '.errors[]?.message // "Unknown error"'
fi

# Google subdomain route
echo "Creating google subdomain route..."
GOOGLE_ROUTE_RESULT=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/workers/routes" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data "{\"pattern\":\"google.$DOMAIN/*\",\"script\":\"sso-broker\"}")

GOOGLE_ROUTE_SUCCESS=$(echo "$GOOGLE_ROUTE_RESULT" | jq -r '.success')
if [ "$GOOGLE_ROUTE_SUCCESS" = "true" ]; then
    echo "✅ Google subdomain route created successfully"
else
    echo "❌ Failed to create google subdomain route:"
    echo "$GOOGLE_ROUTE_RESULT" | jq -r '.errors[]?.message // "Unknown error"'
fi

# GitHub subdomain route
echo "Creating github subdomain route..."
GITHUB_ROUTE_RESULT=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/workers/routes" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data "{\"pattern\":\"github.$DOMAIN/*\",\"script\":\"sso-broker\"}")

GITHUB_ROUTE_SUCCESS=$(echo "$GITHUB_ROUTE_RESULT" | jq -r '.success')
if [ "$GITHUB_ROUTE_SUCCESS" = "true" ]; then
    echo "✅ GitHub subdomain route created successfully"
else
    echo "❌ Failed to create github subdomain route:"
    echo "$GITHUB_ROUTE_RESULT" | jq -r '.errors[]?.message // "Unknown error"'
fi

# SAML subdomain routes
echo "Creating SAML subdomain routes..."

# Apple SAML subdomain route
echo "Creating apple-saml subdomain route..."
APPLE_SAML_ROUTE_RESULT=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/workers/routes" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data "{\"pattern\":\"apple-saml.$DOMAIN/*\",\"script\":\"sso-broker\"}")

APPLE_SAML_ROUTE_SUCCESS=$(echo "$APPLE_SAML_ROUTE_RESULT" | jq -r '.success')
if [ "$APPLE_SAML_ROUTE_SUCCESS" = "true" ]; then
    echo "✅ Apple SAML subdomain route created successfully"
else
    echo "❌ Failed to create apple-saml subdomain route:"
    echo "$APPLE_SAML_ROUTE_RESULT" | jq -r '.errors[]?.message // "Unknown error"'
fi

# Google SAML subdomain route
echo "Creating google-saml subdomain route..."
GOOGLE_SAML_ROUTE_RESULT=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/workers/routes" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data "{\"pattern\":\"google-saml.$DOMAIN/*\",\"script\":\"sso-broker\"}")

GOOGLE_SAML_ROUTE_SUCCESS=$(echo "$GOOGLE_SAML_ROUTE_RESULT" | jq -r '.success')
if [ "$GOOGLE_SAML_ROUTE_SUCCESS" = "true" ]; then
    echo "✅ Google SAML subdomain route created successfully"
else
    echo "❌ Failed to create google-saml subdomain route:"
    echo "$GOOGLE_SAML_ROUTE_RESULT" | jq -r '.errors[]?.message // "Unknown error"'
fi

# GitHub SAML subdomain route
echo "Creating github-saml subdomain route..."
GITHUB_SAML_ROUTE_RESULT=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/workers/routes" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data "{\"pattern\":\"github-saml.$DOMAIN/*\",\"script\":\"sso-broker\"}")

GITHUB_SAML_ROUTE_SUCCESS=$(echo "$GITHUB_SAML_ROUTE_RESULT" | jq -r '.success')
if [ "$GITHUB_SAML_ROUTE_SUCCESS" = "true" ]; then
    echo "✅ GitHub SAML subdomain route created successfully"
else
    echo "❌ Failed to create github-saml subdomain route:"
    echo "$GITHUB_SAML_ROUTE_RESULT" | jq -r '.errors[]?.message // "Unknown error"'
fi

echo "✅ Worker routes created!"

# Create DNS records for subdomains
echo "🌐 Creating DNS records for subdomains..."

# Apple subdomain DNS
echo "Creating apple subdomain DNS record..."
APPLE_DNS_RESULT=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data "{\"type\":\"CNAME\",\"name\":\"apple\",\"content\":\"sso-broker.me-8f4.workers.dev\",\"proxied\":true}")

APPLE_DNS_SUCCESS=$(echo "$APPLE_DNS_RESULT" | jq -r '.success')
if [ "$APPLE_DNS_SUCCESS" = "true" ]; then
    echo "✅ Apple subdomain DNS record created successfully (proxied)"
else
    echo "❌ Failed to create apple subdomain DNS record:"
    echo "$APPLE_DNS_RESULT" | jq -r '.errors[]?.message // "Unknown error"'
fi

# Google subdomain DNS
echo "Creating google subdomain DNS record..."
GOOGLE_DNS_RESULT=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data "{\"type\":\"CNAME\",\"name\":\"google\",\"content\":\"sso-broker.me-8f4.workers.dev\",\"proxied\":true}")

GOOGLE_DNS_SUCCESS=$(echo "$GOOGLE_DNS_RESULT" | jq -r '.success')
if [ "$GOOGLE_DNS_SUCCESS" = "true" ]; then
    echo "✅ Google subdomain DNS record created successfully (proxied)"
else
    echo "❌ Failed to create google subdomain DNS record:"
    echo "$GOOGLE_DNS_RESULT" | jq -r '.errors[]?.message // "Unknown error"'
fi

# GitHub subdomain DNS
echo "Creating github subdomain DNS record..."
GITHUB_DNS_RESULT=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data "{\"type\":\"CNAME\",\"name\":\"github\",\"content\":\"sso-broker.me-8f4.workers.dev\",\"proxied\":true}")

GITHUB_DNS_SUCCESS=$(echo "$GITHUB_DNS_RESULT" | jq -r '.success')
if [ "$GITHUB_DNS_SUCCESS" = "true" ]; then
    echo "✅ GitHub subdomain DNS record created successfully (proxied)"
else
    echo "❌ Failed to create github subdomain DNS record:"
    echo "$GITHUB_DNS_RESULT" | jq -r '.errors[]?.message // "Unknown error"'
fi

# SAML subdomain DNS records
echo "Creating SAML subdomain DNS records..."

# Apple SAML subdomain DNS
echo "Creating apple-saml subdomain DNS record..."
APPLE_SAML_DNS_RESULT=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data "{\"type\":\"CNAME\",\"name\":\"apple-saml\",\"content\":\"sso-broker.me-8f4.workers.dev\",\"proxied\":true}")

APPLE_SAML_DNS_SUCCESS=$(echo "$APPLE_SAML_DNS_RESULT" | jq -r '.success')
if [ "$APPLE_SAML_DNS_SUCCESS" = "true" ]; then
    echo "✅ Apple SAML subdomain DNS record created successfully (proxied)"
else
    echo "❌ Failed to create apple-saml subdomain DNS record:"
    echo "$APPLE_SAML_DNS_RESULT" | jq -r '.errors[]?.message // "Unknown error"'
fi

# Google SAML subdomain DNS
echo "Creating google-saml subdomain DNS record..."
GOOGLE_SAML_DNS_RESULT=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data "{\"type\":\"CNAME\",\"name\":\"google-saml\",\"content\":\"sso-broker.me-8f4.workers.dev\",\"proxied\":true}")

GOOGLE_SAML_DNS_SUCCESS=$(echo "$GOOGLE_SAML_DNS_RESULT" | jq -r '.success')
if [ "$GOOGLE_SAML_DNS_SUCCESS" = "true" ]; then
    echo "✅ Google SAML subdomain DNS record created successfully (proxied)"
else
    echo "❌ Failed to create google-saml subdomain DNS record:"
    echo "$GOOGLE_SAML_DNS_RESULT" | jq -r '.errors[]?.message // "Unknown error"'
fi

# GitHub SAML subdomain DNS
echo "Creating github-saml subdomain DNS record..."
GITHUB_SAML_DNS_RESULT=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/dns_records" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data "{\"type\":\"CNAME\",\"name\":\"github-saml\",\"content\":\"sso-broker.me-8f4.workers.dev\",\"proxied\":true}")

GITHUB_SAML_DNS_SUCCESS=$(echo "$GITHUB_SAML_DNS_RESULT" | jq -r '.success')
if [ "$GITHUB_SAML_DNS_SUCCESS" = "true" ]; then
    echo "✅ GitHub SAML subdomain DNS record created successfully (proxied)"
else
    echo "❌ Failed to create github-saml subdomain DNS record:"
    echo "$GITHUB_SAML_DNS_RESULT" | jq -r '.errors[]?.message // "Unknown error"'
fi

echo "✅ DNS records created!"

# Set up main domain for Pages
echo "🌐 Setting up main domain for Pages..."
MAIN_DOMAIN_RESULT=$(curl -s -X POST "https://api.cloudflare.com/client/v4/pages/projects/sso-broker-frontend/domains" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  --data "{\"domain\":\"$DOMAIN\"}")

MAIN_DOMAIN_SUCCESS=$(echo "$MAIN_DOMAIN_RESULT" | jq -r '.success')
if [ "$MAIN_DOMAIN_SUCCESS" = "true" ]; then
    echo "✅ Main domain configured for Pages successfully"
else
    echo "❌ Failed to configure main domain for Pages:"
    echo "$MAIN_DOMAIN_RESULT" | jq -r '.errors[]?.message // "Unknown error"'
    echo ""
    echo "📝 Manual step required:"
    echo "Go to Cloudflare Dashboard → Pages → sso-broker-frontend → Custom domains"
    echo "Add custom domain: $DOMAIN"
fi

echo ""

echo "✅ Deployment complete!"
echo ""
echo "🎉 sso.broker is now deployed!"
echo ""
echo "URLs:"
echo "  - Main site: https://sso.broker"
echo "  - Apple OIDC: https://apple.sso.broker"
echo "  - Google OIDC: https://google.sso.broker"
echo "  - GitHub OIDC: https://github.sso.broker"
echo "  - Direct worker: https://sso-broker.me-8f4.workers.dev"
echo ""
echo "Next steps:"
echo "1. Update client IDs in this script (lines 13-15) with your actual OAuth app client IDs"
echo "2. Set up OAuth provider secrets:"
echo "   wrangler secret put APPLE_CLIENT_SECRET"
echo "   wrangler secret put GOOGLE_CLIENT_SECRET"
echo "   wrangler secret put GITHUB_CLIENT_SECRET"
echo ""
echo "3. Generate and upload certificates and master secret:"
echo "   ./updatecerts.sh"
echo ""
echo "4. Test the endpoints:"
echo "   - Apple OIDC: https://apple.sso.broker/.well-known/openid-configuration"
echo "   - Google OIDC: https://google.sso.broker/.well-known/openid-configuration"
echo "   - GitHub OIDC: https://github.sso.broker/.well-known/openid-configuration"
echo "   - Main site: https://sso.broker"
