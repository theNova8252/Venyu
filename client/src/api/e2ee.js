const enc = new TextEncoder();
const dec = new TextDecoder();

const LS_PREFIX = "e2ee_identity_v1_";
const RECOVERY_CODE_PREFIX = "e2ee_recovery_code_v1_";
const BACKUP_VERSION = "private-jwk-aes-gcm-pbkdf2-v1";
const PBKDF2_ITERATIONS = 250000;

function b64(bytes) {
  return btoa(String.fromCharCode(...new Uint8Array(bytes)));
}

function unb64(value) {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0));
}

function identityStorageKey(userId) {
  return LS_PREFIX + String(userId);
}

function recoveryCodeStorageKey(userId) {
  return RECOVERY_CODE_PREFIX + String(userId);
}

function normalizeRecoveryCode(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

async function deriveBackupKey(recoveryCode, saltBytes) {
  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(normalizeRecoveryCode(recoveryCode)),
    "PBKDF2",
    false,
    ["deriveKey"],
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: saltBytes,
      iterations: PBKDF2_ITERATIONS,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export function generateRecoveryCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  const parts = [];

  for (let offset = 0; offset < bytes.length; offset += 4) {
    const chunk = Array.from(bytes.slice(offset, offset + 4))
      .map((value) => alphabet[value % alphabet.length])
      .join("");
    parts.push(chunk);
  }

  return parts.join("-");
}

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

export async function saveIdentity(userId, keyPair) {
  const publicJwk = await exportPublicJwk(keyPair);
  const privateJwk = await exportPrivateJwk(keyPair);
  localStorage.setItem(identityStorageKey(userId), JSON.stringify({ publicJwk, privateJwk }));
  return { publicJwk, privateJwk };
}

export async function loadIdentity(userId) {
  const raw = localStorage.getItem(identityStorageKey(userId));
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw);
    if (!parsed?.publicJwk || !parsed?.privateJwk) return null;

    const publicKey = await importPublicJwk(parsed.publicJwk);
    const privateKey = await importPrivateJwk(parsed.privateJwk);
    return { publicKey, privateKey };
  } catch {
    return null;
  }
}

export async function getOrCreateIdentity(userId) {
  if (!userId) throw new Error("missing_userId_for_identity");

  const existing = await loadIdentity(userId);
  if (existing) return existing;

  const nextKeyPair = await generateIdentity();
  await saveIdentity(userId, nextKeyPair);
  return nextKeyPair;
}

export async function restoreIdentityFromPrivateJwk(userId, privateJwk) {
  if (!userId) throw new Error("missing_userId_for_identity");
  const publicJwk = {
    ...privateJwk,
    key_ops: [],
  };

  delete publicJwk.d;

  const publicKey = await importPublicJwk(publicJwk);
  const privateKey = await importPrivateJwk(privateJwk);
  const keyPair = { publicKey, privateKey };
  await saveIdentity(userId, keyPair);
  return keyPair;
}

export function clearIdentity(userId) {
  if (!userId) return;
  localStorage.removeItem(identityStorageKey(userId));
}

export function saveRecoveryCode(userId, recoveryCode) {
  if (!userId || !recoveryCode) return;
  localStorage.setItem(recoveryCodeStorageKey(userId), String(recoveryCode));
}

export function loadSavedRecoveryCode(userId) {
  if (!userId) return "";
  return localStorage.getItem(recoveryCodeStorageKey(userId)) || "";
}

export async function encryptPrivateKeyBackup(keyPair, recoveryCode) {
  const privateJwk = await exportPrivateJwk(keyPair);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const backupKey = await deriveBackupKey(recoveryCode, salt);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    backupKey,
    enc.encode(JSON.stringify(privateJwk)),
  );

  return {
    ciphertext: b64(ciphertext),
    iv: b64(iv),
    salt: b64(salt),
    version: BACKUP_VERSION,
  };
}

export async function decryptPrivateKeyBackup(backupPayload, recoveryCode) {
  const ciphertext = unb64(backupPayload.ciphertext);
  const iv = unb64(backupPayload.iv);
  const salt = unb64(backupPayload.salt);
  const backupKey = await deriveBackupKey(recoveryCode, salt);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    backupKey,
    ciphertext,
  );
  return JSON.parse(dec.decode(plaintext));
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
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    aesKey,
    enc.encode(plaintext),
  );
  return { ciphertext: b64(ciphertext), iv: b64(iv) };
}

export async function decryptText(aesKey, ciphertextB64, ivB64) {
  const ciphertext = unb64(ciphertextB64);
  const iv = unb64(ivB64);
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, aesKey, ciphertext);
  return dec.decode(plaintext);
}
