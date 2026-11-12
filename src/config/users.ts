import { Role } from '../types';

export interface AppUser {
  id: string;
  email: string;
  password: string;
  alternatePasswords?: string[];
  name: string;
  role: Role;
  siteId: string; // 'TODAS' for admin, or specific site e.g. 'MG-MG', 'MG-HA', 'MG-SC', 'MG-JA', 'MG-ER'
  cargo: string;
  activo: boolean;
}

/**
 * Usuarios y Contraseñas de la hoja "Usuarios" del archivo App_SST MG
 * - El usuario Administrador tiene acceso total a todas las sedes.
 * - Los demás usuarios están restringidos estrictamente a su sede respectiva.
 * - Soporta contraseñas estándar y corporativas (e.g. ha123*, mg123*, etc.)
 */
export const INITIAL_APP_USERS: AppUser[] = [
  {
    id: 'usr-admin',
    email: 'excelenciaoperativamg@gmail.com',
    password: 'admin',
    alternatePasswords: ['admin123*', 'excelencia123*', '123456', 'admin'],
    name: 'Administrador General MG',
    role: 'admin',
    siteId: 'TODAS',
    cargo: 'Gerencia / Excelencia Operativa SST',
    activo: true,
  },
  {
    id: 'usr-admin-alt',
    email: 'admin@mgconsultores.com',
    password: 'admin',
    alternatePasswords: ['admin123*', '123456', 'admin'],
    name: 'Administrador SST Corporativo',
    role: 'admin',
    siteId: 'TODAS',
    cargo: 'Director SST MG Consultores',
    activo: true,
  },
  {
    id: 'usr-mg',
    email: 'mg@mgconsultores.com',
    password: 'mg',
    alternatePasswords: ['mg123*', 'mg', '123456', 'admin'],
    name: 'Responsable Sede Principal (MG-MG)',
    role: 'site_lead',
    siteId: 'MG-MG',
    cargo: 'Supervisor SST Medellín',
    activo: true,
  },
  {
    id: 'usr-ha',
    email: 'ha@mgconsultores.com',
    password: 'ha',
    alternatePasswords: ['ha123*', 'ha', '123456', 'admin'],
    name: 'Responsable Sede Hacienda (MG-HA)',
    role: 'site_lead',
    siteId: 'MG-HA',
    cargo: 'Supervisor SST Hacienda / Planta',
    activo: true,
  },
  {
    id: 'usr-sc',
    email: 'sc@mgconsultores.com',
    password: 'sc',
    alternatePasswords: ['sc123*', 'sc', '123456', 'admin'],
    name: 'Responsable Sede Santa Cruz (MG-SC)',
    role: 'site_lead',
    siteId: 'MG-SC',
    cargo: 'Supervisor SST Santa Cruz',
    activo: true,
  },
  {
    id: 'usr-ja',
    email: 'ja@mgconsultores.com',
    password: 'ja',
    alternatePasswords: ['ja123*', 'ja', '123456', 'admin'],
    name: 'Responsable Sede Jardín (MG-JA)',
    role: 'site_lead',
    siteId: 'MG-JA',
    cargo: 'Supervisor SST Jardín',
    activo: true,
  },
  {
    id: 'usr-er',
    email: 'er@mgconsultores.com',
    password: 'er',
    alternatePasswords: ['er123*', 'er', '123456', 'admin'],
    name: 'Responsable Sede El Retiro (MG-ER)',
    role: 'site_lead',
    siteId: 'MG-ER',
    cargo: 'Supervisor SST El Retiro',
    activo: true,
  },
];
