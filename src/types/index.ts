/**
 * Plataforma SST MG Consultores - Type Definitions
 */

export type Role = 'admin' | 'sst_lead' | 'site_lead' | 'viewer';

export interface RoleInfo {
  id: Role;
  name: string;
  description: string;
  badgeColor: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: Role;
  siteId: string; // 'TODAS' or specific like 'MG-MG'
  active: boolean;
  createdAt: string;
}

export interface Sede {
  id: string; // e.g. 'MG-MG', 'MG-HA', 'MG-SC', 'MG-JA', 'MG-ER'
  codigo: string;
  nombre: string;
  ciudad: string;
  direccion: string;
  activa: boolean;
}

export interface Supervisor {
  id: string;
  sedeId: string;
  area: string;
  supervisor: string;
  cargo?: string;
  telefono?: string;
}

export interface EPS {
  id: string;
  nombre: string;
  codigo?: string;
  telefono?: string;
  activa: boolean;
}

export interface ARL {
  id: string;
  nombre: string;
  codigo?: string;
  lineaEmergencias?: string;
  activa: boolean;
}

export interface PersonnelWorker {
  id: string; // Unique, matches cedula
  cedula: string;
  nombre: string;
  fechaNacimiento: string;
  edad: number;
  genero: 'M' | 'F' | 'OTRO';
  sedeId: string;
  fechaIngreso: string;
  puesto: string;
  eps?: string;
  arl?: string;
  estado: 'ACTIVO' | 'INACTIVO';
  fechaRetiro?: string;
  motivoRetiro?: string;
  createdAt: string;
  updatedAt: string;
}

export interface MasterImportDiff {
  totalInFile: number;
  newWorkers: PersonnelWorker[];
  updatedWorkers: Array<{
    existing: PersonnelWorker;
    updated: PersonnelWorker;
    changes: string[];
  }>;
  unchangedCount: number;
  missingInFile: PersonnelWorker[]; // If full upload, candidates to mark as INACTIVO
  validationErrors: Array<{ row: number; cedula?: string; error: string }>;
  isFullReplacement: boolean;
}

export interface MasterImportHistory {
  id: string;
  fecha: string;
  usuarioEmail: string;
  usuarioNombre: string;
  nombreArchivo: string;
  tipoCarga: 'COMPLETA' | 'PARCIAL';
  totalLeidos: number;
  nuevos: number;
  actualizados: number;
  marcadosInactivos: number;
  erroresCount: number;
}

export interface SubMenuConfig {
  id: string;
  menuId: string;
  nombre: string;
  descripcion: string;
  codigo: string;
  icono?: string;
  headerColor?: string;
  buttonColor?: string;
  formularioOficialPendiente?: boolean;
}

export interface MenuModuleConfig {
  id: string;
  nombre: string;
  vista: string;
  icono: string;
  descripcion: string;
  headerColor?: string;
  buttonColor?: string;
  badgeBg?: string;
  submenus: SubMenuConfig[];
}


export type SSTRecordStatus = 'BORRADOR' | 'PENDIENTE' | 'EN_PROCESO' | 'CERRADO';

export interface EvidenciaArchivo {
  id: string;
  nombre: string;
  url: string;
  tipo: string;
  tamanoKb?: number;
  fecha: string;
}

export interface SSTRecord {
  id: string;
  numeroRegistro: string;
  menuId: string;
  subMenuId: string;
  moduloNombre: string;
  subModuloNombre: string;
  fecha: string;
  sedeId: string;
  area: string;
  supervisor?: string;
  cedulaTrabajador?: string;
  nombreTrabajador?: string;
  puestoTrabajador?: string;
  responsableRegistro: string;
  responsableEmail: string;
  estado: SSTRecordStatus;
  observaciones: string;
  hallazgos?: string;
  accionesPropuestas?: string;
  evidencias: EvidenciaArchivo[];
  datosEspecificos?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

export interface AuditLog {
  id: string;
  fecha: string;
  usuarioEmail: string;
  usuarioNombre: string;
  accion: 'CREAR' | 'EDITAR' | 'CAMBIO_ESTADO' | 'ACTUALIZAR_MAESTRO' | 'CAMBIO_PERMISO' | 'DESCARGA_REPORTE' | 'RESPALDO';
  modulo: string;
  registroAfectadoId: string;
  descripcion: string;
  datosPrevios?: any;
  datosNuevos?: any;
}
