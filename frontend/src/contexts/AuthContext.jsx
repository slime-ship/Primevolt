import React, { createContext, useState, useEffect } from 'react';
import api from '../api/api';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [adminUser, setAdminUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('access_token');
      const adminToken = localStorage.getItem('admin_access_token');

      // Initialize User
      if (token) {
        try {
          const res = await api.get('users/me/');
          setUser(res.data);
          setIsAuthenticated(true);
        } catch (err) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
        }
      }

      // Initialize Admin
      if (adminToken) {
        try {
          const savedAdmin = localStorage.getItem('admin_user');
          if (savedAdmin) {
            setAdminUser(JSON.parse(savedAdmin));
            setIsAdminAuthenticated(true);
          }
        } catch (err) {
          localStorage.removeItem('admin_access_token');
          localStorage.removeItem('admin_refresh_token');
        }
      }

      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (username, password) => {
    try {
      const res = await api.post('auth/login/', { username, password });
      const { access, refresh } = res.data;
      localStorage.setItem('access_token', access);
      localStorage.setItem('refresh_token', refresh);
      
      const userRes = await api.get('users/me/');
      setUser(userRes.data);
      setIsAuthenticated(true);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.detail || 'Invalid username or password.'
      };
    }
  };

  const register = async (userData) => {
    try {
      const res = await api.post('auth/register/', userData);
      return { success: true, message: res.data.message };
    } catch (err) {
      // Return first field error or general error
      const errs = err.response?.data || {};
      const errorMsg = typeof errs === 'object' && errs !== null
        ? Object.entries(errs)
            .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(', ') : v}`)
            .join(' | ') || 'Registration failed.'
        : 'Registration failed.';
      return { success: false, error: errorMsg };
    }
  };

  const logout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    setIsAuthenticated(false);
  };

  const adminLogin = async (email, password) => {
    try {
      const res = await api.post('admin/auth/login/', { email, password });
      const { admin, tokens } = res.data;
      localStorage.setItem('admin_access_token', tokens.access);
      localStorage.setItem('admin_refresh_token', tokens.refresh);
      localStorage.setItem('admin_user', JSON.stringify(admin));
      setAdminUser(admin);
      setIsAdminAuthenticated(true);
      return { success: true };
    } catch (err) {
      return {
        success: false,
        error: err.response?.data?.error || 'Invalid credentials.'
      };
    }
  };

  const adminLogout = () => {
    localStorage.removeItem('admin_access_token');
    localStorage.removeItem('admin_refresh_token');
    localStorage.removeItem('admin_user');
    setAdminUser(null);
    setIsAdminAuthenticated(false);
  };

  const fetchUserMe = async () => {
    if (isAuthenticated) {
      try {
        const res = await api.get('users/me/');
        setUser(res.data);
      } catch (err) {
        logout();
      }
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        adminUser,
        isAuthenticated,
        isAdminAuthenticated,
        loading,
        login,
        register,
        logout,
        adminLogin,
        adminLogout,
        fetchUserMe
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
