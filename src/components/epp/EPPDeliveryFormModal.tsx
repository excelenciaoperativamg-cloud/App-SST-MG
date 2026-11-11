import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Plus,
  Trash2,
  UserCheck,
  Calendar,
  Building2,
  User,
  AlertCircle,
  FileCheck,
  CheckCircle2,
} from 'lucide-react';
import { EPPDeliveryRecord, EPPDeliveryItem, EPPDeliveryReason, EPP_CATALOG } from '../../types/epp';
import { PersonnelWorker } from '../../types';
import { storageService } from '../../services/storageService';
import { useAuth } from '../../context/AuthContext';

interface EPPDeliveryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (record: EPPDeliveryRecord) => void;
  editingDelivery?: EPPDeliveryRecord | null;
}

export const EPPDeliveryFormModal: React.FC<EPPDeliveryFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingDelivery,
}) => {
  const { user } = useAuth();
  const sedes = storageService.getSedes();
  const supervisores = storageService.getSupervisores();
  const workers = storageService.getWorkers();

  // Selected sede default
  const defaultSede = user?.role === 'admin' ? (editingDelivery?.sedeId || 'MG-MG') : (user?.siteId || 'MG-MG');

  // Form State
  const [numeroActa, setNumeroActa] = useState('');
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  const [sedeId, setSedeId] = useState(defaultSede);
  const [area, setArea] = useState('Operaciones');
  const [supervisor, setSupervisor] = useState(supervisores[0]?.supervisor || 'Supervisor SST');
  const [motivo, setMotivo] = useState<EPPDeliveryReason>('DOTACION_PERIODICA');
  const [estado, setEstado] = useState<'ENTREGADO_FIRMADO' | 'PENDIENTE_FIRMA' | 'BORRADOR'>('ENTREGADO_FIRMADO');
  const [observaciones, setObservaciones] = useState('');
  const [compromisoAceptado, setCompromisoAceptado] = useState(true);

  // Worker Selection State
  const [workerSearch, setWorkerSearch] = useState('');
  const [selectedWorker, setSelectedWorker] = useState<PersonnelWorker | null>(null);

  // Items State
  const [items, setItems] = useState<EPPDeliveryItem[]>([]);

  // Item to add picker state
  const [selectedCatalogItem, setSelectedCatalogItem] = useState(EPP_CATALOG[0].id);
  const [itemCantidad, setItemCantidad] = useState(1);
  const [itemTalla, setItemTalla] = useState('');
  const [itemEstado, setItemEstado] = useState<'NUEVO' | 'REPOSICION' | 'BUEN_ESTADO'>('NUEVO');

  // Validation Error
  const [error, setError] = useState<string | null>(null);

  // Initialize form
  useEffect(() => {
    if (editingDelivery) {
      setNumeroActa(editingDelivery.numeroActa);
      setFecha(editingDelivery.fecha);
      setSedeId(editingDelivery.sedeId);
      setArea(editingDelivery.area);
      setSupervisor(editingDelivery.supervisor);
      setMotivo(editingDelivery.motivo);
      setEstado(editingDelivery.estado);
      setObservaciones(editingDelivery.observaciones || '');
      setCompromisoAceptado(editingDelivery.compromisoAceptado);
      setItems(editingDelivery.items);

      // Find worker if in database
      const found = workers.find((w) => w.cedula === editingDelivery.cedulaTrabajador);
      if (found) {
        setSelectedWorker(found);
        setWorkerSearch(`${found.cedula} - ${found.nombre}`);
      } else {
        setSelectedWorker({
          id: editingDelivery.cedulaTrabajador,
          cedula: editingDelivery.cedulaTrabajador,
          nombre: editingDelivery.nombreTrabajador,
          puesto: editingDelivery.puestoTrabajador,
          sedeId: editingDelivery.sedeId,
          fechaNacimiento: '1990-01-01',
          edad: 30,
          genero: 'M',
          fechaIngreso: '2026-01-01',
          estado: 'ACTIVO',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        setWorkerSearch(`${editingDelivery.cedulaTrabajador} - ${editingDelivery.nombreTrabajador}`);
      }
    } else {
      // New delivery auto generation
      const sedeCode = (user?.role === 'admin' ? defaultSede : user?.siteId || 'MG').replace('MG-', '');
      const randomConsecutive = Math.floor(100 + Math.random() * 900);
      const generatedCode = `EPP-${sedeCode}-${new Date().getFullYear()}-${randomConsecutive}`;
      setNumeroActa(generatedCode);
      setFecha(new Date().toISOString().split('T')[0]);
      setSedeId(user?.role === 'admin' ? defaultSede : user?.siteId || 'MG-MG');
      setArea('Operaciones');
      setSupervisor(supervisores[0]?.supervisor || 'Supervisor SST');
      setMotivo('DOTACION_PERIODICA');
      setEstado('ENTREGADO_FIRMADO');
      setObservaciones('');
      setCompromisoAceptado(true);
      setSelectedWorker(null);
      setWorkerSearch('');

      // Default with standard basic items (Casco + Gafas)
      setItems([
        {
          itemId: 'epp-casco',
          categoria: 'CABEZA_ROSTRO',
          nombre: 'Casco de Seguridad Dieléctrico Tipo I Clase E',
          cantidad: 1,
          talla: 'Ajustable',
          estado: 'NUEVO',
        },
        {
          itemId: 'epp-gafas-claras',
          categoria: 'VISUAL',
          nombre: 'Gafas de Seguridad Antiempañante Lente Claro',
          cantidad: 1,
          talla: 'Estándar',
          estado: 'NUEVO',
        },
      ]);
    }
    setError(null);
  }, [editingDelivery, isOpen]);

  // Filter workers for search dropdown
  const filteredWorkers = workers
    .filter((w) => {
      // If user is site_lead, only show workers in their sede
      if (user?.role !== 'admin' && user?.siteId && w.sedeId !== user.siteId) {
        return false;
      }
      if (!workerSearch.trim()) return true;
      const q = workerSearch.toLowerCase();
      return (
        w.cedula.toLowerCase().includes(q) ||
        w.nombre.toLowerCase().includes(q) ||
        w.puesto.toLowerCase().includes(q)
      );
    })
    .slice(0, 8);

  const handleSelectWorker = (w: PersonnelWorker) => {
    setSelectedWorker(w);
    setWorkerSearch(`${w.cedula} - ${w.nombre}`);
    if (w.sedeId && user?.role === 'admin') {
      setSedeId(w.sedeId);
    }
  };

  const handleAddItem = () => {
    const catalogItem = EPP_CATALOG.find((c) => c.id === selectedCatalogItem);
    if (!catalogItem) return;

    // Check if already added
    const existingIndex = items.findIndex((i) => i.itemId === catalogItem.id);
    if (existingIndex >= 0) {
      // Increment quantity
      const updated = [...items];
      updated[existingIndex].cantidad += itemCantidad;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          itemId: catalogItem.id,
          categoria: catalogItem.categoria,
          nombre: catalogItem.nombre,
          cantidad: itemCantidad,
          talla: itemTalla || (catalogItem.tallasDisponibles ? catalogItem.tallasDisponibles[0] : 'Única'),
          estado: itemEstado,
        },
      ]);
    }
    setItemCantidad(1);
    setItemTalla('');
  };

  const handleRemoveItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedWorker) {
      setError('Por favor seleccione un trabajador del maestro de personal.');
      return;
    }

    if (items.length === 0) {
      setError('Debe incluir al menos un elemento de protección personal en la entrega.');
      return;
    }

    if (!compromisoAceptado) {
      setError('El trabajador debe aceptar el compromiso legal de uso y cuidado de los EPP.');
      return;
    }

    const record: EPPDeliveryRecord = {
      id: editingDelivery?.id || `epp-rec-${Date.now()}`,
      numeroActa: numeroActa || `EPP-${Date.now()}`,
      fecha,
      sedeId,
      area,
      supervisor,
      cedulaTrabajador: selectedWorker.cedula,
      nombreTrabajador: selectedWorker.nombre,
      puestoTrabajador: selectedWorker.puesto,
      motivo,
      items,
      observaciones: observaciones.trim(),
      compromisoAceptado,
      responsableEntrega: user?.displayName || 'Responsable SST',
      responsableEmail: user?.email || 'sst@mgconsultores.com',
      estado,
      createdAt: editingDelivery?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: editingDelivery?.createdBy || user?.email || 'sst@mgconsultores.com',
    };

    onSave(record);
  };

  if (!isOpen) return null;

  const currentCatalogItem = EPP_CATALOG.find((c) => c.id === selectedCatalogItem);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-8 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0A2958] to-[#123e80] text-white p-6 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Shield className="w-6 h-6 text-[#E60000]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#E60000] bg-white/95 px-2.5 py-0.5 rounded-full shadow-xs">
                  Módulo Personal
                </span>
                <span className="text-xs text-white/80 font-mono">
                  {numeroActa}
                </span>
              </div>
              <h2 className="text-xl font-bold text-white mt-1">
                {editingDelivery ? 'Editar Acta de Entrega de EPP' : 'Nueva Entrega de Dotación y EPP\'s'}
              </h2>
              <p className="text-xs text-white/70">
                Registro oficial con validez jurídica según Res. 2400/1979 y Dec. 1072/2015
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[calc(85vh-160px)] overflow-y-auto">
          {error && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-sm text-red-700 animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: General Info */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="text-sm font-bold text-[#0A2958] uppercase tracking-wide mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#E60000]" />
              1. Datos de Identificación y Sede
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Número de Acta
                </label>
                <input
                  type="text"
                  value={numeroActa}
                  onChange={(e) => setNumeroActa(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fecha de Entrega
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => setFecha(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Sede Operativa</span>
                  {user?.role !== 'admin' && (
                    <span className="text-[10px] text-amber-600 font-medium">Asignada</span>
                  )}
                </label>
                <select
                  value={sedeId}
                  onChange={(e) => setSedeId(e.target.value)}
                  disabled={user?.role !== 'admin'}
                  className={`w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0A2958] ${
                    user?.role !== 'admin' ? 'bg-slate-100 cursor-not-allowed opacity-85' : ''
                  }`}
                >
                  {sedes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.id} - {s.nombre}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Motivo de Entrega
                </label>
                <select
                  value={motivo}
                  onChange={(e) => setMotivo(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
                >
                  <option value="DOTACION_PERIODICA">Dotación Periódica</option>
                  <option value="INGRESO_NUEVO">Ingreso Nuevo Trabajador</option>
                  <option value="REPOSICION_DESGASTE">Reposición por Desgaste Normal</option>
                  <option value="CAMBIO_DANO">Cambio por Daño</option>
                  <option value="PERDIDA_ROBO">Reposición por Pérdida o Hurto</option>
                  <option value="REPOSICION_ACCIDENTE">Reposición por Incidente/Accidente</option>
                  <option value="OTRO">Otro Motivo</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Worker Information */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="text-sm font-bold text-[#0A2958] uppercase tracking-wide mb-3 flex items-center gap-2">
              <User className="w-4 h-4 text-[#E60000]" />
              2. Datos del Trabajador Receptor
            </h3>

            {/* Worker Search / Lookup */}
            <div className="mb-4">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Buscar en Maestro de Personal (Cédula o Nombre)
              </label>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Escriba cédula o nombre del trabajador..."
                  value={workerSearch}
                  onChange={(e) => {
                    setWorkerSearch(e.target.value);
                    if (selectedWorker) setSelectedWorker(null);
                  }}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
                />
                {!selectedWorker && workerSearch.trim().length > 0 && (
                  <div className="absolute z-20 left-0 right-0 mt-1 max-h-48 overflow-y-auto bg-white border border-slate-300 rounded-lg shadow-lg">
                    {filteredWorkers.length === 0 ? (
                      <div className="p-3 text-xs text-slate-500">
                        No se encontró ningún trabajador coincidente en esta sede.
                      </div>
                    ) : (
                      filteredWorkers.map((w) => (
                        <div
                          key={w.cedula}
                          onClick={() => handleSelectWorker(w)}
                          className="p-2.5 hover:bg-blue-50 cursor-pointer border-b border-slate-100 flex items-center justify-between text-xs"
                        >
                          <div>
                            <span className="font-bold text-[#0A2958]">{w.nombre}</span>
                            <span className="text-slate-500 ml-2 font-mono">C.C. {w.cedula}</span>
                          </div>
                          <span className="text-[11px] bg-slate-100 px-2 py-0.5 rounded text-slate-700">
                            {w.puesto} | {w.sedeId}
                          </span>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {selectedWorker ? (
              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                <div>
                  <span className="text-slate-500 block text-[11px]">Trabajador Seleccionado:</span>
                  <span className="font-bold text-[#0A2958] text-sm">{selectedWorker.nombre}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Cédula de Ciudadanía:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedWorker.cedula}</span>
                </div>
                <div>
                  <span className="text-slate-500 block text-[11px]">Cargo / Puesto:</span>
                  <span className="font-semibold text-slate-800">{selectedWorker.puesto}</span>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
                <span>Seleccione el trabajador arriba para vincular automáticamente su cargo y firma oficial.</span>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Área / Sección
                </label>
                <input
                  type="text"
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Supervisor Responsable
                </label>
                <select
                  value={supervisor}
                  onChange={(e) => setSupervisor(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
                >
                  {supervisores.map((sup) => (
                    <option key={sup.id} value={sup.supervisor}>
                      {sup.supervisor} ({sup.cargo || sup.area})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Section 3: EPP Items Selection */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
            <h3 className="text-sm font-bold text-[#0A2958] uppercase tracking-wide mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#E60000]" />
                3. Elementos de Protección Personal Entregados ({items.length})
              </span>
            </h3>

            {/* Item Adder Tool */}
            <div className="p-3 bg-white border border-slate-200 rounded-xl mb-4 space-y-3">
              <div className="text-xs font-bold text-slate-700">Agregar Elemento desde el Catálogo Estándar</div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                <div className="md:col-span-6">
                  <label className="block text-[11px] text-slate-500 mb-1">Elemento del Catálogo</label>
                  <select
                    value={selectedCatalogItem}
                    onChange={(e) => setSelectedCatalogItem(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
                  >
                    {EPP_CATALOG.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        [{cat.categoria}] {cat.nombre}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] text-slate-500 mb-1">Cantidad</label>
                  <input
                    type="number"
                    min="1"
                    max="50"
                    value={itemCantidad}
                    onChange={(e) => setItemCantidad(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 text-center focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[11px] text-slate-500 mb-1">Talla</label>
                  {currentCatalogItem?.tallasDisponibles ? (
                    <select
                      value={itemTalla || currentCatalogItem.tallasDisponibles[0]}
                      onChange={(e) => setItemTalla(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
                    >
                      {currentCatalogItem.tallasDisponibles.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="Única"
                      value={itemTalla}
                      onChange={(e) => setItemTalla(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
                    />
                  )}
                </div>

                <div className="md:col-span-2 flex items-end">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 bg-[#0A2958] hover:bg-[#123e80] text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Agregar</span>
                  </button>
                </div>
              </div>
            </div>

            {/* List of Included Items */}
            {items.length === 0 ? (
              <div className="p-4 text-center text-xs text-slate-400 border border-dashed border-slate-300 rounded-xl">
                No hay elementos incluidos aún. Seleccione del catálogo arriba para agregar.
              </div>
            ) : (
              <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-700 uppercase text-[10px] tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="px-3 py-2 font-bold">Categoría</th>
                      <th className="px-3 py-2 font-bold">Elemento de Protección</th>
                      <th className="px-3 py-2 text-center">Cant.</th>
                      <th className="px-3 py-2 text-center">Talla</th>
                      <th className="px-3 py-2 text-center">Estado</th>
                      <th className="px-3 py-2 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-3 py-2 font-semibold text-slate-600 text-[11px]">
                          {item.categoria}
                        </td>
                        <td className="px-3 py-2 font-medium text-slate-900">
                          {item.nombre}
                        </td>
                        <td className="px-3 py-2 text-center font-bold text-[#0A2958]">
                          {item.cantidad}
                        </td>
                        <td className="px-3 py-2 text-center text-slate-600">
                          {item.talla || 'Única'}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {item.estado}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                            title="Remover elemento"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Section 4: Observations & Commitment */}
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Observaciones y Recomendaciones Adicionales
              </label>
              <textarea
                rows={2}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Indique inspección previa, recomendaciones de lavado, periodicidad de cambio o condiciones particulares..."
                className="w-full px-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
              />
            </div>

            {/* Legal Commitment Box */}
            <div className="p-4 bg-slate-50 border border-slate-300 rounded-xl">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={compromisoAceptado}
                  onChange={(e) => setCompromisoAceptado(e.target.checked)}
                  className="mt-1 w-4 h-4 text-[#0A2958] rounded border-slate-300 focus:ring-[#0A2958]"
                />
                <div className="text-xs text-slate-700 space-y-1">
                  <div className="font-bold text-[#0A2958] flex items-center gap-1.5">
                    <FileCheck className="w-4 h-4 text-[#E60000]" />
                    Compromiso Legal y Obligatoriedad de Uso (Res. 2400/1979 - Dec. 1072/2015)
                  </div>
                  <p className="text-slate-600 leading-relaxed text-[11px]">
                    El trabajador certifica que recibe en óptimas condiciones de calidad e higiene los EPP listados, recibió capacitación para su correcto uso, almacenamiento y limpieza, y asume el compromiso legal de utilizarlos de forma permanente y obligatoria en el desempeño de sus labores en MG Consultores S.A.S.
                  </p>
                </div>
              </label>
            </div>

            {/* Signature status */}
            <div className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-xl text-xs">
              <div className="flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#0A2958]" />
                <span className="font-bold text-[#0A2958]">Estado de la Entrega:</span>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="estado_acta"
                    value="ENTREGADO_FIRMADO"
                    checked={estado === 'ENTREGADO_FIRMADO'}
                    onChange={() => setEstado('ENTREGADO_FIRMADO')}
                    className="text-[#0A2958] focus:ring-[#0A2958]"
                  />
                  <span className="font-semibold text-emerald-800">Entregado y Firmado</span>
                </label>
                <label className="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="radio"
                    name="estado_acta"
                    value="PENDIENTE_FIRMA"
                    checked={estado === 'PENDIENTE_FIRMA'}
                    onChange={() => setEstado('PENDIENTE_FIRMA')}
                    className="text-[#0A2958] focus:ring-[#0A2958]"
                  />
                  <span className="font-semibold text-amber-800">Pendiente de Firma</span>
                </label>
              </div>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-300 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#0A2958] to-[#123e80] hover:from-[#0d346e] hover:to-[#174ba0] text-white rounded-xl text-xs font-bold shadow-md hover:shadow-lg transition-all"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Guardar Acta de Entrega</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
