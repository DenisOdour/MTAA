import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import API from '../utils/api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('mtaa_user');
      return stored ? JSON.parse(stored) : null;
    } catch { return null; }
  });
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // logout defined before fetchMe to avoid scope issue
  const logout = useCallback(() => {
    localStorage.removeItem('mtaa_token');
    localStorage.removeItem('mtaa_user');
    setUser(null);
    setNotifications([]);
    setUnreadCount(0);
  }, []);

  const fetchMe = useCallback(async () => {
    try {
      const { data } = await API.get('/auth/me');
      if (data.success && data.user) {
        setUser(data.user);
        localStorage.setItem('mtaa_user', JSON.stringify(data.user));
      } else {
        logout();
      }
    } catch (err) {
      // Only logout on 401, not network errors
      if (err.response?.status === 401) {
        logout();
      }
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    const token = localStorage.getItem('mtaa_token');
    if (token) {
      fetchMe();
    } else {
      setLoading(false);
    }
  }, [fetchMe]);

  const login = async (identifier, password) => {
    // Support phone, username, or email as identifier
    const payload = { identifier, password };
    const { data } = await API.post('/auth/login', payload);
    if (!data.success) throw new Error(data.message || 'Login failed');
    localStorage.setItem('mtaa_token', data.token);
    localStorage.setItem('mtaa_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const register = async (formData) => {
    const { data } = await API.post('/auth/register', formData);
    if (!data.success) throw new Error(data.message || 'Registration failed');
    localStorage.setItem('mtaa_token', data.token);
    localStorage.setItem('mtaa_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const updateUser = useCallback((updates) => {
    setUser(prev => {
      const updated = { ...prev, ...updates };
      localStorage.setItem('mtaa_user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const fetchNotifications = useCallback(async () => {
    if (!localStorage.getItem('mtaa_token')) return;
    try {
      const { data } = await API.get('/notifications');
      if (data.success) {
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch { /* silently fail */ }
  }, []);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [user, fetchNotifications]);

  const markNotificationsRead = async () => {
    try {
      await API.put('/notifications/read-all');
      setUnreadCount(0);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch { /* silently fail */ }
  };

  const isAdmin = user?.role === 'admin' || user?.role === 'super_admin';
  const isSuperAdmin = user?.role === 'super_admin';

  return (
    <AuthContext.Provider value={{
      user, loading, isAdmin, isSuperAdmin,
      login, register, logout, updateUser,
      notifications, unreadCount, fetchNotifications, markNotificationsRead
    }}>
      {children}
    </AuthContext.Provider>
  );
};
