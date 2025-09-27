// Utility functions for the SSO broker
import ejs from 'ejs';

// CORS headers for cross-origin requests
export const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400'
};

// JSON response helper
export function jsonResponse(obj, status = 200, additionalHeaders = {}) {
  return new Response(JSON.stringify(obj), {
    status,
    headers: { 
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
      ...additionalHeaders
    }
  });
}

// Error response helper
export function errorResponse(message, status = 400, details = null) {
  const error = {
    error: message,
    status,
    timestamp: new Date().toISOString()
  };
  if (details) error.details = details;
  
  return jsonResponse(error, status);
}


export function logRequest(request, context = {}, env = {}) {
  // Only log in development/non-production environments
  if (env.ENVIRONMENT === 'production') {
    return;
  }
  
  console.log(JSON.stringify({
    method: request.method,
    url: request.url,
    headers: Object.fromEntries(request.headers.entries()),
    timestamp: new Date().toISOString(),
    ...context
  }));
}

export function logError(error, context = {}, env = {}) {
  // Only log in development/non-production environments
  if (env.ENVIRONMENT === 'production') {
    return;
  }
  
  console.error(JSON.stringify({
    error: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString(),
    ...context
  }));
}

// Render EJS template
export async function renderTemplate(templatePath, data) {
  try {
    // In Cloudflare Workers, we need to read the template file
    // For now, we'll embed the template content directly
    const template = await getTemplateContent();
    return ejs.render(template, data);
  } catch (error) {
    logError(error, { templatePath, data });
    throw new Error('Failed to render template');
  }
}

// Get template content - in a real implementation, this would read from a file
async function getTemplateContent() {
  // For Cloudflare Workers, we'll need to embed the template content
  // or use a different approach since file system access is limited
  return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>sso.broker - <%= title %></title>
    <style>
        * {
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Inter', system-ui, sans-serif;
            background: #fafafa;
            margin: 0;
            padding: 0;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #0f172a;
            line-height: 1.5;
        }
        .consent-container {
            background: white;
            border: 1px solid #e2e8f0;
            border-radius: 8px;
            padding: 32px;
            max-width: 480px;
            width: 100%;
            margin: 20px;
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }
        .logo {
            text-align: center;
            margin-bottom: 32px;
            padding-bottom: 24px;
            border-bottom: 1px solid #f1f5f9;
        }
        .logo h1 {
            color: #0f172a;
            margin: 0;
            font-size: 24px;
            font-weight: 600;
            letter-spacing: -0.025em;
        }
        .logo p {
            color: #64748b;
            margin: 4px 0 0 0;
            font-size: 14px;
            font-weight: 400;
        }
        .consent-content {
            margin-bottom: 32px;
        }
        .consent-content h2 {
            color: #0f172a;
            font-size: 18px;
            font-weight: 600;
            margin: 0 0 16px 0;
            letter-spacing: -0.025em;
        }
        .consent-content p {
            color: #475569;
            margin: 0 0 16px 0;
            font-size: 14px;
        }
        .app-name {
            background: #f1f5f9;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 12px 16px;
            margin: 16px 0;
            font-weight: 600;
            color: #0f172a;
            text-align: center;
        }
        .details {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 12px 16px;
            margin: 16px 0;
        }
        .detail-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 8px 0;
            font-size: 14px;
        }
        .detail-label {
            color: #64748b;
            font-weight: 500;
        }
        .detail-value {
            color: #0f172a;
            font-family: 'SF Mono', 'Monaco', 'Inconsolata', 'Roboto Mono', monospace;
            font-size: 13px;
            background: #f1f5f9;
            padding: 2px 6px;
            border-radius: 4px;
            word-break: break-all;
        }
        .provider-badge {
            background: #0f172a;
            color: white;
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
            text-transform: uppercase;
            letter-spacing: 0.05em;
        }
        .buttons {
            display: flex;
            gap: 12px;
            margin-top: 24px;
        }
        .btn {
            flex: 1;
            padding: 12px 24px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
            text-decoration: none;
            text-align: center;
            display: inline-block;
        }
        .btn-primary {
            background: #0f172a;
            color: white;
        }
        .btn-primary:hover {
            background: #1e293b;
        }
        .btn-secondary {
            background: #f8fafc;
            color: #475569;
            border: 1px solid #e2e8f0;
        }
        .btn-secondary:hover {
            background: #f1f5f9;
        }
        .permissions {
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 16px;
            margin: 16px 0;
        }
        .permissions h3 {
            margin: 0 0 12px 0;
            font-size: 14px;
            font-weight: 600;
            color: #0f172a;
        }
        .permission-item {
            display: flex;
            align-items: center;
            margin: 8px 0;
            font-size: 14px;
            color: #475569;
        }
        .permission-item::before {
            content: "✓";
            color: #10b981;
            font-weight: bold;
            margin-right: 8px;
        }
    </style>
</head>
<body>
    <div class="consent-container">
        <div class="logo">
            <h1>sso.broker</h1>
            <p>Secure authentication made simple</p>
        </div>
        
        <div class="consent-content">
            <h2><%= heading %></h2>
            <p><%= description %></p>
            
            <div class="app-name">
                <%= appName %>
            </div>
            
            <% if (protocol === 'oidc') { %>
                <div class="permissions">
                    <h3>This app will receive:</h3>
                    <div class="permission-item">Your email address</div>
                    <div class="permission-item">Basic profile information</div>
                </div>
                
                <div class="details">
                    <div class="detail-row">
                        <span class="detail-label">Provider:</span>
                        <span class="detail-value provider-badge"><%= providerKey %></span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Redirect URI:</span>
                        <span class="detail-value"><%= redirectUri %></span>
                    </div>
                </div>
            <% } else if (protocol === 'saml') { %>
                <div class="permissions">
                    <h3>This service will receive:</h3>
                    <div class="permission-item">Your email address</div>
                    <div class="permission-item">Basic profile information</div>
                </div>
                
                <div class="details">
                    <div class="detail-row">
                        <span class="detail-label">Provider:</span>
                        <span class="detail-value provider-badge"><%= providerKey %></span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">Service Provider:</span>
                        <span class="detail-value"><%= spEntityId %></span>
                    </div>
                    <div class="detail-row">
                        <span class="detail-label">ACS URL:</span>
                        <span class="detail-value"><%= acsUrl %></span>
                    </div>
                </div>
            <% } %>
        </div>
        
        <div class="buttons">
            <a href="<%= denyUrl %>" class="btn btn-secondary">Deny</a>
            <a href="<%= allowUrl %>" class="btn btn-primary">Allow</a>
        </div>
    </div>
</body>
</html>`;
}
