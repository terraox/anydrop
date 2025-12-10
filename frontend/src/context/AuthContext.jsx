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

    if (savedToken && savedEmail) {
      setToken(savedToken);
      setUser({
        email: savedEmail,
        role: savedRole,
        plan: savedPlan
      });
    }
    setLoading(false);
  }, []);

  const login = (authToken, userEmail, userRole, userPlan) => {
    localStorage.setItem('anydrop_auth_token', authToken);
    localStorage.setItem('anydrop_user_email', userEmail);
    localStorage.setItem('anydrop_user_role', userRole);
    localStorage.setItem('anydrop_user_plan', userPlan || 'FREE');
    
    setToken(authToken);
    setUser({
      email: userEmail,
      role: userRole,
      plan: userPlan || 'FREE'
    });
  };

  const logout = () => {
    localStorage.removeItem('anydrop_auth_token');
    localStorage.removeItem('anydrop_user_email');
    localStorage.removeItem('anydrop_user_role');
    localStorage.removeItem('anydrop_user_plan');
    setToken(null);
    setUser(null);
  };

  const value = { user, token, login, logout, isAuthenticated: !!token, loading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};