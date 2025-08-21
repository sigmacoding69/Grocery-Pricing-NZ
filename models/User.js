const fs = require('fs').promises;
const path = require('path');

// Simple JSON file database (in production, use proper database)
const DB_FILE = path.join(__dirname, '../data/users.json');

// Initialize database file if it doesn't exist
async function initializeDatabase() {
  try {
    await fs.access(DB_FILE);
  } catch (error) {
    // File doesn't exist, create it
    await fs.mkdir(path.dirname(DB_FILE), { recursive: true });
    await fs.writeFile(DB_FILE, JSON.stringify([], null, 2));
  }
}

// Read users from file
async function readUsers() {
  try {
    await initializeDatabase();
    const data = await fs.readFile(DB_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading users file:', error);
    return [];
  }
}

// Write users to file
async function writeUsers(users) {
  try {
    await fs.writeFile(DB_FILE, JSON.stringify(users, null, 2));
  } catch (error) {
    console.error('Error writing users file:', error);
    throw error;
  }
}

// Create or update user
async function createUser(userData) {
  try {
    const users = await readUsers();
    const existingIndex = users.findIndex(user => user.id === userData.id);
    
    if (existingIndex !== -1) {
      // Update existing user
      users[existingIndex] = { ...users[existingIndex], ...userData };
    } else {
      // Add new user
      users.push(userData);
    }
    
    await writeUsers(users);
    return userData;
  } catch (error) {
    console.error('Error creating/updating user:', error);
    throw error;
  }
}

// Get user by ID
async function getUserById(userId) {
  try {
    const users = await readUsers();
    return users.find(user => user.id === userId);
  } catch (error) {
    console.error('Error getting user by ID:', error);
    return null;
  }
}

// Get user by email
async function getUserByEmail(email) {
  try {
    const users = await readUsers();
    return users.find(user => user.email.toLowerCase() === email.toLowerCase());
  } catch (error) {
    console.error('Error getting user by email:', error);
    return null;
  }
}

// Update user subscription data
async function updateUserSubscription(userId, subscriptionData) {
  try {
    const users = await readUsers();
    const userIndex = users.findIndex(user => user.id === userId);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    // Update subscription fields
    users[userIndex] = {
      ...users[userIndex],
      ...subscriptionData,
      updatedAt: new Date().toISOString()
    };
    
    await writeUsers(users);
    return users[userIndex];
  } catch (error) {
    console.error('Error updating user subscription:', error);
    throw error;
  }
}

// Get all users (admin function)
async function getAllUsers() {
  try {
    return await readUsers();
  } catch (error) {
    console.error('Error getting all users:', error);
    return [];
  }
}

// Delete user
async function deleteUser(userId) {
  try {
    const users = await readUsers();
    const filteredUsers = users.filter(user => user.id !== userId);
    
    if (users.length === filteredUsers.length) {
      throw new Error('User not found');
    }
    
    await writeUsers(filteredUsers);
    return true;
  } catch (error) {
    console.error('Error deleting user:', error);
    throw error;
  }
}

// Get users by subscription status
async function getUsersBySubscriptionStatus(isPremium) {
  try {
    const users = await readUsers();
    return users.filter(user => Boolean(user.isPremium) === Boolean(isPremium));
  } catch (error) {
    console.error('Error getting users by subscription status:', error);
    return [];
  }
}

// Update user last login
async function updateLastLogin(userId) {
  try {
    return await updateUserSubscription(userId, {
      lastLogin: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating last login:', error);
    throw error;
  }
}

// Clean up expired trial users (can be run as a scheduled job)
async function cleanupExpiredTrials() {
  try {
    const users = await readUsers();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const activeUsers = users.filter(user => {
      // Keep premium users and recently active users
      if (user.isPremium) return true;
      
      const lastLogin = user.lastLogin ? new Date(user.lastLogin) : new Date(user.createdAt);
      return lastLogin > thirtyDaysAgo;
    });
    
    if (activeUsers.length !== users.length) {
      await writeUsers(activeUsers);
      console.log(`Cleaned up ${users.length - activeUsers.length} inactive trial users`);
    }
    
    return activeUsers.length;
  } catch (error) {
    console.error('Error cleaning up expired trials:', error);
    return 0;
  }
}

// Get user statistics
async function getUserStats() {
  try {
    const users = await readUsers();
    
    const stats = {
      total: users.length,
      premium: users.filter(user => user.isPremium).length,
      free: users.filter(user => !user.isPremium).length,
      recentlyActive: 0,
      newThisMonth: 0
    };
    
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    
    users.forEach(user => {
      const lastLogin = user.lastLogin ? new Date(user.lastLogin) : new Date(user.createdAt);
      const createdAt = new Date(user.createdAt);
      
      if (lastLogin > weekAgo) {
        stats.recentlyActive++;
      }
      
      if (createdAt > monthAgo) {
        stats.newThisMonth++;
      }
    });
    
    return stats;
  } catch (error) {
    console.error('Error getting user stats:', error);
    return {
      total: 0,
      premium: 0,
      free: 0,
      recentlyActive: 0,
      newThisMonth: 0
    };
  }
}

module.exports = {
  createUser,
  getUserById,
  getUserByEmail,
  updateUserSubscription,
  getAllUsers,
  deleteUser,
  getUsersBySubscriptionStatus,
  updateLastLogin,
  cleanupExpiredTrials,
  getUserStats
};

