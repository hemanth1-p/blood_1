import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('bloodconnect_token'));
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('bloodconnect_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [loading, setLoading] = useState(true);

  // Sync token and user to localStorage
  const setSession = (newToken, newUser) => {
    if (newToken) {
      localStorage.setItem('bloodconnect_token', newToken);
      setToken(newToken);
    } else {
      localStorage.removeItem('bloodconnect_token');
      setToken(null);
    }

    if (newUser) {
      localStorage.setItem('bloodconnect_user', JSON.stringify(newUser));
      setUser(newUser);
    } else {
      localStorage.removeItem('bloodconnect_user');
      setUser(null);
    }
  };

  const refreshProfile = async () => {
    if (!token) return null;
    try {
      const res = await api.get('/auth/me');
      if (res.user) {
        setSession(token, res.user);
        return res.user;
      }
    } catch (err) {
      console.warn('Could not refresh profile:', err);
    }
    return null;
  };

  useEffect(() => {
    const initAuth = async () => {
      if (token) {
        await refreshProfile();
      }
      setLoading(false);
    };
    initAuth();
  }, [token]);

  const login = async (email, password, role) => {
    const res = await api.post('/auth/login', { email, password, role });
    setSession(res.token, res.user);
    return res;
  };

  const register = async (formData) => {
    const res = await api.post('/auth/register', formData);
    setSession(res.token, res.user);
    return res;
  };

  const logout = () => {
    setSession(null, null);
  };

  const updateUser = (updatedUser) => {
    setSession(token, updatedUser);
  };

  const value = {
    user,
    token,
    loading,
    login,
    register,
    logout,
    updateUser,
    refreshProfile,
    isAuthenticated: !!token && !!user,
    isAdmin: user?.role === 'admin',
    isDonor: user?.role === 'donor',
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
