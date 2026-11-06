import React, { useState, useMemo } from 'react';
import {
  FileSpreadsheet,
  Download,
  Filter,
  Calendar,
  Building2,
  FileText,
  Search,
  CheckCircle,
  Eye,
} from 'lucide-react';
import { useSST } from '../../context/SSTContext';
import { useAuth } from '../../context/AuthContext';
import { INITIAL_SEDES, SST_MODULES } from '../../config/constants';
import { exportService } from '../../services/exportService';
import { auditService } from '../../services/auditService';

export const ReportsView: React.FC = () => {
  const { records, workers } = useSST();
  const { user } = useAuth();

  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [selectedSede, setSelectedSede] = useState('TODAS');
  const [selectedModule, setSelectedModule] = useState('TODOS');
  const [selectedEstado, setSelectedEstado] = useState('TODOS');
  const [selectedWorker, setSelectedWorker] = useState('TODOS');
  const [search, setSearch] = useState('');

  const filteredRecords = useMemo(() => {
    return records.filter((r) => {
      if (user?.role === 'site_lead' && user.siteId !== 'TODAS' && r.sedeId !== user.siteId) {
        return false;
      }
      if (selectedSede !== 'TODAS' && r.sedeId !== selectedSede) return false;
      if (selectedModule !== 'TODOS' && r.menuId !== selectedModule) return false;
      if (selectedEstado !== 'TODOS' && r.estado !== selectedEstado) return false;
      if (selectedWorker !== 'TODOS' && r.cedulaTrabajador !== selectedWorker) return false;
      if (fechaInicio && r.fecha < fechaInicio) return false;
      if (fechaFin && r.fecha > fechaFin) return false;
      if (search.trim()) {
        const query = search.toLowerCase();
        const matches =
          r.numeroRegistro.toLowerCase().includes(query) ||
          r.moduloNombre.toLowerCase().includes(query) ||
          r.subModuloNombre.toLowerCase().includes(query) ||
          r.area.toLowerCase().includes(query) ||
          (r.nombreTrabajador && r.nombreTrabajador.toLowerCase().includes(query)) ||
          r.observaciones.toLowerCase().includes(query);
        if (!matches) return false;
      }
      return true;
    });
  }, [records, selectedSede, selectedModule, selectedEstado, selectedWorker, fechaInicio, fechaFin, search, user]);

  const handleExportExcel = () => {
    exportService.exportRecordsToExcel(filteredRecords, 'Reporte_Consolidado_SST_MG');
    auditService.log(
      user?.email || 'sistema',
      user?.displayName || 'Usuario',
      'DESCARGA_REPORTE',
      'Reportes',
      `rep-excel-${Date.now()}`,
      `Descarga de reporte Excel consolidado (${filteredRecords.length} registros)`
    );
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[#0A2958] p-1 text-white">
              <FileSpreadsheet className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-black text-[#0A2958] sm:text-2xl">
              Reportes y Exportaciones SST
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Generación y descarga de informes operacionales en Excel (.xlsx) y actas formales en PDF con membrete corporativo.
          </p>
        </div>

        {/* Global Export Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            disabled={filteredRecords.length === 0}
            className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold text-white shadow-xs transition-colors ${
              filteredRecords.length === 0
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-emerald-600 hover:bg-emerald-700'
            }`}
          >
            <Download className="h-4 w-4" />
            <span>Descargar en Excel ({filteredRecords.length})</span>
          </button>
        </div>
      </div>

      {/* Filter Matrix Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center gap-2 text-xs font-bold text-[#0A2958]">
          <Filter className="h-4 w-4 text-[#E60000]" />
          <span>Filtros Paramétricos de Consulta:</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          {/* Sede */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Sede:</label>
            <select
              value={selectedSede}
              onChange={(e) => setSelectedSede(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 font-semibold text-slate-800"
              disabled={user?.role === 'site_lead'}
            >
              <option value="TODAS">Todas las Sedes</option>
              {INITIAL_SEDES.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.codigo}
                </option>
              ))}
            </select>
          </div>

          {/* Módulo */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Módulo:</label>
            <select
              value={selectedModule}
              onChange={(e) => setSelectedModule(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 font-semibold text-slate-800"
            >
              <option value="TODOS">Todos los Módulos</option>
              {SST_MODULES.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.nombre}
                </option>
              ))}
            </select>
          </div>

          {/* Estado */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Estado:</label>
            <select
              value={selectedEstado}
              onChange={(e) => setSelectedEstado(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 font-semibold text-slate-800"
            >
              <option value="TODOS">Todos los Estados</option>
              <option value="CERRADO">Cerrado</option>
              <option value="EN_PROCESO">En Proceso</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="BORRADOR">Borrador</option>
            </select>
          </div>

          {/* Trabajador */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Trabajador:</label>
            <select
              value={selectedWorker}
              onChange={(e) => setSelectedWorker(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 font-semibold text-slate-800"
            >
              <option value="TODOS">Todos los trabajadores</option>
              {workers.map((w) => (
                <option key={w.cedula} value={w.cedula}>
                  {w.nombre} ({w.cedula})
                </option>
              ))}
            </select>
          </div>

          {/* Fecha Inicio */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Desde:</label>
            <input
              type="date"
              value={fechaInicio}
              onChange={(e) => setFechaInicio(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-800"
            />
          </div>

          {/* Fecha Fin */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Hasta:</label>
            <input
              type="date"
              value={fechaFin}
              onChange={(e) => setFechaFin(e.target.value)}
              className="w-full rounded-lg border border-slate-200 bg-slate-50 p-2 text-slate-800"
            />
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar por texto en observaciones, hallazgos, áreas o número de registro..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs font-medium focus:ring-2 focus:ring-[#0A2958]"
          />
        </div>
      </div>

      {/* Results Table */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-200 p-4">
          <span className="text-xs font-bold text-[#0A2958]">
            Registros encontrados ({filteredRecords.length})
          </span>
          <span className="text-[11px] text-slate-500">
            Resultados consolidados en tiempo real
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
              <tr>
                <th className="px-4 py-3">N° Registro</th>
                <th className="px-4 py-3">Módulo</th>
                <th className="px-4 py-3">Submódulo</th>
                <th className="px-4 py-3">Sede & Área</th>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Trabajador / Responsable</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3 text-right">PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-500">
                    No se encontraron registros coincidentes con los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono font-bold text-[#0A2958] whitespace-nowrap">
                      {r.numeroRegistro}
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{r.moduloNombre}</td>
                    <td className="px-4 py-3 text-slate-600">{r.subModuloNombre}</td>
                    <td className="px-4 py-3">
                      <span className="font-bold text-[#0A2958] bg-slate-100 px-1.5 py-0.5 rounded mr-1">
                        {r.sedeId}
                      </span>
                      {r.area}
                    </td>
                    <td className="px-4 py-3 text-slate-600 whitespace-nowrap">{r.fecha}</td>
                    <td className="px-4 py-3 text-slate-700">
                      {r.nombreTrabajador || r.responsableRegistro}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="text-[10px] font-bold bg-slate-100 text-slate-800 px-2 py-0.5 rounded border border-slate-200">
                        {r.estado}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right whitespace-nowrap">
                      <button
                        onClick={() => exportService.generateRecordPDF(r)}
                        className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[11px] font-bold text-[#0A2958] hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
                      >
                        <FileText className="h-3.5 w-3.5 text-[#E60000]" />
                        <span>PDF</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
