// Initialize the user interface based on current user
function initUserInterface() {
    const currentUser = UserManager.getCurrentUser();
    const userDisplay = document.getElementById('userDisplay');
    
    if (currentUser) {
        // Display current user
        userDisplay.textContent = `User: ${currentUser.username}`;
        
        // Pre-fill form with user's saved credentials
        if (currentUser.clientId) {
            document.getElementById('client_id_box').value = currentUser.clientId;
        }
        
        if (currentUser.clientSecret) {
            document.getElementById('client_secret_box').value = currentUser.clientSecret;
        }
    } else {
        userDisplay.textContent = 'No user selected';
        
        // Redirect to user management if no user is selected
        if (UserManager.getUsers().length > 0) {
            // Only redirect if there are users to select from
            window.location.href = 'users.html';
        } else {
            // Show a message or create default user
            userDisplay.textContent = 'Create a user to get started';
        }
    }
    
    // Re-run input check to enable/disable authorize button
    checkInputs();
}
