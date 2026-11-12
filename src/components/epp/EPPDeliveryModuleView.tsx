import React, { useState, useEffect } from 'react';
import {
  Shield,
  Plus,
  Search,
  FileDown,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  DollarSign,
  Building2,
  Package,
  Layers,
  FileSpreadsheet,
  ExternalLink,
  Camera,
  PenTool,
} from 'lucide-react';
import { EntregaEPPMGRecord, formatCOP } from '../../types/epp';
import { storageService } from '../../services/storageService';
import { exportService } from '../../services/exportService';
import { googleDriveService, TARGET_ENTREGA_EPP_SPREADSHEET } from '../../services/googleDriveService';
import { useAuth } from '../../context/AuthContext';
import { EPPDeliveryFormModal } from './EPPDeliveryFormModal';

export const EPPDeliveryModuleView: React.FC = () => {
  const { user } = useAuth();
  const sedes = storageService.getSedes();

  // Selected filters
  const [selectedSede, setSelectedSede] = useState<string>(
    user?.role === 'admin' ? 'TODAS' : user?.siteId || 'MG-MG'
  );
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEstado, setSelectedEstado] = useState<string>('TODOS');
  const [selectedTipo, setSelectedTipo] = useState<string>('TODOS');

  // Data state
  const [deliveries, setDeliveries] = useState<EntregaEPPMGRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<EntregaEPPMGRecord | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Detail inspection modal & photo zoom modal
  const [inspectDelivery, setInspectDelivery] = useState<EntregaEPPMGRecord | null>(null);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  // Sync sede if user changes or mounts
  useEffect(() => {
    if (user && user.role !== 'admin' && user.siteId) {
      setSelectedSede(user.siteId);
    }
  }, [user]);

  // Load deliveries
  const loadDeliveries = () => {
    const list = storageService.getEntregaEPPRecords();
    setDeliveries(list);
  };

  useEffect(() => {
    loadDeliveries();

    const handleDataChange = () => {
      loadDeliveries();
    };

    window.addEventListener('mg-sst-data-change', handleDataChange);
    return () => window.removeEventListener('mg-sst-data-change', handleDataChange);
  }, []);

  // Filter deliveries according to user role, sede, and search
  const filteredDeliveries = deliveries.filter((item) => {
    // Sede restriction
    if (user?.role !== 'admin') {
      if (item.Sede !== user?.siteId) return false;
    } else {
      if (selectedSede !== 'TODAS' && item.Sede !== selectedSede) return false;
    }

    // Status filter
    if (selectedEstado !== 'TODOS' && item.Estado !== selectedEstado) return false;

    // Tipo entrega filter
    if (selectedTipo !== 'TODOS' && item.Tipo_Entrega !== selectedTipo) return false;

    // Search query across 19 fields
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matches =
        (item.Id_Epp && item.Id_Epp.toLowerCase().includes(q)) ||
        (item.Nombre && item.Nombre.toLowerCase().includes(q)) ||
        (item.Cédula && item.Cédula.toLowerCase().includes(q)) ||
        (item.Labor && item.Labor.toLowerCase().includes(q)) ||
        (item.Area && item.Area.toLowerCase().includes(q)) ||
        (item.Supervisor && item.Supervisor.toLowerCase().includes(q)) ||
        (item.Código_Epp && item.Código_Epp.toLowerCase().includes(q)) ||
        (item.Epp && item.Epp.toLowerCase().includes(q));
      if (!matches) return false;
    }

    return true;
  });

  // Calculate KPIs
  const totalRegistros = filteredDeliveries.length;
  const entregadasFirmadas = filteredDeliveries.filter((d) => d.Estado === 'Entregado y Firmado').length;
  const pendientesFirma = filteredDeliveries.filter((d) => d.Estado === 'Pendiente de Firma').length;
  const costoTotalEPP = filteredDeliveries.reduce((sum, d) => sum + (Number(d.Costo) || 0), 0);

  const handleCreateNew = () => {
    setEditingDelivery(null);
    setIsModalOpen(true);
  };

  const handleEdit = (delivery: EntregaEPPMGRecord) => {
    setEditingDelivery(delivery);
    setIsModalOpen(true);
  };

  const handleDelete = (delivery: EntregaEPPMGRecord) => {
    if (window.confirm(`¿Está seguro de eliminar el registro ${delivery.Id_Epp} de ${delivery.Nombre}?`)) {
      if (user) {
        storageService.deleteEntregaEPPRecord(delivery.id || delivery.Id_Epp, {
          email: user.email,
          name: user.displayName,
        });
        showNotification('success', `Registro ${delivery.Id_Epp} eliminado de la hoja Entrega Epp´s MG.`);
      }
    }
  };

  const [isSyncingDrive, setIsSyncingDrive] = useState(false);

  const handleSave = (record: EntregaEPPMGRecord) => {
    if (user) {
      storageService.saveEntregaEPPRecord(record, { email: user.email, name: user.displayName });
      setIsModalOpen(false);
      showNotification('success', `Registro ${record.Id_Epp} guardado en la hoja Entrega Epp´s MG.`);
    }
  };

  const handleSyncDrive = async () => {
    setIsSyncingDrive(true);
    try {
      const result = await googleDriveService.fetchDeliveriesFromDrive();
      if (result.success && result.records.length > 0) {
        // Merge with existing local records
        result.records.forEach((rec) => {
          storageService.saveEntregaEPPRecord(rec, {
            email: user?.email || 'admin@mgconsultores.com',
            name: 'Google Drive Sync',
          });
        });
        loadDeliveries();
        showNotification('success', result.message);
      } else {
        showNotification(result.success ? 'success' : 'error', result.message);
      }
    } catch (err: any) {
      showNotification('error', `Error al conectar con Drive: ${err.message}`);
    } finally {
      setIsSyncingDrive(false);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleExportPDF = (delivery: EntregaEPPMGRecord) => {
    exportService.generateEPPDeliveryPDF(delivery);
    showNotification('success', `Generando Acta oficial en PDF para ${delivery.Nombre}...`);
  };

  const handleExportExcel = () => {
    exportService.exportEntregaEPPMGToExcel(filteredDeliveries, 'Entrega_Epps_MG');
    showNotification('success', 'Archivo Excel exportado con la hoja Entrega Epp´s MG y sus 19 campos.');
  };

  const handleExportCSV = () => {
    const headers = [
      'Id_Epp',
      'Fecha',
      'Año',
      'Mes',
      'Sede',
      'Cédula',
      'Nombre',
      'Labor',
      'Area',
      'Supervisor',
      'Código Epp',
      'Epp',
      'Tipo_Entrega',
      'Costo',
      'Estado',
      'Foto_Entrega',
      'Firma_Trabajador',
      'Responsable SST',
      'Firma SST',
    ];

    const csvRows = filteredDeliveries.map((d) =>
      [
        `"${d.Id_Epp}"`,
        `"${d.Fecha}"`,
        `"${d.Año}"`,
        `"${d.Mes}"`,
        `"${d.Sede}"`,
        `"${d.Cédula}"`,
        `"${d.Nombre}"`,
        `"${d.Labor}"`,
        `"${d.Area}"`,
        `"${d.Supervisor}"`,
        `"${d.Código_Epp}"`,
        `"${d.Epp}"`,
        `"${d.Tipo_Entrega}"`,
        d.Costo,
        `"${d.Estado}"`,
        `"${d.Foto_Entrega ? 'Foto Adjunta' : 'Sin Foto'}"`,
        `"${d.Firma_Trabajador ? 'Firmado' : 'Pendiente'}"`,
        `"${d.Responsable_SST}"`,
        `"${d.Firma_SST ? 'Firmado' : 'Pendiente'}"`,
      ].join(',')
    );

    const csvContent = [headers.join(','), ...csvRows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Entrega_Epps_MG_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('success', 'Archivo CSV de Entrega Epp´s MG exportado exitosamente.');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#0A2958] bg-slate-100 px-2.5 py-0.5 rounded-full">
              Módulo: Personal
            </span>
            <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Hoja Oficial: Entrega Epp´s MG
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#0A2958] flex items-center gap-2.5">
            <Shield className="w-7 h-7 text-[#E60000]" />
            Entrega Epp´s MG
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Formulario y hoja de registro oficial con los 19 campos reglamentarios y costos vinculados a la hoja <span className="font-bold text-slate-700">Epp´s</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <a
            href={TARGET_ENTREGA_EPP_SPREADSHEET.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2.5 bg-blue-50 hover:bg-blue-100 text-[#0A2958] rounded-xl text-xs font-bold transition-colors border border-blue-200 shadow-xs"
            title="Abrir hoja de cálculo oficial en Google Drive"
          >
            <ExternalLink className="w-4 h-4 text-blue-600" />
            <span>Hoja en Drive</span>
          </a>

          <button
            onClick={handleSyncDrive}
            disabled={isSyncingDrive}
            className="flex items-center gap-2 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors border border-slate-300 shadow-xs disabled:opacity-60"
            title="Sincronizar registros con Google Drive"
          >
            {isSyncingDrive ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-slate-700 border-t-transparent rounded-full animate-spin" />
                <span>Sincronizando...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Sincronizar Drive</span>
              </>
            )}
          </button>

          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold transition-colors border border-emerald-300 shadow-xs"
            title="Exportar archivo Excel (.xlsx) con hoja 'Entrega Epp´s MG'"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Exportar Excel</span>
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors border border-slate-300"
            title="Exportar archivo CSV con los 19 campos"
          >
            <FileDown className="w-4 h-4 text-slate-600" />
            <span>CSV</span>
          </button>

          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#E60000] to-[#b30000] hover:from-[#d10000] hover:to-[#990000] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Entrega Epp´s MG</span>
          </button>
        </div>
      </div>

      {/* Notification banner */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-semibold animate-in fade-in duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
          <span>{notification.message}</span>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Total Registros */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Total Registros (Entrega Epp´s MG)</span>
            <div className="text-2xl font-black text-[#0A2958] mt-1">{totalRegistros}</div>
            <span className="text-[11px] text-slate-400">
              {user?.role === 'admin' && selectedSede === 'TODAS' ? 'Todas las sedes' : `Sede ${selectedSede}`}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0A2958]">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Costo Total Invertido */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Costo Total Suministrado</span>
            <div className="text-xl sm:text-2xl font-black text-emerald-700 mt-1">{formatCOP(costoTotalEPP)}</div>
            <span className="text-[11px] text-emerald-600 font-medium">Tarifas hoja Epp´s</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Entregados y Firmados */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Entregados & Firmados</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">{entregadasFirmadas}</div>
            <span className="text-[11px] text-slate-400">
              {totalRegistros > 0 ? `${Math.round((entregadasFirmadas / totalRegistros) * 100)}% de actas completas` : '0%'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Pendientes de Firma */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Pendientes de Firma</span>
            <div className="text-2xl font-black text-amber-600 mt-1">{pendientesFirma}</div>
            <span className="text-[11px] text-amber-600 font-medium">Requieren gestión</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600">
            <Clock className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Filters and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Search Input */}
          <div className="md:col-span-5 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por Id_Epp, trabajador, cédula, labor, área o EPP..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
            />
          </div>

          {/* Sede Selector */}
          <div className="md:col-span-3">
            {user?.role === 'admin' ? (
              <select
                value={selectedSede}
                onChange={(e) => setSelectedSede(e.target.value)}
                className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
              >
                <option value="TODAS">🏢 Todas las Sedes (Admin General)</option>
                {sedes.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.id} - {s.nombre}
                  </option>
                ))}
              </select>
            ) : (
              <div className="flex items-center gap-2 px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-700 font-semibold">
                <Building2 className="w-4 h-4 text-[#0A2958]" />
                <span>Sede: {user?.siteId} (Fijada)</span>
              </div>
            )}
          </div>

          {/* Estado Selector */}
          <div className="md:col-span-2">
            <select
              value={selectedEstado}
              onChange={(e) => setSelectedEstado(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
            >
              <option value="TODOS">Todos los Estados</option>
              <option value="Entregado y Firmado">Entregado y Firmado</option>
              <option value="Pendiente de Firma">Pendiente de Firma</option>
              <option value="Borrador">Borrador</option>
            </select>
          </div>

          {/* Tipo Entrega Selector */}
          <div className="md:col-span-2">
            <select
              value={selectedTipo}
              onChange={(e) => setSelectedTipo(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
            >
              <option value="TODOS">Todos los Tipos</option>
              <option value="Dotación Periódica">Dotación Periódica</option>
              <option value="Ingreso Nuevo">Ingreso Nuevo</option>
              <option value="Reposición por Desgaste">Reposición Desgaste</option>
              <option value="Cambio por Daño">Cambio por Daño</option>
              <option value="Pérdida o Hurto">Pérdida o Hurto</option>
              <option value="Reposición por Accidente">Accidente</option>
            </select>
          </div>
        </div>

        {/* Applied filters tags */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div>
            Mostrando <span className="font-bold text-slate-800">{filteredDeliveries.length}</span> registros en la hoja <span className="font-semibold text-[#0A2958]">Entrega Epp´s MG</span>
            {selectedSede !== 'TODAS' && ` (Sede ${selectedSede})`}
          </div>
          {(searchQuery || selectedEstado !== 'TODOS' || selectedTipo !== 'TODOS' || (user?.role === 'admin' && selectedSede !== 'TODAS')) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedEstado('TODOS');
                setSelectedTipo('TODOS');
                if (user?.role === 'admin') setSelectedSede('TODAS');
              }}
              className="text-[#E60000] hover:underline text-[11px] font-semibold cursor-pointer"
            >
              Limpiar todos los filtros
            </button>
          )}
        </div>
      </div>

      {/* Main Table: Conforming to the 19 Fields */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredDeliveries.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Shield className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No se encontraron registros en Entrega Epp´s MG</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              No hay registros que coincidan con los filtros seleccionados. Puede registrar uno haciendo clic en "Nueva Entrega Epp´s MG".
            </p>
            <button
              onClick={handleCreateNew}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#0A2958] text-white rounded-xl text-xs font-semibold hover:bg-[#123e80] transition-colors cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Diligenciar Primer Formulario</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0A2958] text-white uppercase text-[10px] font-bold tracking-wider">
                <tr>
                  <th className="px-3.5 py-3">Id_Epp / Fecha</th>
                  <th className="px-3 py-3">Sede</th>
                  <th className="px-3.5 py-3">Trabajador (Cédula & Nombre)</th>
                  <th className="px-3 py-3">Labor / Area</th>
                  <th className="px-3.5 py-3">Elemento (Código Epp & Epp)</th>
                  <th className="px-3 py-3">Tipo Entrega</th>
                  <th className="px-3 py-3 text-right">Costo (Epp´s)</th>
                  <th className="px-3 py-3 text-center">Estado</th>
                  <th className="px-3 py-3 text-center">Foto / Firmas</th>
                  <th className="px-3.5 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredDeliveries.map((delivery) => (
                  <tr key={delivery.id || delivery.Id_Epp} className="hover:bg-slate-50 transition-colors">
                    {/* 1. Id_Epp & 2. Fecha (Año, Mes) */}
                    <td className="px-3.5 py-3">
                      <div className="font-mono font-bold text-[#0A2958]">{delivery.Id_Epp}</div>
                      <div className="text-[11px] text-slate-500">
                        {delivery.Fecha} <span className="text-slate-400">({delivery.Mes})</span>
                      </div>
                    </td>

                    {/* 5. Sede */}
                    <td className="px-3 py-3">
                      <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-800 font-bold rounded-lg text-[11px] border border-slate-200">
                        {delivery.Sede}
                      </span>
                    </td>

                    {/* 6. Cédula & 7. Nombre */}
                    <td className="px-3.5 py-3">
                      <div className="font-bold text-slate-900">{delivery.Nombre}</div>
                      <div className="text-[11px] text-slate-500 font-mono">C.C. {delivery.Cédula}</div>
                    </td>

                    {/* 8. Labor & 9. Area & 10. Supervisor */}
                    <td className="px-3 py-3">
                      <div className="text-slate-800 font-medium">{delivery.Labor}</div>
                      <div className="text-[11px] text-slate-500">{delivery.Area}</div>
                      <div className="text-[10px] text-slate-400 italic">Sup: {delivery.Supervisor}</div>
                    </td>

                    {/* 11. Código Epp & 12. Epp */}
                    <td className="px-3.5 py-3 max-w-xs">
                      <span className="inline-block font-mono text-[10px] font-bold text-[#0A2958] bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 mb-0.5">
                        {delivery.Código_Epp}
                      </span>
                      <div className="font-medium text-slate-900 truncate" title={delivery.Epp}>
                        {delivery.Epp}
                      </div>
                    </td>

                    {/* 13. Tipo_Entrega */}
                    <td className="px-3 py-3">
                      <span className="text-[11px] text-slate-700 font-medium">
                        {delivery.Tipo_Entrega}
                      </span>
                    </td>

                    {/* 14. Costo */}
                    <td className="px-3 py-3 text-right">
                      <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        {formatCOP(delivery.Costo)}
                      </span>
                    </td>

                    {/* 15. Estado */}
                    <td className="px-3 py-3 text-center">
                      {delivery.Estado === 'Entregado y Firmado' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Firmado
                        </span>
                      ) : delivery.Estado === 'Pendiente de Firma' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Pendiente
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                          Borrador
                        </span>
                      )}
                    </td>

                    {/* 16. Foto_Entrega & 17, 19. Firmas */}
                    <td className="px-3 py-3 text-center">
                      <div className="flex items-center justify-center gap-2">
                        {delivery.Foto_Entrega ? (
                          <button
                            onClick={() => setPreviewPhoto(delivery.Foto_Entrega || null)}
                            className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
                            title="Ver Foto_Entrega"
                          >
                            <Camera className="w-4 h-4 text-blue-600" />
                          </button>
                        ) : (
                          <span className="text-[10px] text-slate-300">-</span>
                        )}

                        <span
                          className={`inline-flex p-1 rounded text-[10px] ${
                            delivery.Firma_Trabajador && delivery.Firma_SST
                              ? 'bg-emerald-50 text-emerald-700 font-bold'
                              : 'bg-slate-50 text-slate-400'
                          }`}
                          title={`Firma Trabajador: ${delivery.Firma_Trabajador ? 'Si' : 'No'} | Firma SST: ${delivery.Firma_SST ? 'Si' : 'No'}`}
                        >
                          <PenTool className="w-3.5 h-3.5" />
                        </span>
                      </div>
                    </td>

                    {/* Acciones */}
                    <td className="px-3.5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleExportPDF(delivery)}
                          className="p-1.5 text-blue-600 hover:text-white hover:bg-[#0A2958] rounded-lg transition-colors cursor-pointer"
                          title="Descargar Acta Oficial en PDF (Formato Res. 2400)"
                        >
                          <FileDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setInspectDelivery(delivery)}
                          className="p-1.5 text-slate-600 hover:text-[#0A2958] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Ver los 19 campos completos"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(delivery)}
                          className="p-1.5 text-slate-600 hover:text-[#0A2958] hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                          title="Editar registro"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(delivery)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="Eliminar registro"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Detail Inspection Modal (Shows all 19 Fields clearly) */}
      {inspectDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#0A2958] text-white p-5 flex items-center justify-between border-b-2 border-[#E60000]">
              <div>
                <span className="text-xs uppercase font-mono text-emerald-300 font-bold">
                  Hoja: Entrega Epp´s MG • {inspectDelivery.Id_Epp}
                </span>
                <h3 className="text-lg font-bold text-white mt-0.5">
                  Detalle Oficial de los 19 Campos
                </h3>
              </div>
              <button
                onClick={() => setInspectDelivery(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Grid with 19 fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">1. Id_Epp:</span>
                  <span className="font-mono font-bold text-slate-900">{inspectDelivery.Id_Epp}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">2, 3, 4. Fecha / Periodo:</span>
                  <span className="font-semibold text-slate-900">
                    {inspectDelivery.Fecha} (Año: {inspectDelivery.Año} | Mes: {inspectDelivery.Mes})
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">5. Sede:</span>
                  <span className="font-bold text-[#0A2958]">{inspectDelivery.Sede}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">6, 7. Trabajador Receptor:</span>
                  <span className="font-bold text-slate-900">{inspectDelivery.Nombre}</span>
                  <span className="text-slate-500 block font-mono text-[11px]">C.C. {inspectDelivery.Cédula}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">8, 9. Labor y Area:</span>
                  <span className="font-semibold text-slate-800">{inspectDelivery.Labor}</span>
                  <span className="text-slate-500 block text-[11px]">{inspectDelivery.Area}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">10. Supervisor:</span>
                  <span className="font-semibold text-slate-800">{inspectDelivery.Supervisor}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">11, 12. Código Epp & Epp:</span>
                  <span className="font-mono font-bold text-[#0A2958] block">{inspectDelivery.Código_Epp}</span>
                  <span className="font-medium text-slate-800">{inspectDelivery.Epp}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">13. Tipo_Entrega:</span>
                  <span className="font-semibold text-slate-800">{inspectDelivery.Tipo_Entrega}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">14. Costo (Hoja Epp´s):</span>
                  <span className="font-mono font-bold text-emerald-700 text-sm">
                    {formatCOP(inspectDelivery.Costo)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">15. Estado:</span>
                  <span className="inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-100 text-emerald-800">
                    {inspectDelivery.Estado}
                  </span>
                </div>
                <div className="md:col-span-2">
                  <span className="text-slate-500 text-[10px] uppercase font-bold block">18. Responsable SST:</span>
                  <span className="font-semibold text-slate-800">{inspectDelivery.Responsable_SST}</span>
                </div>
              </div>

              {/* 16. Foto_Entrega & Digital Signatures (17, 19) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {/* Foto_Entrega */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase mb-2">16. Foto_Entrega</span>
                  {inspectDelivery.Foto_Entrega ? (
                    <img
                      src={inspectDelivery.Foto_Entrega}
                      alt="Foto Entrega"
                      className="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-90"
                      onClick={() => setPreviewPhoto(inspectDelivery.Foto_Entrega || null)}
                    />
                  ) : (
                    <span className="text-slate-400 text-[11px] italic">Sin foto adjunta</span>
                  )}
                </div>

                {/* 17. Firma_Trabajador */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase mb-2">17. Firma_Trabajador</span>
                  {inspectDelivery.Firma_Trabajador ? (
                    <img
                      src={inspectDelivery.Firma_Trabajador}
                      alt="Firma Trabajador"
                      className="w-full h-24 object-contain bg-white rounded-lg p-1 border border-slate-200"
                    />
                  ) : (
                    <span className="text-amber-600 text-[11px] font-medium">Pendiente de firma</span>
                  )}
                </div>

                {/* 19. Firma SST */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col items-center justify-center text-center">
                  <span className="text-[10px] font-bold text-slate-500 uppercase mb-2">19. Firma SST</span>
                  {inspectDelivery.Firma_SST ? (
                    <img
                      src={inspectDelivery.Firma_SST}
                      alt="Firma SST"
                      className="w-full h-24 object-contain bg-white rounded-lg p-1 border border-slate-200"
                    />
                  ) : (
                    <span className="text-amber-600 text-[11px] font-medium">Pendiente de firma</span>
                  )}
                </div>
              </div>

              {inspectDelivery.observaciones && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-[10px] font-bold text-slate-500 uppercase block mb-1">Observaciones:</span>
                  <p className="text-slate-700 italic">{inspectDelivery.observaciones}</p>
                </div>
              )}
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
              <button
                onClick={() => setInspectDelivery(null)}
                className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100"
              >
                Cerrar
              </button>
              <button
                onClick={() => handleExportPDF(inspectDelivery)}
                className="flex items-center gap-2 px-4 py-2 bg-[#0A2958] hover:bg-[#123e80] text-white rounded-xl text-xs font-bold shadow-xs transition-colors"
              >
                <FileDown className="w-4 h-4" />
                <span>Descargar Acta PDF</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Photo Preview Modal */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs"
          onClick={() => setPreviewPhoto(null)}
        >
          <div className="relative max-w-2xl max-h-[90vh] bg-white rounded-2xl overflow-hidden p-2">
            <img
              src={previewPhoto}
              alt="Evidencia Foto Entrega"
              className="max-h-[80vh] w-auto object-contain rounded-xl"
            />
            <div className="p-2 text-center text-xs font-bold text-[#0A2958]">
              Foto_Entrega - Evidencia de Cumplimiento SG-SST
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      <EPPDeliveryFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        editingDelivery={editingDelivery}
      />
    </div>
  );
};
