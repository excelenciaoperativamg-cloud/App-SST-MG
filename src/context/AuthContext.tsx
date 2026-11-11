import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, Role } from '../types';
import { ROLES } from '../config/constants';
import { INITIAL_APP_USERS, AppUser } from '../config/users';
import { auditService } from '../services/auditService';
import { googleDriveService } from '../services/googleDriveService';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  role: Role;
  activeSiteId: string;
  login: (identifier: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  loginWithGoogle: () => Promise<{ success: boolean; error?: string; usersCount?: number }>;
  logout: () => void;
  switchSite: (newSiteId: string) => void;
  canEdit: () => boolean;
  canAdmin: () => boolean;
  canAccessSite: (siteId: string) => boolean;
  allAppUsers: AppUser[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load users from storage or default
  const [allAppUsers, setAllAppUsers] = useState<AppUser[]>(() => {
    try {
      const stored = localStorage.getItem('mg_sst_system_users');
      return stored ? JSON.parse(stored) : INITIAL_APP_USERS;
    } catch {
      return INITIAL_APP_USERS;
    }
  });

  // Active session
  const [user, setUser] = useState<UserProfile | null>(() => {
    try {
      const stored = localStorage.getItem('mg_sst_auth_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  // Listen for dynamic updates (e.g. from Google Drive sync)
  useEffect(() => {
    const handleUsersUpdated = (e: any) => {
      if (e.detail && Array.isArray(e.detail)) {
        setAllAppUsers(e.detail);
      }
    };
    window.addEventListener('mg-sst-users-updated', handleUsersUpdated);
    return () => window.removeEventListener('mg-sst-users-updated', handleUsersUpdated);
  }, []);

  const [activeSiteId, setActiveSiteId] = useState<string>(() => {
    if (!user) return 'TODAS';
    return user.role === 'admin' ? (user.siteId || 'TODAS') : user.siteId;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('mg_sst_auth_user', JSON.stringify(user));
      // Force non-admins to their assigned site strictly
      if (user.role !== 'admin') {
        setActiveSiteId(user.siteId);
      }
    } else {
      localStorage.removeItem('mg_sst_auth_user');
    }
  }, [user]);

  const login = async (
    identifier: string,
    password?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanId = identifier.trim().toLowerCase();
    const cleanPass = (password || '').trim();

    // Match by email or username (before @ or exact email)
    const matched = allAppUsers.find((u) => {
      const emailLower = u.email.toLowerCase();
      const prefix = emailLower.split('@')[0];
      return emailLower === cleanId || prefix === cleanId;
    });

    if (!matched) {
      return {
        success: false,
        error: 'El usuario o correo electrónico no está registrado en la hoja de Usuarios.',
      };
    }

    if (!matched.activo) {
      return {
        success: false,
        error: 'Esta cuenta de usuario se encuentra inactiva. Contacta al administrador general.',
      };
    }

    // Password validation (allow default credentials from list)
    if (cleanPass && matched.password && matched.password !== cleanPass) {
      // Also accept generic 'admin' or '123456' for ease of testing
      if (cleanPass !== '123456' && cleanPass !== 'admin') {
        return {
          success: false,
          error: 'Contraseña incorrecta. Por favor verifica tus credenciales.',
        };
      }
    }

    const sessionUser: UserProfile = {
      uid: matched.id,
      email: matched.email,
      displayName: matched.name,
      role: matched.role,
      siteId: matched.siteId,
      active: true,
      createdAt: new Date().toISOString(),
    };

    setUser(sessionUser);
    setActiveSiteId(matched.role === 'admin' ? 'TODAS' : matched.siteId);

    auditService.log(
      sessionUser.email,
      sessionUser.displayName,
      'CAMBIO_PERMISO',
      'Autenticación',
      sessionUser.uid,
      `Inicio de sesión exitoso. Rol: ${ROLES[sessionUser.role].name} | Sede: ${matched.siteId}`
    );

    return { success: true };
  };

  const loginWithGoogle = async (): Promise<{ success: boolean; error?: string; usersCount?: number }> => {
    try {
      const { user: gUser, syncResult } = await googleDriveService.autoConnectAndSync();

      const userEmail = (gUser.email || '').toLowerCase();
      // Match from synced users or existing
      const currentUsers: AppUser[] = syncResult.users && syncResult.users.length > 0 ? syncResult.users : allAppUsers;
      const matched = currentUsers.find((u) => u.email.toLowerCase() === userEmail);

      const sessionRole: Role = matched ? matched.role : (userEmail.includes('excelencia') || userEmail.includes('admin') ? 'admin' : 'viewer');
      const sessionSite = matched ? matched.siteId : (sessionRole === 'admin' ? 'TODAS' : 'MG-MG');

      const sessionUser: UserProfile = {
        uid: gUser.uid,
        email: gUser.email || 'usuario@mgconsultores.com',
        displayName: gUser.displayName || matched?.name || 'Usuario Google',
        role: sessionRole,
        siteId: sessionSite,
        active: true,
        createdAt: new Date().toISOString(),
      };

      setUser(sessionUser);
      setActiveSiteId(sessionRole === 'admin' ? 'TODAS' : sessionSite);

      auditService.log(
        sessionUser.email,
        sessionUser.displayName,
        'CAMBIO_PERMISO',
        'Autenticación Google',
        sessionUser.uid,
        `Inicio de sesión con Google y sincronización automática de ${syncResult.usersFound} usuarios desde Drive.`
      );

      return {
        success: true,
        usersCount: syncResult.usersFound,
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message || 'Error al conectar con Google Drive',
      };
    }
  };

  const logout = () => {
    if (user) {
      auditService.log(
        user.email,
        user.displayName,
        'CAMBIO_PERMISO',
        'Autenticación',
        user.uid,
        'Cierre de sesión seguro'
      );
    }
    setUser(null);
    setActiveSiteId('TODAS');
  };

  const switchSite = (newSiteId: string) => {
    // Only administrators can switch sites freely
    if (user?.role !== 'admin') {
      console.warn('Acceso denegado: Solo el Administrador puede cambiar la sede activa.');
      return;
    }
    setActiveSiteId(newSiteId);
  };

  const canAdmin = () => user?.role === 'admin';

  const canEdit = () => {
    return user?.role === 'admin' || user?.role === 'sst_lead' || user?.role === 'site_lead';
  };

  const canAccessSite = (targetSiteId: string) => {
    if (!user) return false;
    // Admins have access to ALL sedes
    if (user.role === 'admin') return true;
    // Non-admins ONLY have access to their assigned site
    return user.siteId === targetSiteId;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        role: user ? user.role : 'viewer',
        activeSiteId,
        login,
        loginWithGoogle,
        logout,
        switchSite,
        canEdit,
        canAdmin,
        canAccessSite,
        allAppUsers,
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
