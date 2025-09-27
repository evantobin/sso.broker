# Certificate Management for sso.broker

This document explains how to manage certificates and secrets for the sso.broker application.

## Quick Start

```bash
cd scripts
./updatecerts.sh
```

## What This Script Does

### `scripts/updatecerts.sh`
- Generates a 32-byte master secret
- Creates a 2048-bit RSA private key
- Generates a SAML certificate valid for 10 years
- Uploads all secrets to Cloudflare Workers
- Colored output and comprehensive error handling

## Generated Secrets

### Master Secret (`MASTER_SECRET`)
- Used for signing client credentials
- 32 bytes, base64 encoded
- Should be kept secure

### SAML Certificate (`SAML_CERT`)
- X.509 certificate for SAML assertions
- Valid for 10 years
- Subject: `/C=US/ST=FL/L=Kissimmee/O=sso.broker/OU=IT/CN=sso.broker`

### SAML Private Key (`SAML_PRIVATE_KEY`)
- 2048-bit RSA private key
- Used to sign SAML assertions
- Must be kept secure

## Certificate Regeneration

### Fresh Certificates Anytime
Run the script anytime to generate fresh certificates:
```bash
cd scripts
./updatecerts.sh
```

There's no downside to regenerating certificates frequently - it's actually better for security!

## Security Notes

1. **Certificate Storage**: All secrets are stored securely in Cloudflare Workers secrets.

2. **Key Rotation**: Consider rotating the master secret periodically for enhanced security.

## Troubleshooting

### OpenSSL Not Found
```bash
# macOS
brew install openssl

# Ubuntu/Debian
sudo apt-get install openssl
```

### Wrangler Not Found
```bash
npm install -g wrangler
```

### Permission Denied
```bash
chmod +x scripts/updatecerts.sh
```

### Wrong Directory
```bash
# Make sure you're in the scripts directory
cd scripts
./updatecerts.sh
```

## File Structure After Running Scripts

```
sso.broker/
├── scripts/
│   └── updatecerts.sh             # Certificate generation script
└── workers/
    └── wrangler.toml              # Cloudflare Worker configuration
```

## Verification

After running the scripts, verify the deployment:

1. **Check Worker Secrets**:
   ```bash
   wrangler secret list
   ```

2. **Test SAML Metadata**:
   ```bash
   curl https://apple-saml.sso.broker/metadata
   ```

3. **Verify Certificate**:
   ```bash
   # Check the certificate in the SAML metadata
   curl https://apple-saml.sso.broker/metadata | grep -A 1 "X509Certificate"
   ```

## Best Practices

1. **Regular Renewal**: Set up a calendar reminder to renew certificates before expiration
2. **Monitoring**: Monitor certificate expiration dates
3. **Documentation**: Document any custom certificate configurations
4. **Testing**: Always test after certificate updates

## Support

If you encounter issues:
1. Check the script output for error messages
2. Verify OpenSSL and Wrangler are installed
3. Ensure you're in the correct directory
4. Check Cloudflare API token permissions
