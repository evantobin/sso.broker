import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface SAMLInstructionsProps {
  activeTab: string;
  copiedText: string | null;
  isDarkMode: boolean;
  copyToClipboard: (text: string) => void;
}

export default function SAMLInstructions({ activeTab, copiedText, isDarkMode, copyToClipboard }: SAMLInstructionsProps) {
  return (
    <div className="space-y-8">
      {/* Step 3: Get SAML Metadata */}
      <div className="p-6 rounded-lg border" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-primary)' }}>
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-3" style={{ backgroundColor: 'var(--button-primary)', color: 'var(--bg-primary)' }}>3</div>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Get SAML Metadata</h3>
        </div>
        <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>Download the SAML metadata for your Service Provider configuration:</p>
        <div className="relative">
          <button 
            onClick={() => copyToClipboard(`curl https://${activeTab}-saml.sso.broker/metadata`)}
            className="absolute top-2 right-2 z-10 px-2 py-1 rounded text-xs transition-colors"
            style={{ 
              backgroundColor: 'var(--copy-button-bg)', 
              color: 'var(--copy-button-text)' 
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--copy-button-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--copy-button-bg)';
            }}
          >
            {copiedText === `curl https://${activeTab}-saml.sso.broker/metadata` ? 'Copied!' : 'Copy'}
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
{`curl https://${activeTab}-saml.sso.broker/metadata`}
          </SyntaxHighlighter>
        </div>
      </div>

      {/* Step 4: Configure Service Provider */}
      <div className="p-6 rounded-lg border" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-primary)' }}>
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-3" style={{ backgroundColor: 'var(--button-primary)', color: 'var(--bg-primary)' }}>4</div>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Configure Your Service Provider</h3>
        </div>
        <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>Configure your SAML Service Provider with these settings:</p>
        <div className="relative">
          <button 
            onClick={() => copyToClipboard(`Entity ID: https://${activeTab}-saml.sso.broker
SSO URL: https://${activeTab}-saml.sso.broker/saml/sso
SLO URL: https://${activeTab}-saml.sso.broker/saml/slo
Name ID Format: urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress`)}
            className="absolute top-2 right-2 z-10 px-2 py-1 rounded text-xs transition-colors"
            style={{ 
              backgroundColor: 'var(--copy-button-bg)', 
              color: 'var(--copy-button-text)' 
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--copy-button-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--copy-button-bg)';
            }}
          >
            {copiedText === `Entity ID: https://${activeTab}-saml.sso.broker
SSO URL: https://${activeTab}-saml.sso.broker/saml/sso
SLO URL: https://${activeTab}-saml.sso.broker/saml/slo
Name ID Format: urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress` ? 'Copied!' : 'Copy'}
          </button>
          <SyntaxHighlighter
            language="text"
            style={isDarkMode ? oneDark : oneLight}
            customStyle={{
              margin: 0,
              borderRadius: '0.5rem',
              fontSize: '0.75rem',
              padding: '1rem',
              background: 'var(--code-bg)',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap !important',
              wordBreak: 'break-word',
              maxWidth: '100%',
              width: '100%',
              boxSizing: 'border-box',
              minWidth: 0
            }}
            wrapLines={true}
            wrapLongLines={true}
            className="syntax-highlighter-override"
          >
{`Entity ID: https://${activeTab}-saml.sso.broker
SSO URL: https://${activeTab}-saml.sso.broker/saml/sso
SLO URL: https://${activeTab}-saml.sso.broker/saml/slo
Name ID Format: urn:oasis:names:tc:SAML:1.1:nameid-format:emailAddress`}
          </SyntaxHighlighter>
        </div>
      </div>

      {/* Step 5: Initiate SAML Authentication */}
      <div className="p-6 rounded-lg border" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-primary)' }}>
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-3" style={{ backgroundColor: 'var(--button-primary)', color: 'var(--bg-primary)' }}>5</div>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Initiate SAML Authentication</h3>
        </div>
        <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>Redirect users to the SAML SSO endpoint:</p>
        <div className="relative">
          <button 
            onClick={() => copyToClipboard(`https://${activeTab}-saml.sso.broker/saml/sso?SAMLRequest=<base64_encoded_request>&RelayState=<state>`)}
            className="absolute top-2 right-2 z-10 px-2 py-1 rounded text-xs transition-colors"
            style={{ 
              backgroundColor: 'var(--copy-button-bg)', 
              color: 'var(--copy-button-text)' 
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--copy-button-hover)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--copy-button-bg)';
            }}
          >
            {copiedText === `https://${activeTab}-saml.sso.broker/saml/sso?SAMLRequest=<base64_encoded_request>&RelayState=<state>` ? 'Copied!' : 'Copy'}
          </button>
          <SyntaxHighlighter
            language="text"
            style={isDarkMode ? oneDark : oneLight}
            customStyle={{
              margin: 0,
              borderRadius: '0.5rem',
              fontSize: '0.75rem',
              padding: '1rem',
              background: 'var(--code-bg)',
              overflowX: 'auto',
              whiteSpace: 'pre-wrap !important',
              wordBreak: 'break-word',
              maxWidth: '100%',
              width: '100%',
              boxSizing: 'border-box',
              minWidth: 0
            }}
            wrapLines={true}
            wrapLongLines={true}
            className="syntax-highlighter-override"
          >
{`https://${activeTab}-saml.sso.broker/saml/sso?
  SAMLRequest=<base64_encoded_request>&
  RelayState=<state>`}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  );
}
