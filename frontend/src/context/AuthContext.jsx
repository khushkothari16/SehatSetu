import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService, patientService } from '../services/authService';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState('patient'); // Extensible to doctor, admin, etc.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      try {
        const session = await authService.getSession();
        if (session.isAuthenticated) {
          setUser(session.user);
          setRole(session.role);
        }
      } catch (err) {
        console.error('Failed to restore auth session:', err);
      } finally {
        setLoading(false);
      }
    };
    initAuth();
  }, []);

  const loginWithOtp = async (phone, otp) => {
    const res = await authService.loginWithOtp(phone, otp);
    setUser(res.user);
    setRole('patient');
    return res;
  };

  const setAuthSession = ({ user, role }) => {
    setUser(user);
    setRole(role);
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
    setRole(null);
  };

  const updateProfile = async (updates) => {
    const updated = await patientService.updateProfile(updates);
    setUser(updated);
    return updated;
  };

  const addEmergencyContact = async (contact) => {
    const updated = await patientService.addEmergencyContact(contact);
    setUser(updated);
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        loginWithOtp,
        logout,
        setAuthSession,
        updateProfile,
        addEmergencyContact,
        isAuthenticated: Boolean(user)
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
