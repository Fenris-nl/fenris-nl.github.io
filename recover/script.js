// Zero-knowledge link recovery.
// Fetches an ENCRYPTED blob from the Google Apps Script and decrypts it locally
// using the user's passphrase. The server never sees the plaintext link or the
// passphrase, so it cannot read the stored Spotify credentials.
(function () {
  // ⚠️ Must match the Web App URL used in /script.js and /configure/script.js
  const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxgMZcWAVlRUeZA5NVdZ8xhYeD6hT-LxrlP-zLkQ1zHn8kpuqqdxcBGsnivbIxmLqK4Ew/exec';
  

  const idBox = document.getElementById('recoveryIdBox');
  const passBox = document.getElementById('recoveryPassBox');
  const recoverButton = document.getElementById('recoverButton');
  const statusMsg = document.getElementById('statusMsg');
  const resultBox = document.getElementById('resultBox');
  const resultLink = document.getElementById('resultLink');
  const copyButton = document.getElementById('copyButton');

  function setStatus(message, type) {
    statusMsg.textContent = message || '';
    statusMsg.className = 'status' + (type ? ' ' + type : '');
  }

  // ---- crypto helpers (mirror of /configure/script.js) ----
  function base64ToBuf(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
  }

  async function sha256HexStr(str) {
    const data = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
      .map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
  }

  async function deriveKey(passphrase, salt) {
    const baseKey = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(passphrase),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: salt, iterations: 150000, hash: 'SHA-256' },
      baseKey,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  async function decryptString(saltB64, ivB64, ciphertextB64, passphrase) {
    const salt = new Uint8Array(base64ToBuf(saltB64));
    const iv = new Uint8Array(base64ToBuf(ivB64));
    const key = await deriveKey(passphrase, salt);
    const plainBuf = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      base64ToBuf(ciphertextB64)
    );
    return new TextDecoder().decode(plainBuf);
  }

  async function recover() {
    const recoveryId = idBox.value.trim();
    const passphrase = passBox.value;

    resultBox.style.display = 'none';
    if (!recoveryId || !passphrase) {
      setStatus('Enter both your recovery ID and passphrase.', 'error');
      return;
    }
    if (!APPS_SCRIPT_URL) {
      setStatus('Recovery storage is not configured.', 'error');
      return;
    }

    recoverButton.disabled = true;
    setStatus('Looking up your link…', '');

    try {
      const lookup = await sha256HexStr(recoveryId.toLowerCase());
      const url = APPS_SCRIPT_URL + '?view=recover&lookup=' + encodeURIComponent(lookup);
      const response = await fetch(url);
      const data = await response.json();

      if (data.error) {
        setStatus('Error: ' + data.error, 'error');
        return;
      }
      if (!data.found) {
        setStatus('No saved link found for that recovery ID.', 'error');
        return;
      }

      setStatus('Decrypting…', '');
      let link;
      try {
        link = await decryptString(data.salt, data.iv, data.ciphertext, passphrase);
      } catch (e) {
        setStatus('Wrong passphrase, or the data is corrupt.', 'error');
        return;
      }

      resultLink.value = link;
      resultBox.style.display = 'block';
      setStatus('Link recovered.', 'success');
    } catch (err) {
      console.error('Recovery failed:', err);
      setStatus('Could not recover. Check your connection and try again.', 'error');
    } finally {
      recoverButton.disabled = false;
    }
  }

  recoverButton.addEventListener('click', recover);
  passBox.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') recover();
  });

  copyButton.addEventListener('click', function () {
    navigator.clipboard.writeText(resultLink.value).then(function () {
      copyButton.textContent = 'Copied!';
      setTimeout(function () { copyButton.textContent = 'Copy link'; }, 2000);
    });
  });
})();
