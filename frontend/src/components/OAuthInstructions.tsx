import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneLight, oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface OAuthInstructionsProps {
  activeTab: string;
  copiedText: string | null;
  isDarkMode: boolean;
  copyToClipboard: (text: string) => void;
}

export default function OAuthInstructions({ activeTab, copiedText, isDarkMode, copyToClipboard }: OAuthInstructionsProps) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Step 3: Register Client (OAuth) */}
      <div className="p-6 rounded-lg border" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-primary)' }}>
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-3" style={{ backgroundColor: 'var(--button-primary)', color: 'var(--bg-primary)' }}>3</div>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Register Your Client</h3>
        </div>
        <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>POST to register endpoint with your app name:</p>
        <div className="relative">
          <button 
            onClick={() => copyToClipboard(`curl -X POST https://${activeTab}.sso.broker/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "client_name": "My Awesome App",
    "redirect_uris": ["https://yourapp.com/callback"]
  }'`)}
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
            {copiedText === `curl -X POST https://${activeTab}.sso.broker/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "client_name": "My Awesome App",
    "redirect_uris": ["https://yourapp.com/callback"]
  }'` ? 'Copied!' : 'Copy'}
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
{`curl -X POST \\
  https://${activeTab}.sso.broker/register \\
  -H "Content-Type: application/json" \\
  -d '{
    "client_name": "My Awesome App",
    "redirect_uris": ["https://yourapp.com/callback"]
  }'`}
          </SyntaxHighlighter>
        </div>
        <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
          <div className="flex items-start">
            <div className="flex-shrink-0 mr-3">
              <div className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: 'var(--button-primary)', color: 'var(--bg-primary)' }}>ℹ</div>
            </div>
            <div>
              <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>App Name Required</p>
              <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
                The <code className="px-1 py-0.5 rounded text-xs" style={{ backgroundColor: 'var(--code-bg)', color: 'var(--text-primary)' }}>client_name</code> field is required and will be displayed to users during the consent screen. Choose a clear, descriptive name for your application.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Step 4: Configure OIDC */}
      <div className="p-6 rounded-lg border" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-primary)' }}>
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm mr-3" style={{ backgroundColor: 'var(--button-primary)', color: 'var(--bg-primary)' }}>4</div>
          <h3 className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>Configure OIDC</h3>
        </div>
        <p className="mb-4" style={{ color: 'var(--text-secondary)' }}>Use standard OIDC endpoints:</p>
        <div className="relative">
          <button 
            onClick={() => copyToClipboard(`{
  "issuer": "https://${activeTab}.sso.broker",
  "authorization_endpoint": "https://${activeTab}.sso.broker/authorize",
  "token_endpoint": "https://${activeTab}.sso.broker/token",
  "userinfo_endpoint": "https://${activeTab}.sso.broker/userinfo"
}`)}
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
            {copiedText === `{
  "issuer": "https://${activeTab}.sso.broker",
  "authorization_endpoint": "https://${activeTab}.sso.broker/authorize",
  "token_endpoint": "https://${activeTab}.sso.broker/token",
  "userinfo_endpoint": "https://${activeTab}.sso.broker/userinfo"
}` ? 'Copied!' : 'Copy'}
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
  "issuer": "https://${activeTab}.sso.broker",
  "authorization_endpoint": 
    "https://${activeTab}.sso.broker/authorize",
  "token_endpoint": 
    "https://${activeTab}.sso.broker/token",
  "userinfo_endpoint": 
    "https://${activeTab}.sso.broker/userinfo"
}`}
          </SyntaxHighlighter>
        </div>
      </div>
    </div>
  );
}
