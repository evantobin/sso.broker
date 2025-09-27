#!/bin/bash

# sso.broker Certificate and Secret Generation Script
set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

echo -e "${BLUE}🔐 sso.broker Certificate and Secret Management${NC}"
echo "=================================================="
echo ""

# Check prerequisites
print_status "Checking prerequisites..."

if ! command_exists openssl; then
    print_error "OpenSSL is not installed. Please install OpenSSL first."
    echo "On macOS: brew install openssl"
    echo "On Ubuntu/Debian: sudo apt-get install openssl"
    exit 1
fi

if ! command_exists wrangler; then
    print_error "Wrangler is not installed. Installing..."
    npm install -g wrangler
fi

print_success "Prerequisites check passed"
echo ""

# Check if we're in the right directory (scripts folder)
if [ ! -f "../workers/wrangler.toml" ]; then
    print_error "Please run this script from the scripts directory"
    exit 1
fi


# Create a temporary directory for certificates
TEMP_DIR=$(mktemp -d)
print_status "Using temporary directory: $TEMP_DIR"

# Generate a strong master secret (32 bytes, base64 encoded)
print_status "Generating master secret..."
MASTER_SECRET=$(openssl rand -base64 32 | tr -d "=+/" | cut -c1-32)
print_success "Master secret generated"

# Generate SAML private key (2048-bit RSA)
print_status "Generating SAML private key (2048-bit RSA)..."
openssl genrsa -out "$TEMP_DIR/saml-private-key.pem" 2048
print_success "SAML private key generated"

# Generate SAML certificate (valid for 10 years)
print_status "Generating SAML certificate (valid for 3650 days)..."
openssl req -new -x509 -key "$TEMP_DIR/saml-private-key.pem" -out "$TEMP_DIR/saml-cert.pem" -days 3650 -subj "/C=US/ST=FL/L=Kissimmee/O=sso.broker/OU=IT/CN=sso.broker"
print_success "SAML certificate generated"


# Read the certificate and private key
# For SAML metadata, we need just the base64 content without PEM markers
SAML_CERT=$(openssl x509 -in "$TEMP_DIR/saml-cert.pem" -outform der | base64 -w 0)
SAML_PRIVATE_KEY=$(cat "$TEMP_DIR/saml-private-key.pem")

# Clean up temporary files
rm -rf "$TEMP_DIR"
print_success "Cleaned up temporary files"

echo ""
print_status "Uploading secrets to Cloudflare..."

# Upload master secret
print_status "Uploading master secret..."
cd ../workers
echo "$MASTER_SECRET" | wrangler secret put MASTER_SECRET
print_success "Master secret uploaded"

# Upload SAML certificate
print_status "Uploading SAML certificate..."
echo "$SAML_CERT" | wrangler secret put SAML_CERT
print_success "SAML certificate uploaded"

# Upload SAML private key
print_status "Uploading SAML private key..."
echo "$SAML_PRIVATE_KEY" | wrangler secret put SAML_PRIVATE_KEY
print_success "SAML private key uploaded"
cd ../scripts

echo ""
echo -e "${GREEN}🎉 All secrets and certificates have been generated and uploaded!${NC}"
echo ""
echo "📋 Summary:"
echo "  - Master Secret: Generated and uploaded"
echo "  - SAML Certificate: Generated and uploaded (valid for 3650 days)"
echo "  - SAML Private Key: Generated and uploaded"
echo ""
echo "🔍 Certificate Details:"
echo "  - Subject: /C=US/ST=FL/L=Kissimmee/O=sso.broker/OU=IT/CN=sso.broker"
echo "  - Validity: 3650 days (10 years) from today"
echo "  - Key Size: 2048-bit RSA"
echo ""
echo ""
print_warning "Important Notes:"
echo "  - The SAML certificate is valid for 3650 days (10 years)"
echo "  - Run this script anytime to generate fresh certificates (no downside to frequent regeneration)"
echo "  - Keep the master secret secure - it's used for client credential signing"
echo "  - The SAML certificate is used for signing SAML assertions"
echo ""
echo ""
echo -e "${GREEN}✅ Your sso.broker is now ready with proper certificates and secrets!${NC}"
