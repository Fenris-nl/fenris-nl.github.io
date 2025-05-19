# 🎵 Spotify Widget 🎵

A beautiful, customizable widget that displays your currently playing Spotify track. Perfect for streamers, content creators, or anyone who wants to share their music tastes!

![Spotify Widget Preview](https://i.imgur.com/YourImageHere.png)

## ✨ Features

- 🎧 Real-time display of currently playing Spotify track
- 🎨 Customizable colors and appearance
- 🖼️ Option to hide album art
- ⏱️ Auto-hide when nothing is playing
- 🔄 Automatic refresh to keep track information current
- 🔒 Secure configuration page

## 🚀 Getting Started

### Prerequisites

- A Spotify account (free or premium)
- A Spotify Developer account (free to create)

## 📋 Step-by-Step Setup Guide

### Step 1: Create a Spotify Developer Application

1. Go to the [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
2. Log in with your Spotify account
3. Click "Create An App"
4. Fill in the application name (e.g., "My Spotify Widget") and description
5. Click "Create"
6. In your new app's dashboard, click "Edit Settings"
7. Add the following Redirect URI: `https://fenris-nl.github.io/configure/` (or your local development URL)
8. Save your changes

### Step 2: Configure the Widget

1. Go to `https://fenris-nl.github.io/configure/` (or your local version)
2. You'll be prompted for a password - contact the administrator for access
3. Once logged in, you'll see the configuration page
4. Enter your Spotify Client ID and Client Secret from your Spotify Developer Dashboard
5. Click "Authorize"
6. You'll be redirected to Spotify's authorization page - log in and approve the permissions
7. After authorization, you'll be returned to the configuration page with customization options

### Step 3: Customize Your Widget

Now the fun part! Customize your widget appearance:

- 🎨 Background Color: Choose the color and opacity for the widget background
- 🖌️ Text Color: Select the color for all text and progress bar
- 🖼️ Album Art: Toggle to show or hide the album art
- ⏱️ Auto-hide: Set a duration (in seconds) after which the widget will hide when music stops playing

### Step 4: Get Your Widget URL

- When you're happy with your customizations, click "Click to copy URL"
- This URL contains all your settings and authentication details
- ⚠️ Keep this URL private as it contains your authentication credentials

### Step 5: Use Your Widget

- In OBS or your preferred streaming software:

  1. Add a new "Browser Source"
  2. Paste your widget URL
  3. Set the width to at least 500px (recommended)
  4. Set the height to at least 150px (recommended)

- For personal use:
  - Simply open the URL in any browser to see your currently playing track!

### Step 6: Advanced URL Parameters (Optional)

You can customize the widget further by adding these parameters to your URL:

- **Auto-hide after inactivity**: Add `&duration=X` where X is the number of seconds
  - Example: `https://fenris-nl.github.io/?client_id=...&duration=10`
- **Hide album art**: Add `&hideAlbumArt` to your URL
  - Example: `https://fenris-nl.github.io/?client_id=...&hideAlbumArt`
- **Combine parameters**: You can use both options together
  - Example: `https://fenris-nl.github.io/?client_id=...&duration=10&hideAlbumArt`

## 🛠️ Troubleshooting

- **Widget shows "Connecting..."**: Check your Spotify client credentials and make sure Spotify is currently playing music
- **No music information appears**: Ensure you're playing music on Spotify and that you've authorized the application
- **Colors not displaying correctly**: Try regenerating your widget URL with new color settings
- **Authorization expired**: Return to the configure page and generate a new widget URL

## 🔄 Updating Your Widget

If you want to change the appearance or settings:

1. Return to the configuration page
2. Re-enter your credentials if needed
3. Adjust your settings
4. Get the new URL and update your browser source

## 📝 Notes

- Your authentication credentials will remain private and are only stored in the widget URL
- Each user can have their own customized widget with different settings
- The widget automatically refreshes when songs change
- For optimal performance, keep the browser source running

## 💡 Tips

- Match your widget colors with your stream theme for a seamless look
- Place the widget in a corner of your stream for minimal distraction
- If you prefer a minimal look, hide the album art and use a subtle background color

## 🎨 Custom CSS Examples (Optional)

Want to further customize the look? Add these CSS rules to your OBS Browser Source:

```css
body {
  background-color: rgba(0, 0, 0, 0);
  margin: 0px auto;
  overflow: hidden;
}

#mainContainer {
  filter: drop-shadow(0px 0px 0px rgba(0, 0, 0, 1));
}

/* Fun example - you can customize fonts and colors */
#songLabel {
  font-family: "Your Favorite Font";
  color: #ff0000; /* Red */
}

#artistLabel {
  font-family: "Your Favorite Font";
  color: #ffa500; /* Orange */
}

#times {
  font-family: "Your Favorite Font";
  color: #00ff00; /* Green */
}

#progressBar {
  background-color: #800080; /* Purple */
}
```

## ❓ Need Help?

If you encounter any issues or have questions, please:

- Check the verification tool at `https://fenris-nl.github.io/verify.html`
- Contact the developer through the "Instructions" link on the configuration page

---

Enjoy your personalized Spotify Widget! 🎉
