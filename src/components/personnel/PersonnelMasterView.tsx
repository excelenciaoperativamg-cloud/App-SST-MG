import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  Filter,
  FileSpreadsheet,
  Download,
  Plus,
  Building2,
  Calendar,
  Briefcase,
  History,
  CheckCircle2,
  XCircle,
  Eye,
  FileCheck,
} from 'lucide-react';
import { useSST } from '../../context/SSTContext';
import { useAuth } from '../../context/AuthContext';
import { exportService } from '../../services/exportService';
import { INITIAL_SEDES } from '../../config/constants';
import { PersonnelWorker } from '../../types';
import { ExcelMasterUpdateModal } from './ExcelMasterUpdateModal';

export const PersonnelMasterView: React.FC = () => {
  const { workers, saveWorker, importHistory } = useSST();
  const { canEdit, user } = useAuth();

  const [search, setSearch] = useState('');
  const [selectedSede, setSelectedSede] = useState('TODAS');
  const [selectedEstado, setSelectedEstado] = useState<'TODOS' | 'ACTIVO' | 'INACTIVO'>('ACTIVO');
  const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [selectedWorker, setSelectedWorker] = useState<PersonnelWorker | null>(null);

  // Filtered workers list
  const filteredWorkers = useMemo(() => {
    return workers.filter((w) => {
      if (selectedSede !== 'TODAS' && w.sedeId !== selectedSede) return false;
      if (selectedEstado !== 'TODOS' && w.estado !== selectedEstado) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const matches =
          String(w.cedula).includes(query) ||
          w.nombre.toLowerCase().includes(query) ||
          w.puesto.toLowerCase().includes(query) ||
          (w.eps && w.eps.toLowerCase().includes(query));
        if (!matches) return false;
      }
      return true;
    });
  }, [workers, selectedSede, selectedEstado, search]);

  const activeCount = workers.filter((w) => w.estado === 'ACTIVO').length;
  const inactiveCount = workers.filter((w) => w.estado === 'INACTIVO').length;

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

          <button
            onClick={() => setIsHistoryModalOpen(true)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs transition-colors"
          >
            <History className="h-4 w-4 text-[#0A2958]" />
            <span>Historial ({importHistory.length})</span>
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
          <p className="text-2xl font-black text-[#0A2958] mt-0.5">{workers.length}</p>
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
              placeholder="Buscar por cédula, nombre completo, puesto o EPS..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
            />
          </div>

          {/* Sede & Status Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedSede}
              onChange={(e) => setSelectedSede(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
            >
              <option value="TODAS">Todas las Sedes</option>
              {INITIAL_SEDES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.codigo}
                </option>
              ))}
            </select>

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
        <div className="overflow-x-auto">
          <table
            className="w-full text-left text-xs"
            aria-label="Listado de Trabajadores del Maestro de Personal"
          >
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th scope="col" className="px-4 py-3">Cédula</th>
                <th scope="col" className="px-4 py-3">Nombre del Trabajador</th>
                <th scope="col" className="px-4 py-3">Puesto / Cargo</th>
                <th scope="col" className="px-4 py-3">Sede</th>
                <th scope="col" className="px-4 py-3">Edad / Género</th>
                <th scope="col" className="px-4 py-3">EPS & ARL</th>
                <th scope="col" className="px-4 py-3">Ingreso</th>
                <th scope="col" className="px-4 py-3">Estado</th>
                <th scope="col" className="px-4 py-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredWorkers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-slate-500">
                    No se encontraron trabajadores que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                filteredWorkers.map((worker) => (
                  <tr
                    key={worker.id}
                    className="hover:bg-slate-50/80 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono font-bold text-[#0A2958]">
                      {worker.cedula}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-800">{worker.nombre}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-700 font-medium">
                      {worker.puesto}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-[#0A2958] bg-slate-100 px-2 py-0.5 rounded">
                        {worker.sedeId}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {worker.edad} años ({worker.genero})
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[11px] text-slate-700">{worker.eps || 'No registrada'}</div>
                      <div className="text-[10px] text-slate-600">{worker.arl || 'No registrada'}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {worker.fechaIngreso}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {worker.estado === 'ACTIVO' ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 border border-emerald-300 px-2.5 py-0.5 text-[10px] font-bold text-emerald-800">
                          <CheckCircle2 className="h-3 w-3" />
                          ACTIVO
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 border border-slate-300 px-2.5 py-0.5 text-[10px] font-bold text-slate-600">
                          <XCircle className="h-3 w-3" />
                          INACTIVO
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => setSelectedWorker(worker)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-semibold text-[#0A2958] hover:bg-slate-100 transition-colors"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Detalles</span>
                      </button>
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
                  <span className="text-[10px] font-bold uppercase text-slate-400">Nombre Completo:</span>
                  <p className="font-bold text-slate-800 text-sm">{selectedWorker.nombre}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Estado:</span>
                  <p className="font-bold text-slate-800">{selectedWorker.estado}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Puesto / Cargo:</span>
                  <p className="font-semibold text-slate-700">{selectedWorker.puesto}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Sede:</span>
                  <p className="font-semibold text-[#0A2958]">{selectedWorker.sedeId}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Fecha Nacimiento:</span>
                  <p className="font-medium text-slate-700">{selectedWorker.fechaNacimiento} ({selectedWorker.edad} años)</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Fecha Ingreso:</span>
                  <p className="font-medium text-slate-700">{selectedWorker.fechaIngreso}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">EPS:</span>
                  <p className="font-medium text-slate-700">{selectedWorker.eps || 'N/A'}</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">ARL:</span>
                  <p className="font-medium text-slate-700">{selectedWorker.arl || 'N/A'}</p>
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

      {/* History of Imports Modal */}
      {isHistoryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <div>
                <h3 className="text-base font-bold text-[#0A2958]">Historial de Actualizaciones del Maestro</h3>
                <p className="text-xs text-slate-500">Registro auditable de importaciones de Excel realizadas</p>
              </div>
              <button
                onClick={() => setIsHistoryModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <div className="max-h-80 overflow-y-auto space-y-2 text-xs">
              {importHistory.length === 0 ? (
                <p className="text-center text-slate-400 py-6">No hay registros de importación masiva aún.</p>
              ) : (
                importHistory.map((h) => (
                  <div key={h.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="flex items-center justify-between font-bold text-slate-800 mb-1">
                      <span>{h.nombreArchivo}</span>
                      <span className="text-[11px] text-slate-500">
                        {new Date(h.fecha).toLocaleString('es-CO')}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2 text-[11px] text-slate-600">
                      <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold">
                        {h.tipoCarga}
                      </span>
                      <span>Total: {h.totalLeidos}</span>
                      <span className="text-emerald-700 font-semibold">Nuevos: {h.nuevos}</span>
                      <span className="text-blue-700 font-semibold">Actualizados: {h.actualizados}</span>
                      <span className="text-amber-700 font-semibold">Inactivos: {h.marcadosInactivos}</span>
                    </div>
                    <p className="text-[10px] text-slate-600 mt-1">
                      Ejecutado por: {h.usuarioNombre} ({h.usuarioEmail})
                    </p>
                  </div>
                ))
              )}
            </div>

            <div className="mt-5 flex justify-end">
              <button
                onClick={() => setIsHistoryModalOpen(false)}
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
