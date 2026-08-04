const encoder = new TextEncoder();

async function getCryptoKey(): Promise<CryptoKey> {
  const secret = process.env.SESSION_SECRET || 'fallback-secret-key-at-least-32-chars-long';
  const keyData = encoder.encode(secret);
  return crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function signSession(): Promise<string> {
  const key = await getCryptoKey();
  const payload = JSON.stringify({
    role: 'admin',
    exp: Date.now() + 86400000, // 24 hours
  });
  const payloadB64 = btoa(payload);
  const signatureBuffer = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode(payload)
  );
  const signatureArray = Array.from(new Uint8Array(signatureBuffer));
  const signatureHex = signatureArray.map((b) => b.toString(16).padStart(2, '0')).join('');
  return `${payloadB64}.${signatureHex}`;
}

export async function verifySession(token: string): Promise<boolean> {
  try {
    const parts = token.split('.');
    if (parts.length !== 2) return false;
    const [payloadB64, signatureHex] = parts;
    const payloadStr = atob(payloadB64);
    const payload = JSON.parse(payloadStr);

    if (payload.exp < Date.now()) return false;

    const key = await getCryptoKey();
    const signatureBuffer = await crypto.subtle.sign(
      'HMAC',
      key,
      encoder.encode(payloadStr)
    );
    const signatureArray = Array.from(new Uint8Array(signatureBuffer));
    const expectedSignatureHex = signatureArray.map((b) => b.toString(16).padStart(2, '0')).join('');

    return signatureHex === expectedSignatureHex;
  } catch {
    return false;
  }
}
