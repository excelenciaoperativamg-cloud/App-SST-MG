import React, { useState, useMemo } from 'react';
import {
  Users,
  ClipboardList,
  AlertTriangle,
  CheckCircle2,
  HardHat,
  Building2,
  Filter,
  PlusCircle,
  FileSpreadsheet,
  ArrowRight,
  TrendingUp,
} from 'lucide-react';
import { useSST } from '../../context/SSTContext';
import { useAuth } from '../../context/AuthContext';
import { INITIAL_SEDES, SST_MODULES } from '../../config/constants';
import { SSTRecord, MenuModuleConfig } from '../../types';
import { ModuleCard } from '../common/ModuleCard';
import { SubmenuPickerModal } from '../common/SubmenuPickerModal';

interface DashboardViewProps {
  onNavigateToModule: (moduleId: string, subMenuId?: string) => void;
  onNavigateToPersonnel: () => void;
  onNavigateToReports: () => void;
  onOpenNewRecordModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateToModule,
  onNavigateToPersonnel,
  onNavigateToReports,
  onOpenNewRecordModal,
}) => {
  const { workers, records, stats } = useSST();
  const { user, canEdit } = useAuth();
  const [selectedPickerModule, setSelectedPickerModule] = useState<MenuModuleConfig | null>(null);

  // Filters
  const [selectedSede, setSelectedSede] = useState<string>('TODAS');
  const [selectedModule, setSelectedModule] = useState<string>('TODOS');
  const [selectedEstado, setSelectedEstado] = useState<string>('TODOS');
  const [dateRange, setDateRange] = useState<'all' | 'month' | 'quarter'>('all');

  // Filtered records for dynamic dashboard cards
  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (user?.role === 'site_lead' && user.siteId !== 'TODAS' && r.sedeId !== user.siteId) {
        return false;
      }
      if (selectedSede !== 'TODAS' && r.sedeId !== selectedSede) return false;
      if (selectedModule !== 'TODOS' && r.menuId !== selectedModule) return false;
      if (selectedEstado !== 'TODOS' && r.estado !== selectedEstado) return false;

      if (dateRange === 'month') {
        const d = new Date(r.fecha);
        const now = new Date();
        if (d.getMonth() !== now.getMonth() || d.getFullYear() !== now.getFullYear()) {
          return false;
        }
      } else if (dateRange === 'quarter') {
        const d = new Date(r.fecha);
        const diffMonths = (new Date().getTime() - d.getTime()) / (1000 * 3600 * 24 * 30);
        if (diffMonths > 3) return false;
      }

      return true;
    });
  }, [records, selectedSede, selectedModule, selectedEstado, dateRange, user]);

  // Derived counts
  const eppDeliveriesCount = useMemo(() => {
    return filteredRecords.filter((r) => r.subMenuId === 'sub-per-1').length;
  }, [filteredRecords]);

  const emergencyInspectionsCount = useMemo(() => {
    return filteredRecords.filter((r) => r.menuId === 'd19d30b0').length;
  }, [filteredRecords]);

  const pendingFiltered = useMemo(() => {
    return filteredRecords.filter((r) => r.estado === 'PENDIENTE');
  }, [filteredRecords]);

  const closedFiltered = useMemo(() => {
    return filteredRecords.filter((r) => r.estado === 'CERRADO');
  }, [filteredRecords]);

  const inProcessFiltered = useMemo(() => {
    return filteredRecords.filter((r) => r.estado === 'EN_PROCESO');
  }, [filteredRecords]);

  const complianceRate = filteredRecords.length > 0
    ? Math.round((closedFiltered.length / filteredRecords.length) * 100)
    : 100;

  const getStatusBadge = (status: SSTRecord['estado']) => {
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
      {/* Top Banner / Welcome */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0A2958] via-[#103b7b] to-[#0A2958] p-6 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
          <Building2 className="w-64 h-64 text-white" />
        </div>

        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-2 mb-2">
            <span className="rounded-full bg-[#E60000] px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-white">
              MG CONSULTORES
            </span>
            <span className="text-xs text-slate-300">
              Sistema de Gestión SG-SST
            </span>
          </div>
          <h1 className="text-2xl font-black tracking-tight sm:text-3xl text-white">
            Panel de Seguridad y Salud en el Trabajo
          </h1>
          <p className="mt-1 text-sm text-slate-200">
            Monitoreo en tiempo real de inspecciones, entregas de EPP, rondas de cuidado, gestión de contratistas y cumplimiento por sedes operativas.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            {canEdit() && (
              <button
                onClick={onOpenNewRecordModal}
                className="inline-flex items-center gap-2 rounded-xl bg-[#E60000] px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-red-700 transition-all hover:scale-[1.02]"
              >
                <PlusCircle className="h-4 w-4" />
                <span>Nuevo Registro SST</span>
              </button>
            )}
            <button
              onClick={onNavigateToPersonnel}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-md px-4 py-2.5 text-xs font-bold text-white border border-white/20 hover:bg-white/20 transition-all"
            >
              <Users className="h-4 w-4" />
              <span>Maestro de Personal ({stats.activeWorkers})</span>
            </button>
            <button
              onClick={onNavigateToReports}
              className="inline-flex items-center gap-2 rounded-xl bg-white/10 backdrop-blur-md px-4 py-2.5 text-xs font-bold text-white border border-white/20 hover:bg-white/20 transition-all"
            >
              <FileSpreadsheet className="h-4 w-4" />
              <span>Generar Reportes & PDF</span>
            </button>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-[#0A2958]">
            <Filter className="h-4 w-4 text-[#E60000]" />
            <span>Filtros Dinámicos del Dashboard:</span>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
            {/* Sede */}
            <select
              value={selectedSede}
              onChange={(e) => setSelectedSede(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
            >
              <option value="TODAS">Todas las Sedes</option>
              {INITIAL_SEDES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.codigo}
                </option>
              ))}
            </select>

            {/* Módulo */}
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
            >
              <option value="TODOS">Todos los Módulos</option>
              {SST_MODULES.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>

            {/* Estado */}
            <select
              value={selectedEstado}
              onChange={(e) => setSelectedEstado(e.target.value)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
            >
              <option value="TODOS">Todos los Estados</option>
              <option value="CERRADO">Cerrados</option>
              <option value="EN_PROCESO">En Proceso</option>
              <option value="PENDIENTE">Pendientes</option>
              <option value="BORRADOR">Borrador</option>
            </select>

            {/* Date Range */}
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value as any)}
              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
            >
              <option value="all">Todo el Histórico</option>
              <option value="quarter">Último Trimestre</option>
              <option value="month">Este Mes</option>
            </select>

            {(selectedSede !== 'TODAS' ||
              selectedModule !== 'TODOS' ||
              selectedEstado !== 'TODOS' ||
              dateRange !== 'all') && (
              <button
                onClick={() => {
                  setSelectedSede('TODAS');
                  setSelectedModule('TODOS');
                  setSelectedEstado('TODOS');
                  setDateRange('all');
                }}
                className="text-xs font-bold text-[#E60000] hover:underline px-2 py-1"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {/* Workers Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Trabajadores Activos
              </p>
              <h3 className="mt-1 text-2xl font-black text-[#0A2958]">
                {stats.activeWorkers}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-[#0A2958]">
              <Users className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
            <span>Inactivos registrados:</span>
            <span className="font-bold text-slate-700">{stats.inactiveWorkers}</span>
          </div>
        </div>

        {/* SST Records Total Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Registros SST Filtrados
              </p>
              <h3 className="mt-1 text-2xl font-black text-[#0A2958]">
                {filteredRecords.length}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
              <ClipboardList className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
            <span>Tasa de resolución:</span>
            <span className="font-bold text-emerald-600 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {complianceRate}%
            </span>
          </div>
        </div>

        {/* Pending Alerts Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Registros Pendientes
              </p>
              <h3 className="mt-1 text-2xl font-black text-[#E60000]">
                {pendingFiltered.length}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-50 text-[#E60000]">
              <AlertTriangle className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
            <span>En proceso de atención:</span>
            <span className="font-bold text-blue-600">{inProcessFiltered.length}</span>
          </div>
        </div>

        {/* Closed / Completed Card */}
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Inspecciones Cerradas
              </p>
              <h3 className="mt-1 text-2xl font-black text-emerald-600">
                {closedFiltered.length}
              </h3>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="h-6 w-6" />
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-500">
            <span>Entregas de EPP:</span>
            <span className="font-bold text-slate-700">{eppDeliveriesCount}</span>
          </div>
        </div>
      </div>

      {/* 8 Official SST Modules in requested card style */}
      <section aria-labelledby="modulos-sst-heading" className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 id="modulos-sst-heading" className="text-lg font-black text-[#0A2958] flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-[#E60000]" />
              Módulos Operacionales de Seguridad y Salud en el Trabajo
            </h2>
            <p className="text-xs text-slate-500">
              Selecciona el proceso para gestionar inspecciones, registros y formatos SST
            </p>
          </div>
          <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-lg">
            8 Módulos Oficiales
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {SST_MODULES.map((m) => {
            const recordsCount = records.filter((r) => r.menuId === m.id).length;
            return (
              <ModuleCard
                key={m.id}
                module={m}
                recordsCount={recordsCount}
                onAccess={(modId, subId) => onNavigateToModule(modId, subId)}
                onOpenSubmenuPicker={(mod) => setSelectedPickerModule(mod)}
              />
            );
          })}
        </div>
      </section>

      {/* Sede Indicators */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-base font-bold text-[#0A2958] flex items-center gap-2">
              <Building2 className="h-4 w-4 text-[#E60000]" />
              Registros y Actividad por Sede
            </h2>
            <p className="text-xs text-slate-500">Distribución de registros en las 5 sedes operativas de MG Consultores</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {INITIAL_SEDES.map((sede) => {
            const count = records.filter((r) => r.sedeId === sede.id).length;
            const pendingCount = records.filter((r) => r.sedeId === sede.id && r.estado === 'PENDIENTE').length;
            const maxRecords = Math.max(...INITIAL_SEDES.map((s) => records.filter((r) => r.sedeId === s.id).length), 1);
            const percentage = Math.round((count / maxRecords) * 100);

            return (
              <div key={sede.id} className="rounded-xl border border-slate-100 bg-slate-50/70 p-3.5 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between text-xs mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-[#0A2958] bg-white border border-slate-200 px-2 py-0.5 rounded">
                      {sede.codigo}
                    </span>
                  </div>
                  <span className="font-bold text-slate-800">{count} reg.</span>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-500 mb-1.5">
                  <span>{sede.ciudad}</span>
                  {pendingCount > 0 ? (
                    <span className="font-bold text-red-600 bg-red-50 px-1.5 py-0.2 rounded border border-red-200">
                      {pendingCount} pend.
                    </span>
                  ) : (
                    <span className="text-emerald-600 font-semibold">Al día</span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#0A2958] to-[#E60000] transition-all duration-500"
                    style={{ width: `${Math.max(percentage, 5)}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Submenu Picker Modal */}
      <SubmenuPickerModal
        module={selectedPickerModule}
        isOpen={Boolean(selectedPickerModule)}
        onClose={() => setSelectedPickerModule(null)}
        onSelectSubmenu={(modId, subId) => onNavigateToModule(modId, subId)}
      />

      {/* Recent SST Records Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <div>
            <h2 className="text-base font-bold text-[#0A2958]">
              Registros SST Recientes
            </h2>
            <p className="text-xs text-slate-500">Últimas inspecciones y actividades registradas</p>
          </div>
          <button
            onClick={onNavigateToReports}
            className="text-xs font-bold text-[#0A2958] hover:text-[#E60000] hover:underline"
          >
            Ver todos los registros ➔
          </button>
        </div>

        {filteredRecords.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <ClipboardList className="mx-auto h-12 w-12 text-slate-300 mb-2" />
            <p className="text-sm font-semibold">No se encontraron registros con los filtros seleccionados.</p>
            <p className="text-xs text-slate-600 mt-1">Crea un nuevo registro para iniciar la trazabilidad.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs" aria-label="Tabla de registros SST recientes">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider">
                <tr>
                  <th scope="col" className="px-4 py-3">Registro</th>
                  <th scope="col" className="px-4 py-3">Módulo / Submódulo</th>
                  <th scope="col" className="px-4 py-3">Sede & Área</th>
                  <th scope="col" className="px-4 py-3">Fecha</th>
                  <th scope="col" className="px-4 py-3">Trabajador / Responsable</th>
                  <th scope="col" className="px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecords.slice(0, 7).map((rec) => (
                  <tr
                    key={rec.id}
                    onClick={() => onNavigateToModule(rec.menuId, rec.subMenuId)}
                    className="hover:bg-slate-50/80 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-bold text-[#0A2958]">
                      {rec.numeroRegistro}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">{rec.moduloNombre}</div>
                      <div className="text-[11px] text-slate-500">{rec.subModuloNombre}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-[#0A2958] bg-slate-100 px-1.5 py-0.5 rounded mr-1">
                        {rec.sedeId}
                      </span>
                      <span className="text-slate-600">{rec.area}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">
                      {rec.fecha}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-800">
                        {rec.nombreTrabajador || rec.responsableRegistro}
                      </div>
                      {rec.cedulaTrabajador && (
                        <div className="text-[11px] text-slate-600">
                          C.C. {rec.cedulaTrabajador}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-bold ${getStatusBadge(
                          rec.estado
                        )}`}
                      >
                        {rec.estado}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
