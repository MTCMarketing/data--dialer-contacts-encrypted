let encryptedData = null;

const BASE_URL = "https://mtcmarketing.github.io/data--dialer-contacts-encrypted/contacts/";
const TEST_URL = "https://mtcmarketing.github.io/data--dialer-contacts-encrypted/test-contacts/";

const SALT = "static-salt";
const ITERATIONS = 100000;

// ===== LOAD =====
async function loadData() {
  const id = document.getElementById("contactId").value.trim();
  const output = document.getElementById("output");

  if (!id) {
    output.textContent = "Enter an ID.";
    return;
  }

  const mode = document.querySelector('input[name="mode"]:checked').value;
  const base = mode === "test" ? TEST_URL : BASE_URL;
  const url = base + id + ".json";

  try {
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error("File not found");
    }

    encryptedData = await res.json();

    output.textContent = JSON.stringify(encryptedData, null, 2);
    document.getElementById("decryptSection").style.display = "block";

  } catch (err) {
    output.textContent = "Error: " + err.message;
  }
}

// ===== CRYPTO =====
async function deriveKey(password) {
  const enc = new TextEncoder();

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode(SALT),
      iterations: ITERATIONS,
      hash: "SHA-256"
    },
    keyMaterial,
    { name: "AES-GCM", length: 256 },
    false,
    ["decrypt"]
  );
}

async function decryptValue(str, key) {
  try {
    const parts = str.split(".");
    if (parts.length !== 3) return str;

    const [ivB64, tagB64, dataB64] = parts;

    const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
    const tag = Uint8Array.from(atob(tagB64), c => c.charCodeAt(0));
    const data = Uint8Array.from(atob(dataB64), c => c.charCodeAt(0));

    const combined = new Uint8Array([...data, ...tag]);

    const decrypted = await crypto.subtle.decrypt(
      { name: "AES-GCM", iv },
      key,
      combined
    );

    return JSON.parse(new TextDecoder().decode(decrypted));
  } catch {
    return str;
  }
}

async function walk(obj, key) {
  if (Array.isArray(obj)) {
    return Promise.all(obj.map(v => walk(v, key)));
  }

  if (obj && typeof obj === "object") {
    const out = {};
    for (const k in obj) {
      out[k] = await walk(obj[k], key);
    }
    return out;
  }

  if (typeof obj === "string" && obj.includes(".")) {
    return decryptValue(obj, key);
  }

  return obj;
}

// ===== DECRYPT =====
async function decryptData() {
  const password = document.getElementById("password").value;
  const output = document.getElementById("output");

  if (!password) {
    output.textContent = "Enter password.";
    return;
  }

  if (!encryptedData) {
    output.textContent = "Load data first.";
    return;
  }

  try {
    const key = await deriveKey(password);
    const result = await walk(encryptedData, key);

    output.textContent = JSON.stringify(result, null, 2);
  } catch {
    output.textContent = "Decryption failed.";
  }
}

// 🔥 make functions available to HTML onclick
window.loadData = loadData;
window.decryptData = decryptData;