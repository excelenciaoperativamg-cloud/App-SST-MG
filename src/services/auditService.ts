import { AuditLog } from '../types';

const AUDIT_STORAGE_KEY = 'mg_sst_audit_logs';

function sanitizeAuditPayload(obj: any): any {
  if (obj === null || obj === undefined) return undefined;
  try {
    return JSON.parse(
      JSON.stringify(obj, (_key, val) => {
        if (typeof val === 'string' && val.startsWith('data:image') && val.length > 512) {
          return '[Imagen/Firma adjunta]';
        }
        return val;
      })
    );
  } catch {
    return undefined;
  }
}

export const auditService = {
  getLogs(): AuditLog[] {
    try {
      const stored = localStorage.getItem(AUDIT_STORAGE_KEY);
      if (!stored) return [];
      const parsed = JSON.parse(stored);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  compactLogs(): void {
    try {
      const logs = this.getLogs();
      const compacted = logs.slice(0, 60).map((l) => ({
        ...l,
        datosPrevios: sanitizeAuditPayload(l.datosPrevios),
        datosNuevos: sanitizeAuditPayload(l.datosNuevos),
      }));
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(compacted));
    } catch {
      try {
        localStorage.removeItem(AUDIT_STORAGE_KEY);
      } catch {
        // Ignore storage restrictions
      }
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
      datosPrevios: sanitizeAuditPayload(datosPrevios),
      datosNuevos: sanitizeAuditPayload(datosNuevos),
    };

    const existing = this.getLogs();
    const updated = [newLog, ...existing.slice(0, 149)];
    try {
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('mg-audit-updated', { detail: newLog }));
    } catch {
      try {
        localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updated.slice(0, 30)));
      } catch (e) {
        console.warn('No se pudo guardar log de auditoría:', e);
      }
    }

    return newLog;
  },
};
