import React, { createContext, useState, useEffect, useContext } from 'react';
import API from '../services/api';
import toast from 'react-hot-toast';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem('apex_user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const saved = sessionStorage.getItem('apex_user');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed && parsed.token) {
            const res = await API.get('/auth/profile');
            const freshUser = { ...res.data.data, token: parsed.token };
            setUser(freshUser);
            sessionStorage.setItem('apex_user', JSON.stringify(freshUser));
          } else {
            setUser(null);
            sessionStorage.removeItem('apex_user');
          }
        } catch (err) {
          setUser(null);
          sessionStorage.removeItem('apex_user');
        }
      } else {
        setUser(null);
      }
      setIsInitializing(false);
    };

    initAuth();

    const handleExpired = () => {
      setUser(null);
      sessionStorage.removeItem('apex_user');
      toast.error('Session expired. Please log in again.');
    };
    window.addEventListener('storage_token_expired', handleExpired);
    return () => window.removeEventListener('storage_token_expired', handleExpired);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const res = await API.post('/auth/login', { email, password });
      const userData = res.data.data;
      setUser(userData);
      sessionStorage.setItem('apex_user', JSON.stringify(userData));
      toast.success(res.data.message || 'Logged in successfully!');
      return userData;
    } catch (err) {
      const msg = err.response?.data?.message || 'Login failed';
      toast.error(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const register = async (formData) => {
    setLoading(true);
    try {
      const res = await API.post('/auth/register', formData);
      const userData = res.data.data;
      setUser(userData);
      sessionStorage.setItem('apex_user', JSON.stringify(userData));
      toast.success('Registration successful! Welcome to ApexCart.');
      return userData;
    } catch (err) {
      const msg = err.response?.data?.message || 'Registration failed';
      toast.error(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    sessionStorage.removeItem('apex_user');
    toast.success('Logged out successfully');
  };

  const updateProfileState = (updatedUser) => {
    setUser((prevUser) => {
      if (!prevUser) return null;
      const newUserData = { ...prevUser, ...updatedUser, token: prevUser.token };
      sessionStorage.setItem('apex_user', JSON.stringify(newUserData));
      return newUserData;
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        isInitializing,
        login,
        register,
        logout,
        updateProfileState,
        isAdmin: user?.role === 'admin',
        isAuthenticated: !!user,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
