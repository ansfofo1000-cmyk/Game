import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, initCSRF, notificationService } from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const fetchCurrentUser = async () => {
    try {
      await initCSRF();
      const res = await authService.me();
      if (res.data.isAuthenticated) {
        setUser(res.data.user);
        fetchNotificationsCount();
      } else {
        setUser(null);
      }
    } catch (err) {
      console.warn('Error fetching current user:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificationsCount = async () => {
    try {
      const res = await notificationService.getNotifications();
      setUnreadNotifications(res.data.unread_count || 0);
    } catch {
      // ignore unauthenticated or background errors
    }
  };

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const login = async (email, password) => {
    await initCSRF();
    const res = await authService.login({ email, password });
    setUser(res.data.user);
    fetchNotificationsCount();
    return res.data;
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn('Logout error:', err);
    } finally {
      setUser(null);
      setUnreadNotifications(0);
    }
  };

  const registerStudent = async (formData) => {
    await initCSRF();
    const res = await authService.registerStudent(formData);
    setUser(res.data);
    fetchNotificationsCount();
    return res.data;
  };

  const registerTeacher = async (formData) => {
    await initCSRF();
    const res = await authService.registerTeacher(formData);
    return res.data;
  };

  const refreshUser = async () => {
    try {
      const res = await authService.me();
      if (res.data.isAuthenticated) {
        setUser(res.data.user);
        fetchNotificationsCount();
      }
    } catch (err) {
      console.warn('Refresh user error:', err);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isStudent: user?.role === 'STUDENT',
    isTeacher: user?.role === 'TEACHER',
    isAdmin: user?.role === 'ADMIN' || user?.is_staff || user?.is_superuser,
    unreadNotifications,
    login,
    logout,
    registerStudent,
    registerTeacher,
    refreshUser,
    fetchNotificationsCount,
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
