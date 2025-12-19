const enc = new TextEncoder();
const dec = new TextDecoder();

function b64(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}
function unb64(s) {
  return Uint8Array.from(atob(s), (c) => c.charCodeAt(0));
}

const LS_PREFIX = "e2ee_identity_v1_";

export async function generateIdentity() {
  return crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey"],
  );
}

export async function exportPublicJwk(keyPair) {
  return crypto.subtle.exportKey("jwk", keyPair.publicKey);
}

// ✅ NEU: private key export/import
export async function exportPrivateJwk(keyPair) {
  return crypto.subtle.exportKey("jwk", keyPair.privateKey);
}

export async function importPublicJwk(jwk) {
  return crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    [],
  );
}

export async function importPrivateJwk(jwk) {
  return crypto.subtle.importKey(
    "jwk",
    jwk,
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey"],
  );
}

// ✅ NEU: persistente Identity pro User
export async function getOrCreateIdentity(userId) {
  if (!userId) throw new Error("missing_userId_for_identity");
  const key = LS_PREFIX + String(userId);

  const raw = localStorage.getItem(key);
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (parsed?.publicJwk && parsed?.privateJwk) {
        const publicKey = await importPublicJwk(parsed.publicJwk);
        const privateKey = await importPrivateJwk(parsed.privateJwk);
        return { publicKey, privateKey };
      }
    } catch {
      // ignore -> fallthrough create new
    }
  }

  const kp = await generateIdentity();
  const publicJwk = await exportPublicJwk(kp);
  const privateJwk = await exportPrivateJwk(kp);

  localStorage.setItem(key, JSON.stringify({ publicJwk, privateJwk }));
  return kp;
}

export async function importRemotePublicJwk(jwk) {
  return importPublicJwk(jwk);
}

export async function deriveAesKey(myKeyPair, theirPublicKey) {
  return crypto.subtle.deriveKey(
    { name: "ECDH", public: theirPublicKey },
    myKeyPair.privateKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptText(aesKey, plaintext) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, aesKey, enc.encode(plaintext));
  return { ciphertext: b64(ct), iv: b64(iv) };
}

export async function decryptText(aesKey, ciphertextB64, ivB64) {
  const ct = unb64(ciphertextB64);
  const iv = unb64(ivB64);
  const pt = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, aesKey, ct);
  return dec.decode(pt);
}
