import { AuditLog } from '../types';

const AUDIT_STORAGE_KEY = 'mg_sst_audit_logs';

export const auditService = {
  getLogs(): AuditLog[] {
    try {
      const stored = localStorage.getItem(AUDIT_STORAGE_KEY);
      if (!stored) return [];
      return JSON.parse(stored);
    } catch {
      return [];
    }
  },

  log(
    userEmail: string,
    userName: string,
    accion: AuditLog['accion'],
    modulo: string,
    registroAfectadoId: string,
    descripcion: string,
    datosPrevios?: any,
    datosNuevos?: any
  ): AuditLog {
    const newLog: AuditLog = {
      id: 'aud-' + Date.now() + '-' + Math.random().toString(36).substring(2, 7),
      fecha: new Date().toISOString(),
      usuarioEmail: userEmail || 'sistema@mgconsultores.com',
      usuarioNombre: userName || 'Sistema',
      accion,
      modulo,
      registroAfectadoId,
      descripcion,
      datosPrevios: datosPrevios ? JSON.parse(JSON.stringify(datosPrevios)) : undefined,
      datosNuevos: datosNuevos ? JSON.parse(JSON.stringify(datosNuevos)) : undefined,
    };

    const existing = this.getLogs();
    const updated = [newLog, ...existing.slice(0, 499)]; // Keep up to 500 logs
    try {
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('mg-audit-updated', { detail: newLog }));
    } catch (e) {
      console.warn('No se pudo guardar log de auditoría:', e);
    }

    return newLog;
  },
};
