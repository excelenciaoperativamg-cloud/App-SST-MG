import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  X,
  Shield,
  User,
  Calendar,
  Building2,
  AlertCircle,
  FileCheck,
  CheckCircle2,
  DollarSign,
  Camera,
  Trash2,
  Upload,
  Search,
  ChevronDown,
} from 'lucide-react';
import {
  EntregaEPPMGRecord,
  CATALOGO_EPPS,
  CATALOGO_LABORES,
  CATALOGO_AREAS,
  CATALOGO_TIPO_ENTREGA,
  CATALOGO_SUPERVISORES,
  getMesNumero,
  getAnioFecha,
  formatCOP,
} from '../../types/epp';
import { PersonnelWorker } from '../../types';
import { storageService } from '../../services/storageService';
import { googleDriveService } from '../../services/googleDriveService';
import { useAuth } from '../../context/AuthContext';
import { useSST } from '../../context/SSTContext';
import { SignaturePad } from '../common/SignaturePad';

interface EPPDeliveryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (
    record: EntregaEPPMGRecord,
    driveSyncResult?: { success: boolean; message: string; needsConfig?: boolean }
  ) => void;
  editingDelivery?: EntregaEPPMGRecord | null;
}

export const EPPDeliveryFormModal: React.FC<EPPDeliveryFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingDelivery,
}) => {
  const { user } = useAuth();
  const { workers, supervisores, sedes } = useSST();
  const eppCatalog = storageService.getEPPCatalog();
  const laboresCatalog = storageService.getLabores();
  const areasCatalog = storageService.getAreas();
  const tiposEntregaCatalog = storageService.getTiposEntrega();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const supervisorContainerRef = useRef<HTMLDivElement>(null);
  const eppContainerRef = useRef<HTMLDivElement>(null);

  const normalizeSearch = (val: string) =>
    String(val || '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase()
      .trim();

  // Extraer del Maestro los trabajadores que en la columna Cargo registran como Supervisor
  const supervisoresMaestro = useMemo(() => {
    const fromWorkers = workers
      .filter((w) => {
        if (w.estado === 'INACTIVO') return false;
        const cargoCol = (w.cargo || w.puesto || '').toUpperCase();
        return cargoCol.includes('SUPERVISOR');
      })
      .map((w) => w.nombre.trim())
      .filter(Boolean);

    const uniqueFromWorkers = Array.from(new Set(fromWorkers)).sort((a, b) =>
      a.localeCompare(b)
    );

    if (uniqueFromWorkers.length > 0) {
      return uniqueFromWorkers;
    }

    const fromSupervisores = supervisores.map((s) => s.supervisor.trim()).filter(Boolean);
    return Array.from(new Set([...fromSupervisores, ...CATALOGO_SUPERVISORES])).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [workers, supervisores]);

  // Selected sede default
  const defaultSede =
    user?.role === 'admin'
      ? editingDelivery?.Sede || 'MG-HA'
      : user?.siteId || 'MG-HA';

  // The 19 Official Form Fields:
  // 1. Id_Epp (Generado automáticamente, no se muestra en el formulario)
  const [idEpp, setIdEpp] = useState('');
  // 2. Fecha
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
  // 3. Año (Calculado automáticamente, no se muestra en formulario)
  const [anio, setAnio] = useState(new Date().getFullYear());
  // 4. Mes (Calculado automáticamente 1..12, no se muestra en formulario)
  const [mes, setMes] = useState<number | string>(getMesNumero(new Date().toISOString().split('T')[0]));
  // 5. Sede (Traída del maestro según la cédula)
  const [sede, setSede] = useState(defaultSede);
  // 6. Cédula
  const [cedula, setCedula] = useState('');
  // 7. Nombre
  const [nombre, setNombre] = useState('');
  // 8. Labor (Opciones de la hoja Labores o nueva ingresada)
  const [labor, setLabor] = useState(laboresCatalog[0] || CATALOGO_LABORES[0] || 'MIPE');
  const [isCustomLabor, setIsCustomLabor] = useState(false);
  // 9. Area (Opciones de la hoja Area)
  const [area, setArea] = useState(areasCatalog[0] || CATALOGO_AREAS[0] || 'MIPE');
  // 10. Supervisor (Lista de supervisores del maestro, sin valor preseleccionado al abrir)
  const [supervisor, setSupervisor] = useState('');
  const [isSupervisorOpen, setIsSupervisorOpen] = useState(false);
  // 11. Código Epp (Solo el código, con buscador)
  const [codigoEpp, setCodigoEpp] = useState('');
  const [eppSearch, setEppSearch] = useState('');
  const [isEppOpen, setIsEppOpen] = useState(false);
  // 12. Epp (Nombre del Epp traído automáticamente de la hoja Epp´s)
  const [epp, setEpp] = useState('');
  // 13. Tipo_Entrega (Opciones de la hoja Tipo_Entrega)
  const [tipoEntrega, setTipoEntrega] = useState(tiposEntregaCatalog[0] || CATALOGO_TIPO_ENTREGA[0] || 'REPOSICIÓN');
  // 14. Costo (Costo oficial de la hoja Epp´s)
  const [costo, setCosto] = useState<number>(0);
  // 15. Estado
  const [estado, setEstado] = useState<'Entregado y Firmado' | 'Pendiente de Firma' | 'Borrador'>('Entregado y Firmado');
  // 16. Foto_Entrega
  const [fotoEntrega, setFotoEntrega] = useState<string>('');
  // 17. Firma_Trabajador
  const [firmaTrabajador, setFirmaTrabajador] = useState<string>('');
  // 18. Responsable SST
  const [responsableSST, setResponsableSST] = useState('');
  // 19. Firma SST
  const [firmaSST, setFirmaSST] = useState<string>('');

  // Auxiliary state
  const [observaciones, setObservaciones] = useState('');
  const [matchedWorker, setMatchedWorker] = useState<PersonnelWorker | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [driveSyncing, setDriveSyncing] = useState(false);

  // Cerrar desplegables al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        supervisorContainerRef.current &&
        !supervisorContainerRef.current.contains(event.target as Node)
      ) {
        setIsSupervisorOpen(false);
      }
      if (
        eppContainerRef.current &&
        !eppContainerRef.current.contains(event.target as Node)
      ) {
        setIsEppOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredSupervisores = useMemo(() => {
    const q = normalizeSearch(supervisor);
    if (!q) return supervisoresMaestro;
    return supervisoresMaestro.filter((sup) => normalizeSearch(sup).includes(q));
  }, [supervisoresMaestro, supervisor]);

  const filteredEpps = useMemo(() => {
    const q = normalizeSearch(eppSearch);
    if (!q) return eppCatalog;
    return eppCatalog.filter(
      (item) =>
        normalizeSearch(item.codigoEpp).includes(q) ||
        normalizeSearch(item.epp).includes(q)
    );
  }, [eppCatalog, eppSearch]);

  // Update Año and Mes internally whenever Fecha changes
  const handleFechaChange = (newFecha: string) => {
    setFecha(newFecha);
    setAnio(getAnioFecha(newFecha));
    setMes(getMesNumero(newFecha));
  };

  // Lookup worker in Maestro by Cédula -> Trae Nombre, Sede y sugerencia de Labor/Area
  const handleCedulaLookup = (inputCedula: string) => {
    setCedula(inputCedula);
    const cleanCedula = inputCedula.trim();
    if (!cleanCedula) {
      setMatchedWorker(null);
      return;
    }

    const found = storageService.getWorkerByCedula(cleanCedula);
    if (found) {
      setMatchedWorker(found);
      setNombre(found.nombre);
      // Traer la Sede del maestro de acuerdo a la cédula ingresada
      if (found.sedeId) {
        setSede(found.sedeId);
      }
      // Labor: verificar si está en la lista o es personalizada
      if (found.puesto) {
        const foundLaborUpper = found.puesto.trim().toUpperCase();
        const matched = laboresCatalog.find(
          (l) => l.toUpperCase() === foundLaborUpper || foundLaborUpper.includes(l.toUpperCase())
        );
        if (matched) {
          setLabor(matched);
          setIsCustomLabor(false);
        } else {
          setLabor(found.puesto.trim());
          setIsCustomLabor(true);
        }
      }
      // Area
      if (found.area) {
        const matchedArea = areasCatalog.find(
          (a) => a.toLowerCase() === found.area?.toLowerCase()
        );
        if (matchedArea) {
          setArea(matchedArea);
        }
      }
      // Supervisor
      if (found.supervisor && supervisoresMaestro.includes(found.supervisor)) {
        setSupervisor(found.supervisor);
      }
      setError(null);
    } else {
      setMatchedWorker(null);
    }
  };

  // When Código Epp is changed: automatically update Epp name and Costo from sheet Epp´s!
  const handleEppCodeChange = (selectedCodigo: string) => {
    const cleanCode = selectedCodigo.split(' - ')[0].trim();
    setCodigoEpp(cleanCode);
    setEppSearch(cleanCode);
    const item =
      eppCatalog.find((c) => c.codigoEpp.toUpperCase() === cleanCode.toUpperCase()) ||
      CATALOGO_EPPS.find((c) => c.codigoEpp.toUpperCase() === cleanCode.toUpperCase());
    if (item) {
      setCodigoEpp(item.codigoEpp);
      setEppSearch(item.codigoEpp);
      setEpp(item.epp);
      setCosto(item.costo); // Costo automático de la hoja Epp´s
    } else {
      setEpp('');
      setCosto(0);
    }
  };

  // Initialize or reset form
  useEffect(() => {
    if (editingDelivery) {
      setIdEpp(editingDelivery.Id_Epp || editingDelivery.id);
      setFecha(editingDelivery.Fecha);
      setAnio(editingDelivery.Año || getAnioFecha(editingDelivery.Fecha));
      setMes(editingDelivery.Mes || getMesNumero(editingDelivery.Fecha));
      setSede(editingDelivery.Sede);
      setCedula(editingDelivery.Cédula);
      setNombre(editingDelivery.Nombre);
      setLabor(editingDelivery.Labor || CATALOGO_LABORES[0]);
      setArea(editingDelivery.Area || CATALOGO_AREAS[0]);
      setSupervisor(editingDelivery.Supervisor || '');
      const existingCode = (editingDelivery.Código_Epp || '').split(' - ')[0].trim();
      setCodigoEpp(existingCode);
      setEppSearch(existingCode);
      setEpp(editingDelivery.Epp || '');
      setCosto(Number(editingDelivery.Costo) || 0);
      setTipoEntrega(editingDelivery.Tipo_Entrega || CATALOGO_TIPO_ENTREGA[0]);
      setEstado(
        (editingDelivery.Estado === 'Pendiente de Firma' || editingDelivery.Estado === 'Borrador')
          ? editingDelivery.Estado
          : 'Entregado y Firmado'
      );
      setFotoEntrega(editingDelivery.Foto_Entrega || '');
      setFirmaTrabajador(editingDelivery.Firma_Trabajador || '');
      setResponsableSST(editingDelivery.Responsable_SST || user?.displayName || 'Responsable SST');
      setFirmaSST(editingDelivery.Firma_SST || '');
      setObservaciones(editingDelivery.observaciones || '');

      const found = storageService.getWorkerByCedula(editingDelivery.Cédula);
      setMatchedWorker(found || null);
    } else {
      // New delivery auto generation: format matching Drive sheet (e.g. 15gh86 or EPP-consecutive)
      const randomPrefix = Math.floor(10 + Math.random() * 90);
      const randomChars = 'gh';
      const randomSuffix = Math.floor(100 + Math.random() * 900);
      const generatedId = `${randomPrefix}${randomChars}${randomSuffix}`;

      const todayStr = new Date().toISOString().split('T')[0];
      setIdEpp(generatedId);
      setFecha(todayStr);
      setAnio(getAnioFecha(todayStr));
      setMes(getMesNumero(todayStr));
      setSede(user?.role === 'admin' ? 'MG-HA' : user?.siteId || 'MG-HA');
      setCedula('');
      setNombre('');
      setLabor(CATALOGO_LABORES[0] || 'MIPE');
      setArea(CATALOGO_AREAS[0] || 'MIPE');
      setSupervisor('');
      setCodigoEpp('');
      setEppSearch('');
      setEpp('');
      setCosto(0);

      setTipoEntrega(CATALOGO_TIPO_ENTREGA[0] || 'REPOSICIÓN');
      setEstado('Entregado y Firmado');
      setFotoEntrega('');
      setFirmaTrabajador('');
      setResponsableSST(user?.displayName || 'Supervisor SST MG Consultores');
      setFirmaSST('');
      setObservaciones('');
      setMatchedWorker(null);
    }
    setIsSupervisorOpen(false);
    setIsEppOpen(false);
    setError(null);
  }, [editingDelivery, isOpen]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('La foto de entrega no debe superar los 5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFotoEntrega(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!cedula.trim()) {
      setError('Por favor ingrese la cédula del trabajador.');
      return;
    }

    if (!nombre.trim()) {
      setError('Por favor ingrese el nombre del trabajador o ingrese una cédula registrada en Maestro.');
      return;
    }

    if (!supervisor.trim()) {
      setError('Por favor busque y seleccione el supervisor a cargo.');
      return;
    }

    if (!codigoEpp || !epp) {
      setError('Por favor busque y seleccione un código EPP válido de la hoja Epp´s.');
      return;
    }

    const cleanCodigoEpp = codigoEpp.split(' - ')[0].trim();
    const cleanEpp = epp.trim();

    const record: EntregaEPPMGRecord = {
      id: editingDelivery?.id || `epp-${Date.now()}`,
      Id_Epp: idEpp.trim() || `EPP-${Date.now()}`,
      Fecha: fecha,
      Año: anio, // Guardado en el registro y en Drive, sin mostrar en el formulario
      Mes: mes, // Guardado en el registro y en Drive, sin mostrar en el formulario
      Sede: sede,
      Cédula: cedula.trim(),
      Nombre: nombre.trim(),
      Labor: labor.trim(),
      Area: area.trim(),
      Supervisor: supervisor,
      Código_Epp: cleanCodigoEpp, // Solo el Código Epp sin el nombre
      Epp: cleanEpp, // La descripción Epp
      Tipo_Entrega: tipoEntrega,
      Costo: Number(costo) || 0,
      Estado: estado,
      Foto_Entrega: fotoEntrega || undefined,
      Firma_Trabajador: firmaTrabajador || undefined,
      Responsable_SST: responsableSST.trim() || user?.displayName || 'Responsable SST',
      Firma_SST: firmaSST || undefined,
      observaciones: observaciones.trim(),
      createdAt: editingDelivery?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: editingDelivery?.createdBy || user?.email || 'sst@mgconsultores.com',
    };

    // Attempt automatic save to Drive (Apps Script Web App or Google OAuth)
    let driveResult: { success: boolean; message: string; needsConfig?: boolean } | undefined;
    if (googleDriveService.isConnectedAutomatically()) {
      setDriveSyncing(true);
      try {
        driveResult = await googleDriveService.appendEntregaEPPRecord(record);
      } catch (err: any) {
        console.warn('Sync to drive warning:', err);
        driveResult = {
          success: false,
          message: err?.message || 'Error al sincronizar con Google Drive.',
        };
      } finally {
        setDriveSyncing(false);
      }
    }

    onSave(record, driveResult);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#0A2958] via-[#0d346e] to-[#0A2958] text-white p-5 flex items-start justify-between border-b-2 border-[#E60000]">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Shield className="w-6 h-6 text-[#E60000]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-[#E60000] bg-white px-2.5 py-0.5 rounded-full shadow-xs">
                  Hoja: Entrega Epp´s MG
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-white mt-1">
                {editingDelivery ? 'Editar Registro: Entrega Epp´s MG' : 'Formulario Oficial: Entrega Epp´s MG'}
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-6 max-h-[calc(88vh-140px)] overflow-y-auto text-xs">
          
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2.5 text-xs text-red-700 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span className="font-semibold">{error}</span>
            </div>
          )}

          {/* Bloque 1: Fecha y Sede (Fecha, Sede) -> Id_Epp no se muestra en el formulario por requerimiento */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="font-bold text-[#0A2958] uppercase tracking-wide flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#E60000]" />
                1. Datos de Fecha y Sede (Fecha, Sede)
              </h3>
              <span className="text-[10px] font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                Año ({anio}) y Mes ({mes}) se guardan automáticamente en Drive
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* 2. Fecha */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  2. Fecha *
                </label>
                <input
                  type="date"
                  value={fecha}
                  onChange={(e) => handleFechaChange(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
                  required
                />
              </div>

              {/* 5. Sede (Traída del Maestro de acuerdo a la cédula ingresada) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>5. Sede *</span>
                  {matchedWorker?.sedeId ? (
                    <span className="text-[9px] text-emerald-700 font-bold">Desde Maestro: {matchedWorker.sedeId}</span>
                  ) : (
                    <span className="text-[9px] text-slate-500 font-semibold">Traída desde Maestro según cédula</span>
                  )}
                </label>
                <select
                  value={sede}
                  onChange={(e) => setSede(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
                >
                  {sedes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.id}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Bloque 2: Trabajador Receptor (Cédula, Nombre, Labor, Area, Supervisor) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="font-bold text-[#0A2958] uppercase tracking-wide flex items-center gap-2">
                <User className="w-4 h-4 text-[#E60000]" />
                2. Datos del Trabajador Receptor (Cédula, Nombre, Labor, Area, Supervisor)
              </h3>
              <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                Campos 6 al 10
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 pt-1">
              {/* 6. Cédula con búsqueda automática en hoja Maestro */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>6. Cédula *</span>
                  <span className="text-[9px] text-blue-700 font-bold">Hoja Maestro</span>
                </label>
                <input
                  type="text"
                  list="cedulas-maestro-list"
                  value={cedula}
                  onChange={(e) => handleCedulaLookup(e.target.value)}
                  onBlur={(e) => handleCedulaLookup(e.target.value)}
                  placeholder="Ingrese cédula..."
                  className="w-full px-2.5 py-2 font-mono font-bold bg-white border border-slate-300 rounded-lg text-[#0A2958] focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
                  required
                />
                <datalist id="cedulas-maestro-list">
                  {workers.map((w) => (
                    <option key={w.cedula} value={w.cedula}>
                      {w.nombre} ({w.sedeId} - {w.puesto})
                    </option>
                  ))}
                </datalist>

                {matchedWorker && (
                  <div className="text-[10px] text-emerald-700 font-bold mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Datos y Sede ({matchedWorker.sedeId}) vinculados</span>
                  </div>
                )}
              </div>

              {/* 7. Nombre (Traído automáticamente de Maestro) */}
              <div className="md:col-span-2">
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>7. Nombre del Trabajador *</span>
                  <span className="text-[9px] text-slate-500">Auto desde Cédula</span>
                </label>
                <input
                  type="text"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  placeholder="Nombre completo del trabajador..."
                  className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
                  required
                />
              </div>

              {/* 8. Labor (Opciones de la hoja Labores o nueva ingresada en caso de no estar en la lista) */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-bold text-slate-700">8. Labor *</label>
                  {isCustomLabor ? (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomLabor(false);
                        setLabor(laboresCatalog[0] || CATALOGO_LABORES[0]);
                      }}
                      className="text-[9px] text-blue-700 hover:underline font-bold"
                    >
                      ← Ver lista
                    </button>
                  ) : (
                    <span className="text-[9px] text-slate-500 font-semibold">Hoja Labores</span>
                  )}
                </div>

                {isCustomLabor ? (
                  <div>
                    <input
                      type="text"
                      list="labores-maestro-list"
                      value={labor}
                      onChange={(e) => setLabor(e.target.value.toUpperCase())}
                      placeholder="Escriba nueva labor..."
                      className="w-full px-2.5 py-2 bg-white border border-blue-400 rounded-lg text-slate-800 font-semibold uppercase focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
                      required
                    />
                    <datalist id="labores-maestro-list">
                      {laboresCatalog.map((lab) => (
                        <option key={lab} value={lab} />
                      ))}
                    </datalist>
                  </div>
                ) : (
                  <select
                    value={laboresCatalog.includes(labor) ? labor : '__OTRA__'}
                    onChange={(e) => {
                      if (e.target.value === '__OTRA__') {
                        setIsCustomLabor(true);
                        setLabor('');
                      } else {
                        setLabor(e.target.value);
                      }
                    }}
                    className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
                    required
                  >
                    {laboresCatalog.map((lab) => (
                      <option key={lab} value={lab}>
                        {lab}
                      </option>
                    ))}
                    <option value="__OTRA__" className="text-blue-700 font-bold">
                      ➕ Ingresar nueva labor...
                    </option>
                  </select>
                )}
              </div>

              {/* 9. Area (Opciones de la hoja Area del archivo Entrega Epp´s MG) */}
              <div>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>9. Area *</span>
                  <span className="text-[9px] text-slate-500 font-semibold">Hoja Area</span>
                </label>
                <select
                  value={area}
                  onChange={(e) => setArea(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
                  required
                >
                  {areasCatalog.map((ar) => (
                    <option key={ar} value={ar}>
                      {ar}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 10. Supervisor (Listado del Maestro con Cargo = Supervisor + cuadro de búsqueda) */}
            <div className="pt-1 relative" ref={supervisorContainerRef}>
              <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                <span>10. Supervisor a Cargo *</span>
                <span className="text-[9px] text-emerald-700 font-bold">
                  Maestro Cargo: Supervisor ({supervisoresMaestro.length})
                </span>
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={supervisor}
                  onFocus={() => setIsSupervisorOpen(true)}
                  onChange={(e) => {
                    setSupervisor(e.target.value);
                    setIsSupervisorOpen(true);
                  }}
                  placeholder="Buscar supervisor en el Maestro..."
                  className="w-full pl-9 pr-14 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
                  autoComplete="off"
                  required
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  {supervisor && (
                    <button
                      type="button"
                      onClick={() => {
                        setSupervisor('');
                        setIsSupervisorOpen(true);
                      }}
                      className="p-1 text-slate-400 hover:text-slate-600 rounded"
                      title="Limpiar supervisor"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setIsSupervisorOpen((prev) => !prev)}
                    className="p-1 text-slate-400 hover:text-[#0A2958] rounded"
                    title="Mostrar lista de supervisores"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {isSupervisorOpen && (
                <div className="absolute left-0 right-0 z-30 mt-1 bg-white border border-slate-300 rounded-xl shadow-lg max-h-52 overflow-y-auto divide-y divide-slate-100">
                  {filteredSupervisores.length === 0 ? (
                    <div className="px-3 py-2.5 text-xs text-slate-500">
                      No se encontraron supervisores que coincidan con "{supervisor}".
                    </div>
                  ) : (
                    filteredSupervisores.map((sup) => (
                      <button
                        key={sup}
                        type="button"
                        onClick={() => {
                          setSupervisor(sup);
                          setIsSupervisorOpen(false);
                          setError(null);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-between hover:bg-blue-50 transition-colors ${
                          supervisor.toUpperCase() === sup.toUpperCase()
                            ? 'bg-blue-50/80 text-[#0A2958] font-bold'
                            : 'text-slate-700'
                        }`}
                      >
                        <span>{sup}</span>
                        <span className="text-[10px] text-emerald-700 font-medium">SUPERVISOR</span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Bloque 3: Elemento EPP, Costo y Tipo de Entrega (Campos 11, 12, 13, 14, 15) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="font-bold text-[#0A2958] uppercase tracking-wide flex items-center gap-2">
                <Shield className="w-4 h-4 text-[#E60000]" />
                3. Elemento EPP, Costo de Hoja Epp´s y Entrega (Campos 11 al 15)
              </h3>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                Tarifas Oficiales Hoja Epp´s
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-3">
              {/* 11. Código Epp (Cuadro con buscador por código o descripción) */}
              <div className="md:col-span-4 relative" ref={eppContainerRef}>
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>11. Código Epp *</span>
                  <span className="text-[9px] text-blue-700 font-bold">Buscar Código o EPP</span>
                </label>
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    value={eppSearch}
                    onFocus={() => setIsEppOpen(true)}
                    onChange={(e) => {
                      const val = e.target.value;
                      setEppSearch(val);
                      setIsEppOpen(true);
                      const exactMatch =
                        eppCatalog.find(
                          (c) => c.codigoEpp.toUpperCase() === val.trim().toUpperCase()
                        ) ||
                        CATALOGO_EPPS.find(
                          (c) => c.codigoEpp.toUpperCase() === val.trim().toUpperCase()
                        );
                      if (exactMatch) {
                        setCodigoEpp(exactMatch.codigoEpp);
                        setEpp(exactMatch.epp);
                        setCosto(exactMatch.costo);
                      } else {
                        setCodigoEpp('');
                        setEpp('');
                        setCosto(0);
                      }
                    }}
                    placeholder="Buscar código o nombre de EPP..."
                    className="w-full pl-9 pr-14 py-2 bg-white border border-slate-300 rounded-lg text-[#0A2958] font-mono font-bold focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
                    autoComplete="off"
                    required
                  />
                  <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {eppSearch && (
                      <button
                        type="button"
                        onClick={() => {
                          setEppSearch('');
                          setCodigoEpp('');
                          setEpp('');
                          setCosto(0);
                          setIsEppOpen(true);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600 rounded"
                        title="Limpiar código EPP"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setIsEppOpen((prev) => !prev)}
                      className="p-1 text-slate-400 hover:text-[#0A2958] rounded"
                      title="Mostrar catálogo de EPP"
                    >
                      <ChevronDown className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {isEppOpen && (
                  <div className="absolute left-0 right-0 md:w-[440px] z-30 mt-1 bg-white border border-slate-300 rounded-xl shadow-xl max-h-60 overflow-y-auto divide-y divide-slate-100">
                    {filteredEpps.length === 0 ? (
                      <div className="px-3 py-2.5 text-xs text-slate-500">
                        No hay EPP que coincidan con "{eppSearch}".
                      </div>
                    ) : (
                      filteredEpps.map((cat) => (
                        <button
                          key={cat.codigoEpp}
                          type="button"
                          onClick={() => {
                            handleEppCodeChange(cat.codigoEpp);
                            setIsEppOpen(false);
                            setError(null);
                          }}
                          className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between gap-2 hover:bg-blue-50 transition-colors ${
                            codigoEpp === cat.codigoEpp ? 'bg-blue-50/80' : ''
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <span className="inline-block font-mono font-bold text-[#0A2958] bg-slate-100 px-1.5 py-0.5 rounded mr-2">
                              {cat.codigoEpp}
                            </span>
                            <span className="font-semibold text-slate-700 break-words">
                              {cat.epp}
                            </span>
                          </div>
                          <span className="font-mono font-bold text-emerald-700 shrink-0">
                            {formatCOP(cat.costo)}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* 12. Epp (Nombre traído de la hoja Epp´s) */}
              <div className="md:col-span-5">
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>12. Descripción Epp *</span>
                  <span className="text-[9px] text-slate-500">Auto desde Código</span>
                </label>
                <input
                  type="text"
                  value={epp}
                  readOnly
                  className="w-full px-2.5 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-800 font-semibold cursor-not-allowed"
                />
              </div>

              {/* 14. Costo (Tomado de la hoja Epp´s) */}
              <div className="md:col-span-3">
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>14. Costo (COP) *</span>
                  <span className="text-[9px] text-emerald-700 font-bold">Hoja Epp´s</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none text-slate-400">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                  </div>
                  <input
                    type="number"
                    value={costo}
                    readOnly
                    className="w-full pl-8 pr-3 py-2 font-mono font-bold text-[#0A2958] bg-emerald-50/60 border border-emerald-300 rounded-lg cursor-not-allowed"
                    required
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  Tarifa: <span className="font-bold text-emerald-700">{formatCOP(costo)}</span>
                </p>
              </div>

              {/* 13. Tipo_Entrega (Opciones de la hoja Tipo_Entrega) */}
              <div className="md:col-span-6">
                <label className="block font-bold text-slate-700 mb-1 flex items-center justify-between">
                  <span>13. Tipo_Entrega *</span>
                  <span className="text-[9px] text-slate-500 font-semibold">Hoja Tipo_Entrega</span>
                </label>
                <select
                  value={tipoEntrega}
                  onChange={(e) => setTipoEntrega(e.target.value)}
                  className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
                >
                  {tiposEntregaCatalog.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {tipo}
                    </option>
                  ))}
                </select>
              </div>

              {/* 15. Estado */}
              <div className="md:col-span-6">
                <label className="block font-bold text-slate-700 mb-1">
                  15. Estado del Registro *
                </label>
                <div className="flex flex-wrap items-center gap-3 bg-white p-2 rounded-lg border border-slate-200">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="estado_entrega"
                      value="Entregado y Firmado"
                      checked={estado === 'Entregado y Firmado'}
                      onChange={() => setEstado('Entregado y Firmado')}
                      className="text-[#0A2958] focus:ring-[#0A2958]"
                    />
                    <span className="font-bold text-emerald-800">Entregado y Firmado</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="estado_entrega"
                      value="Pendiente de Firma"
                      checked={estado === 'Pendiente de Firma'}
                      onChange={() => setEstado('Pendiente de Firma')}
                      className="text-[#0A2958] focus:ring-[#0A2958]"
                    />
                    <span className="font-bold text-amber-800">Pendiente de Firma</span>
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="radio"
                      name="estado_entrega"
                      value="Borrador"
                      checked={estado === 'Borrador'}
                      onChange={() => setEstado('Borrador')}
                      className="text-[#0A2958] focus:ring-[#0A2958]"
                    />
                    <span className="font-medium text-slate-600">Borrador</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Bloque 4: Foto de Entrega (Campo 16) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="font-bold text-[#0A2958] uppercase tracking-wide flex items-center gap-2">
                <Camera className="w-4 h-4 text-[#E60000]" />
                4. Evidencia Fotográfica (16. Foto_Entrega)
              </h3>
              <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                Campo 16
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
              <div>
                <p className="text-slate-600 mb-2 leading-relaxed">
                  Adjunte la fotografía del trabajador con el elemento de protección personal puesto o entregado a satisfacción.
                </p>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-100 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5 text-blue-600" />
                    <span>Seleccionar Foto / Tomar Captura</span>
                  </button>
                  {fotoEntrega && (
                    <button
                      type="button"
                      onClick={() => setFotoEntrega('')}
                      className="inline-flex items-center gap-1 px-2.5 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Eliminar foto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Quitar</span>
                    </button>
                  )}
                </div>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>

              {/* Photo Preview Thumbnail */}
              <div className="flex justify-center md:justify-end">
                {fotoEntrega ? (
                  <div className="relative group rounded-xl overflow-hidden border-2 border-slate-300 max-h-36 shadow-md">
                    <img
                      src={fotoEntrega}
                      alt="Foto Entrega"
                      className="w-full h-36 object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <span className="text-[10px] text-white font-bold bg-black/60 px-2 py-1 rounded">
                        Foto_Entrega Cargada
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="w-full max-w-xs h-28 border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center text-slate-400 bg-white">
                    <Camera className="w-6 h-6 mb-1 opacity-60" />
                    <span className="text-[10px]">Sin evidencia fotográfica</span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bloque 5: Firmas y Responsables (Campos 17, 18, 19) */}
          <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <h3 className="font-bold text-[#0A2958] uppercase tracking-wide flex items-center gap-2">
                <FileCheck className="w-4 h-4 text-[#E60000]" />
                5. Aprobaciones y Firmas Digitales (Campos 17, 18, 19)
              </h3>
              <span className="text-[10px] font-bold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                Campos 17 al 19
              </span>
            </div>

            {/* 18. Responsable SST */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                18. Responsable SST (Quien Realiza la Entrega) *
              </label>
              <input
                type="text"
                value={responsableSST}
                onChange={(e) => setResponsableSST(e.target.value)}
                placeholder="Nombre y cargo del responsable SST"
                className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 font-semibold focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
                required
              />
            </div>

            {/* Dual Signature Pads */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
              {/* 17. Firma_Trabajador */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                <SignaturePad
                  label="17. Firma_Trabajador (Receptor Conforme)"
                  sublabel={`Firma digital de: ${nombre || 'Trabajador seleccionado'}`}
                  value={firmaTrabajador}
                  onChange={setFirmaTrabajador}
                />
              </div>

              {/* 19. Firma SST */}
              <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
                <SignaturePad
                  label="19. Firma SST (Certificación Oficial)"
                  sublabel={`Firma digital de: ${responsableSST || 'Líder SST'}`}
                  value={firmaSST}
                  onChange={setFirmaSST}
                />
              </div>
            </div>

            {/* Observaciones complementarias */}
            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Observaciones Complementarias
              </label>
              <textarea
                rows={2}
                value={observaciones}
                onChange={(e) => setObservaciones(e.target.value)}
                placeholder="Detalles sobre inspección previa, talla especial, entrega en campo o recomendación de uso..."
                className="w-full px-2.5 py-2 bg-white border border-slate-300 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
              />
            </div>
          </div>

          {/* Modal Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 border border-slate-300 rounded-xl font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={driveSyncing}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-[#E60000] to-[#b30000] hover:from-[#c40000] hover:to-[#990000] text-white rounded-xl font-bold shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-75"
            >
              {driveSyncing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Guardando registro...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 text-white" />
                  <span>Guardar registro</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
