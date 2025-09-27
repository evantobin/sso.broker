import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface AuthenticationStepProps {
  activeTab: string;
  copiedText: string | null;
  isDarkMode: boolean;
  copyToClipboard: (text: string) => void;
  providerFormat: 'oauth' | 'saml';
}

export default function AuthenticationStep({ activeTab, copiedText, isDarkMode, copyToClipboard, providerFormat }: AuthenticationStepProps) {
  if (providerFormat === 'oauth') {
    return (
      <div className="mt-8 p-6 rounded-lg border" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-primary)' }}>
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-3" style={{ backgroundColor: 'var(--button-primary)', color: 'var(--bg-primary)' }}>5</div>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Start Authentication</h3>
        </div>
        <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>Redirect users to authorize endpoint:</p>
        <div className="relative">
          <button 
            onClick={() => copyToClipboard(`https://${activeTab}.sso.broker/authorize?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=https://yourapp.com/callback&scope=openid%20email`)}
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
            {copiedText === `https://${activeTab}.sso.broker/authorize?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=https://yourapp.com/callback&scope=openid%20email` ? 'Copied!' : 'Copy'}
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
{`https://${activeTab}.sso.broker/authorize?
  response_type=code&
  client_id=YOUR_CLIENT_ID&
  redirect_uri=
    https://yourapp.com/callback&
  scope=openid%20email`}
          </SyntaxHighlighter>
        </div>
      </div>
    );
  }

  return null; // SAML authentication step is handled in SAMLInstructions
}
