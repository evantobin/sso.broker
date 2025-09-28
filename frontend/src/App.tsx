import { Routes, Route, Link, useLocation } from 'react-router-dom';
import Home from './pages/Home';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import Tutorials from './pages/Tutorials';
import './App.css';

function App() {
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  return (
    <div className="min-h-screen bg-primary text-primary">
      {/* Navigation */}
      <nav className="border-b border-primary">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center">
              <h1 className="text-3xl font-black tracking-tight brand-logo brand-logo-large">
                sso.broker
              </h1>
            </Link>
            <div className="flex items-center gap-4">
              <a 
                href="https://github.com/evantobin/sso.broker" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all hover:scale-105 btn-secondary"
              >
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <span className="hidden sm:inline">Source Code</span>
                <span className="sm:hidden">Code</span>
              </a>
              {!isHomePage && (
                <Link 
                  to="/" 
                  className="px-4 py-2 rounded transition-colors btn-secondary"
                >
                  ← Back to Home
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/tutorials" element={<Tutorials />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
      </Routes>

      {/* Footer - Only show on home page */}
      <Routes>
        <Route path="/" element={
      <footer className="py-12 border-t border-primary">
            <div className="container mx-auto px-6">
              <div className="text-center mb-8">
          <div className="flex items-center justify-center mb-4">
            <span className="text-2xl font-black tracking-tight brand-logo brand-logo-medium">
              sso.broker
            </span>
          </div>
          <p className="text-sm text-tertiary">© 2025 sso.broker. Built with ❤️ for developers.</p>
          </div>
          
          {/* Terms and Privacy Links */}
          <div className="max-w-2xl mx-auto">
            <div className="flex justify-center gap-8">
              <Link 
                to="/tutorials" 
                className="text-sm font-medium"
              >
                Tutorials
              </Link>
              <Link 
                to="/terms" 
                className="text-sm font-medium"
              >
                Terms of Service
              </Link>
              <Link 
                to="/privacy" 
                className="text-sm font-medium"
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
