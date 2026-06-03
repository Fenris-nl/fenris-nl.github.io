///////////////
// PARAMETRS //
///////////////

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

const code = urlParams.get("code") || "";

// Get current hostname to handle local development vs production
const currentHostname = window.location.hostname;
const isLocalhost = currentHostname === 'localhost' || currentHostname === '127.0.0.1';

// Set base URL and redirect URI based on environment
const baseURL = isLocalhost 
    ? `${window.location.protocol}//${window.location.host}`
    : "https://fenris-nl.github.io";
    
const redirect_uri = `${baseURL}/configure/`;

// Log for debugging
console.debug(`Base URL: ${baseURL}`);
console.debug(`Redirect URI: ${redirect_uri}`);

let refresh_token = "";
let access_token = "";
let browserSourceURL = "";

// Google Apps Script Web App URL (same one used for analytics in /script.js).
// Used only to store/retrieve ENCRYPTED link blobs for recovery. The script
// never receives the plaintext link or any Spotify credentials.
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxgtwODSYY0cTgJKpA7RpkKGydBPWezL-u_luMwhzlHAQOnH70QxqH7xiGN9JVPunucFA/exec';

////////////////////////////////////////
// ZERO-KNOWLEDGE RECOVERY (CLIENT-SIDE) //
////////////////////////////////////////
// The link is encrypted in the browser with a user-chosen passphrase before it
// is uploaded. Only AES-GCM ciphertext leaves the device, so the Google Sheet
// (and the site owner) can never read the Spotify secrets.

// Base64 helpers for ArrayBuffer <-> string
function bufToBase64(buf) {
    return btoa(String.fromCharCode.apply(null, new Uint8Array(buf)));
}
function base64ToBuf(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes.buffer;
}

// SHA-256 hex of a string (used as a non-secret lookup id)
async function sha256HexStr(str) {
    const data = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0')).join('');
}

// Derive an AES-GCM key from a passphrase + salt using PBKDF2
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

// Encrypt a string, returning everything needed to decrypt later (all base64)
async function encryptString(plaintext, passphrase) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(passphrase, salt);
    const ciphertext = await crypto.subtle.encrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        new TextEncoder().encode(plaintext)
    );
    return {
        salt: bufToBase64(salt.buffer),
        iv: bufToBase64(iv.buffer),
        ciphertext: bufToBase64(ciphertext)
    };
}

// Password protection (client-side, hash-only)
// 1) Generate a SHA-256 hex of your chosen password (see README or steps I'll share)
// 2) Paste the 64-char hex string below. Do NOT paste the plaintext password.
const ADMIN_PASSWORD_HASH = "6a83f1b880d8c28788873c5a489182685598587e42c72f6fe6cd72951ec4f4d4"; // e.g. "5e884898da28047151d0e56f8dc629..."

async function sha256Hex(str) {
    const data = new TextEncoder().encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Check if user is already authenticated
const isPasswordAuthenticated = sessionStorage.getItem('passwordAuthenticated') === 'true';
if (isPasswordAuthenticated) {
    document.getElementById('passwordContainer').style.display = 'none';
}

// Setup password listener
document.getElementById('submitPassword').addEventListener('click', () => { checkPassword(); });
document.getElementById('passwordInput').addEventListener('keydown', function(event) {
    if (event.key === 'Enter') {
        checkPassword();
    }
});

async function checkPassword() {
    const inputEl = document.getElementById('passwordInput');
    const errorElement = document.getElementById('passwordError');
    const password = inputEl.value;

    if (!ADMIN_PASSWORD_HASH || ADMIN_PASSWORD_HASH === 'REPLACE_WITH_SHA256_HEX') {
        errorElement.textContent = 'Admin password is not configured. Please set the hash in configure/script.js';
        return;
    }

    try {
        const inputHash = await sha256Hex(password);
        if (inputHash === ADMIN_PASSWORD_HASH) {
            sessionStorage.setItem('passwordAuthenticated', 'true');
            document.getElementById('passwordContainer').style.display = 'none';
            errorElement.textContent = '';
        } else {
            errorElement.textContent = 'Incorrect password. Please try again.';
            inputEl.value = '';
        }
    } catch (e) {
        console.error('Password check failed:', e);
        errorElement.textContent = 'Unexpected error. Please try again.';
    }
}

// Import user management (defined in users.js)
// Define a simple version if it doesn't exist (for backwards compatibility)
if (typeof UserManager === 'undefined') {
    // Basic stub for UserManager when users.js is not loaded
    window.UserManager = {
        getCurrentUser: () => null,
        updateUser: () => null,
        userHasValidCredentials: () => false
    };
}



/////////////////////////
// AUTHORIZATION STUFF //
/////////////////////////

function RequestAuthorization() {
    const client_id = document.getElementById("client_id_box").value;
    const client_secret = document.getElementById("client_secret_box").value;
    
    // Check if we have a current user
    const currentUser = UserManager.getCurrentUser();
    
    if (currentUser) {
        // Save to user data
        UserManager.updateUser(currentUser.username, {
            clientId: client_id,
            clientSecret: client_secret
        });
    }
    
    // Still save to localStorage for backward compatibility
    localStorage.setItem("client_id", client_id);
    localStorage.setItem("client_secret", client_secret);

    let url = "https://accounts.spotify.com/authorize";
    url += "?client_id=" + client_id;
    url += "&response_type=code";
    url += "&redirect_uri=" + encodeURI(redirect_uri);
    url += "&show_dialog=true";
    url += "&scope=user-read-private user-read-email user-modify-playback-state user-read-playback-position user-library-read streaming user-read-playback-state user-read-recently-played playlist-read-private";
    window.location.href = url;
}

// If there is no code in the query string, direct the user to authorize their account
if (code != "") {
    FetchAccessToken(code);
}
else {
    document.getElementById("connectBox").style.display = 'inline';
}

async function FetchAccessToken(code) {
    try {
        const client_id = localStorage.getItem("client_id");
        const client_secret = localStorage.getItem("client_secret");
        console.debug(`Client ID: ${client_id}`);
        console.debug(`Client Secret: ${client_secret}`);

        if (!client_id || !client_secret) {
            showError("Client ID or Client Secret is missing. Please try authorizing again.");
            document.getElementById("connectBox").style.display = 'inline';
            return;
        }

        let body = "grant_type=authorization_code";
        body += "&code=" + code;
        body += "&redirect_uri=" + encodeURI(redirect_uri);
        body += "&client_id=" + client_id;
        body += "&client_secret=" + client_secret;
        console.log(body);

        // Show loading status
        showStatus("Connecting to Spotify...", "loading");

        // Get the current player information from Spotify
        const response = await fetch("https://accounts.spotify.com/api/token", {
            method: "POST",
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: body,
            // Add timeout to prevent long hangs
            signal: AbortSignal.timeout(10000) // 10 second timeout
        });

        // If we got a response, save the access token
        if (response.ok) {
            const responseData = await response.json();
            console.debug(responseData);
            refresh_token = responseData.refresh_token;           // Unsure if we need to replace the refresh_token but do it just in case
            access_token = responseData.access_token;             // Save access token for all future API calls

            // Check if we have a current user
            const currentUser = UserManager.getCurrentUser();
            if (currentUser) {
                // Save to user data
                UserManager.updateUser(currentUser.username, {
                    refreshToken: refresh_token
                });
            }            browserSourceURL = `${baseURL}?client_id=${client_id}&client_secret=${client_secret}&refresh_token=${refresh_token}`;
            document.getElementById("authorizationBox").style.display = 'inline';
            hideStatus();
            
            // Setup any customization listeners if needed
            if (typeof setupCustomizationListeners === 'function') {
                setupCustomizationListeners();
            }
        } else {
            // Handle HTTP error responses
            console.error(`Error ${response.status}: ${response.statusText}`);
            showError(`Authorization failed (${response.status}): ${response.statusText}`);
        }
    } catch (error) {
        // Handle network errors, timeouts, etc.
        console.error("Fetch error:", error);
        if (error.name === 'AbortError') {
            showError("Connection timed out. Please check your internet connection and try again.");
        } else if (error.name === 'TypeError' && error.message.includes('NetworkError')) {
            showError("Network error. Please check your internet connection and try again.");
        } else {
            showError(`Error connecting to Spotify: ${error.message}`);
        }
        
        // Show login form again
        document.getElementById("connectBox").style.display = 'inline';
    }
}



///////////////////////////
// BUTTON CLICK HANDLERS //
///////////////////////////

// Status message handling functions
function showStatus(message, type = "info") {
    hideConnectBox();
    hideAuthBox();
    
    let statusBox = document.getElementById("statusBox");
    if (!statusBox) {
        statusBox = document.createElement("div");
        statusBox.id = "statusBox";
        document.getElementById("mainContainer").appendChild(statusBox);
    }
    
    statusBox.innerHTML = `
        <div class="status-content ${type}">
            <div class="status-spinner"></div>
            <div class="status-message">${message}</div>
        </div>
    `;
    statusBox.style.display = "flex";
}

function showError(message) {
    showStatus(message, "error");
}

function hideStatus() {
    const statusBox = document.getElementById("statusBox");
    if (statusBox) {
        statusBox.style.display = "none";
    }
}

function hideConnectBox() {
    document.getElementById("connectBox").style.display = 'none';
}

function hideAuthBox() {
    document.getElementById("authorizationBox").style.display = 'none';
}

const clientIdBox = document.getElementById('client_id_box');
const clientSecretBox = document.getElementById('client_secret_box');
const authorizeButton = document.getElementById('authorizeButton');

// Function to check if either input is empty
function checkInputs() {
    if (clientIdBox.value.trim() === '' || clientSecretBox.value.trim() === '') {
        authorizeButton.disabled = true;    // Disable the button
    } else {
        authorizeButton.disabled = false;   // Enable the button
    }
}

// Listen for changes in the input boxes
clientIdBox.addEventListener('input', checkInputs);
clientSecretBox.addEventListener('input', checkInputs);

// Initial check when the page loads, just in case
checkInputs();

function CopyToURL() {
    navigator.clipboard.writeText(browserSourceURL);

    document.getElementById("copyURLButton").innerText = "Copied to clipboard";
    document.getElementById("copyURLButton").style.backgroundColor = "#00dd63"
    document.getElementById("copyURLButton").style.color = "#ffffff";

    setTimeout(() => {
        document.getElementById("copyURLButton").innerText = "Click to copy URL";
        document.getElementById("copyURLButton").style.backgroundColor = "#ffffff";
        document.getElementById("copyURLButton").style.color = "#181818";
    }, 3000);
}

// Encrypt the current link with the user's passphrase and upload the ciphertext
async function SaveForRecovery() {
    const statusEl = document.getElementById("recoveryStatus");
    const recoveryId = document.getElementById("recoveryIdBox").value.trim();
    const passphrase = document.getElementById("recoveryPassBox").value;
    const button = document.getElementById("saveRecoveryButton");

    if (!browserSourceURL) {
        statusEl.style.color = "#ff6b6b";
        statusEl.textContent = "No link to save yet.";
        return;
    }
    if (!recoveryId || !passphrase) {
        statusEl.style.color = "#ff6b6b";
        statusEl.textContent = "Enter both a recovery ID and a passphrase.";
        return;
    }
    if (passphrase.length < 8) {
        statusEl.style.color = "#ff6b6b";
        statusEl.textContent = "Use a passphrase of at least 8 characters.";
        return;
    }
    if (!APPS_SCRIPT_URL) {
        statusEl.style.color = "#ff6b6b";
        statusEl.textContent = "Recovery storage is not configured.";
        return;
    }

    button.disabled = true;
    statusEl.style.color = "#b3b3b3";
    statusEl.textContent = "Encrypting and saving…";

    try {
        const lookup = await sha256HexStr(recoveryId.toLowerCase());
        const encrypted = await encryptString(browserSourceURL, passphrase);

        await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type: 'savelink',
                lookup: lookup,
                salt: encrypted.salt,
                iv: encrypted.iv,
                ciphertext: encrypted.ciphertext
            })
        });

        // no-cors gives an opaque response, so we can't read it; assume success
        statusEl.style.color = "#00dd63";
        statusEl.textContent = "Saved. Recover anytime with your ID + passphrase.";
        document.getElementById("recoveryPassBox").value = "";
    } catch (e) {
        console.error("Save for recovery failed:", e);
        statusEl.style.color = "#ff6b6b";
        statusEl.textContent = "Could not save. Please try again.";
    } finally {
        button.disabled = false;
    }
}

function OpenInstructions() {
    window.open("#", '_blank').focus();
}

function OpenDonationPage() {
    window.open("https://paypal.me/kerdem97?country.x=NL&locale.x=nl_NL", '_blank').focus();
}

// Empty function to prevent errors if called
function setupCustomizationListeners() {
    // This is an empty implementation to prevent errors
    console.log("Customization options are not available in this version");
}