// Tools page JS - runs only on /tools/
(function(){
  const $ = (sel) => document.querySelector(sel);
  const baseUrlInput = $('#baseUrl');
  const clientId = $('#clientId');
  const clientSecret = $('#clientSecret');
  const refreshToken = $('#refreshToken');
  const duration = $('#duration');
  const hideAlbumArt = $('#hideAlbumArt');
  const resultUrl = $('#resultUrl');
  const buildUrlBtn = $('#buildUrl');
  const copyUrlBtn = $('#copyUrl');
  const clearStoredBtn = $('#clearStored');

  // Prefill base URL with current origin
  baseUrlInput.value = window.location.origin;

  // Restore stored values
  try {
    const stored = JSON.parse(localStorage.getItem('tools-url-builder') || '{}');
    if (stored.clientId) clientId.value = stored.clientId;
    if (stored.clientSecret) clientSecret.value = stored.clientSecret;
    if (stored.refreshToken) refreshToken.value = stored.refreshToken;
    if (stored.duration != null) duration.value = stored.duration;
    if (stored.hideAlbumArt != null) hideAlbumArt.checked = stored.hideAlbumArt;
    if (stored.baseUrl) baseUrlInput.value = stored.baseUrl;
  } catch {}

  function saveState(){
    const state = {
      clientId: clientId.value.trim(),
      clientSecret: clientSecret.value.trim(),
      refreshToken: refreshToken.value.trim(),
      duration: duration.value === '' ? '' : Number(duration.value),
      hideAlbumArt: hideAlbumArt.checked,
      baseUrl: baseUrlInput.value.trim() || window.location.origin
    };
    localStorage.setItem('tools-url-builder', JSON.stringify(state));
  }

  function buildUrl(){
    const base = (baseUrlInput.value.trim() || window.location.origin).replace(/\/$/, '');
    const params = new URLSearchParams();
    if (clientId.value.trim()) params.set('client_id', clientId.value.trim());
    if (clientSecret.value.trim()) params.set('client_secret', clientSecret.value.trim());
    if (refreshToken.value.trim()) params.set('refresh_token', refreshToken.value.trim());
    if (duration.value && Number(duration.value) > 0) params.set('duration', String(Number(duration.value)));
    const url = `${base}/?${params.toString()}${hideAlbumArt.checked ? '&hideAlbumArt' : ''}`;
    resultUrl.textContent = url;
    copyUrlBtn.disabled = !url.includes('client_id') || !url.includes('client_secret') || !url.includes('refresh_token');
  }

  buildUrlBtn.addEventListener('click', () => { saveState(); buildUrl(); });
  copyUrlBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(resultUrl.textContent);
      copyUrlBtn.textContent = 'Copied!';
      setTimeout(()=> copyUrlBtn.textContent = 'Copy', 1500);
    } catch (e) {
      alert('Copy failed. You can copy manually.');
    }
  });
  clearStoredBtn.addEventListener('click', () => {
    localStorage.removeItem('tools-url-builder');
    clientId.value = clientSecret.value = refreshToken.value = '';
    duration.value = '';
    hideAlbumArt.checked = false;
    baseUrlInput.value = window.location.origin;
    resultUrl.textContent = '(your URL will appear here)';
    copyUrlBtn.disabled = true;
  });

  // Password Hash generator
  const pwInput = document.querySelector('#pwInput');
  const makeHashBtn = document.querySelector('#makeHash');
  const copyHashBtn = document.querySelector('#copyHash');
  const hashOutput = document.querySelector('#hashOutput');

  async function sha256Hex(str){
    const enc = new TextEncoder().encode(str);
    const buf = await crypto.subtle.digest('SHA-256', enc);
    const arr = Array.from(new Uint8Array(buf));
    return arr.map(b => b.toString(16).padStart(2,'0')).join('');
  }

  makeHashBtn.addEventListener('click', async () => {
    const pw = pwInput.value;
    if (!pw) { hashOutput.textContent = '(enter a password first)'; copyHashBtn.disabled = true; return; }
    try {
      const hex = await sha256Hex(pw);
      hashOutput.textContent = hex;
      copyHashBtn.disabled = false;
    } catch(e){
      hashOutput.textContent = 'Error generating hash';
      copyHashBtn.disabled = true;
    }
  });

  copyHashBtn.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(hashOutput.textContent);
      copyHashBtn.textContent = 'Copied!';
      setTimeout(()=> copyHashBtn.textContent = 'Copy', 1500);
    } catch (e) {
      alert('Copy failed. You can copy manually.');
    }
  });
})();
