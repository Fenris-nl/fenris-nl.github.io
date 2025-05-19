// User and credentials selector for the widget
// This handles loading credentials from URL or user system

function getUserCredentials() {
    // First check URL parameters
    const queryString = window.location.search;
    const urlParams = new URLSearchParams(queryString);
    
    // Get credentials from URL first
    let client_id = urlParams.get("client_id") || "";
    let client_secret = urlParams.get("client_secret") || "";
    let refresh_token = urlParams.get("refresh_token") || "";
      // If URL has a specific username, load that user
    const username = urlParams.get("username");
    if (username && window.UserManager) {
        const user = UserManager.getUser(username);
        if (user && UserManager.userHasValidCredentials(user)) {
            console.debug(`Loading credentials for user: ${username}`);
            client_id = user.clientId || client_id;
            client_secret = user.clientSecret || client_secret;
            refresh_token = user.refreshToken || refresh_token;
        } else if (user) {
            console.warn(`User found but has invalid credentials: ${username}`);
        } else {
            console.warn(`User not found: ${username}`);
        }
    }
    // If no username specified but we have UserManager, try current user
    else if (window.UserManager) {
        const currentUser = UserManager.getCurrentUser();
        if (currentUser && UserManager.userHasValidCredentials(currentUser)) {
            console.debug(`Loading credentials for current user: ${currentUser.username}`);
            // Only use user credentials if URL params are empty
            client_id = client_id || currentUser.clientId;
            client_secret = client_secret || currentUser.clientSecret;
            refresh_token = refresh_token || currentUser.refreshToken;
        }
    }
    
    return { client_id, client_secret, refresh_token };
}
