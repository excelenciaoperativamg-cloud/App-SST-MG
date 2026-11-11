import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  Filter,
  Download,
  FileText,
  Building2,
  Calendar,
  AlertTriangle,
  FileCheck,
  Trash2,
  Edit3,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';
import { useSST } from '../../context/SSTContext';
import { useAuth } from '../../context/AuthContext';
import { SST_MODULES, INITIAL_SEDES } from '../../config/constants';
import { exportService } from '../../services/exportService';
import { SSTRecord, SSTRecordStatus } from '../../types';
import { DynamicSSTFormModal } from './DynamicSSTFormModal';

interface SSTModuleViewProps {
  moduleId: string;
  activeSubMenuId?: string;
  onSelectSubMenu: (subId: string) => void;
}

export const SSTModuleView: React.FC<SSTModuleViewProps> = ({
  moduleId,
  activeSubMenuId,
  onSelectSubMenu,
}) => {
  const { records, deleteRecord } = useSST();
  const { user, canEdit, canAdmin } = useAuth();

  const currentModule = SST_MODULES.find((m) => m.id === moduleId) || SST_MODULES[0];
  const activeSub = currentModule.submenus.find((s) => s.id === activeSubMenuId) || currentModule.submenus[0];

  const [search, setSearch] = useState('');
  const [selectedSede, setSelectedSede] = useState('TODAS');
  const [selectedEstado, setSelectedEstado] = useState<string>('TODOS');
  const [viewMode, setViewMode] = useState<'table' | 'submodule_cards'>('table');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<SSTRecord | null>(null);

  // Filter records belonging to this module and submodule
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (r.menuId !== currentModule.id) return false;
      if (activeSub && r.subMenuId !== activeSub.id) return false;
      if (user?.role === 'site_lead' && user.siteId !== 'TODAS' && r.sedeId !== user.siteId) {
        return false;
      }
      if (selectedSede !== 'TODAS' && r.sedeId !== selectedSede) return false;
      if (selectedEstado !== 'TODOS' && r.estado !== selectedEstado) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const matches =
          r.numeroRegistro.toLowerCase().includes(query) ||
          r.area.toLowerCase().includes(query) ||
          (r.nombreTrabajador && r.nombreTrabajador.toLowerCase().includes(query)) ||
          (r.cedulaTrabajador && r.cedulaTrabajador.includes(query)) ||
          r.observaciones.toLowerCase().includes(query);
        if (!matches) return false;
      }
      return true;
    });
  }, [records, currentModule.id, activeSub, selectedSede, selectedEstado, search, user]);

  const handleCreateNew = () => {
    setRecordToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleEditRecord = (rec: SSTRecord) => {
    setRecordToEdit(rec);
    setIsFormModalOpen(true);
  };

  const handleDelete = (id: string, code: string) => {
    if (window.confirm(`¿Confirmas la eliminación del registro ${code}? Esta acción quedará auditada.`)) {
      deleteRecord(id);
    }
  };

  const getStatusBadge = (status: SSTRecordStatus) => {
    switch (status) {
      case 'CERRADO':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'EN_PROCESO':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'PENDIENTE':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Module Title Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0A2958] to-[#123970] p-6 text-white shadow-md">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="rounded-full bg-[#E60000] px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">
                MÓDULO SST
              </span>
              <span className="text-xs text-slate-300">
                Código Menú: {currentModule.id}
              </span>
            </div>
            <h1 className="text-2xl font-black text-white">{currentModule.nombre}</h1>
            <p className="mt-1 text-xs text-slate-200 max-w-2xl">
              {currentModule.descripcion}
            </p>
          </div>

          {canEdit() && (
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center gap-2 rounded-xl bg-[#E60000] px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-red-700 transition-all hover:scale-[1.02] flex-shrink-0"
            >
              <Plus className="h-4 w-4" />
              <span>Nuevo Registro en {activeSub?.nombre}</span>
            </button>
          )}
        </div>
      </div>

      {/* Submenu Navigation & View Mode Toggle */}
      {currentModule.submenus.length > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-3">
          {/* Submenu Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {currentModule.submenus.map((sub) => {
              const isSelected = activeSub?.id === sub.id;
              const count = records.filter((r) => r.subMenuId === sub.id).length;
              return (
                <button
                  key={sub.id}
                  onClick={() => {
                    onSelectSubMenu(sub.id);
                    setViewMode('table');
                  }}
                  className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all ${
                    isSelected && viewMode === 'table'
                      ? 'bg-[#0A2958] text-white shadow-sm ring-2 ring-[#0A2958]'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{sub.nombre}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                      isSelected && viewMode === 'table' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* View Mode Toggle: Cards vs Table */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200 flex-shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                viewMode === 'table'
                  ? 'bg-white text-[#0A2958] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Registros ({filteredRecords.length})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('submodule_cards')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all ${
                viewMode === 'submodule_cards'
                  ? 'bg-[#0A2958] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Catálogo de Submódulos ({currentModule.submenus.length})
            </button>
          </div>
        </div>
      )}

      {/* When viewMode is submodule_cards: Show the visual cards exactly like the reference screenshot */}
      {viewMode === 'submodule_cards' && currentModule.submenus.length > 1 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Subprocesos e Inspecciones Disponibles ({currentModule.nombre})
            </h2>
            <span className="text-xs text-slate-500">
              Selecciona un submódulo para ver sus registros o realizar una nueva inspección
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {currentModule.submenus.map((sub, idx) => {
              const subRecords = records.filter((r) => r.subMenuId === sub.id);
              const cardHeaderBg = sub.headerColor || currentModule.headerColor || 'bg-[#0A2958]';
              const cardButtonBg = sub.buttonColor || currentModule.buttonColor || 'bg-[#0A2958] hover:bg-blue-900';

              return (
                <article
                  key={sub.id}
                  className="flex flex-col rounded-2xl bg-white shadow-md border border-slate-200/90 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200 group text-left"
                >
                  {/* Colorful Top Header Bar */}
                  <div className={`${cardHeaderBg} px-5 py-4 flex items-center gap-3 relative transition-colors`}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-xs border border-white/30 flex-shrink-0 shadow-xs text-white font-black text-sm">
                      {idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold text-white tracking-wide truncate">
                        {sub.nombre}
                      </h3>
                      <span className="text-[10px] text-white/85 font-medium block">
                        Código: {sub.codigo}
                      </span>
                    </div>
                  </div>

                  {/* White Card Body */}
                  <div className="p-5 flex flex-col justify-between flex-1 bg-white space-y-4">
                    <div>
                      <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed line-clamp-3 min-h-[42px]">
                        {sub.descripcion}
                      </p>

                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                        <span className="font-medium text-slate-600">Historial de inspecciones</span>
                        <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                          {subRecords.length} registros
                        </span>
                      </div>
                    </div>

                    {/* Action Button labeled "ACCEDER" in matching color */}
                    <div className="space-y-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectSubMenu(sub.id);
                          setViewMode('table');
                        }}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider text-white ${cardButtonBg} shadow-sm transition-all duration-150 flex items-center justify-center gap-2 group-hover:brightness-105 active:scale-[0.99]`}
                      >
                        <span>ACCEDER</span>
                        <ExternalLink className="h-4 w-4" />
                      </button>

                      {canEdit() && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectSubMenu(sub.id);
                            handleCreateNew();
                          }}
                          className="w-full py-1.5 px-3 rounded-lg text-[11px] font-bold text-[#0A2958] bg-blue-50 hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5 border border-blue-200/60"
                        >
                          <Plus className="h-3.5 w-3.5 text-[#E60000]" />
                          <span>Diligenciar Inspección</span>
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* Table View (Filters and Records) */}
      {viewMode === 'table' && (
        <div className="space-y-6">
          {/* Notice on pending official SST format */}
          {activeSub?.formularioOficialPendiente && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">
                  Submódulo: {activeSub.nombre} (Espacio de trabajo operativo listo)
                </p>
                <p className="text-amber-800">
                  Este submódulo opera con el motor estándar de registros SST (código único, sede, área, supervisor, trabajador del maestro, evidencias fotográficas, observaciones y trazabilidad). La plantilla específica de campo oficial de MG Consultores se integrará progresivamente según la entrega documental.
                </p>
              </div>
            </div>
          )}

      {/* Filter and Action Toolbar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder={`Buscar en ${activeSub?.nombre || 'este módulo'} (N° registro, área, trabajador, hallazgo)...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Sede Filter */}
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

            {/* Estado Filter */}
            <select
              value={selectedEstado}
              onChange={(e) => setSelectedEstado(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
            >
              <option value="TODOS">Todos los Estados</option>
              <option value="CERRADO">Cerrado</option>
              <option value="EN_PROCESO">En Proceso</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="BORRADOR">Borrador</option>
            </select>

            {/* Export Excel */}
            <button
              onClick={() => exportService.exportRecordsToExcel(filteredRecords, `Reporte_${activeSub?.nombre}`)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs"
            >
              <Download className="h-3.5 w-3.5 text-emerald-600" />
              <span>Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Records Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table
            className="w-full text-left text-xs"
            aria-label={`Registros e inspecciones de ${activeSub?.nombre || 'SST'}`}
          >
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th scope="col" className="px-4 py-3">N° Registro</th>
                <th scope="col" className="px-4 py-3">Fecha</th>
                <th scope="col" className="px-4 py-3">Sede & Área</th>
                <th scope="col" className="px-4 py-3">Trabajador / Sujeto</th>
                <th scope="col" className="px-4 py-3">Observaciones / Hallazgo</th>
                <th scope="col" className="px-4 py-3">Estado</th>
                <th scope="col" className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-500">
                    <FileText className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">No hay registros en {activeSub?.nombre}.</p>
                    <p className="text-xs text-slate-600 mt-0.5">Haz clic en "Nuevo Registro" para diligenciar el formato.</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((rec) => (
                  <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-[#0A2958] whitespace-nowrap">
                      {rec.numeroRegistro}
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {rec.fecha}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-[#0A2958] bg-slate-100 px-1.5 py-0.5 rounded mr-1">
                        {rec.sedeId}
                      </span>
                      <span className="text-slate-700">{rec.area}</span>
                    </td>
                    <td className="px-4 py-3">
                      {rec.nombreTrabajador ? (
                        <div>
                          <div className="font-bold text-slate-800">{rec.nombreTrabajador}</div>
                          <div className="text-[10px] text-slate-600">C.C. {rec.cedulaTrabajador}</div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">Inspección general de área</span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-xs">
                      <p className="truncate text-slate-700 font-medium">{rec.observaciones}</p>
                      {rec.evidencias && rec.evidencias.length > 0 && (
                        <span className="inline-block mt-0.5 text-[10px] text-blue-600 font-semibold">
                          📷 {rec.evidencias.length} evidencias adjuntas
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${getStatusBadge(
                          rec.estado
                        )}`}
                      >
                        {rec.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap space-x-1">
                      {/* PDF Report */}
                      <button
                        onClick={() => exportService.generateRecordPDF(rec)}
                        title="Descargar PDF Oficial con membrete de MG Consultores"
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-[#0A2958] hover:bg-blue-50 hover:border-blue-200 transition-colors"
                      >
                        <FileText className="h-3.5 w-3.5 text-[#E60000]" />
                        <span>PDF</span>
                      </button>

                      {/* Edit */}
                      {canEdit() && (
                        <button
                          onClick={() => handleEditRecord(rec)}
                          title="Editar registro"
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>Editar</span>
                        </button>
                      )}

                      {/* Delete (Admin only) */}
                      {canAdmin() && (
                        <button
                          onClick={() => handleDelete(rec.id, rec.numeroRegistro)}
                          title="Eliminar registro (Solo Admin)"
                          className="inline-flex items-center rounded-lg border border-red-200 bg-red-50 p-1 text-red-600 hover:bg-red-100 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )}

      {/* Dynamic Form Modal */}
      <DynamicSSTFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        recordToEdit={recordToEdit}
        initialMenuId={moduleId}
        initialSubMenuId={activeSubMenuId}
        onSaved={() => {
          // auto refreshed via storage listener
        }}
      />
    </div>
  );
};
