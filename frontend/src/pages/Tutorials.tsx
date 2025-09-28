import React from 'react';

const Tutorials: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-4xl font-bold text-gray-900 mb-8">Tutorials</h1>
      
      <div className="space-y-8">
        {/* Microsoft Entra ID with Apple ID Tutorial */}
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">
            Configuring Microsoft Entra ID to Use Apple ID for Login
          </h2>
          
          <div className="prose max-w-none">
            <p className="text-gray-700 mb-6">
              This tutorial will guide you through setting up Microsoft Entra ID (formerly Azure Active Directory) 
              to use Apple ID as an authentication method via SAML. This allows users to sign in to Microsoft 
              services using their Apple ID credentials.
            </p>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
              <p className="text-blue-800">
                <strong>Prerequisites:</strong> You'll need administrative access to Microsoft Entra ID and 
                a configured SAML Identity Provider (like sso.broker) that supports Apple ID authentication.
              </p>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Step 1: Configure Domain Federation</h3>
            
            <p className="text-gray-700 mb-4">
              First, you need to configure domain federation in Microsoft Entra ID using PowerShell:
            </p>

            <div className="bg-gray-100 rounded-lg p-4 mb-4">
              <pre className="text-sm overflow-x-auto">
{`# Connect to Microsoft Graph PowerShell
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
New-MgDomainFederationConfiguration @domainAuthParams`}
              </pre>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <p className="text-yellow-800">
                <strong>Important:</strong> Replace <code>YOUR_TENANT_ID</code> with your actual Microsoft Entra ID tenant ID. 
                You can find this in the Azure Portal under Azure Active Directory → Overview.
              </p>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Step 2: Verify Domain Federation Configuration</h3>
            
            <p className="text-gray-700 mb-4">
              After running the PowerShell command, you can verify the configuration was created successfully:
            </p>

            <div className="bg-gray-100 rounded-lg p-4 mb-4">
              <pre className="text-sm overflow-x-auto">
{`# Check the federation configuration
Get-MgDomainFederationConfiguration -DomainId $domainId

# You should see output similar to:
# DisplayName       Id                                   IssuerUri
# -----------       --                                   ---------
# Apple SAML Broker 150f5e87-d539-4790-9e73-de1b6a130f45 urn:apple-saml.sso.broker`}
              </pre>
            </div>

            <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
              <p className="text-blue-800">
                <strong>Note:</strong> The PowerShell command automatically creates the SAML application configuration 
                in Microsoft Entra ID. No additional manual configuration is needed.
              </p>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Step 3: Configure User Attributes</h3>
            
            <p className="text-gray-700 mb-4">
              Set up the user attributes that will be sent from your SAML Identity Provider:
            </p>

            <div className="bg-gray-100 rounded-lg p-4 mb-4">
              <h4 className="font-semibold mb-2">Required Claims:</h4>
              <ul className="list-disc list-inside space-y-1 text-sm">
                <li><strong>Name ID:</strong> <code>http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier</code></li>
                <li><strong>Email Address:</strong> <code>http://schemas.xmlsoap.org/ws/2005/05/identity/claims/emailaddress</code></li>
                <li><strong>Display Name:</strong> <code>http://schemas.xmlsoap.org/ws/2005/05/identity/claims/name</code></li>
                <li><strong>UPN:</strong> <code>http://schemas.xmlsoap.org/ws/2005/05/identity/claims/upn</code></li>
              </ul>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Step 4: Create Users in Microsoft Entra ID</h3>
            
            <p className="text-gray-700 mb-4">
              Before users can authenticate with Apple ID, they need to be created in Microsoft Entra ID. 
              Use PowerShell to create users:
            </p>

            <div className="bg-gray-100 rounded-lg p-4 mb-4">
              <pre className="text-sm overflow-x-auto">
{`# Create a new user in Microsoft Entra ID
New-MgUser -DisplayName "John Doe" -UserPrincipalName "john@company.com" -accountEnabled -mailNickname "johndoe" -PasswordProfile @{Password="SecurePassword123!"} -OnPremisesImmutableId "john@company.com"`}
              </pre>
            </div>

            <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
              <p className="text-yellow-800">
                <strong>Important:</strong> The <code>OnPremisesImmutableId</code> should match the email address 
                that will be used for Apple ID authentication. This creates the link between the Entra ID user 
                and the SAML assertion.
              </p>
            </div>

            <p className="text-gray-700 mb-4">
              For multiple users, you can create them in bulk:
            </p>

            <div className="bg-gray-100 rounded-lg p-4 mb-6">
              <pre className="text-sm overflow-x-auto">
{`# Example: Create multiple users
$users = @(
    @{DisplayName="John Doe"; UPN="john@company.com"; MailNickname="johndoe"},
    @{DisplayName="Jane Smith"; UPN="jane@company.com"; MailNickname="janesmith"}
)

foreach ($user in $users) {
    New-MgUser -DisplayName $user.DisplayName -UserPrincipalName $user.UPN -accountEnabled -mailNickname $user.MailNickname -PasswordProfile @{Password="SecurePassword123!"} -OnPremisesImmutableId $user.UPN
}`}
              </pre>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Step 5: Test the Configuration</h3>
            
            <p className="text-gray-700 mb-4">
              Test your configuration by accessing the application:
            </p>

            <ol className="list-decimal list-inside space-y-3 text-gray-700 mb-6">
              <li>Go to <strong>My Apps</strong> (myapps.microsoft.com)</li>
              <li>Find your configured application</li>
              <li>Click on it to initiate the SAML authentication flow</li>
              <li>You should be redirected to the Apple ID login page</li>
              <li>After successful authentication, you should be redirected back to Microsoft</li>
            </ol>

            <div className="bg-green-50 border-l-4 border-green-400 p-4 mb-6">
              <p className="text-green-800">
                <strong>Success!</strong> If you can successfully sign in using your Apple ID, 
                the configuration is working correctly.
              </p>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Troubleshooting</h3>
            
            <div className="space-y-4">
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <h4 className="font-semibold text-red-800 mb-2">Common Issues:</h4>
                <ul className="list-disc list-inside space-y-1 text-red-700 text-sm">
                  <li><strong>AADSTS51004:</strong> User account doesn't exist in directory - Create the user using <code>New-MgUser</code> PowerShell command</li>
                  <li><strong>AADSTS500081:</strong> SAML assertion validation failed - Check XML signature</li>
                  <li><strong>AADSTS50186:</strong> Unpermitted realm - Verify issuer configuration</li>
                  <li><strong>Authentication fails:</strong> Ensure <code>OnPremisesImmutableId</code> matches the email in SAML assertion</li>
                </ul>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-gray-900 mt-8 mb-4">Additional Resources</h3>
            
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li><a href="https://docs.microsoft.com/en-us/azure/active-directory/develop/single-sign-on-saml-protocol" className="text-blue-600 hover:text-blue-800">Microsoft SAML Protocol Documentation</a></li>
              <li><a href="https://docs.microsoft.com/en-us/azure/active-directory/develop/reference-saml-tokens" className="text-blue-600 hover:text-blue-800">SAML Token Reference</a></li>
              <li><a href="https://docs.microsoft.com/en-us/azure/active-directory/develop/howto-v1-federated-saml-idp" className="text-blue-600 hover:text-blue-800">Federated SAML Identity Provider Guide</a></li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tutorials;
