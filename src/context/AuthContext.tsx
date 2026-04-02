import React, { createContext, useContext, useEffect, useState } from 'react';
import api from '../lib/api';

interface AuthContextType {
  user: any | null;
  profile: any | null;
  loading: boolean;
  isAuthReady: boolean;
  login: (email: string, password: string, role: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('smart_student_user');
    if (storedUser) {
      const parsedUser = JSON.parse(storedUser);
      // Ensure id exists as an alias for _id
      if (parsedUser._id && !parsedUser.id) {
        parsedUser.id = parsedUser._id;
      }
      setUser(parsedUser);
      setProfile(parsedUser);
    }
    setLoading(false);
    setIsAuthReady(true);
  }, []);

  const login = async (email: string, password: string, role: string) => {
    try {
      console.log('🔐 Login attempt:', { email, role, apiBaseURL: api.defaults.baseURL });
      
      const { data } = await api.post('/api/auth/login', { email, password, role });
      
      console.log('✅ Login successful:', { email, role });
      
      // Ensure id exists as an alias for _id
      if (data._id && !data.id) {
        data.id = data._id;
      }
      localStorage.setItem('smart_student_user', JSON.stringify(data));
      setUser(data);
      setProfile(data);
    } catch (error: any) {
      console.error('❌ Login error:', {
        status: error.response?.status,
        message: error.response?.data?.message,
        fullError: error.message,
        url: error.config?.url,
      });
      throw new Error(error.response?.data?.message || error.message || 'Login failed');
    }
  };

  const logout = () => {
    localStorage.removeItem('smart_student_user');
    setUser(null);
    setProfile(null);
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, isAuthReady, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
