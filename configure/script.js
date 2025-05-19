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
            }

            browserSourceURL = `${baseURL}?client_id=${client_id}&client_secret=${client_secret}&refresh_token=${refresh_token}`;
            document.getElementById("authorizationBox").style.display = 'inline';
            hideStatus();
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

function OpenInstructions() {
    window.open("https://nuttylmao.notion.site/Spotify-Widget-18e19969b237807ca88cfc9c4159da15", '_blank').focus();
}

function OpenDonationPage() {
    window.open("http://nutty.gg/pages/donate", '_blank').focus();}