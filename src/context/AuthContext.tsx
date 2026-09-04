import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { storage } from '../services/storage';
import { api, AddEmployeeParams } from '../services/api';

interface AuthContextType {
  user: User | null;
  role: UserRole;
  users: User[];
  login: (email: string, password?: string) => Promise<void>;
  addEmployee: (params: AddEmployeeParams) => Promise<User>;
  deleteEmployee: (userId: string) => Promise<void>;
  switchUser: (userId: string) => void;
  switchRole: (role: UserRole) => void;
  logout: () => void;
  isLoading: boolean;
  refreshUsers: () => User[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole>('EMPLOYEE');
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUsers = () => {
    const loadedUsers = storage.getUsers();
    setUsers(loadedUsers);
    return loadedUsers;
  };

  useEffect(() => {
    const loadedUsers = refreshUsers();
    const currentId = storage.getCurrentUserId();
    if (currentId) {
      const currentUser = loadedUsers.find(u => u.id === currentId);
      if (currentUser) {
        setUser(currentUser);
        setRole(currentUser.role);
      } else {
        storage.setCurrentUserId(null);
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password?: string) => {
    setIsLoading(true);
    try {
      const loggedUser = await api.login(email, password);
      setUser(loggedUser);
      setRole(loggedUser.role);
      refreshUsers();
    } finally {
      setIsLoading(false);
    }
  };

  const addEmployee = async (params: AddEmployeeParams): Promise<User> => {
    const newUser = await api.addEmployee(params);
    refreshUsers();
    return newUser;
  };

  const deleteEmployee = async (userId: string): Promise<void> => {
    await api.removeEmployee(userId);
    refreshUsers();
    if (user?.id === userId) {
      setUser(null);
    }
  };

  const switchUser = (userId: string) => {
    const loadedUsers = refreshUsers();
    const target = loadedUsers.find(u => u.id === userId);
    if (target) {
      storage.setCurrentUserId(target.id);
      setUser(target);
      setRole(target.role);
    }
  };

  const switchRole = (newRole: UserRole) => {
    setRole(newRole);
  };

  const logout = () => {
    storage.setCurrentUserId(null);
    setUser(null);
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
        switchUser,
        switchRole,
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
