import React, { createContext, useContext, useState, useEffect } from 'react';
import { UserProfile, Role } from '../types';
import { ROLES } from '../config/constants';
import { auditService } from '../services/auditService';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  role: Role;
  activeSiteId: string;
  login: (email: string, role: Role, siteId?: string, name?: string) => void;
  logout: () => void;
  switchRole: (newRole: Role) => void;
  switchSite: (newSiteId: string) => void;
  canEdit: () => boolean;
  canAdmin: () => boolean;
  canAccessSite: (siteId: string) => boolean;
}

const DEFAULT_USER: UserProfile = {
  uid: 'usr-admin-01',
  email: 'excelenciaoperativamg@gmail.com',
  displayName: 'Equipo Excelencia Operativa MG',
  role: 'admin',
  siteId: 'TODAS',
  active: true,
  createdAt: '2026-01-01T00:00:00.000Z',
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile>(() => {
    try {
      const stored = localStorage.getItem('mg_sst_auth_user');
      return stored ? JSON.parse(stored) : DEFAULT_USER;
    } catch {
      return DEFAULT_USER;
    }
  });

  const [activeSiteId, setActiveSiteId] = useState<string>(() => {
    return user.siteId || 'TODAS';
  });

  useEffect(() => {
    localStorage.setItem('mg_sst_auth_user', JSON.stringify(user));
  }, [user]);

  const login = (email: string, role: Role, siteId: string = 'TODAS', name?: string) => {
    const updatedUser: UserProfile = {
      uid: 'usr-' + Date.now(),
      email,
      displayName: name || email.split('@')[0],
      role,
      siteId,
      active: true,
      createdAt: new Date().toISOString(),
    };
    setUser(updatedUser);
    setActiveSiteId(siteId);
    auditService.log(
      updatedUser.email,
      updatedUser.displayName,
      'CAMBIO_PERMISO',
      'Autenticación',
      updatedUser.uid,
      `Inicio de sesión con rol: ${ROLES[role].name} en sede ${siteId}`
    );
  };

  const logout = () => {
    auditService.log(
      user.email,
      user.displayName,
      'CAMBIO_PERMISO',
      'Autenticación',
      user.uid,
      'Cierre de sesión de usuario'
    );
    // Reset to default admin or guest
    setUser(DEFAULT_USER);
    setActiveSiteId('TODAS');
  };

  const switchRole = (newRole: Role) => {
    const updated = { ...user, role: newRole };
    setUser(updated);
    auditService.log(
      user.email,
      user.displayName,
      'CAMBIO_PERMISO',
      'Seguridad',
      user.uid,
      `Cambio de rol de sesión a: ${ROLES[newRole].name}`
    );
  };

  const switchSite = (newSiteId: string) => {
    setActiveSiteId(newSiteId);
    const updated = { ...user, siteId: newSiteId };
    setUser(updated);
  };

  const canAdmin = () => user.role === 'admin';

  const canEdit = () => {
    return user.role === 'admin' || user.role === 'sst_lead' || user.role === 'site_lead';
  };

  const canAccessSite = (targetSiteId: string) => {
    if (user.role === 'admin' || user.role === 'sst_lead') return true;
    if (activeSiteId === 'TODAS') return true;
    return activeSiteId === targetSiteId;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: true,
        role: user.role,
        activeSiteId,
        login,
        logout,
        switchRole,
        switchSite,
        canEdit,
        canAdmin,
        canAccessSite,
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
