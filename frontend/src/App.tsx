import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import './App.css';

function App() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      {/* Navigation */}
      <nav style={{ borderBottom: '1px solid var(--border-primary)' }}>
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center">
              <h1 className="text-3xl font-black tracking-tight" style={{ 
                color: 'var(--text-primary)',
                fontFamily: '"JetBrains Mono", "Fira Code", "Monaco", "Consolas", monospace',
                letterSpacing: '-0.02em',
                fontVariant: 'small-caps',
                fontSize: '1.75rem'
              }}>
                sso.broker
              </h1>
            </Link>
            {!isHomePage && (
              <Link 
                to="/" 
                className="px-4 py-2 rounded transition-colors"
                style={{ 
                  backgroundColor: 'var(--button-secondary)', 
                  color: 'var(--text-primary)' 
                }}
              >
                ← Back to Home
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
      </Routes>

      {/* Footer - Only show on home page */}
      <Routes>
        <Route path="/" element={
      <footer className="py-12" style={{ borderTop: '1px solid var(--border-primary)' }}>
            <div className="container mx-auto px-6">
              <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <span className="text-2xl font-black tracking-tight" style={{ 
              color: 'var(--text-primary)',
              fontFamily: '"JetBrains Mono", "Fira Code", "Monaco", "Consolas", monospace',
              letterSpacing: '-0.02em',
              fontVariant: 'small-caps',
              fontSize: '1.5rem'
            }}>
              sso.broker
            </span>
          </div>
          <p className="text-sm" style={{ color: 'var(--text-tertiary)' }}>© 2025 sso.broker. Built with ❤️ for developers.</p>
          </div>
          
          {/* Terms and Privacy Links */}
          <div className="max-w-2xl mx-auto">
            <div className="flex justify-center gap-8">
              <Link 
                to="/terms" 
                className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
              >
                Terms of Service
              </Link>
              <Link 
                to="/privacy" 
                className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
              >
                Privacy Policy
              </Link>
            </div>
          </div>
        </div>
      </footer>
        } />
      </Routes>
    </div>
  );
}

export default App;
