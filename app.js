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

  // 🔥 GET MODE
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