import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  FileSpreadsheet,
  Download,
  Building2,
} from 'lucide-react';
import { useSST } from '../../context/SSTContext';
import { useAuth } from '../../context/AuthContext';
import { exportService } from '../../services/exportService';
import { INITIAL_SEDES } from '../../config/constants';
import { PersonnelWorker } from '../../types';
import { ExcelMasterUpdateModal } from './ExcelMasterUpdateModal';

export const PersonnelMasterView: React.FC = () => {
  const { workers } = useSST();
  const { canEdit, user, activeSiteId, switchSite } = useAuth();

  const isAdmin = user?.role === 'admin';
  const lockedSiteId = !isAdmin && user?.siteId && user.siteId !== 'TODAS' ? user.siteId : null;
  const effectiveSiteScope = lockedSiteId || (isAdmin ? activeSiteId || 'TODAS' : 'TODAS');

  const [search, setSearch] = useState('');
  const [selectedEstado, setSelectedEstado] = useState<'TODOS' | 'ACTIVO' | 'INACTIVO'>('ACTIVO');
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<PersonnelWorker | null>(null);

  const siteScopedWorkers = useMemo(() => {
    if (!effectiveSiteScope || effectiveSiteScope === 'TODAS') return workers;
    return workers.filter(
      (w) => String(w.sedeId || '').trim().toUpperCase() === effectiveSiteScope.trim().toUpperCase()
    );
  }, [workers, effectiveSiteScope]);

  // Filtered workers list
  const filteredWorkers = useMemo(() => {
    return siteScopedWorkers.filter((w) => {
      if (selectedEstado !== 'TODOS' && w.estado !== selectedEstado) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const matches =
          String(w.cedula).includes(query) ||
          w.nombre.toLowerCase().includes(query) ||
          (w.cargo || w.puesto || '').toLowerCase().includes(query) ||
          (w.sedeId && w.sedeId.toLowerCase().includes(query));
        if (!matches) return false;
      }
      return true;
    });
  }, [siteScopedWorkers, selectedEstado, search]);

  const activeCount = siteScopedWorkers.filter((w) => w.estado === 'ACTIVO').length;
  const inactiveCount = siteScopedWorkers.filter((w) => w.estado === 'INACTIVO').length;

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[#0A2958] p-1 text-white">
              <Users className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-black text-[#0A2958] sm:text-2xl">
              Maestro Único de Personal
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Fuente centralizada de información de trabajadores de MG Consultores para todos los módulos SST.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => exportService.exportPersonnelToExcel(filteredWorkers)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
          >
            <Download className="h-4 w-4 text-emerald-600" />
            <span>Exportar Excel</span>
          </button>

          {canEdit() && (
            <button
              onClick={() => setIsUpdateModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-[#E60000] px-4 py-2 text-xs font-bold text-white shadow-md hover:bg-red-700 transition-all hover:scale-[1.02]"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>ACTUALIZAR MAESTRO (EXCEL)</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Counters Banner */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-500">Total en Maestro</span>
          <p className="text-2xl font-black text-[#0A2958] mt-0.5">{siteScopedWorkers.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-emerald-600">Activos Operativos</span>
          <p className="text-2xl font-black text-emerald-600 mt-0.5">{activeCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-slate-400">Inactivos / Retirados</span>
          <p className="text-2xl font-black text-slate-500 mt-0.5">{inactiveCount}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase text-blue-600">Filtrados en Vista</span>
          <p className="text-2xl font-black text-[#0A2958] mt-0.5">{filteredWorkers.length}</p>
        </div>
      </div>

      {/* Search and Filters Toolbar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por cédula, nombre, sede o cargo..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
            />
          </div>

          {/* Sede & Status Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin ? (
              <select
                value={effectiveSiteScope}
                onChange={(e) => switchSite(e.target.value)}
                className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
              >
                <option value="TODAS">Todas las Sedes</option>
                {INITIAL_SEDES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.codigo}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-1.5 rounded-lg border border-slate-200 bg-slate-100 px-3 py-2 text-xs font-bold text-[#0A2958]">
                <Building2 className="h-3.5 w-3.5" />
                <span>Sede: {lockedSiteId}</span>
              </div>
            )}

            <select
              value={selectedEstado}
              onChange={(e) => setSelectedEstado(e.target.value as any)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
            >
              <option value="TODOS">Todos los Estados</option>
              <option value="ACTIVO">Solo Activos</option>
              <option value="INACTIVO">Solo Inactivos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Workers Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
          <table
            className="w-full text-left text-xs"
            aria-label="Listado de Trabajadores del Maestro de Personal"
          >
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10">
              <tr>
                <th scope="col" className="px-4 py-3">Cédula</th>
                <th scope="col" className="px-4 py-3">Nombre</th>
                <th scope="col" className="px-4 py-3 whitespace-nowrap">Fecha Nacimiento</th>
                <th scope="col" className="px-4 py-3 text-center">Edad</th>
                <th scope="col" className="px-4 py-3 text-center">Género</th>
                <th scope="col" className="px-4 py-3">Sede</th>
                <th scope="col" className="px-4 py-3 whitespace-nowrap">Fecha Ingreso</th>
                <th scope="col" className="px-4 py-3">Cargo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredWorkers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No se encontraron trabajadores que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredWorkers.map((worker) => (
                  <tr
                    key={worker.id}
                    onClick={() => setSelectedWorker(worker)}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                  >
                    <td className="px-4 py-3 font-mono font-bold text-[#0A2958] whitespace-nowrap">
                      {worker.cedula}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-800">{worker.nombre}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {worker.fechaNacimiento || '—'}
                    </td>
                    <td className="px-4 py-3 text-center font-medium text-slate-700 whitespace-nowrap">
                      {worker.edad > 0 ? worker.edad : '—'}
                    </td>
                    <td className="px-4 py-3 text-center font-semibold text-slate-700 whitespace-nowrap">
                      {worker.genero || '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="font-bold text-[#0A2958] bg-slate-100 px-2 py-0.5 rounded">
                        {worker.sedeId}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {worker.fechaIngreso || '—'}
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium">
                      {worker.cargo || worker.puesto}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Worker Details Modal */}
      {selectedWorker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-[#0A2958]">Ficha del Trabajador</h3>
                <p className="text-xs text-slate-500">C.C. {selectedWorker.cedula}</p>
              </div>
              <button
                onClick={() => setSelectedWorker(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Cédula:</span>
                  <p className="font-mono font-bold text-[#0A2958]">{selectedWorker.cedula}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Nombre:</span>
                  <p className="font-bold text-slate-800 text-sm">{selectedWorker.nombre}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Fecha Nacimiento:</span>
                  <p className="font-medium text-slate-700">{selectedWorker.fechaNacimiento || '—'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Edad:</span>
                  <p className="font-medium text-slate-700">{selectedWorker.edad > 0 ? selectedWorker.edad : '—'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Género:</span>
                  <p className="font-medium text-slate-700">{selectedWorker.genero || '—'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Sede:</span>
                  <p className="font-semibold text-[#0A2958]">{selectedWorker.sedeId}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Fecha Ingreso:</span>
                  <p className="font-medium text-slate-700">{selectedWorker.fechaIngreso || '—'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Cargo:</span>
                  <p className="font-semibold text-slate-700">{selectedWorker.cargo || selectedWorker.puesto}</p>
                </div>
              </div>

              {selectedWorker.estado === 'INACTIVO' && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-amber-900">
                  <p className="font-bold">Historial de Retiro:</p>
                  <p className="text-[11px] mt-0.5">Fecha retiro: {selectedWorker.fechaRetiro || 'Registrada en sistema'}</p>
                  <p className="text-[11px]">Motivo: {selectedWorker.motivoRetiro || 'Desvinculación laboral'}</p>
                </div>
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setSelectedWorker(null)}
                className="rounded-lg bg-[#0A2958] px-4 py-2 text-xs font-bold text-white hover:bg-blue-900"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel Master Update Modal */}
      <ExcelMasterUpdateModal
        isOpen={isUpdateModalOpen}
        onClose={() => setIsUpdateModalOpen(false)}
        onSuccess={() => {
          // Toast or confirmation
        }}
      />
    </div>
  );
};
