export interface Tutorial {
  id: string;
  title: string;
  description: string;
  category: string;
  estimatedTime: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  tags: string[];
  content: string;
  lastUpdated: string;
}

export const tutorials: Tutorial[] = [
  {
    id: 'microsoft-entra-apple-id',
    title: 'Configuring Microsoft Entra ID to Use Apple ID for Login',
    description: 'Learn how to set up Microsoft Entra ID to authenticate users with Apple ID credentials via SAML',
    category: 'SAML Integration',
    estimatedTime: '15 minutes',
    difficulty: 'Intermediate',
    tags: ['Microsoft Entra ID', 'Apple ID', 'SAML', 'Authentication'],
    lastUpdated: '2025-09-28',
    content: `This comprehensive tutorial will guide you through setting up Microsoft Entra ID (formerly Azure Active Directory) to use Apple ID as an authentication method via SAML. This allows users to sign in to Microsoft services using their Apple ID credentials seamlessly.

## Prerequisites

You'll need administrative access to Microsoft Entra ID and a configured SAML Identity Provider (like sso.broker) that supports Apple ID authentication.

## Step 1: Configure Domain Federation

First, you need to configure domain federation in Microsoft Entra ID using PowerShell:

\`\`\`powershell
# Connect to Microsoft Graph PowerShell
Connect-MgGraph -Scopes "Domain.ReadWrite.All"

# Set your domain ID (replace with your actual domain)
$domainId = "your-domain.onmicrosoft.com"

# Configure domain federation parameters
$domainAuthParams = @{
    DomainId = $domainId
    ActiveSignInUri = "https://apple-saml.sso.broker/saml/sso?entra=YOUR_TENANT_ID"
    PassiveSignInUri = "https://apple-saml.sso.broker/saml/sso?entra=YOUR_TENANT_ID"
    IssuerUri = "urn:apple-saml.sso.broker"
    DisplayName = "Apple SAML Broker"
    FederatedIdpMfaBehavior = "acceptIfMfaDoneByFederatedIdp"
    PreferredAuthenticationProtocol = "saml"
}

# Create the federation configuration
New-MgDomainFederationConfiguration @domainAuthParams
\`\`\`

**Important:** Replace \`YOUR_TENANT_ID\` with your actual Microsoft Entra ID tenant ID. You can find this in the Azure Portal under Azure Active Directory → Overview.

## Step 2: Verify Domain Federation Configuration

After running the PowerShell command, you can verify the configuration was created successfully:

\`\`\`powershell
# Check the federation configuration
Get-MgDomainFederationConfiguration -DomainId $domainId

# You should see output similar to:
# DisplayName       Id                                   IssuerUri
# -----------       --                                   ---------
# Apple SAML Broker 150f5e87-d539-4790-9e73-de1b6a130f45 urn:apple-saml.sso.broker
\`\`\`

**Note:** The PowerShell command automatically creates the SAML application configuration in Microsoft Entra ID. No additional manual configuration is needed.

## Step 3: Create Users in Microsoft Entra ID

Before users can authenticate with Apple ID, they need to be created in Microsoft Entra ID. Use PowerShell to create users:

\`\`\`powershell
# Create a new user in Microsoft Entra ID
New-MgUser -DisplayName "John Doe" -UserPrincipalName "john@company.com" -accountEnabled -mailNickname "johndoe" -PasswordProfile @{Password="SecurePassword123!"} -OnPremisesImmutableId "john@company.com"
\`\`\`

**Important:** The \`OnPremisesImmutableId\` should match the email address that will be used for Apple ID authentication. This creates the link between the Entra ID user and the SAML assertion.

For multiple users, you can create them in bulk:

\`\`\`powershell
# Example: Create multiple users
$users = @(
    @{DisplayName="John Doe"; UPN="john@company.com"; MailNickname="johndoe"},
    @{DisplayName="Jane Smith"; UPN="jane@company.com"; MailNickname="janesmith"}
)

foreach ($user in $users) {
    New-MgUser -DisplayName $user.DisplayName -UserPrincipalName $user.UPN -accountEnabled -mailNickname $user.MailNickname -PasswordProfile @{Password="SecurePassword123!"} -OnPremisesImmutableId $user.UPN
}
\`\`\`

## Step 4: Test the Configuration

Test your configuration by attempting to log into the Azure Portal:

1. Go to **portal.azure.com**
2. Enter the email address of a user you created in Step 3
3. Click **Next** to proceed with authentication
4. You should be redirected to the Apple ID login page
5. After successful Apple ID authentication, you should be redirected back to Microsoft and logged into the Azure Portal

**Success!** If you can successfully sign in to the Azure Portal using your Apple ID, the configuration is working correctly.

## Troubleshooting

### Common Issues

- **AADSTS51004:** User account doesn't exist in directory - Create the user using \`New-MgUser\` PowerShell command
- **AADSTS500081:** SAML assertion validation failed - Check XML signature
- **AADSTS50186:** Unpermitted realm - Verify issuer configuration
- **Authentication fails:** Ensure \`OnPremisesImmutableId\` matches the email in SAML assertion

## Additional Resources

- [Microsoft SAML Protocol Documentation](https://docs.microsoft.com/en-us/azure/active-directory/develop/single-sign-on-saml-protocol)
- [SAML Token Reference](https://docs.microsoft.com/en-us/azure/active-directory/develop/reference-saml-tokens)
- [Federated SAML Identity Provider Guide](https://docs.microsoft.com/en-us/azure/active-directory/develop/howto-v1-federated-saml-idp)`
  }
];