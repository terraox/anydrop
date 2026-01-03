import React, { createContext, useState, useEffect, useContext } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check localStorage for persisting session
    const savedToken = localStorage.getItem('anydrop_auth_token');
    const savedRole = localStorage.getItem('anydrop_user_role');
    const savedEmail = localStorage.getItem('anydrop_user_email');
    const savedPlan = localStorage.getItem('anydrop_user_plan');
    
    // NEW: Load Identity fields
    const savedUsername = localStorage.getItem('anydrop_user_username');
    const savedAvatar = localStorage.getItem('anydrop_user_avatar');

    if (savedToken && savedEmail) {
      setToken(savedToken);
      setUser({
        email: savedEmail,
        role: savedRole,
        plan: savedPlan,
        username: savedUsername, // Gamertag support
        avatar: savedAvatar      // Pixel Art Avatar support
      });
    }
    setLoading(false);
  }, []);

  const login = (authToken, userData) => {
    // userData expects: { email, role, plan, username, avatar }
    
    localStorage.setItem('anydrop_auth_token', authToken);
    localStorage.setItem('anydrop_user_email', userData.email);
    localStorage.setItem('anydrop_user_role', userData.role);
    localStorage.setItem('anydrop_user_plan', userData.plan || 'FREE');
    
    // NEW: Save Identity
    localStorage.setItem('anydrop_user_username', userData.username);
    localStorage.setItem('anydrop_user_avatar', userData.avatar);
    
    setToken(authToken);
    setUser({
      email: userData.email,
      role: userData.role,
      plan: userData.plan || 'FREE',
      username: userData.username,
      avatar: userData.avatar
    });
  };

  const logout = () => {
    localStorage.removeItem('anydrop_auth_token');
    localStorage.removeItem('anydrop_user_email');
    localStorage.removeItem('anydrop_user_role');
    localStorage.removeItem('anydrop_user_plan');
    
    // NEW: Clear Identity
    localStorage.removeItem('anydrop_user_username');
    localStorage.removeItem('anydrop_user_avatar');
    
    setToken(null);
    setUser(null);
  };

  const value = { user, token, login, logout, isAuthenticated: !!token, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};