import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { supabase } from '@/lib/supabase';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      setAuthError(null);

      if (typeof window !== 'undefined' && window.location.pathname === '/auth/callback') {
        await handleOAuthCallback();
        return;
      }

      const savedToken = localStorage.getItem('campusense_token');
      const savedUser = localStorage.getItem('campusense_user');

      if (savedToken && savedUser) {
        try {
          setUser(JSON.parse(savedUser));
          setIsAuthenticated(true);
          await checkUserAuth();
        } catch (e) {
          setAuthError({ type: 'unknown', message: e.message });
        }
      } else {
        setAuthError({
          type: 'auth_required',
          message: 'Authentication required'
        });
      }
      setIsLoadingAuth(false);
      setAuthChecked(true);
    } catch (error) {
      console.error('App state check failed:', error);
      setAuthError({ type: 'unknown', message: error.message });
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const handleOAuthCallback = async () => {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error || !data.session || !data.session.user?.email) {
        throw error || new Error('No session');
      }

      const u = data.session.user;
      const meta = u.user_metadata || {};
      const fullName = meta.full_name || meta.name || '';
      const parts = fullName.split(' ').filter(Boolean);

      const res = await base44.auth.google({
        access_token: data.session.access_token,
        email: u.email,
        first_name: parts[0] || '',
        last_name: parts.slice(1).join(' '),
        avatar_url: meta.avatar_url || meta.picture || null
      });

      setUser(res.user);
      setIsAuthenticated(true);
      setAuthError(null);
      if (typeof window !== 'undefined') {
        window.location.replace('/');
        return;
      }
    } catch (err) {
      console.error('OAuth callback failed:', err);
      setAuthError({
        type: 'auth_required',
        message: 'Google sign-in failed. Try again.'
      });
      if (typeof window !== 'undefined') {
        window.location.replace('/');
        return;
      }
    } finally {
      setIsLoadingAuth(false);
      setAuthChecked(true);
    }
  };

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      localStorage.setItem('campusense_user', JSON.stringify(currentUser));
      setIsAuthenticated(true);
      setAuthError(null);
      setIsLoadingAuth(false);
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setUser(null);
      localStorage.removeItem('campusense_token');
      localStorage.removeItem('campusense_user');

      if (error.response?.status === 401 || error.response?.status === 403) {
        setAuthError({
          type: 'auth_required',
          message: 'Authentication required'
        });
      }
    }
  };

  const login = async (email, password) => {
    const data = await base44.auth.login(email, password);
    setUser(data.user);
    setIsAuthenticated(true);
    setAuthError(null);
    setAuthChecked(true);
    return data;
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    setAuthChecked(true);
    setAuthError({
      type: 'auth_required',
      message: 'Authentication required'
    });
    if (shouldRedirect) {
      base44.auth.logout(window.location.href);
    } else {
      base44.auth.logout();
    }
  };

  const navigateToLogin = () => {
    base44.auth.logout();
    setAuthError({
      type: 'auth_required',
      message: 'Authentication required'
    });
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      authChecked,
      appPublicSettings,
      login,
      logout,
      navigateToLogin,
      checkAppState
    }}>
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
