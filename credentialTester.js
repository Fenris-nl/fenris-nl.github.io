// Credential Tester for Spotify Widget
// This script helps to verify if the credentials are properly loaded
// Include this in index.html for debugging purposes

document.addEventListener('DOMContentLoaded', function() {
    // Create a debug overlay
    const debugOverlay = document.createElement('div');
    debugOverlay.style.position = 'fixed';
    debugOverlay.style.bottom = '10px';
    debugOverlay.style.right = '10px';
    debugOverlay.style.backgroundColor = 'rgba(0, 0, 0, 0.8)';
    debugOverlay.style.color = 'white';
    debugOverlay.style.padding = '10px';
    debugOverlay.style.borderRadius = '5px';
    debugOverlay.style.fontFamily = 'monospace';
    debugOverlay.style.fontSize = '12px';
    debugOverlay.style.maxWidth = '400px';
    debugOverlay.style.zIndex = '9999';
    debugOverlay.style.display = 'none'; // Initially hidden
    
    // Add a toggle button
    const toggleButton = document.createElement('button');
    toggleButton.textContent = 'Show Debug Info';
    toggleButton.style.position = 'fixed';
    toggleButton.style.bottom = '10px';
    toggleButton.style.right = '10px';
    toggleButton.style.zIndex = '10000';
    toggleButton.style.padding = '5px 10px';
    toggleButton.style.borderRadius = '3px';
    toggleButton.style.backgroundColor = '#333';
    toggleButton.style.color = 'white';
    toggleButton.style.border = 'none';
    toggleButton.style.cursor = 'pointer';
    
    // Toggle debug overlay when clicking the button
    toggleButton.addEventListener('click', function() {
        if (debugOverlay.style.display === 'none') {
            debugOverlay.style.display = 'block';
            toggleButton.textContent = 'Hide Debug Info';
            updateDebugInfo();
        } else {
            debugOverlay.style.display = 'none';
            toggleButton.textContent = 'Show Debug Info';
        }
    });
    
    document.body.appendChild(toggleButton);
    document.body.appendChild(debugOverlay);
    
    // Function to update debug info
    function updateDebugInfo() {
        if (debugOverlay.style.display === 'none') return;
        
        // Get credentials from getUserCredentials
        let credentials = { client_id: "", client_secret: "", refresh_token: "" };
        
        if (typeof getUserCredentials === 'function') {
            credentials = getUserCredentials();
        }
        
        // Check URL parameters
        const queryString = window.location.search;
        const urlParams = new URLSearchParams(queryString);
        const username = urlParams.get("username");
        
        // Get user info
        let userInfo = "No user system available";
        if (window.UserManager) {
            const users = UserManager.getUsers();
            const currentUser = UserManager.getCurrentUser();
            
            userInfo = `
                <strong>Users:</strong> ${users.length} users found
                <strong>Current User:</strong> ${currentUser ? currentUser.username : 'None'}
                <strong>URL Username:</strong> ${username || 'None'}
            `;
            
            if (username) {
                const user = UserManager.getUser(username);
                if (user) {
                    userInfo += `
                        <br><br><strong>User Found:</strong> ${user.username}
                        <strong>Has Valid Credentials:</strong> ${UserManager.userHasValidCredentials(user)}
                        <strong>Client ID:</strong> ${maskString(user.clientId)}
                        <strong>Client Secret:</strong> ${maskString(user.clientSecret)}
                        <strong>Refresh Token:</strong> ${maskString(user.refreshToken)}
                    `;
                } else {
                    userInfo += `<br><br>User "${username}" not found in user system`;
                }
            }
        }
        
        // Generate debug info HTML
        debugOverlay.innerHTML = `
            <h3>Spotify Widget Debug Info</h3>
            <strong>Loaded Credentials:</strong><br>
            Client ID: ${maskString(credentials.client_id)}<br>
            Client Secret: ${maskString(credentials.client_secret)}<br>
            Refresh Token: ${maskString(credentials.refresh_token)}<br><br>
            <strong>User System:</strong><br>
            ${userInfo}
            <br>
            <small>Last updated: ${new Date().toLocaleTimeString()}</small>
        `;
        
        // Update every 5 seconds
        setTimeout(updateDebugInfo, 5000);
    }
    
    // Helper function to mask strings for security
    function maskString(str) {
        if (!str) return 'Not set';
        if (str.length <= 8) return '********';
        return str.substr(0, 4) + '...' + str.substr(-4);
    }
});