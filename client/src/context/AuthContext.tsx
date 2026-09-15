import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from 'react';

import type { ReactNode } from 'react';

import api from '../services/api';

export interface User {
  id?: string;
  _id?: string;
  name: string;
  email: string;
  phone?: string;
  role:
    | 'customer'
    | 'admin'
    | 'staff'
    | 'superadmin';
  avatar?: string | null;
  addresses?: unknown[];
}

interface AuthContextType {
  user: User | null;
  loading: boolean;

  login: (
    email: string,
    password: string
  ) => Promise<User>;

  register: (
    name: string,
    email: string,
    password: string,
    phone?: string
  ) => Promise<User>;

  adminLogin: (
    username: string,
    password: string
  ) => Promise<User>;

  googleLogin: (
    credential: string
  ) => Promise<User>;

  logout: () => void;

  isAuthenticated: boolean;
}

const AuthContext =
  createContext<
    AuthContextType | undefined
  >(undefined);

const saveAuthData = (
  token: string,
  user: User
) => {
  localStorage.setItem(
    'hangover_token',
    token
  );

  localStorage.setItem(
    'hangover_user',
    JSON.stringify(user)
  );
};

const getSavedUser =
  (): User | null => {
    try {
      const saved =
        localStorage.getItem(
          'hangover_user'
        );

      if (!saved) {
        return null;
      }

      return JSON.parse(saved) as User;
    } catch (error) {
      console.error(
        'Failed to load saved user:',
        error
      );

      localStorage.removeItem(
        'hangover_user'
      );

      return null;
    }
  };

export const AuthProvider: React.FC<{
  children: ReactNode;
}> = ({ children }) => {
  const [
    user,
    setUser,
  ] = useState<User | null>(
    getSavedUser
  );

  const [
    loading,
    setLoading,
  ] = useState(false);

  /*
   * Restore authentication from
   * localStorage when the app starts.
   */
  useEffect(() => {
    const token =
      localStorage.getItem(
        'hangover_token'
      );

    const savedUser =
      getSavedUser();

    if (!token || !savedUser) {
      localStorage.removeItem(
        'hangover_token'
      );

      localStorage.removeItem(
        'hangover_user'
      );

      setUser(null);

      return;
    }

    setUser(savedUser);
  }, []);

  /*
   * Customer login
   */
  const login = async (
    email: string,
    password: string
  ): Promise<User> => {
    setLoading(true);

    try {
      const response =
        await api.post(
          '/auth/login',
          {
            email,
            password,
          }
        );

      const loggedUser =
        response.data.user as User;

      saveAuthData(
        response.data.token,
        loggedUser
      );

      setUser(loggedUser);

      return loggedUser;
    } finally {
      setLoading(false);
    }
  };

  /*
   * Customer registration
   */
  const register = async (
    name: string,
    email: string,
    password: string,
    phone?: string
  ): Promise<User> => {
    setLoading(true);

    try {
      const response =
        await api.post(
          '/auth/register',
          {
            name,
            email,
            password,
            phone,
          }
        );

      const newUser =
        response.data.user as User;

      saveAuthData(
        response.data.token,
        newUser
      );

      setUser(newUser);

      return newUser;
    } finally {
      setLoading(false);
    }
  };

  /*
   * ADMIN LOGIN
   *
   * This is the important new function.
   *
   * It updates both localStorage AND
   * AuthContext state.
   */
  const adminLogin = async (
    username: string,
    password: string
  ): Promise<User> => {
    setLoading(true);

    try {
      const response =
        await api.post(
          '/auth/admin-login',
          {
            username,
            password,
          }
        );

      const adminUser =
        response.data.user as User;

      /*
       * Make sure the backend really
       * returned an admin/staff account.
       */
      if (
        adminUser.role !== 'admin' &&
        adminUser.role !== 'staff' &&
        adminUser.role !== 'superadmin'
      ) {
        throw new Error(
          'Invalid admin account.'
        );
      }

      saveAuthData(
        response.data.token,
        adminUser
      );

      /*
       * THIS fixes your redirect problem.
       */
      setUser(adminUser);

      return adminUser;
    } finally {
      setLoading(false);
    }
  };

  /*
   * Google login
   */
  const googleLogin = async (
    credential: string
  ): Promise<User> => {
    setLoading(true);

    try {
      const response =
        await api.post(
          '/auth/google',
          {
            credential,
          }
        );

      const googleUser =
        response.data.user as User;

      saveAuthData(
        response.data.token,
        googleUser
      );

      setUser(googleUser);

      return googleUser;
    } finally {
      setLoading(false);
    }
  };

  /*
   * Logout
   */
  const logout = () => {
    localStorage.removeItem(
      'hangover_token'
    );

    localStorage.removeItem(
      'hangover_user'
    );

    setUser(null);
  };

  const isAuthenticated =
    !!user &&
    !!localStorage.getItem(
      'hangover_token'
    );

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        adminLogin,
        googleLogin,
        logout,
        isAuthenticated,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth =
  (): AuthContextType => {
    const context =
      useContext(AuthContext);

    if (!context) {
      throw new Error(
        'useAuth must be used inside AuthProvider'
      );
    }

    return context;
  };