// Cryptographic utilities for client credential generation and validation

// Generate a unique client ID with cryptographic signature
export async function generateClientId(clientName, redirectUris, secret) {
  // Generate a unique GUID for this app
  const appGuid = crypto.randomUUID();
  
  const payload = {
    n: clientName,           // name
    r: redirectUris,         // redirect_uris
    g: appGuid,              // GUID
    t: Date.now()            // timestamp
  };
  
  const encoder = new TextEncoder();
  const data = encoder.encode(JSON.stringify(payload));
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, data);
  const signatureHex = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  // Create a base64-encoded client ID with signature
  const clientIdData = {
    p: btoa(JSON.stringify(payload)),  // payload
    s: signatureHex                    // signature
  };
  
  return 'c' + btoa(JSON.stringify(clientIdData)).replace(/[+/=]/g, (match) => {
    switch (match) {
      case '+': return '-';
      case '/': return '_';
      case '=': return '';
      default: return match;
    }
  });
}

// Generate client secret from app GUID
export async function generateClientSecret(appGuid, secret) {
  const encoder = new TextEncoder();
  const data = encoder.encode(appGuid);
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, data);
  const signatureHex = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  
  return 's' + signatureHex.substring(0, 32);
}

// Generate signed email code for OIDC
export async function generateSignedEmailCode(email, secret) {
  const timestamp = Date.now();
  
  // Combine email and expiration with delimiter
  const emailWithExpiration = `${email}|${timestamp}`;
  
  // Encrypt the email + expiration using AES-GCM
  const encoder = new TextEncoder();
  const dataToEncrypt = encoder.encode(emailWithExpiration);
  
  // Generate a random IV
  const iv = crypto.getRandomValues(new Uint8Array(12));
  
  // Create encryption key from secret
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'PBKDF2' },
    false,
    ['deriveKey']
  );
  
  const encryptionKey = await crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: encoder.encode('email-encryption-salt'),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt']
  );
  
  // Encrypt the email + expiration
  const encryptedData = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: iv },
    encryptionKey,
    dataToEncrypt
  );
  
  const payload = {
    d: btoa(String.fromCharCode(...new Uint8Array(encryptedData))), // encrypted data as base64
    i: btoa(String.fromCharCode(...iv)) // IV as base64
  };
  
  return 'e' + btoa(JSON.stringify(payload)).replace(/[+/=]/g, (match) => {
    switch (match) {
      case '+': return '-';
      case '/': return '_';
      case '=': return '';
      default: return match;
    }
  });
}

// Validate signed email code
export async function validateSignedEmailCode(code, secret) {
  try {
    // Remove the 'e' prefix if present
    const codeWithoutPrefix = code.startsWith('e') ? code.substring(1) : code;
    
    // Decode code - add padding if needed
    let codeBase64 = codeWithoutPrefix.replace(/[-_]/g, (match) => {
      switch (match) {
        case '-': return '+';
        case '_': return '/';
        default: return match;
      }
    });
    
    // Add padding if needed
    while (codeBase64.length % 4) {
      codeBase64 += '=';
    }
    
    const payload = JSON.parse(atob(codeBase64));
    
    // Decrypt the email + expiration
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'PBKDF2' },
      false,
      ['deriveKey']
    );
    
    const decryptionKey = await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('email-encryption-salt'),
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    
    // Convert base64 back to Uint8Array
    const encryptedData = new Uint8Array(atob(payload.d).split('').map(c => c.charCodeAt(0)));
    const iv = new Uint8Array(atob(payload.i).split('').map(c => c.charCodeAt(0)));
    
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      decryptionKey,
      encryptedData
    );
    
    const decryptedString = new TextDecoder().decode(decryptedData);
    
    // Split email and timestamp using delimiter
    const [email, timestampStr] = decryptedString.split('|');
    const timestamp = parseInt(timestampStr, 10);
    
    // Check if code is not too old (1 hour)
    const age = Date.now() - timestamp;
    if (age > 60 * 60 * 1000) {
      return { valid: false, error: 'Email code expired' };
    }
    
    return { 
      valid: true, 
      email: email,
      timestamp: timestamp
    };
  } catch (error) {
    return { valid: false, error: 'Invalid email code format' };
  }
}

// Validate client ID
export async function validateClientId(clientId, secret) {
  try {
    
    // Remove the 'c' prefix if present
    const clientIdWithoutPrefix = clientId.startsWith('c') ? clientId.substring(1) : clientId;
    
    // Decode client ID - add padding if needed
    let clientIdBase64 = clientIdWithoutPrefix.replace(/[-_]/g, (match) => {
      switch (match) {
        case '-': return '+';
        case '_': return '/';
        default: return match;
      }
    });
    
    // Add padding if needed
    while (clientIdBase64.length % 4) {
      clientIdBase64 += '=';
    }
    
    const clientIdData = JSON.parse(atob(clientIdBase64));
    
    const payload = JSON.parse(atob(clientIdData.p)); // Use 'p' for payload
    
    // Verify signature
    const encoder = new TextEncoder();
    const data = encoder.encode(JSON.stringify(payload));
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    );
    
    const signature = new Uint8Array(
      clientIdData.s.match(/.{2}/g).map(byte => parseInt(byte, 16)) // Use 's' for signature
    );
    
    const isValid = await crypto.subtle.verify('HMAC', key, signature, data);
    
    if (!isValid) {
      return { valid: false, error: 'Invalid client ID signature' };
    }
    
    
    return { 
      valid: true, 
      clientName: payload.n, // Use 'n' for name
      redirectUris: payload.r, // Use 'r' for redirect_uris
      appGuid: payload.g // Use 'g' for GUID
    };
  } catch (error) {
    return { valid: false, error: 'Invalid client ID format' };
  }
}

// Validate client credentials
export async function validateClientCredentials(clientId, clientSecret, secret) {
  try {
    // First validate the client ID
    const clientIdValidation = await validateClientId(clientId, secret);
    if (!clientIdValidation.valid) {
      return clientIdValidation;
    }
    
    // Now validate the client secret by checking if it's a valid signature of the app GUID
    const appGuid = clientIdValidation.appGuid;
    
    // Remove the 's' prefix if present
    const clientSecretWithoutPrefix = clientSecret.startsWith('s') ? clientSecret.substring(1) : clientSecret;
    
    // Verify the client secret is a valid signature of the app GUID
    const appGuidData = new TextEncoder().encode(appGuid);
    const secretKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign']
    );
    
    const expectedSignature = await crypto.subtle.sign('HMAC', secretKey, appGuidData);
    const expectedSignatureHex = Array.from(new Uint8Array(expectedSignature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    const expectedClientSecret = 's' + expectedSignatureHex.substring(0, 32);
    
    if (clientSecret !== expectedClientSecret) {
      return { valid: false, error: 'Invalid client secret' };
    }
    
    return { 
      valid: true, 
      clientName: clientIdValidation.clientName,
      redirectUris: clientIdValidation.redirectUris,
      appGuid: clientIdValidation.appGuid
    };
  } catch (error) {
    return { valid: false, error: 'Invalid client credentials format' };
  }
}
