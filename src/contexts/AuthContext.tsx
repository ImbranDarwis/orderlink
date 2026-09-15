import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { User as ApiUser } from '../services/api';

export type UserRole = 'Distributor' | 'Retailer' | 'Driver' | 'Admin';
export type AppTheme = 'dark' | 'light';
export type AppLanguage = 'EN' | 'IND';
export type AppCurrency = 'USD' | 'IDR';

interface AuthContextType {
  user: ApiUser | null;
  role: UserRole | null;
  loading: boolean;
  theme: AppTheme;
  language: AppLanguage;
  currency: AppCurrency;
  profileName: string;
  setRole: (role: UserRole) => void;
  setTheme: (theme: AppTheme) => void;
  setLanguage: (lang: AppLanguage) => void;
  setCurrency: (curr: AppCurrency) => void;
  setProfileName: (name: string) => void;
  loginDemo: (role: UserRole) => void;
  loginReal: (userObj: ApiUser, role: UserRole) => void;
  signOut: () => Promise<void>;
  hasPermission: (permission: string) => boolean;
  canAccessPage: (page: string) => boolean;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: null,
  loading: true,
  theme: 'dark',
  language: 'EN',
  currency: 'IDR',
  profileName: 'User',
  setRole: () => {},
  setTheme: () => {},
  setLanguage: () => {},
  setCurrency: () => {},
  setProfileName: () => {},
  loginDemo: () => {},
  loginReal: () => {},
  signOut: async () => {},
  hasPermission: () => false,
  canAccessPage: () => false,
});

// Role-based permissions
const rolePermissions: Record<UserRole, string[]> = {
  Admin: ['Dashboard', 'Orders', 'Inventory', 'Customers', 'Analytics', 'Settings', 'Create', 'Edit', 'Delete'],
  Distributor: ['Dashboard', 'Orders', 'Inventory', 'Customers', 'Analytics', 'Create', 'Edit'],
  Retailer: ['Dashboard', 'Orders', 'Customers', 'Create'],
  Driver: ['Dashboard', 'Orders'],
};

const hasPermission = (userRole: UserRole | null, permission: string): boolean => {
  if (!userRole) return false;
  return rolePermissions[userRole]?.includes(permission) ?? false;
};

const canAccessPage = (userRole: UserRole | null, page: string): boolean => {
  if (!userRole) return false;
  // Map page names to permissions
  const pagePermissions: Record<string, string> = {
    'Dashboard': 'Dashboard',
    'Orders': 'Orders',
    'Inventory': 'Inventory',
    'Customers': 'Customers',
    'Analytics': 'Analytics',
    'Settings': 'Settings',
    '': 'Dashboard',
  };
  const permission = pagePermissions[page] || page;
  return hasPermission(userRole, permission);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<ApiUser | null>(null);
  const [role, setRoleState] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);

  // Global Settings States
  const [theme, setThemeState] = useState<AppTheme>('dark');
  const [language, setLanguageState] = useState<AppLanguage>('EN');
  const [currency, setCurrencyState] = useState<AppCurrency>('IDR');
  const [profileName, setProfileNameState] = useState('User');

  const fetchUserProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (!error && data) {
      setUser(data as ApiUser);
      setRoleState(data.role as UserRole);
      setProfileNameState(data.full_name);
    }
  };

  useEffect(() => {
    // Check local demo session
    const savedRole = localStorage.getItem('demo_user_role') as UserRole | null;
    const savedName = localStorage.getItem('demo_user_name');
    if (savedRole) {
      setRoleState(savedRole);
      setProfileNameState(savedName || `${savedRole} Demo`);
      setUser({
        id: 'demo-user-id',
        email: `${savedRole.toLowerCase()}@orderlink.io`,
        role: savedRole,
        full_name: savedName || `${savedRole} Demo`
      });
    }

    let unsubscribe = () => {};

    if (isSupabaseConfigured) {
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user) {
          fetchUserProfile(session.user.id).finally(() => setLoading(false));
        } else {
          setLoading(false);
        }
      }).catch(() => {
        setLoading(false);
      });

      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          fetchUserProfile(session.user.id);
        } else if (!localStorage.getItem('demo_user_role')) {
          setUser(null);
          setRoleState(null);
        }
      });
      unsubscribe = () => subscription.unsubscribe();
    } else {
      setLoading(false);
    }

    const savedTheme = localStorage.getItem('app_theme') as AppTheme | null;
    if (savedTheme) {
      setThemeState(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      document.documentElement.classList.add('dark');
    }

    const savedLang = localStorage.getItem('app_lang') as AppLanguage | null;
    if (savedLang) setLanguageState(savedLang);

    const savedCurr = localStorage.getItem('app_curr') as AppCurrency | null;
    if (savedCurr) setCurrencyState(savedCurr);

    return () => unsubscribe();
  }, []);


  const setRole = (newRole: UserRole) => {
    setRoleState(newRole);
    // Ideally this would be updated in the backend, but we just set local state here for UI mocking if needed
  };

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    localStorage.setItem('app_theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const setLanguage = (newLang: AppLanguage) => {
    setLanguageState(newLang);
    localStorage.setItem('app_lang', newLang);
    // Auto-switch currency: IDR for Indonesian, USD for English
    const newCurrency = newLang === 'IND' ? 'IDR' : 'USD';
    setCurrencyState(newCurrency);
    localStorage.setItem('app_curr', newCurrency);
  };

  const setCurrency = (newCurr: AppCurrency) => {
    setCurrencyState(newCurr);
    localStorage.setItem('app_curr', newCurr);
  };

  const setProfileName = (newName: string) => {
    setProfileNameState(newName);
    // Normally we'd want to persist this to Supabase profile
  };

  const loginDemo = (selectedRole: UserRole) => {
    const demoUser: ApiUser = {
      id: 'demo-user-id',
      email: `${selectedRole.toLowerCase()}@orderlink.io`,
      role: selectedRole,
      full_name: `${selectedRole} Demo`
    };
    setUser(demoUser);
    setRoleState(selectedRole);
    setProfileNameState(`${selectedRole} Demo`);
    localStorage.setItem('demo_user_role', selectedRole);
    localStorage.setItem('demo_user_name', `${selectedRole} Demo`);
  };

  const loginReal = (userObj: ApiUser, selectedRole: UserRole) => {
    setUser(userObj);
    setRoleState(selectedRole);
  };

  const signOut = async () => {
    localStorage.removeItem('demo_user_role');
    localStorage.removeItem('demo_user_name');
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch {
        // ignore
      }
    }
    setUser(null);
    setRoleState(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        loading,
        theme,
        language,
        currency,
        profileName,
        setRole,
        setTheme,
        setLanguage,
        setCurrency,
        setProfileName,
        loginDemo,
        loginReal,
        signOut,
        hasPermission: (permission: string) => hasPermission(role, permission),
        canAccessPage: (page: string) => canAccessPage(role, page),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);