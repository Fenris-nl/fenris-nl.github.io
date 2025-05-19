// User management for Spotify Widget

// User data structure
class User {
    constructor(username) {
        this.username = username;
        this.clientId = '';
        this.clientSecret = '';
        this.refreshToken = '';
        this.createdAt = new Date().toISOString();
        this.lastLogin = new Date().toISOString();
    }
}

// User manager singleton
const UserManager = {
    // Key for localStorage
    STORAGE_KEY: 'spotify_widget_users',
    CURRENT_USER_KEY: 'spotify_widget_current_user',
    
    // Get all users from storage
    getUsers() {
        const usersJson = localStorage.getItem(this.STORAGE_KEY);
        if (!usersJson) {
            return [];
        }
        
        try {
            return JSON.parse(usersJson);
        } catch (e) {
            console.error('Failed to parse users data:', e);
            return [];
        }
    },
    
    // Save users to storage
    saveUsers(users) {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(users));
    },
    
    // Add a new user
    addUser(username) {
        if (!username || username.trim() === '') {
            throw new Error('Username cannot be empty');
        }
        
        const users = this.getUsers();
        
        // Check if username already exists
        if (users.some(user => user.username.toLowerCase() === username.toLowerCase())) {
            throw new Error('Username already exists');
        }
        
        const newUser = new User(username);
        users.push(newUser);
        this.saveUsers(users);
        
        return newUser;
    },
    
    // Delete a user
    deleteUser(username) {
        let users = this.getUsers();
        users = users.filter(user => user.username !== username);
        this.saveUsers(users);
        
        // If current user is deleted, clear current user
        if (this.getCurrentUser()?.username === username) {
            this.clearCurrentUser();
        }
    },
    
    // Get user by username
    getUser(username) {
        const users = this.getUsers();
        return users.find(user => user.username === username);
    },
    
    // Update user data
    updateUser(username, userData) {
        let users = this.getUsers();
        const userIndex = users.findIndex(user => user.username === username);
        
        if (userIndex === -1) {
            throw new Error('User not found');
        }
        
        // Update specific properties
        users[userIndex] = { ...users[userIndex], ...userData };
        
        this.saveUsers(users);
        
        // Update current user if it's the same
        if (this.getCurrentUser()?.username === username) {
            this.setCurrentUser(users[userIndex]);
        }
        
        return users[userIndex];
    },
    
    // Set current active user
    setCurrentUser(user) {
        localStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));
    },
    
    // Get current active user
    getCurrentUser() {
        const userJson = localStorage.getItem(this.CURRENT_USER_KEY);
        if (!userJson) {
            return null;
        }
        
        try {
            return JSON.parse(userJson);
        } catch (e) {
            console.error('Failed to parse current user data:', e);
            return null;
        }
    },
    
    // Clear current user
    clearCurrentUser() {
        localStorage.removeItem(this.CURRENT_USER_KEY);
    },
    
    // Check if user has valid Spotify credentials
    userHasValidCredentials(user) {
        return !!(user && user.clientId && user.clientSecret && user.refreshToken);
    }
};

// Initialize the user list when the page loads
document.addEventListener('DOMContentLoaded', function() {
    renderUserList();
    
    // Add event listener for adding users
    document.getElementById('addUserButton').addEventListener('click', function() {
        const usernameInput = document.getElementById('newUsername');
        const username = usernameInput.value.trim();
        
        try {
            UserManager.addUser(username);
            usernameInput.value = '';
            renderUserList();
        } catch (error) {
            alert(error.message);
        }
    });
});

// Render the list of users
function renderUserList() {
    const userList = document.getElementById('userList');
    const users = UserManager.getUsers();
    
    if (users.length === 0) {
        userList.innerHTML = `<div style="text-align: center; padding: 20px;">No users found. Create a new user to get started.</div>`;
        return;
    }
    
    const currentUser = UserManager.getCurrentUser();
    
    userList.innerHTML = users.map(user => {
        const isConnected = UserManager.userHasValidCredentials(user);
        const isCurrent = currentUser && currentUser.username === user.username;
        
        return `
            <div class="user-card ${isCurrent ? 'current-user' : ''}">
                <div>
                    <div class="username">${user.username} ${isCurrent ? '(Current)' : ''}</div>
                    <div class="user-status ${isConnected ? 'connected' : 'not-connected'}">
                        ${isConnected ? 'Connected to Spotify' : 'Not connected to Spotify'}
                    </div>
                </div>
                <div class="user-actions">
                    <button onclick="switchUser('${user.username}')">
                        ${isCurrent ? 'Configure' : 'Select'}
                    </button>
                    <button class="delete-btn" onclick="deleteUser('${user.username}')">Delete</button>
                </div>
            </div>
        `;
    }).join('');
}

// Switch to a user
function switchUser(username) {
    const user = UserManager.getUser(username);
    if (user) {
        UserManager.setCurrentUser(user);
        // Redirect to configure page for the selected user
        window.location.href = 'index.html';
    }
}

// Delete a user
function deleteUser(username) {
    if (confirm(`Are you sure you want to delete the user "${username}"? This action cannot be undone.`)) {
        UserManager.deleteUser(username);
        renderUserList();
    }
}
