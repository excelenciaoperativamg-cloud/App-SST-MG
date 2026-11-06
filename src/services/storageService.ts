import {
  PersonnelWorker,
  SSTRecord,
  Sede,
  Supervisor,
  EPS,
  ARL,
  MasterImportHistory,
  AuditLog,
} from '../types';
import {
  INITIAL_SEDES,
  INITIAL_SUPERVISORES,
  INITIAL_EPS,
  INITIAL_ARL,
} from '../config/constants';
import { auditService } from './auditService';

// Storage keys
const KEYS = {
  PERSONNEL: 'mg_sst_personnel_master',
  RECORDS: 'mg_sst_records',
  SEDES: 'mg_sst_sedes',
  SUPERVISORES: 'mg_sst_supervisores',
  EPS: 'mg_sst_eps',
  ARL: 'mg_sst_arl',
  IMPORT_HISTORY: 'mg_sst_import_history',
};

// Initial sample seed workers for demonstration and initial testing
const SEED_WORKERS: PersonnelWorker[] = [
  {
    id: '1017123456',
    cedula: '1017123456',
    nombre: 'Mateo Arango Jaramillo',
    fechaNacimiento: '1992-05-14',
    edad: 34,
    genero: 'M',
    sedeId: 'MG-MG',
    fechaIngreso: '2021-03-15',
    puesto: 'Técnico de Mantenimiento',
    eps: 'SURA EPS',
    arl: 'ARL SURA',
    estado: 'ACTIVO',
    createdAt: '2021-03-15T08:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: '1020456789',
    cedula: '1020456789',
    nombre: 'Laura Camila Restrepo Morales',
    fechaNacimiento: '1995-11-20',
    edad: 31,
    genero: 'F',
    sedeId: 'MG-HA',
    fechaIngreso: '2022-06-01',
    puesto: 'Operadora de Planta',
    eps: 'Sanitas EPS',
    arl: 'ARL SURA',
    estado: 'ACTIVO',
    createdAt: '2022-06-01T08:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: '1035678901',
    cedula: '1035678901',
    nombre: 'Juan Pablo Zapata Ochoa',
    fechaNacimiento: '1988-08-04',
    edad: 38,
    genero: 'M',
    sedeId: 'MG-SC',
    fechaIngreso: '2019-11-10',
    puesto: 'Coordinador de Almacén',
    eps: 'Compensar EPS',
    arl: 'Positiva Compañía de Seguros',
    estado: 'ACTIVO',
    createdAt: '2019-11-10T08:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: '43567812',
    cedula: '43567812',
    nombre: 'Gloria Patricia Betancur',
    fechaNacimiento: '1980-02-17',
    edad: 46,
    genero: 'F',
    sedeId: 'MG-JA',
    fechaIngreso: '2018-02-01',
    puesto: 'Auxiliar de Servicios Generales',
    eps: 'Salud Total EPS',
    arl: 'ARL SURA',
    estado: 'ACTIVO',
    createdAt: '2018-02-01T08:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: '71987654',
    cedula: '71987654',
    nombre: 'Guillermo Alejandro Duque',
    fechaNacimiento: '1979-09-30',
    edad: 47,
    genero: 'M',
    sedeId: 'MG-ER',
    fechaIngreso: '2017-08-15',
    puesto: 'Vigilante de Seguridad',
    eps: 'Nueva EPS',
    arl: 'Seguros Bolívar ARL',
    estado: 'ACTIVO',
    createdAt: '2017-08-15T08:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: '98765432',
    cedula: '98765432',
    nombre: 'Hernán Darío Gómez Peláez',
    fechaNacimiento: '1975-12-05',
    edad: 51,
    genero: 'M',
    sedeId: 'MG-MG',
    fechaIngreso: '2015-04-10',
    puesto: 'Conductor Operativo PESV',
    eps: 'SURA EPS',
    arl: 'ARL SURA',
    estado: 'INACTIVO',
    fechaRetiro: '2025-12-15',
    motivoRetiro: 'Renuncia voluntaria',
    createdAt: '2015-04-10T08:00:00.000Z',
    updatedAt: '2025-12-15T10:00:00.000Z',
  },
];

// Initial SST Records for demonstration
const SEED_RECORDS: SSTRecord[] = [
  {
    id: 'rec-2026-001',
    numeroRegistro: 'EXT-2026-001',
    menuId: 'd19d30b0',
    subMenuId: 'sub-em-1',
    moduloNombre: 'Inspección Emergencias',
    subModuloNombre: 'Extintores',
    fecha: '2026-02-15',
    sedeId: 'MG-MG',
    area: 'Mantenimiento',
    supervisor: 'Andrés Felipe Gómez',
    responsableRegistro: 'Carlos SST Inspector',
    responsableEmail: 'sst@mgconsultores.com',
    estado: 'CERRADO',
    observaciones: 'Inspección mensual reglamentaria. Extintor multipropósito ABC 20lbs verificado. Presión en verde, pasador y precinto intactos, acceso despejado.',
    hallazgos: 'Todo en conformidad con la norma NFPA 10.',
    accionesPropuestas: 'Mantener señalización visible.',
    evidencias: [
      {
        id: 'ev-1',
        nombre: 'inspeccion_extintor_area_mant.jpg',
        url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80',
        tipo: 'image/jpeg',
        fecha: '2026-02-15',
      },
    ],
    createdAt: '2026-02-15T09:30:00.000Z',
    updatedAt: '2026-02-15T10:00:00.000Z',
    createdBy: 'sst@mgconsultores.com',
  },
  {
    id: 'rec-2026-002',
    numeroRegistro: 'EPP-2026-014',
    menuId: 'c9189227',
    subMenuId: 'sub-per-1',
    moduloNombre: 'Personal',
    subModuloNombre: 'Entrega EPP\'s',
    fecha: '2026-03-01',
    sedeId: 'MG-HA',
    area: 'Producción',
    supervisor: 'María Eugenia Salazar',
    cedulaTrabajador: '1020456789',
    nombreTrabajador: 'Laura Camila Restrepo Morales',
    puestoTrabajador: 'Operadora de Planta',
    responsableRegistro: 'Coordinador SST Sede',
    responsableEmail: 'sst_hacienda@mgconsultores.com',
    estado: 'CERRADO',
    observaciones: 'Entrega de dotación de protección personal: Casco dieléctrico con barboquejo, gafas de seguridad antirrayadura y guantes de nitrilo calibre 15.',
    accionesPropuestas: 'Capacitación en uso y cuidado de EPP.',
    evidencias: [],
    createdAt: '2026-03-01T14:15:00.000Z',
    updatedAt: '2026-03-01T14:30:00.000Z',
    createdBy: 'sst_hacienda@mgconsultores.com',
  },
  {
    id: 'rec-2026-003',
    numeroRegistro: 'PESV-2026-088',
    menuId: '649b9099',
    subMenuId: 'sub-pesv-1',
    moduloNombre: 'PESV',
    subModuloNombre: 'Chequeo Vehículos',
    fecha: '2026-03-10',
    sedeId: 'MG-MG',
    area: 'Operaciones',
    supervisor: 'Carlos Mario Restrepo',
    cedulaTrabajador: '1017123456',
    nombreTrabajador: 'Mateo Arango Jaramillo',
    puestoTrabajador: 'Técnico de Mantenimiento',
    responsableRegistro: 'Conductor Operativo',
    responsableEmail: 'operaciones@mgconsultores.com',
    estado: 'EN_PROCESO',
    observaciones: 'Preoperacional de camioneta placa MGX-450. Nivel de refrigerante óptimo, luces altas y bajas operativas. Se detecta desgaste en plumilla limpiaparabrisas derecha.',
    hallazgos: 'Plumilla derecha requiere reemplazo preventivo.',
    accionesPropuestas: 'Orden de cambio solicitada al taller autorizado.',
    evidencias: [],
    createdAt: '2026-03-10T06:45:00.000Z',
    updatedAt: '2026-03-10T07:10:00.000Z',
    createdBy: 'operaciones@mgconsultores.com',
  },
  {
    id: 'rec-2026-004',
    numeroRegistro: 'COND-2026-005',
    menuId: 'c9189227',
    subMenuId: 'sub-per-2',
    moduloNombre: 'Personal',
    subModuloNombre: 'Condiciones Inseguras',
    fecha: '2026-03-18',
    sedeId: 'MG-SC',
    area: 'Almacén',
    supervisor: 'Guillermo León Vélez',
    responsableRegistro: 'Líder de Bodega',
    responsableEmail: 'almacen@mgconsultores.com',
    estado: 'PENDIENTE',
    observaciones: 'Se evidencia estiba averiada con riesgo de colapso en estantería nivel 3 sector B. Falta delimitación en pasillo principal.',
    hallazgos: 'Riesgo locativo y mecánico por caída de objetos.',
    accionesPropuestas: 'Aislar pasillo de inmediato y trasvasar carga a estiba plástica certificada.',
    evidencias: [],
    createdAt: '2026-03-18T11:20:00.000Z',
    updatedAt: '2026-03-18T11:20:00.000Z',
    createdBy: 'almacen@mgconsultores.com',
  },
];

export const storageService = {
  // Initialize storage with seeds if empty
  init() {
    if (!localStorage.getItem(KEYS.SEDES)) {
      localStorage.setItem(KEYS.SEDES, JSON.stringify(INITIAL_SEDES));
    }
    if (!localStorage.getItem(KEYS.SUPERVISORES)) {
      localStorage.setItem(KEYS.SUPERVISORES, JSON.stringify(INITIAL_SUPERVISORES));
    }
    if (!localStorage.getItem(KEYS.EPS)) {
      localStorage.setItem(KEYS.EPS, JSON.stringify(INITIAL_EPS));
    }
    if (!localStorage.getItem(KEYS.ARL)) {
      localStorage.setItem(KEYS.ARL, JSON.stringify(INITIAL_ARL));
    }
    if (!localStorage.getItem(KEYS.PERSONNEL)) {
      localStorage.setItem(KEYS.PERSONNEL, JSON.stringify(SEED_WORKERS));
    }
    if (!localStorage.getItem(KEYS.RECORDS)) {
      localStorage.setItem(KEYS.RECORDS, JSON.stringify(SEED_RECORDS));
    }
  },

  // ---------------- PERSONNEL MASTER ----------------
  getWorkers(): PersonnelWorker[] {
    try {
      const stored = localStorage.getItem(KEYS.PERSONNEL);
      if (!stored) return SEED_WORKERS;
      return JSON.parse(stored);
    } catch {
      return SEED_WORKERS;
    }
  },

  getWorkerByCedula(cedula: string): PersonnelWorker | undefined {
    const list = this.getWorkers();
    return list.find((w) => String(w.cedula).trim() === String(cedula).trim());
  },

  saveWorker(worker: PersonnelWorker, auditUser: { email: string; name: string }): PersonnelWorker {
    const workers = this.getWorkers();
    const index = workers.findIndex((w) => w.cedula === worker.cedula);
    let updatedWorkers: PersonnelWorker[];
    const isNew = index === -1;

    if (isNew) {
      updatedWorkers = [worker, ...workers];
      auditService.log(
        auditUser.email,
        auditUser.name,
        'CREAR',
        'Maestro de Personal',
        worker.cedula,
        `Ingreso de trabajador ${worker.nombre} (C.C. ${worker.cedula})`,
        undefined,
        worker
      );
    } else {
      const prev = workers[index];
      updatedWorkers = [...workers];
      updatedWorkers[index] = { ...worker, updatedAt: new Date().toISOString() };
      auditService.log(
        auditUser.email,
        auditUser.name,
        'EDITAR',
        'Maestro de Personal',
        worker.cedula,
        `Actualización de trabajador ${worker.nombre} (C.C. ${worker.cedula})`,
        prev,
        worker
      );
    }

    localStorage.setItem(KEYS.PERSONNEL, JSON.stringify(updatedWorkers));
    this.notify();
    return worker;
  },

  bulkUpsertWorkers(
    workersToUpsert: PersonnelWorker[],
    auditUser: { email: string; name: string }
  ) {
    const existingWorkers = this.getWorkers();
    const map = new Map<string, PersonnelWorker>();
    existingWorkers.forEach((w) => map.set(w.cedula, w));

    workersToUpsert.forEach((w) => {
      map.set(w.cedula, w);
    });

    const updatedList = Array.from(map.values());
    localStorage.setItem(KEYS.PERSONNEL, JSON.stringify(updatedList));

    auditService.log(
      auditUser.email,
      auditUser.name,
      'ACTUALIZAR_MAESTRO',
      'Maestro de Personal',
      `bulk-${Date.now()}`,
      `Actualización masiva: ${workersToUpsert.length} trabajadores procesados.`,
      undefined,
      { count: workersToUpsert.length }
    );

    this.notify();
  },

  markWorkersInactive(
    cedulas: string[],
    auditUser: { email: string; name: string }
  ) {
    if (cedulas.length === 0) return;
    const workers = this.getWorkers();
    const cedulaSet = new Set(cedulas);
    const now = new Date().toISOString();

    const updated = workers.map((w) => {
      if (cedulaSet.has(w.cedula) && w.estado === 'ACTIVO') {
        return {
          ...w,
          estado: 'INACTIVO' as const,
          fechaRetiro: now.split('T')[0],
          motivoRetiro: 'No figura en carga completa de maestro de personal',
          updatedAt: now,
        };
      }
      return w;
    });

    localStorage.setItem(KEYS.PERSONNEL, JSON.stringify(updated));

    auditService.log(
      auditUser.email,
      auditUser.name,
      'CAMBIO_ESTADO',
      'Maestro de Personal',
      `inactivos-${Date.now()}`,
      `Marcados como inactivos ${cedulas.length} trabajadores no presentes en archivo maestro.`,
      undefined,
      { cedulas }
    );

    this.notify();
  },

  // ---------------- SST RECORDS ----------------
  getRecords(filters?: {
    sedeId?: string;
    menuId?: string;
    subMenuId?: string;
    estado?: string;
    fechaInicio?: string;
    fechaFin?: string;
    cedulaTrabajador?: string;
    search?: string;
  }): SSTRecord[] {
    let list: SSTRecord[] = [];
    try {
      const stored = localStorage.getItem(KEYS.RECORDS);
      list = stored ? JSON.parse(stored) : SEED_RECORDS;
    } catch {
      list = SEED_RECORDS;
    }

    if (!filters) return list;

    return list.filter((r) => {
      if (filters.sedeId && filters.sedeId !== 'TODAS' && r.sedeId !== filters.sedeId) return false;
      if (filters.menuId && r.menuId !== filters.menuId) return false;
      if (filters.subMenuId && r.subMenuId !== filters.subMenuId) return false;
      if (filters.estado && filters.estado !== 'TODOS' && r.estado !== filters.estado) return false;
      if (filters.cedulaTrabajador && r.cedulaTrabajador !== filters.cedulaTrabajador) return false;
      if (filters.fechaInicio && r.fecha < filters.fechaInicio) return false;
      if (filters.fechaFin && r.fecha > filters.fechaFin) return false;
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matches =
          r.numeroRegistro.toLowerCase().includes(query) ||
          r.moduloNombre.toLowerCase().includes(query) ||
          r.subModuloNombre.toLowerCase().includes(query) ||
          r.area.toLowerCase().includes(query) ||
          (r.nombreTrabajador && r.nombreTrabajador.toLowerCase().includes(query)) ||
          (r.cedulaTrabajador && r.cedulaTrabajador.toLowerCase().includes(query)) ||
          r.observaciones.toLowerCase().includes(query);
        if (!matches) return false;
      }
      return true;
    });
  },

  getRecordById(id: string): SSTRecord | undefined {
    const list = this.getRecords();
    return list.find((r) => r.id === id);
  },

  saveRecord(record: SSTRecord, auditUser: { email: string; name: string }): SSTRecord {
    const records = this.getRecords();
    const index = records.findIndex((r) => r.id === record.id);
    let updatedRecords: SSTRecord[];
    const isNew = index === -1;

    if (isNew) {
      updatedRecords = [record, ...records];
      auditService.log(
        auditUser.email,
        auditUser.name,
        'CREAR',
        record.subModuloNombre,
        record.numeroRegistro,
        `Creación de registro ${record.numeroRegistro} en sede ${record.sedeId}`,
        undefined,
        record
      );
    } else {
      const prev = records[index];
      updatedRecords = [...records];
      updatedRecords[index] = { ...record, updatedAt: new Date().toISOString() };
      
      const accion = prev.estado !== record.estado ? 'CAMBIO_ESTADO' : 'EDITAR';
      auditService.log(
        auditUser.email,
        auditUser.name,
        accion,
        record.subModuloNombre,
        record.numeroRegistro,
        `Modificación de registro ${record.numeroRegistro} (Estado: ${record.estado})`,
        prev,
        record
      );
    }

    localStorage.setItem(KEYS.RECORDS, JSON.stringify(updatedRecords));
    this.notify();
    return record;
  },

  deleteRecord(id: string, auditUser: { email: string; name: string }): boolean {
    const records = this.getRecords();
    const target = records.find((r) => r.id === id);
    if (!target) return false;

    const filtered = records.filter((r) => r.id !== id);
    localStorage.setItem(KEYS.RECORDS, JSON.stringify(filtered));

    auditService.log(
      auditUser.email,
      auditUser.name,
      'EDITAR',
      target.subModuloNombre,
      target.numeroRegistro,
      `Eliminación autorizada de registro ${target.numeroRegistro} por administrador`,
      target,
      undefined
    );

    this.notify();
    return true;
  },

  // ---------------- CATALOGS ----------------
  getSedes(): Sede[] {
    try {
      const stored = localStorage.getItem(KEYS.SEDES);
      return stored ? JSON.parse(stored) : INITIAL_SEDES;
    } catch {
      return INITIAL_SEDES;
    }
  },

  saveSede(sede: Sede, auditUser: { email: string; name: string }): Sede {
    const list = this.getSedes();
    const index = list.findIndex((s) => s.id === sede.id);
    let updated: Sede[];
    if (index === -1) {
      updated = [...list, sede];
    } else {
      updated = [...list];
      updated[index] = sede;
    }
    localStorage.setItem(KEYS.SEDES, JSON.stringify(updated));
    auditService.log(
      auditUser.email,
      auditUser.name,
      'CREAR',
      'Catálogo Sedes',
      sede.id,
      `Actualización de sede ${sede.nombre}`
    );
    this.notify();
    return sede;
  },

  getSupervisores(): Supervisor[] {
    try {
      const stored = localStorage.getItem(KEYS.SUPERVISORES);
      return stored ? JSON.parse(stored) : INITIAL_SUPERVISORES;
    } catch {
      return INITIAL_SUPERVISORES;
    }
  },

  saveSupervisor(sup: Supervisor, auditUser: { email: string; name: string }): Supervisor {
    const list = this.getSupervisores();
    const index = list.findIndex((s) => s.id === sup.id);
    let updated: Supervisor[];
    if (index === -1) {
      updated = [...list, sup];
    } else {
      updated = [...list];
      updated[index] = sup;
    }
    localStorage.setItem(KEYS.SUPERVISORES, JSON.stringify(updated));
    auditService.log(
      auditUser.email,
      auditUser.name,
      'CREAR',
      'Catálogo Supervisores',
      sup.id,
      `Actualización de supervisor ${sup.supervisor}`
    );
    this.notify();
    return sup;
  },

  getEPS(): EPS[] {
    try {
      const stored = localStorage.getItem(KEYS.EPS);
      return stored ? JSON.parse(stored) : INITIAL_EPS;
    } catch {
      return INITIAL_EPS;
    }
  },

  getARL(): ARL[] {
    try {
      const stored = localStorage.getItem(KEYS.ARL);
      return stored ? JSON.parse(stored) : INITIAL_ARL;
    } catch {
      return INITIAL_ARL;
    }
  },

  // ---------------- IMPORT HISTORY ----------------
  getImportHistory(): MasterImportHistory[] {
    try {
      const stored = localStorage.getItem(KEYS.IMPORT_HISTORY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  saveImportHistory(entry: MasterImportHistory) {
    const list = this.getImportHistory();
    const updated = [entry, ...list.slice(0, 49)];
    localStorage.setItem(KEYS.IMPORT_HISTORY, JSON.stringify(updated));
    this.notify();
  },

  // ---------------- BACKUP & RESTORE ----------------
  createFullBackup(auditUser: { email: string; name: string }) {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      exportedBy: auditUser.email,
      sedes: this.getSedes(),
      supervisores: this.getSupervisores(),
      eps: this.getEPS(),
      arl: this.getARL(),
      personnel: this.getWorkers(),
      records: this.getRecords(),
      importHistory: this.getImportHistory(),
      auditLogs: auditService.getLogs(),
    };

    auditService.log(
      auditUser.email,
      auditUser.name,
      'RESPALDO',
      'Respaldos',
      `backup-${Date.now()}`,
      'Generación y descarga de respaldo completo de la base de datos SST'
    );

    return backupData;
  },

  restoreFullBackup(backupData: any, auditUser: { email: string; name: string }): { success: boolean; message: string } {
    if (!backupData || !backupData.personnel || !backupData.records) {
      return { success: false, message: 'El archivo de respaldo no tiene el formato válido requerido.' };
    }

    try {
      if (Array.isArray(backupData.sedes)) localStorage.setItem(KEYS.SEDES, JSON.stringify(backupData.sedes));
      if (Array.isArray(backupData.supervisores)) localStorage.setItem(KEYS.SUPERVISORES, JSON.stringify(backupData.supervisores));
      if (Array.isArray(backupData.eps)) localStorage.setItem(KEYS.EPS, JSON.stringify(backupData.eps));
      if (Array.isArray(backupData.arl)) localStorage.setItem(KEYS.ARL, JSON.stringify(backupData.arl));
      if (Array.isArray(backupData.personnel)) localStorage.setItem(KEYS.PERSONNEL, JSON.stringify(backupData.personnel));
      if (Array.isArray(backupData.records)) localStorage.setItem(KEYS.RECORDS, JSON.stringify(backupData.records));
      if (Array.isArray(backupData.importHistory)) localStorage.setItem(KEYS.IMPORT_HISTORY, JSON.stringify(backupData.importHistory));

      auditService.log(
        auditUser.email,
        auditUser.name,
        'RESPALDO',
        'Respaldos',
        `restore-${Date.now()}`,
        `Restauración total de información realizada por administrador. ${backupData.personnel.length} trabajadores y ${backupData.records.length} registros restaurados.`
      );

      this.notify();
      return { success: true, message: 'Base de datos restaurada exitosamente.' };
    } catch (e: any) {
      return { success: false, message: `Error al restaurar: ${e.message}` };
    }
  },

  // Notify listeners across components
  notify() {
    window.dispatchEvent(new CustomEvent('mg-sst-data-change'));
  },
};

// Auto initialize on module load
storageService.init();
