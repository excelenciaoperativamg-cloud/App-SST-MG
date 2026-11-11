import React, { useState, useEffect } from 'react';
import {
  Shield,
  Plus,
  Search,
  Filter,
  FileDown,
  Printer,
  Edit2,
  Trash2,
  CheckCircle2,
  Clock,
  User,
  Building2,
  Package,
  Layers,
  FileSpreadsheet,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import { EPPDeliveryRecord } from '../../types/epp';
import { storageService } from '../../services/storageService';
import { exportService } from '../../services/exportService';
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
  const [selectedMotivo, setSelectedMotivo] = useState<string>('TODOS');

  // Data state
  const [deliveries, setDeliveries] = useState<EPPDeliveryRecord[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingDelivery, setEditingDelivery] = useState<EPPDeliveryRecord | null>(null);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Detail inspection modal
  const [inspectDelivery, setInspectDelivery] = useState<EPPDeliveryRecord | null>(null);

  // Sync sede if user changes or mounts
  useEffect(() => {
    if (user && user.role !== 'admin' && user.siteId) {
      setSelectedSede(user.siteId);
    }
  }, [user]);

  // Load deliveries
  const loadDeliveries = () => {
    const list = storageService.getEPPDeliveries();
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
      if (item.sedeId !== user?.siteId) return false;
    } else {
      if (selectedSede !== 'TODAS' && item.sedeId !== selectedSede) return false;
    }

    // Status filter
    if (selectedEstado !== 'TODOS' && item.estado !== selectedEstado) return false;

    // Motivo filter
    if (selectedMotivo !== 'TODOS' && item.motivo !== selectedMotivo) return false;

    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matches =
        item.numeroActa.toLowerCase().includes(q) ||
        item.nombreTrabajador.toLowerCase().includes(q) ||
        item.cedulaTrabajador.toLowerCase().includes(q) ||
        item.area.toLowerCase().includes(q) ||
        item.supervisor.toLowerCase().includes(q) ||
        item.items.some((i) => i.nombre.toLowerCase().includes(q));
      if (!matches) return false;
    }

    return true;
  });

  // Calculate KPIs
  const totalEntregas = filteredDeliveries.length;
  const entregadasFirmadas = filteredDeliveries.filter((d) => d.estado === 'ENTREGADO_FIRMADO').length;
  const pendientesFirma = filteredDeliveries.filter((d) => d.estado === 'PENDIENTE_FIRMA').length;
  const totalItemsSuministrados = filteredDeliveries.reduce(
    (sum, d) => sum + d.items.reduce((iSum, item) => iSum + (item.cantidad || 1), 0),
    0
  );

  const handleCreateNew = () => {
    setEditingDelivery(null);
    setIsModalOpen(true);
  };

  const handleEdit = (delivery: EPPDeliveryRecord) => {
    setEditingDelivery(delivery);
    setIsModalOpen(true);
  };

  const handleDelete = (delivery: EPPDeliveryRecord) => {
    if (window.confirm(`¿Está seguro de eliminar el acta ${delivery.numeroActa} de ${delivery.nombreTrabajador}?`)) {
      if (user) {
        storageService.deleteEPPDelivery(delivery.id, { email: user.email, name: user.displayName });
        showNotification('success', `Acta ${delivery.numeroActa} eliminada satisfactoriamente.`);
      }
    }
  };

  const handleSave = (record: EPPDeliveryRecord) => {
    if (user) {
      storageService.saveEPPDelivery(record, { email: user.email, name: user.displayName });
      setIsModalOpen(false);
      showNotification('success', `Acta ${record.numeroActa} guardada exitosamente.`);
    }
  };

  const showNotification = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => {
      setNotification(null);
    }, 4000);
  };

  const handleExportPDF = (delivery: EPPDeliveryRecord) => {
    exportService.generateEPPDeliveryPDF(delivery);
    showNotification('success', `Generando Acta oficial en PDF para ${delivery.nombreTrabajador}...`);
  };

  const handleExportCSV = () => {
    const csvContent = [
      ['Numero Acta', 'Fecha', 'Sede', 'Cedula', 'Trabajador', 'Puesto', 'Area', 'Supervisor', 'Motivo', 'Total EPP', 'Estado'].join(','),
      ...filteredDeliveries.map((d) =>
        [
          `"${d.numeroActa}"`,
          `"${d.fecha}"`,
          `"${d.sedeId}"`,
          `"${d.cedulaTrabajador}"`,
          `"${d.nombreTrabajador}"`,
          `"${d.puestoTrabajador}"`,
          `"${d.area}"`,
          `"${d.supervisor}"`,
          `"${d.motivo}"`,
          d.items.reduce((acc, i) => acc + i.cantidad, 0),
          `"${d.estado}"`,
        ].join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Entregas_EPP_MG_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification('success', 'Archivo CSV exportado exitosamente.');
  };

  return (
    <div className="space-y-6">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0A2958] bg-slate-100 px-2.5 py-0.5 rounded-full">
              Módulo: Personal
            </span>
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Formulario Activo Oficial
            </span>
          </div>
          <h1 className="text-2xl font-black text-[#0A2958] flex items-center gap-2">
            <Shield className="w-7 h-7 text-[#E60000]" />
            Entrega de Dotación y EPP's
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Gestión y control de entrega de Elementos de Protección Personal con actas legales e inventario por trabajador
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors border border-slate-300"
            title="Exportar registros a CSV / Excel"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={handleCreateNew}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#E60000] to-[#b30000] hover:from-[#d10000] hover:to-[#990000] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Entrega de EPP</span>
          </button>
        </div>
      </div>

      {/* Notification banner */}
      {notification && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-medium animate-in fade-in duration-200 ${
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
        {/* Card 1: Total Deliveries */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Total Actas de Entrega</span>
            <div className="text-2xl font-black text-[#0A2958] mt-1">{totalEntregas}</div>
            <span className="text-[11px] text-slate-400">
              {user?.role === 'admin' && selectedSede === 'TODAS' ? 'Todas las sedes' : `Sede ${selectedSede}`}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0A2958]">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        {/* Card 2: Items Delivered */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Elementos Suministrados</span>
            <div className="text-2xl font-black text-[#0A2958] mt-1">{totalItemsSuministrados}</div>
            <span className="text-[11px] text-emerald-600 font-medium">EPP certificados</span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* Card 3: Signed & Delivered */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold text-slate-500 block">Entregados & Firmados</span>
            <div className="text-2xl font-black text-emerald-600 mt-1">{entregadasFirmadas}</div>
            <span className="text-[11px] text-slate-400">
              {totalEntregas > 0 ? `${Math.round((entregadasFirmadas / totalEntregas) * 100)}% de cumplimiento` : '0%'}
            </span>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
            <CheckCircle2 className="w-6 h-6" />
          </div>
        </div>

        {/* Card 4: Pending Signature */}
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
              placeholder="Buscar por acta, trabajador, cédula, cargo o elemento..."
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
                <option value="TODAS">🏢 Todas las Sedes (Admin)</option>
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

          {/* Status Selector */}
          <div className="md:col-span-2">
            <select
              value={selectedEstado}
              onChange={(e) => setSelectedEstado(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
            >
              <option value="TODOS">Todos los Estados</option>
              <option value="ENTREGADO_FIRMADO">Entregado y Firmado</option>
              <option value="PENDIENTE_FIRMA">Pendiente de Firma</option>
            </select>
          </div>

          {/* Motivo Selector */}
          <div className="md:col-span-2">
            <select
              value={selectedMotivo}
              onChange={(e) => setSelectedMotivo(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
            >
              <option value="TODOS">Todos los Motivos</option>
              <option value="DOTACION_PERIODICA">Dotación Periódica</option>
              <option value="INGRESO_NUEVO">Ingreso Nuevo</option>
              <option value="REPOSICION_DESGASTE">Reposición Desgaste</option>
              <option value="PERDIDA_ROBO">Pérdida o Hurto</option>
              <option value="REPOSICION_ACCIDENTE">Reposición Accidente</option>
            </select>
          </div>
        </div>

        {/* Applied filters tags */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
          <div>
            Mostrando <span className="font-bold text-slate-800">{filteredDeliveries.length}</span> actas de entrega
            {selectedSede !== 'TODAS' && ` en ${selectedSede}`}
          </div>
          {(searchQuery || selectedEstado !== 'TODOS' || selectedMotivo !== 'TODOS' || (user?.role === 'admin' && selectedSede !== 'TODAS')) && (
            <button
              onClick={() => {
                setSearchQuery('');
                setSelectedEstado('TODOS');
                setSelectedMotivo('TODOS');
                if (user?.role === 'admin') setSelectedSede('TODAS');
              }}
              className="text-[#E60000] hover:underline text-[11px] font-semibold"
            >
              Limpiar todos los filtros
            </button>
          )}
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {filteredDeliveries.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center mx-auto mb-4 text-slate-400">
              <Shield className="w-8 h-8" />
            </div>
            <h3 className="text-base font-bold text-slate-800">No se encontraron entregas de EPP</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              No hay registros que coincidan con los filtros seleccionados. Puede registrar una nueva entrega haciendo clic en "Nueva Entrega de EPP".
            </p>
            <button
              onClick={handleCreateNew}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[#0A2958] text-white rounded-xl text-xs font-semibold hover:bg-[#123e80] transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Registrar Primera Entrega</span>
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0A2958] text-white uppercase text-[11px] font-bold tracking-wider">
                <tr>
                  <th className="px-4 py-3">Acta / Fecha</th>
                  <th className="px-4 py-3">Sede</th>
                  <th className="px-4 py-3">Trabajador Receptor</th>
                  <th className="px-4 py-3">Cargo / Área</th>
                  <th className="px-4 py-3">Elementos Entregados</th>
                  <th className="px-4 py-3">Motivo</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredDeliveries.map((delivery) => (
                  <tr key={delivery.id} className="hover:bg-slate-50 transition-colors">
                    {/* Acta / Fecha */}
                    <td className="px-4 py-3">
                      <div className="font-mono font-bold text-[#0A2958]">{delivery.numeroActa}</div>
                      <div className="text-[11px] text-slate-500">{delivery.fecha}</div>
                    </td>

                    {/* Sede */}
                    <td className="px-4 py-3">
                      <span className="inline-block px-2.5 py-1 bg-slate-100 text-slate-800 font-bold rounded-lg text-[11px] border border-slate-200">
                        {delivery.sedeId}
                      </span>
                    </td>

                    {/* Trabajador */}
                    <td className="px-4 py-3">
                      <div className="font-bold text-slate-900">{delivery.nombreTrabajador}</div>
                      <div className="text-[11px] text-slate-500 font-mono">C.C. {delivery.cedulaTrabajador}</div>
                    </td>

                    {/* Cargo / Area */}
                    <td className="px-4 py-3">
                      <div className="text-slate-800 font-medium">{delivery.puestoTrabajador}</div>
                      <div className="text-[11px] text-slate-500">{delivery.area}</div>
                    </td>

                    {/* Items */}
                    <td className="px-4 py-3 max-w-xs">
                      <div className="flex flex-wrap gap-1">
                        {delivery.items.slice(0, 3).map((item, idx) => (
                          <span
                            key={idx}
                            className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-blue-50 text-[#0A2958] border border-blue-200"
                          >
                            {item.cantidad}x {item.nombre.length > 25 ? `${item.nombre.substring(0, 25)}...` : item.nombre}
                          </span>
                        ))}
                        {delivery.items.length > 3 && (
                          <button
                            onClick={() => setInspectDelivery(delivery)}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-slate-200 text-slate-700 hover:bg-slate-300"
                          >
                            +{delivery.items.length - 3} más
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Motivo */}
                    <td className="px-4 py-3">
                      <span className="text-[11px] text-slate-700 font-medium">
                        {delivery.motivo === 'DOTACION_PERIODICA' && 'Dotación Periódica'}
                        {delivery.motivo === 'INGRESO_NUEVO' && 'Ingreso Nuevo'}
                        {delivery.motivo === 'REPOSICION_DESGASTE' && 'Reposición Desgaste'}
                        {delivery.motivo === 'PERDIDA_ROBO' && 'Pérdida / Hurto'}
                        {delivery.motivo === 'REPOSICION_ACCIDENTE' && 'Accidente de Trabajo'}
                      </span>
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-3 text-center">
                      {delivery.estado === 'ENTREGADO_FIRMADO' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          Firmado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                          <Clock className="w-3 h-3 text-amber-600" />
                          Pendiente
                        </span>
                      )}
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleExportPDF(delivery)}
                          className="p-1.5 text-blue-600 hover:text-white hover:bg-[#0A2958] rounded-lg transition-colors"
                          title="Descargar Acta Oficial en PDF (Formato Res. 2400)"
                        >
                          <FileDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setInspectDelivery(delivery)}
                          className="p-1.5 text-slate-600 hover:text-[#0A2958] hover:bg-slate-100 rounded-lg transition-colors"
                          title="Ver detalle de entrega"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(delivery)}
                          className="p-1.5 text-slate-600 hover:text-[#0A2958] hover:bg-slate-100 rounded-lg transition-colors"
                          title="Editar acta"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(delivery)}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

      {/* Detail Inspection Modal */}
      {inspectDelivery && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-[#0A2958] text-white p-5 flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-mono text-white/80">{inspectDelivery.numeroActa}</span>
                <h3 className="text-lg font-bold text-white">Detalle de Entrega de EPP</h3>
              </div>
              <button
                onClick={() => setInspectDelivery(null)}
                className="text-white/80 hover:text-white p-1 rounded-lg hover:bg-white/10"
              >
                ✕
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
              {/* Worker & Header info */}
              <div className="grid grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <span className="text-slate-500 text-[11px] block">Trabajador:</span>
                  <span className="font-bold text-slate-900 text-sm">{inspectDelivery.nombreTrabajador}</span>
                  <span className="text-slate-500 block font-mono">C.C. {inspectDelivery.cedulaTrabajador}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Cargo y Área:</span>
                  <span className="font-semibold text-slate-800">{inspectDelivery.puestoTrabajador}</span>
                  <span className="text-slate-500 block">{inspectDelivery.area} | {inspectDelivery.sedeId}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Fecha de Entrega:</span>
                  <span className="font-semibold text-slate-800">{inspectDelivery.fecha}</span>
                </div>
                <div>
                  <span className="text-slate-500 text-[11px] block">Supervisor:</span>
                  <span className="font-semibold text-slate-800">{inspectDelivery.supervisor}</span>
                </div>
              </div>

              {/* Items Table */}
              <div>
                <h4 className="font-bold text-[#0A2958] mb-2 uppercase text-[11px]">
                  Elementos Entregados ({inspectDelivery.items.length})
                </h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 font-bold">
                      <tr>
                        <th className="px-3 py-2">Elemento</th>
                        <th className="px-3 py-2">Categoría</th>
                        <th className="px-3 py-2 text-center">Cant.</th>
                        <th className="px-3 py-2 text-center">Talla</th>
                        <th className="px-3 py-2 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {inspectDelivery.items.map((item, idx) => (
                        <tr key={idx}>
                          <td className="px-3 py-2 font-medium text-slate-900">{item.nombre}</td>
                          <td className="px-3 py-2 text-slate-600">{item.categoria}</td>
                          <td className="px-3 py-2 text-center font-bold text-[#0A2958]">{item.cantidad}</td>
                          <td className="px-3 py-2 text-center text-slate-600">{item.talla || 'Única'}</td>
                          <td className="px-3 py-2 text-center">
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              {item.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Observaciones */}
              {inspectDelivery.observaciones && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <span className="text-[11px] font-bold text-slate-600 block mb-1">Observaciones:</span>
                  <p className="text-slate-700 italic">{inspectDelivery.observaciones}</p>
                </div>
              )}

              {/* Legal commitment acknowledgement */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-[11px]">
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                <span>
                  Compromiso legal aceptado según Resoluciones del Sistema de Gestión de Seguridad y Salud en el Trabajo.
                </span>
              </div>
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
