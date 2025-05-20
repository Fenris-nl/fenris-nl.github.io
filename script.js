///////////////
// PARAMETRS //
///////////////

const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);

const client_id = urlParams.get("client_id") || "";
const client_secret = urlParams.get("client_secret") || "";
let refresh_token = urlParams.get("refresh_token") || "";
let access_token = "";

const visibilityDuration = urlParams.get("duration") || 0;
const hideAlbumArt = urlParams.has("hideAlbumArt");

// Customization parameters
const bgColorHex = urlParams.get("bgColor") || "";
const bgOpacity = parseFloat(urlParams.get("bgOpacity") || "0.5");
const textColorHex = urlParams.get("textColor") || "";

// Convert hex color to rgba string
function hexToRGBA(hex, opacity = 1) {
    let h = hex.replace('#', '');
    if (h.length === 3) {
        h = h.split('').map(c => c + c).join('');
    }
    const bigint = parseInt(h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

function applyCustomStyles() {
    if (bgColorHex) {
        document.documentElement.style.setProperty('--bg-color', hexToRGBA(bgColorHex, bgOpacity));
    } else if (urlParams.has('bgOpacity')) {
        document.documentElement.style.setProperty('--bg-color', hexToRGBA('000000', bgOpacity));
    }

    if (textColorHex) {
        const textCol = `#${textColorHex}`;
        document.documentElement.style.setProperty('--text-color', textCol);

        // Optional: also apply to a specific container
        const container = document.getElementById('IAmRunningOutOfNamesForTheseBoxes');
        if (container) {
            container.style.color = textCol;
        }
    }
}

// Apply once immediately…
applyCustomStyles();

let currentState = false;
let currentSongUri = "";



/////////////////
// SPOTIFY API //
/////////////////

// Update the access token - this expires so needs to be refreshed with refresh_token
async function RefreshAccessToken() {
	console.debug(`Client ID: ${client_id}`);
	console.debug(`Client Secret: ${client_secret}`);
	console.debug(`Refresh Token: ${refresh_token}`);

    let body = "grant_type=refresh_token";
    body += "&refresh_token=" + refresh_token;
    body += "&client_id=" + client_id;

	const response = await fetch("https://accounts.spotify.com/api/token", {
		method: "POST",
		headers: {
			'Authorization': `Basic ${btoa(client_id + ":" + client_secret)}`,
			'Content-Type': 'application/x-www-form-urlencoded'
		},
		body: body
	});

	// If we got a response, save the access token
	if (response.ok)
	{
		const responseData = await response.json();
		console.debug(responseData);
		//refresh_token = responseData.refresh_token;			// Unsure if we need to replace the refresh_token but do it just in case
		access_token = responseData.access_token;			// Save access token for all future API calls
	}
	else
	{
		console.error(`${response.status}`);
	}
}

// Helper function to measure text width
function measureTextWidth(text, element) {
    const canvas = measureTextWidth.canvas || (measureTextWidth.canvas = document.createElement("canvas"));
    const context = canvas.getContext("2d");
    const style = window.getComputedStyle(element);
    
    context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    
    // Add a small buffer to ensure text doesn't get cut off
    return Math.ceil(context.measureText(text).width) + 10;
}

async function GetCurrentlyPlaying(refreshInterval) {
	try {
		// Get the current player information from Spotify
		const response = await fetch("https://api.spotify.com/v1/me/player/currently-playing", {
			method: "GET",
			headers: {
				'Authorization': `Bearer ${access_token}`,
				'Content-Type': 'application/json'
			}
		})
	
		// If we got a response, save the access token
		if (response.ok)
		{
			const responseData = await response.json();
			console.debug(responseData);
			UpdatePlayer(responseData);
		}
		else
		{
			switch (response.status)
			{
				case 401:
					console.debug(`${response.status}`)
					await RefreshAccessToken();
					break;
				case 204:
					console.debug("No content - nothing playing");
					SetVisibility(false);
					break;
				default:
					console.error(`${response.status}`)
			}
		}
		// Refresh
		setTimeout(() => {
			GetCurrentlyPlaying()
		}, 1000);
	}
	catch (error)
	{
		console.debug(error);
		SetVisibility(false);
		
		// Try again in 2 seconds
		setTimeout(() => {
			GetCurrentlyPlaying()
		}, 2000);
	}
}

function UpdatePlayer(data) {
	const isPlaying = data.is_playing;							// The play/pause state of the player
	const songUri = data.item.uri;
	const albumArt = data.item.album.images.length > 0 ?
		`${data.item.album.images[0].url}`
		: `images/placeholder-album-art.png`;					// The album art URL
	const artist = `${data.item.artists[0].name}`;				// Name of the artist
	const name = `${data.item.name}`;							// Name of the song
	const duration = `${data.item.duration_ms/1000}`;			// The duration of the song in seconds
	const progress = `${data.progress_ms/1000}`;				// The current position in seconds

	// Set the visibility of the player, but only if the state is different than the last time we checked
	if (isPlaying != currentState) {

		// Set player visibility
		if (!isPlaying)
		{
			console.debug("Hiding player...");
			SetVisibility(false);
		}
		else
		{
			console.debug("Showing player...");
			setTimeout(() => {
				SetVisibility(true);

				if (visibilityDuration > 0) {
					setTimeout(() => {
						SetVisibility(false, false);
					}, visibilityDuration * 1000);
				}
			}, 500);
		}
	}

	if (songUri != currentSongUri) {		
		if (isPlaying) {
			console.debug("Showing player...");
			setTimeout(() => {
				SetVisibility(true);

				if (visibilityDuration > 0) {
					setTimeout(() => {
						SetVisibility(false, false);
					}, visibilityDuration * 1000);
				}
			}, 500);
	
			currentSongUri = songUri;
		}
	}

	// Set thumbnail
	UpdateAlbumArt(document.getElementById("albumArt"), albumArt);
	UpdateAlbumArt(document.getElementById("backgroundImage"), albumArt);

	// Set song info
	UpdateTextLabel(document.getElementById("artistLabel"), artist);
	UpdateTextLabel(document.getElementById("songLabel"), name);
	
	// Set progressbar
	const progressPerc = ((progress / duration) * 100);			// Progress expressed as a percentage
	const progressTime = ConvertSecondsToMinutesSoThatItLooksBetterOnTheOverlay(progress);
	const timeRemaining = ConvertSecondsToMinutesSoThatItLooksBetterOnTheOverlay(duration - progress);
	console.debug(`Progress: ${progressTime}`);
	console.debug(`Time Remaining: ${timeRemaining}`);
	document.getElementById("progressBar").style.width = `${progressPerc}%`;
	document.getElementById("progressTime").innerHTML = progressTime;
	document.getElementById("timeRemaining").innerHTML = `-${timeRemaining}`;

	setTimeout(() => {
		document.getElementById("albumArtBack").src = albumArt;
		document.getElementById("backgroundImageBack").src = albumArt;
	}, 1000);
}

function UpdateTextLabel(div, text) {
	if (div.innerText != text) {
		div.setAttribute("class", "text-fade");
		setTimeout(() => {
			// Check if this is the song label div and handle scrolling text
			if (div.id === "songLabel") {
				// Clear any existing content
				div.innerHTML = "";
				
				// Get the width of the text and container
				const textWidth = measureTextWidth(text, div);
				const containerWidth = div.offsetWidth;
				
				// If text is longer than container, add scrolling
				if (textWidth > containerWidth) {
					// Create container and scrolling span
					const scrollContainer = document.createElement("div");
					scrollContainer.className = "scrolling-text-container";
					
					const scrollingSpan = document.createElement("span");
					scrollingSpan.className = "scrolling-text";
					scrollingSpan.innerText = text;
					
					// Calculate and set scroll distance
					const scrollDistance = textWidth - containerWidth;
					scrollingSpan.style.setProperty('--scroll-distance', scrollDistance + 'px');
					
					// Add to DOM
					scrollContainer.appendChild(scrollingSpan);
					div.appendChild(scrollContainer);
					
					console.debug(`Text width: ${textWidth}px, Container width: ${containerWidth}px, Scroll distance: ${scrollDistance}px`);
				} else {
					// If text fits, just display it normally
					div.innerText = text;
				}
			} else {
				// For other labels, just update text normally
				div.innerText = text;
			}
			
			div.setAttribute("class", "text-show");
		}, 500);
	}
}

function UpdateAlbumArt(div, imgsrc) {
	if (div.src != imgsrc) {
		div.setAttribute("class", "text-fade");
		setTimeout(() => {
			div.src = imgsrc;
			div.setAttribute("class", "text-show");
		}, 500);
	}
}



//////////////////////
// HELPER FUNCTIONS //
//////////////////////

function ConvertSecondsToMinutesSoThatItLooksBetterOnTheOverlay(time) {
	const minutes = Math.floor(time / 60);
	const seconds = Math.trunc(time - minutes * 60);

	return `${minutes}:${('0' + seconds).slice(-2)}`;
}

function SetVisibility(isVisible, updateCurrentState = true) {
	// Define this variable correctly (was undefined)
	let widgetVisibility = isVisible;

	const mainContainer = document.getElementById("mainContainer");
	const statusContainer = document.getElementById("statusContainer");

	if (isVisible) {
		mainContainer.style.opacity = 1;
		mainContainer.style.bottom = "50%";
		statusContainer.style.opacity = 0;
	}
	else {
		mainContainer.style.opacity = 0;
		mainContainer.style.bottom = "calc(50% - 20px)";
		
		// Show status if we have authentication params but nothing is playing
		if (client_id && client_secret && refresh_token) {
			statusContainer.innerHTML = "No track playing";
			statusContainer.style.opacity = 1;
		} else if (!client_id || !client_secret || !refresh_token) {
			statusContainer.innerHTML = "Missing authentication parameters";
			statusContainer.style.opacity = 1;
		}
	}

	if (updateCurrentState)
		currentState = isVisible;
}



//////////////////////////////////////////////////////////////////////////////////////////
// RESIZER THING BECAUSE I THINK I KNOW HOW RESPONSIVE DESIGN WORKS EVEN THOUGH I DON'T //
//////////////////////////////////////////////////////////////////////////////////////////

let outer = document.getElementById('mainContainer'),
	maxWidth = outer.clientWidth+50,
	maxHeight = outer.clientHeight;

window.addEventListener("resize", resize);

resize();
function resize() {
	const scale = window.innerWidth / maxWidth;
	outer.style.transform = 'translate(-50%, 50%) scale(' + scale + ')';
}



/////////////////////////////////////////////////////////////////////
// IF THE USER PUT IN THE HIDEALBUMART PARAMATER, THEN YOU SHOULD  //
//   HIDE THE ALBUM ART, BECAUSE THAT'S WHAT IT'S SUPPOSED TO DO   //
/////////////////////////////////////////////////////////////////////

if (hideAlbumArt) {
	document.getElementById("albumArtBox").style.display = "none";
	document.getElementById("songInfoBox").style.width = "calc(100% - 20px)";
}



////////////////////////////////
// KICK OFF THE WHOLE WIDGET  //
////////////////////////////////

// Initialize visibility
document.getElementById("statusContainer").style.opacity = 1;
document.getElementById("statusContainer").innerHTML = "Initializing...";

// Start the connection
RefreshAccessToken();
GetCurrentlyPlaying();			// This is a recursive function, so just run it once
