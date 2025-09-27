import { useState, useEffect } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import OAuthInstructions from '../components/OAuthInstructions';
import SAMLInstructions from '../components/SAMLInstructions';
import AuthenticationStep from '../components/AuthenticationStep';

export default function Home() {
  const [providerFormat, setProviderFormat] = useState<'oauth' | 'saml' | null>(null);
  const [activeTab, setActiveTab] = useState('apple');
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setIsDarkMode(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (err) {
      console.error('Failed to copy text: ', err);
    }
  };

  return (
    <>
      {/* Hero Section */}
      <section className="container mx-auto px-6 py-20 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 text-primary">
            Skip the OAuth & SAML Setup Complexity
          </h1>
          <p className="text-xl leading-relaxed mb-6 text-secondary">
            Setting up Sign in with Apple, Google Sign-In, and GitHub OAuth/SAML is complex and time-consuming. 
            If your app just needs basic login without additional permissions, this is much easier.
          </p>
          <p className="text-lg leading-relaxed text-secondary">
            One unified provider that handles Apple, Google, and GitHub authentication for you - supporting both OIDC and SAML protocols.
          </p>
        </div>
      </section>

      {/* Quick Start Section */}
      <section id="docs" className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-3xl font-bold text-center mb-16 text-primary">Get Started in 4 Steps</h2>
          
          {/* Provider Format Selection */}
          {!providerFormat && (
            <div className="max-w-4xl mx-auto mb-12">
              <h3 className="text-xl font-semibold mb-6 text-primary">1. Choose Your Protocol</h3>
              <p className="text-lg mb-8 text-secondary">
                Select whether your client application uses OAuth or SAML for authentication:
              </p>
              <div className="grid md:grid-cols-2 gap-6">
                <button
                  onClick={() => setProviderFormat('oauth')}
                  className="p-6 rounded-lg border-2 border-solid transition-all hover:scale-105 bg-primary border-primary"
                >
                  <div className="text-center">
                    <div className="text-4xl mb-4">🔐</div>
                    <h4 className="text-xl font-semibold mb-2 text-primary">OAuth</h4>
                    <p className="text-sm text-secondary">
                      Modern, REST-based authentication. Perfect for web apps, mobile apps, and APIs.
                    </p>
                    <div className="mt-4 text-xs text-tertiary">
                      Uses: <code>*.sso.broker</code> subdomains
                    </div>
                  </div>
                </button>
                <button
                  onClick={() => setProviderFormat('saml')}
                  className="p-6 rounded-lg border-2 transition-all hover:scale-105 bg-primary border-primary border-solid"
                >
                  <div className="text-center">
                    <div className="text-4xl mb-4">🏢</div>
                    <h4 className="text-xl font-semibold mb-2 text-primary">SAML</h4>
                    <p className="text-sm text-secondary">
                      Enterprise-grade authentication. Ideal for corporate applications and SSO integrations.
                    </p>
                    <div className="mt-4 text-xs text-tertiary">
                      Uses: <code>*-saml.sso.broker</code> subdomains
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* Provider Selection */}
          {providerFormat && (
            <div className="max-w-4xl mx-auto mb-12">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold text-primary">
                  {providerFormat === 'oauth' ? '2. Choose Your OAuth Provider' : '2. Choose Your SAML Provider'}
                </h3>
                <button
                  onClick={() => setProviderFormat(null)}
                  className="text-sm px-3 py-1 rounded transition-colors btn-secondary"
                >
                  ← Back to Protocol Selection
                </button>
              </div>
              <div className="flex flex-wrap gap-4 mb-8">
                <button
                  onClick={() => setActiveTab('apple')}
                  className="px-6 py-3 rounded font-semibold transition-colors"
                  style={{
                    backgroundColor: activeTab === 'apple' ? 'var(--button-primary)' : 'var(--button-secondary)',
                    color: activeTab === 'apple' ? 'var(--bg-primary)' : 'var(--text-primary)'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== 'apple') {
                      e.currentTarget.style.backgroundColor = 'var(--button-secondary-hover)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== 'apple') {
                      e.currentTarget.style.backgroundColor = 'var(--button-secondary)';
                    }
                  }}
                >
                  Apple Sign-In
                </button>
                <button
                  onClick={() => setActiveTab('google')}
                  className="px-6 py-3 rounded font-semibold transition-colors"
                  style={{
                    backgroundColor: activeTab === 'google' ? 'var(--button-primary)' : 'var(--button-secondary)',
                    color: activeTab === 'google' ? 'var(--bg-primary)' : 'var(--text-primary)'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== 'google') {
                      e.currentTarget.style.backgroundColor = 'var(--button-secondary-hover)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== 'google') {
                      e.currentTarget.style.backgroundColor = 'var(--button-secondary)';
                    }
                  }}
                >
                  Google Sign-In
                </button>
                <button
                  onClick={() => setActiveTab('github')}
                  className="px-6 py-3 rounded font-semibold transition-colors"
                  style={{
                    backgroundColor: activeTab === 'github' ? 'var(--button-primary)' : 'var(--button-secondary)',
                    color: activeTab === 'github' ? 'var(--bg-primary)' : 'var(--text-primary)'
                  }}
                  onMouseEnter={(e) => {
                    if (activeTab !== 'github') {
                      e.currentTarget.style.backgroundColor = 'var(--button-secondary-hover)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (activeTab !== 'github') {
                      e.currentTarget.style.backgroundColor = 'var(--button-secondary)';
                    }
                  }}
                >
                  GitHub Sign-In
                </button>
              </div>
              
              <div className="p-6 rounded-lg border bg-secondary border-primary">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm font-medium text-secondary">
                    {providerFormat === 'oauth' ? 'Your OIDC Issuer' : 'Your SAML Entity ID'}
                  </span>
                  <button 
                    onClick={() => copyToClipboard(providerFormat === 'oauth' 
                      ? `https://${activeTab}.sso.broker` 
                      : `${activeTab}-saml.sso.broker`)}
                    className="text-sm font-medium"
                    text-secondary
                  >
                    {copiedText === (providerFormat === 'oauth' 
                      ? `https://${activeTab}.sso.broker` 
                      : `${activeTab}-saml.sso.broker`) ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <code className="text-lg font-mono" text-primary>
                  {providerFormat === 'oauth' 
                    ? `https://${activeTab}.sso.broker` 
                    : `${activeTab}-saml.sso.broker`}
                </code>
              </div>
            </div>
          )}

          {/* Code Examples */}
          {providerFormat && (
            <div className="max-w-4xl mx-auto px-4">
              {providerFormat === 'oauth' ? (
                <>
                  <OAuthInstructions 
                    activeTab={activeTab}
                    copiedText={copiedText}
                    isDarkMode={isDarkMode}
                    copyToClipboard={copyToClipboard}
                  />
                  <AuthenticationStep 
                    activeTab={activeTab}
                    copiedText={copiedText}
                    isDarkMode={isDarkMode}
                    copyToClipboard={copyToClipboard}
                    providerFormat={providerFormat}
                  />
                </>
              ) : (
                <SAMLInstructions 
                  activeTab={activeTab}
                  copiedText={copiedText}
                  isDarkMode={isDarkMode}
                  copyToClipboard={copyToClipboard}
                />
              )}

              {/* Technical Details Section - Only show for OAuth */}
              {providerFormat === 'oauth' && (
                <div className="mt-8 p-6 rounded-lg border bg-primary border-primary">
                  <div className="flex items-center mb-4">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-3 btn-primary">⚙️</div>
                    <h3 className="text-lg font-semibold text-primary">Technical Details</h3>
                  </div>
                  <div className="grid sm:grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg bg-secondary">
                      <h4 className="font-semibold mb-2 text-primary">🔄 Token Exchange</h4>
                      <p className="text-sm mb-2 text-secondary">
                        Exchange the authorization code for access and ID tokens.
                      </p>
                      <div className="relative">
                        <button 
                          onClick={() => copyToClipboard(`curl -X POST https://github.sso.broker/token \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=authorization_code" \\
  -d "code=e<encrypted_email_code>" \\
  -d "redirect_uri=https://myapp.com/callback" \\
  -d "client_id=c<client_id>" \\
  -d "client_secret=s<client_secret>"`)}
                          className="absolute top-2 right-2 z-10 px-2 py-1 rounded text-xs transition-colors copy-btn"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--copy-button-hover)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--copy-button-bg)';
                          }}
                        >
                          Copy
                        </button>
                        <SyntaxHighlighter
                          language="bash"
                          style={isDarkMode ? oneDark : oneLight}
                          customStyle={{
                            margin: 0,
                            borderRadius: '0.5rem',
                            fontSize: '0.75rem',
                            padding: '1rem',
                            background: 'var(--code-bg)',
                            overflowX: 'auto',
                            whiteSpace: 'pre-wrap !important',
                            wordBreak: 'break-all',
                            maxWidth: '100%',
                            width: '100%',
                            boxSizing: 'border-box',
                            minWidth: 0
                          }}
                          wrapLines={true}
                          wrapLongLines={true}
                          className="syntax-highlighter-override"
                        >
{`curl -X POST https://github.sso.broker/token \\
  -H "Content-Type: application/x-www-form-urlencoded" \\
  -d "grant_type=authorization_code" \\
  -d "code=e<encrypted_email_code>" \\
  -d "redirect_uri=https://myapp.com/callback" \\
  -d "client_id=c<client_id>" \\
  -d "client_secret=s<client_secret>"`}
                        </SyntaxHighlighter>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary">
                      <h4 className="font-semibold mb-2 text-primary">📧 Token Response</h4>
                      <p className="text-sm mb-2 text-secondary">
                        The user's email is included directly in the token exchange response for immediate access.
                      </p>
                      <div className="relative">
                        <button 
                          onClick={() => copyToClipboard(`{
  "access_token": "e<encrypted_email_code>",
  "token_type": "Bearer",
  "expires_in": 3600,
  "id_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "scope": "user:email",
  "email": "user@example.com"
}`)}
                          className="absolute top-2 right-2 z-10 px-2 py-1 rounded text-xs transition-colors copy-btn"
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--copy-button-hover)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'var(--copy-button-bg)';
                          }}
                        >
                          Copy
                        </button>
                        <SyntaxHighlighter
                          language="json"
                          style={isDarkMode ? oneDark : oneLight}
                          customStyle={{
                            margin: 0,
                            borderRadius: '0.5rem',
                            fontSize: '0.75rem',
                            padding: '1rem',
                            background: 'var(--code-bg)',
                            overflowX: 'auto',
                            whiteSpace: 'pre-wrap !important',
                            wordBreak: 'break-all',
                            maxWidth: '100%',
                            width: '100%',
                            boxSizing: 'border-box',
                            minWidth: 0
                          }}
                          wrapLines={true}
                          wrapLongLines={true}
                          className="syntax-highlighter-override"
                        >
{`{
  "access_token": "e<encrypted_email_code>",
  "token_type": "Bearer",
  "expires_in": 3600,
  "id_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "scope": "user:email",
  "email": "user@example.com"
}`}
                        </SyntaxHighlighter>
                      </div>
                    </div>
                    <div className="p-4 rounded-lg bg-secondary">
                      <h4 className="font-semibold mb-2 text-primary">🔐 Cryptographic Security</h4>
                      <p className="text-sm mb-2 text-secondary">
                        Client IDs are cryptographically signed and contain all necessary information for validation.
                      </p>
                      <ul className="text-sm space-y-1 text-secondary">
                        <li>• No storage required - stateless validation</li>
                        <li>• Cryptographically signed for security</li>
                        <li>• Contains app name and redirect URIs</li>
                        <li>• Tamper-proof and verifiable</li>
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
