import React, { useState, useEffect, useMemo } from 'react';
import {
  History,
  ShieldAlert,
  Search,
  Filter,
  Eye,
  CheckCircle,
  FileText,
  User,
  Clock,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { auditService } from '../../services/auditService';
import { AuditLog } from '../../types';

export const AuditView: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [search, setSearch] = useState('');
  const [selectedAccion, setSelectedAccion] = useState('TODAS');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const loadLogs = () => {
    setLogs(auditService.getLogs());
  };

  useEffect(() => {
    loadLogs();
    const handleUpdate = () => loadLogs();
    window.addEventListener('mg-audit-updated', handleUpdate);
    return () => window.removeEventListener('mg-audit-updated', handleUpdate);
  }, []);

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      if (selectedAccion !== 'TODAS' && log.accion !== selectedAccion) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const matches =
          log.descripcion.toLowerCase().includes(query) ||
          log.usuarioEmail.toLowerCase().includes(query) ||
          log.modulo.toLowerCase().includes(query) ||
          log.registroAfectadoId.toLowerCase().includes(query);
        if (!matches) return false;
      }
      return true;
    });
  }, [logs, selectedAccion, search]);

  const getActionBadge = (accion: AuditLog['accion']) => {
    switch (accion) {
      case 'CREAR':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'EDITAR':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'CAMBIO_ESTADO':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'ACTUALIZAR_MAESTRO':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'CAMBIO_PERMISO':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      case 'RESPALDO':
        return 'bg-cyan-100 text-cyan-800 border-cyan-300';
      case 'DESCARGA_REPORTE':
        return 'bg-slate-100 text-slate-800 border-slate-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[#0A2958] p-1 text-white">
              <History className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-black text-[#0A2958] sm:text-2xl">
              Auditoría de Actividades y Trazabilidad
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Registro cronológico inmutable de creaciones, modificaciones, actualizaciones de maestro, cambios de estado y descargas.
          </p>
        </div>

        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-100 border border-emerald-300 px-3 py-1 text-xs font-bold text-emerald-800">
          <ShieldAlert className="h-3.5 w-3.5" />
          <span>Logs Inmutables ({logs.length})</span>
        </span>
      </div>

      {/* Filter and Search */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por usuario, módulo, descripción o código de registro..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
            />
          </div>

          <div className="flex items-center gap-2">
            <select
              value={selectedAccion}
              onChange={(e) => setSelectedAccion(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
            >
              <option value="TODAS">Todas las Acciones</option>
              <option value="CREAR">Crear</option>
              <option value="EDITAR">Editar</option>
              <option value="CAMBIO_ESTADO">Cambio de Estado</option>
              <option value="ACTUALIZAR_MAESTRO">Actualizar Maestro</option>
              <option value="CAMBIO_PERMISO">Cambio de Permiso / Login</option>
              <option value="RESPALDO">Respaldo</option>
              <option value="DESCARGA_REPORTE">Descarga Reporte</option>
            </select>
          </div>
        </div>
      </div>

      {/* Logs Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3">Fecha y Hora (COT)</th>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Acción</th>
                <th className="px-4 py-3">Módulo</th>
                <th className="px-4 py-3">Registro / ID</th>
                <th className="px-4 py-3">Descripción</th>
                <th className="px-4 py-3 text-right">Detalle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    No hay registros de auditoría que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => {
                  const isExpanded = expandedLogId === log.id;
                  const hasDetails = log.datosPrevios || log.datosNuevos;

                  return (
                    <React.Fragment key={log.id}>
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                          {new Date(log.fecha).toLocaleString('es-CO')}
                        </td>
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-800">{log.usuarioNombre}</div>
                          <div className="text-[10px] text-slate-500">{log.usuarioEmail}</div>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${getActionBadge(
                              log.accion
                            )}`}
                          >
                            {log.accion}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-semibold text-slate-700 whitespace-nowrap">
                          {log.modulo}
                        </td>
                        <td className="px-4 py-3 font-mono text-[#0A2958] font-bold whitespace-nowrap">
                          {log.registroAfectadoId}
                        </td>
                        <td className="px-4 py-3 text-slate-700 max-w-sm truncate">
                          {log.descripcion}
                        </td>
                        <td className="px-4 py-3 text-right whitespace-nowrap">
                          {hasDetails ? (
                            <button
                              onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0A2958] hover:underline"
                            >
                              <span>{isExpanded ? 'Ocultar' : 'Ver Diff'}</span>
                              {isExpanded ? (
                                <ChevronUp className="h-3 w-3" />
                              ) : (
                                <ChevronDown className="h-3 w-3" />
                              )}
                            </button>
                          ) : (
                            <span className="text-slate-400 text-[11px]">N/A</span>
                          )}
                        </td>
                      </tr>

                      {/* Expandable Diff Row */}
                      {isExpanded && hasDetails && (
                        <tr className="bg-slate-50/90 border-b border-slate-200">
                          <td colSpan={7} className="px-6 py-4">
                            <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 text-xs">
                              <p className="font-bold text-[#0A2958]">
                                Detalle de Cambios en la Base de Datos:
                              </p>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {log.datosPrevios && (
                                  <div className="rounded-lg bg-red-50/50 border border-red-200 p-3">
                                    <span className="font-bold text-red-800 block mb-1">
                                      Valores Anteriores:
                                    </span>
                                    <pre className="text-[10px] font-mono text-red-950 overflow-x-auto whitespace-pre-wrap">
                                      {JSON.stringify(log.datosPrevios, null, 2)}
                                    </pre>
                                  </div>
                                )}
                                {log.datosNuevos && (
                                  <div className="rounded-lg bg-emerald-50/50 border border-emerald-200 p-3">
                                    <span className="font-bold text-emerald-800 block mb-1">
                                      Valores Nuevos:
                                    </span>
                                    <pre className="text-[10px] font-mono text-emerald-950 overflow-x-auto whitespace-pre-wrap">
                                      {JSON.stringify(log.datosNuevos, null, 2)}
                                    </pre>
                                  </div>
                                )}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
