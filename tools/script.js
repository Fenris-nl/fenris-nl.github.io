// Tools page JS - Password Hash generator only
(function(){
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
