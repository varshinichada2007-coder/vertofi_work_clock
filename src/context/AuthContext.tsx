import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { storage } from '../services/storage';
import { api, AddEmployeeParams, mapProfileToUser } from '../services/api';
import { supabase } from '../lib/supabase';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  users: User[];
  login: (email: string, password?: string) => Promise<void>;
  addEmployee: (params: AddEmployeeParams) => Promise<User>;
  deleteEmployee: (userId: string) => Promise<void>;
  updateProfile: (updates: { name?: string; phone?: string; workLocation?: string }) => Promise<User>;
  logout: () => Promise<void>;
  isLoading: boolean;
  refreshUsers: () => Promise<User[]>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('EMPLOYEE');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUsers = async (): Promise<User[]> => {
    try {
      const profiles = await api.getProfiles();
      setUsers(profiles);
      return profiles;
    } catch (e) {
      const local = storage.getUsers();
      setUsers(local);
      return local;
    }
  };

  // Listen to active Supabase authentication state & local storage session
  useEffect(() => {
    let isMounted = true;

    // Safety timer to ensure isLoading never hangs on blank screen
    const safetyTimer = setTimeout(() => {
      if (isMounted) {
        setIsLoading(false);
      }
    }, 1500);

    const fetchSessionAndProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .maybeSingle();

          if (profile && isMounted) {
            const mapped = mapProfileToUser(profile);
            setUser(mapped);
            setRole(mapped.role);
            storage.setCurrentUserId(mapped.id);
            storage.addUser(mapped);
          } else if (isMounted) {
            const currentUser = storage.getCurrentUser();
            if (currentUser) {
              setUser(currentUser);
              setRole(currentUser.role);
            } else {
              setUser(null);
            }
          }
        } else if (isMounted) {
          const currentUser = storage.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            setRole(currentUser.role);
          } else {
            setUser(null);
          }
        }
      } catch (err) {
        console.warn('Supabase auth session check warning:', err);
        if (isMounted) {
          const currentUser = storage.getCurrentUser();
          if (currentUser) {
            setUser(currentUser);
            setRole(currentUser.role);
          } else {
            setUser(null);
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
          refreshUsers();
        }
      }
    };

    fetchSessionAndProfile();

    let authSub: { unsubscribe: () => void } | undefined = undefined;
    try {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', session.user.id)
              .maybeSingle();

            if (profile && isMounted) {
              const mapped = mapProfileToUser(profile);
              setUser(mapped);
              setRole(mapped.role);
              storage.setCurrentUserId(mapped.id);
              storage.addUser(mapped);
            }
          } catch (e) {
            console.error('Error loading profile on auth state change:', e);
          }
        }
        if (isMounted) {
          setIsLoading(false);
          refreshUsers();
        }
      });
      authSub = authListener?.subscription;
    } catch (e) {
      console.warn('onAuthStateChange listener warning:', e);
    }

    return () => {
      isMounted = false;
      clearTimeout(safetyTimer);
      authSub?.unsubscribe();
    };
  }, []);

  const login = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      const loggedUser = await api.login(email, password);
      setUser(loggedUser);
      setRole(loggedUser.role);
      await refreshUsers();
    } finally {
      setIsLoading(false);
    }
  };

  const addEmployee = async (params: AddEmployeeParams): Promise<User> => {
    const newUser = await api.addEmployee(params);
    await refreshUsers();
    return newUser;
  };

  const deleteEmployee = async (userId: string): Promise<void> => {
    await api.removeEmployee(userId);
    await refreshUsers();
    if (user?.id === userId) {
      setUser(null);
      await supabase.auth.signOut();
    }
  };

  const updateProfile = async (updates: { name?: string; phone?: string; workLocation?: string }): Promise<User> => {
    if (!user) throw new Error('No authenticated user.');
    const updatedUser = await api.updateProfile(user.id, updates);
    // Update the avatar URL if name changed (initials-based avatar)
    if (updates.name) {
      updatedUser.profileImage = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(updates.name)}&backgroundColor=0c8ee9,0270c7`;
    }
    setUser(updatedUser);
    storage.updateUser(updatedUser);
    return updatedUser;
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await supabase.auth.signOut();
      storage.setCurrentUserId(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        users,
        login,
        addEmployee,
        deleteEmployee,
        updateProfile,
        logout,
        isLoading,
        refreshUsers
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
