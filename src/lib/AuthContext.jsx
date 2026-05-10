import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null);

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setIsLoadingAuth(true);
      setAuthError(null);

      const appClient = createAxiosClient({
        baseURL: `/api/apps/public`,
        headers: { 'X-App-Id': appParams.appId },
        token: appParams.token,
        interceptResponses: true
      });

      const settingsPromise = appClient.get(`/prod/public-settings/by-id/${appParams.appId}`);
      const authPromise = appParams.token ? base44.auth.me().catch(e => ({ _authError: e })) : Promise.resolve(null);

      const [publicSettingsResult, authResult] = await Promise.allSettled([settingsPromise, authPromise]);

      // Handle public settings
      if (publicSettingsResult.status === 'fulfilled') {
        setAppPublicSettings(publicSettingsResult.value);
        setIsLoadingPublicSettings(false);
      } else {
        const appError = publicSettingsResult.reason;
        if (appError?.status === 403 && appError?.data?.extra_data?.reason) {
          const reason = appError.data.extra_data.reason;
          setAuthError({ type: reason, message: appError.message });
        } else {
          setAuthError({ type: 'unknown', message: appError?.message || 'Failed to load app' });
        }
        setIsLoadingPublicSettings(false);
        setIsLoadingAuth(false);
        return;
      }

      // Handle auth
      if (!appParams.token) {
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
      } else if (authResult.status === 'fulfilled' && authResult.value && !authResult.value._authError) {
        setUser(authResult.value);
        setIsAuthenticated(true);
        setIsLoadingAuth(false);
      } else {
        const error = authResult.reason || authResult.value?._authError;
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
        if (error?.status === 401 || error?.status === 403) {
          setAuthError({ type: 'auth_required', message: 'Authentication required' });
        }
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      setAuthError({ type: 'unknown', message: error.message || 'An unexpected error occurred' });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const deleteAccount = async () => {
    try {
      const response = await base44.functions.invoke('deleteUserAccount', {});
      if (response.data?.logout) {
        logout(true);
      }
    } catch (error) {
      console.error('Failed to delete account:', error);
      throw error;
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);
    if (shouldRedirect) {
      base44.auth.logout(window.location.href);
    } else {
      base44.auth.logout();
    }
  };

  const navigateToLogin = () => {
    // Avoid redirect loops by not including auth-related params
    const loginUrl = window.location.pathname === '/' ? '/dashboard' : window.location.pathname;
    base44.auth.redirectToLogin(window.location.origin + loginUrl);
  };

  return (
    <AuthContext.Provider value={{ 
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      logout,
      deleteAccount,
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