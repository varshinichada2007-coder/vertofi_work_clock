import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, Organization } from '../types';
import { storage } from '../services/storage';
import { api, AddEmployeeParams } from '../services/api';
import { supabaseDb } from '../services/supabaseDb';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  users: User[];
  organization: Organization;
  organizations: Organization[];
  login: (email: string, password?: string, secretCode?: string) => Promise<User>;
  logout: () => Promise<void>;
  switchOrganization: (orgId: string) => Promise<void>;
  addEmployee: (params: AddEmployeeParams) => Promise<User>;
  updateEmployee: (userId: string, updates: Partial<User>) => Promise<User>;
  toggleEmployeeStatus: (userId: string) => Promise<User>;
  updateProfile: (updates: Partial<User>) => Promise<User>;
  isLoading: boolean;
  refreshData: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('EMPLOYEE');
  const [users, setUsers] = useState<User[]>([]);
  const [organization, setOrganization] = useState<Organization>(storage.getCurrentOrganization());
  const [organizations, setOrganizations] = useState<Organization[]>(storage.getOrganizations());
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = async () => {
    try {
      const orgs = await api.getOrganizations();
      setOrganizations(orgs);
      const currentOrg = await api.getCurrentOrganization();
      setOrganization(currentOrg);

      const orgUsers = await api.getEmployees(currentOrg.id);
      setUsers(orgUsers);

      const currentUser = storage.getCurrentUser();
      if (currentUser) {
        setUser(currentUser);
        setRole(currentUser.role);
      } else {
        setUser(null);
      }
    } catch (e) {
      console.warn('Error refreshing auth context:', e);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      try {
        const currentOrg = storage.getCurrentOrganization();
        setOrganization(currentOrg);
        setOrganizations(storage.getOrganizations());

        // Sync fresh data from Supabase database
        try {
          await supabaseDb.checkAndSeedDefaults();
          const remoteUsers = await supabaseDb.getProfiles();
          if (remoteUsers && remoteUsers.length > 0 && isMounted) {
            storage.setUsers(remoteUsers);
            setUsers(remoteUsers.filter((u: User) => u.organizationId === currentOrg.id));
          }
        } catch (dbErr) {
          console.warn('Initial Supabase sync notice:', dbErr);
        }

        // Check if there is an active session in sessionStorage
        const activeSessionId = sessionStorage.getItem('vertofi_active_user_session');
        if (activeSessionId && isMounted) {
          const remoteUsers = await supabaseDb.getProfiles();
          const found = remoteUsers?.find(u => u.id === activeSessionId) || storage.getUserById(activeSessionId);
          if (found) {
            setUser(found);
            setRole(found.role);
          } else {
            setUser(null);
          }
        } else {
          // ALWAYS default to null on fresh open so Login Page appears!
          setUser(null);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    init();

    // Realtime listener on profiles table so multi-laptop edits reflect live
    const profileSub = supabaseDb.subscribeToTableChanges('profiles', () => {
      refreshData();
    });

    return () => {
      isMounted = false;
      profileSub?.unsubscribe?.();
    };
  }, []);

  const login = async (email: string, password?: string, secretCode?: string): Promise<User> => {
    setIsLoading(true);
    try {
      const loggedUser = await api.login(email, password, secretCode);
      sessionStorage.setItem('vertofi_active_user_session', loggedUser.id);
      setUser(loggedUser);
      setRole(loggedUser.role);
      const org = storage.getCurrentOrganization();
      setOrganization(org);
      setUsers(storage.getUsers(org.id));
      return loggedUser;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      sessionStorage.removeItem('vertofi_active_user_session');
      await api.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const switchOrganization = async (orgId: string) => {
    setIsLoading(true);
    try {
      const org = await api.switchOrganization(orgId);
      setOrganization(org);
      const orgUsers = await api.getEmployees(org.id);
      setUsers(orgUsers);
      // If current user is not in new org, find admin of new org or sign out
      const userInOrg = orgUsers.find(u => u.role === 'ADMIN') || orgUsers[0];
      if (userInOrg) {
        storage.setCurrentUserId(userInOrg.id);
        setUser(userInOrg);
        setRole(userInOrg.role);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const addEmployee = async (params: AddEmployeeParams): Promise<User> => {
    const newUser = await api.addEmployee({
      ...params,
      organizationId: organization.id
    });
    await refreshData();
    return newUser;
  };

  const updateEmployee = async (userId: string, updates: Partial<User>): Promise<User> => {
    const updated = await api.updateEmployee(userId, updates);
    if (user?.id === userId) {
      setUser(updated);
    }
    await refreshData();
    return updated;
  };

  const toggleEmployeeStatus = async (userId: string): Promise<User> => {
    const toggled = await api.toggleEmployeeStatus(userId);
    await refreshData();
    return toggled;
  };

  const updateProfile = async (updates: Partial<User>): Promise<User> => {
    if (!user) throw new Error('No user logged in.');
    const updated = await api.updateEmployee(user.id, updates);
    setUser(updated);
    await refreshData();
    return updated;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        users,
        organization,
        organizations,
        login,
        logout,
        switchOrganization,
        addEmployee,
        updateEmployee,
        toggleEmployeeStatus,
        updateProfile,
        isLoading,
        refreshData
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
