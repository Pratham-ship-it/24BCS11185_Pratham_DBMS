import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import API from '../api/axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Stable logout that can be safely referenced from interceptors and effects
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  // Expose logout to the Axios 401 interceptor so React state stays in sync
  const logoutRef = useRef(logout);
  logoutRef.current = logout;

  useEffect(() => {
    const interceptorId = API.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response && error.response.status === 401 && localStorage.getItem('token')) {
          // Clear both localStorage AND React state via the ref
          logoutRef.current();
        }
        return Promise.reject(error);
      }
    );

    return () => {
      API.interceptors.response.eject(interceptorId);
    };
  }, []);

  // Verify session on mount
  useEffect(() => {
    const initAuth = async () => {
      const storedToken = localStorage.getItem('token');
      if (storedToken) {
        try {
          const res = await API.get('/auth/me');
          // Backend /auth/me returns the full user doc; normalise the id field
          const verifiedUser = res.data;
          if (verifiedUser._id && !verifiedUser.id) {
            verifiedUser.id = verifiedUser._id;
          }
          setUser(verifiedUser);
          localStorage.setItem('user', JSON.stringify(verifiedUser));
        } catch (err) {
          console.warn('Session verification failed, logging out:', err?.response?.data?.message || err.message);
          logout();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [logout]);

  const login = async (email, password) => {
    const res = await API.post('/auth/login', { email, password });
    const { token: receivedToken, user: receivedUser } = res.data;
    setToken(receivedToken);
    setUser(receivedUser);
    localStorage.setItem('token', receivedToken);
    localStorage.setItem('user', JSON.stringify(receivedUser));
    return receivedUser;
  };

  const register = async (userData) => {
    const res = await API.post('/auth/register', userData);
    const { token: receivedToken, user: receivedUser } = res.data;
    setToken(receivedToken);
    setUser(receivedUser);
    localStorage.setItem('token', receivedToken);
    localStorage.setItem('user', JSON.stringify(receivedUser));
    return receivedUser;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        isAdmin: user?.role === 'admin',
        isOrganizer: user?.role === 'organizer' || user?.role === 'admin',
        loading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
