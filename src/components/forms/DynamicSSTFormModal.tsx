import React, { useState, useEffect } from 'react';
import {
  X,
  Save,
  Upload,
  Calendar,
  Building2,
  User,
  AlertTriangle,
  FileText,
  Camera,
  Trash2,
  CheckCircle,
} from 'lucide-react';
import { useSST } from '../../context/SSTContext';
import { useAuth } from '../../context/AuthContext';
import { INITIAL_SEDES, SST_MODULES } from '../../config/constants';
import { SSTRecord, SSTRecordStatus, EvidenciaArchivo } from '../../types';

interface DynamicSSTFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  recordToEdit?: SSTRecord | null;
  initialMenuId?: string;
  initialSubMenuId?: string;
  onSaved: (record: SSTRecord) => void;
}

export const DynamicSSTFormModal: React.FC<DynamicSSTFormModalProps> = ({
  isOpen,
  onClose,
  recordToEdit,
  initialMenuId,
  initialSubMenuId,
  onSaved,
}) => {
  const { workers, sedes, supervisores, saveRecord } = useSST();
  const { user, activeSiteId } = useAuth();

  // Find initial module and submodule
  const defaultModule = SST_MODULES.find((m) => m.id === initialMenuId) || SST_MODULES[0];
  const defaultSub = defaultModule.submenus.find((s) => s.id === initialSubMenuId) || defaultModule.submenus[0];

  const [menuId, setMenuId] = useState<string>(defaultModule.id);
  const [subMenuId, setSubMenuId] = useState<string>(defaultSub.id);
  const [sedeId, setSedeId] = useState<string>(activeSiteId !== 'TODAS' ? activeSiteId : 'MG-MG');
  const [area, setArea] = useState<string>('Operaciones');
  const [supervisor, setSupervisor] = useState<string>('');
  const [fecha, setFecha] = useState<string>(new Date().toISOString().split('T')[0]);
  const [cedulaTrabajador, setCedulaTrabajador] = useState<string>('');
  const [nombreTrabajador, setNombreTrabajador] = useState<string>('');
  const [puestoTrabajador, setPuestoTrabajador] = useState<string>('');
  const [estado, setEstado] = useState<SSTRecordStatus>('EN_PROCESO');
  const [observaciones, setObservaciones] = useState<string>('');
  const [hallazgos, setHallazgos] = useState<string>('');
  const [accionesPropuestas, setAccionesPropuestas] = useState<string>('');
  const [evidencias, setEvidencias] = useState<EvidenciaArchivo[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync when editing an existing record
  useEffect(() => {
    if (recordToEdit) {
      setMenuId(recordToEdit.menuId);
      setSubMenuId(recordToEdit.subMenuId);
      setSedeId(recordToEdit.sedeId);
      setArea(recordToEdit.area);
      setSupervisor(recordToEdit.supervisor || '');
      setFecha(recordToEdit.fecha);
      setCedulaTrabajador(recordToEdit.cedulaTrabajador || '');
      setNombreTrabajador(recordToEdit.nombreTrabajador || '');
      setPuestoTrabajador(recordToEdit.puestoTrabajador || '');
      setEstado(recordToEdit.estado);
      setObservaciones(recordToEdit.observaciones || '');
      setHallazgos(recordToEdit.hallazgos || '');
      setAccionesPropuestas(recordToEdit.accionesPropuestas || '');
      setEvidencias(recordToEdit.evidencias || []);
    } else {
      // New record defaults
      const m = SST_MODULES.find((mod) => mod.id === initialMenuId) || SST_MODULES[0];
      const s = m.submenus.find((sub) => sub.id === initialSubMenuId) || m.submenus[0];
      setMenuId(m.id);
      setSubMenuId(s.id);
      setSedeId(activeSiteId !== 'TODAS' ? activeSiteId : 'MG-MG');
      setArea('Operaciones');
      setFecha(new Date().toISOString().split('T')[0]);
      setCedulaTrabajador('');
      setNombreTrabajador('');
      setPuestoTrabajador('');
      setEstado('EN_PROCESO');
      setObservaciones('');
      setHallazgos('');
      setAccionesPropuestas('');
      setEvidencias([]);
    }
    setErrorMsg(null);
  }, [recordToEdit, initialMenuId, initialSubMenuId, activeSiteId, isOpen]);

  // Current selected module & submodule config
  const currentModule = SST_MODULES.find((m) => m.id === menuId) || SST_MODULES[0];
  const currentSub = currentModule.submenus.find((s) => s.id === subMenuId) || currentModule.submenus[0];

  // Auto-fill supervisor when area/sede changes
  useEffect(() => {
    const matchingSup = supervisores.find((s) => s.sedeId === sedeId && s.area.toLowerCase() === area.toLowerCase());
    if (matchingSup) {
      setSupervisor(matchingSup.supervisor);
    }
  }, [sedeId, area, supervisores]);

  // Handle worker selection from Master
  const handleWorkerChange = (cedula: string) => {
    setCedulaTrabajador(cedula);
    if (!cedula) {
      setNombreTrabajador('');
      setPuestoTrabajador('');
      return;
    }
    const found = workers.find((w) => w.cedula === cedula);
    if (found) {
      setNombreTrabajador(found.nombre);
      setPuestoTrabajador(found.puesto);
      if (found.sedeId && found.sedeId !== sedeId) {
        setSedeId(found.sedeId);
      }
    }
  };

  // Simulated file upload for photographic evidence
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newEvidenceList: EvidenciaArchivo[] = [];
    Array.from(files).forEach((f) => {
      newEvidenceList.push({
        id: 'ev-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
        nombre: f.name,
        tipo: f.type || 'image/jpeg',
        url: URL.createObjectURL(f),
        tamanoKb: Math.round(f.size / 1024),
        fecha: new Date().toISOString().split('T')[0],
      });
    });

    setEvidencias((prev) => [...prev, ...newEvidenceList]);
  };

  const removeEvidence = (id: string) => {
    setEvidencias((prev) => prev.filter((ev) => ev.id !== id));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!observaciones.trim()) {
      setErrorMsg('Las observaciones y descripción de la actividad son obligatorias.');
      return;
    }

    const correlative = Math.floor(100 + Math.random() * 900);
    const prefix = currentSub.codigo || 'SST';
    const numeroRegistro = recordToEdit?.numeroRegistro || `${prefix}-${new Date().getFullYear()}-${correlative}`;

    const newRecord: SSTRecord = {
      id: recordToEdit?.id || 'rec-' + Date.now(),
      numeroRegistro,
      menuId,
      subMenuId,
      moduloNombre: currentModule.nombre,
      subModuloNombre: currentSub.nombre,
      fecha,
      sedeId,
      area,
      supervisor: supervisor || undefined,
      cedulaTrabajador: cedulaTrabajador || undefined,
      nombreTrabajador: nombreTrabajador || undefined,
      puestoTrabajador: puestoTrabajador || undefined,
      responsableRegistro: user?.displayName || 'Responsable SST',
      responsableEmail: user?.email || 'sst@mgconsultores.com',
      estado,
      observaciones,
      hallazgos: hallazgos || undefined,
      accionesPropuestas: accionesPropuestas || undefined,
      evidencias,
      createdAt: recordToEdit?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: recordToEdit?.createdBy || user?.email || 'sistema',
    };

    saveRecord(newRecord);
    onSaved(newRecord);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#0A2958] px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600/30 border border-red-500/40 text-white">
              <FileText className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {recordToEdit ? `Editar Registro: ${recordToEdit.numeroRegistro}` : 'Nuevo Registro Operativo SST'}
              </h2>
              <p className="text-xs text-slate-300">
                {currentModule.nombre} ➔ {currentSub.nombre}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-300 hover:bg-white/10 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Notice of Form Architecture */}
        {currentSub.formularioOficialPendiente && (
          <div className="bg-amber-50 border-b border-amber-200 px-6 py-2.5 text-xs text-amber-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <span>
                <strong>Estructura oficial extensible:</strong> Módulo preparado con campos maestros estándar. Los formatos específicos de SST se integrarán según la entrega oficial.
              </span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs">
          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2 font-medium">
              <AlertTriangle className="h-4 w-4 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Module & Submenu Selector */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-100">
            <div>
              <label htmlFor="field-menu-id" className="block font-bold text-[#0A2958] mb-1">
                Módulo SST:
              </label>
              <select
                id="field-menu-id"
                value={menuId}
                onChange={(e) => {
                  const mId = e.target.value;
                  setMenuId(mId);
                  const m = SST_MODULES.find((mod) => mod.id === mId);
                  if (m && m.submenus[0]) {
                    setSubMenuId(m.submenus[0].id);
                  }
                }}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
              >
                {SST_MODULES.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="field-submenu-id" className="block font-bold text-[#0A2958] mb-1">
                Submódulo / Proceso:
              </label>
              <select
                id="field-submenu-id"
                value={subMenuId}
                onChange={(e) => setSubMenuId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
              >
                {currentModule.submenus.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date, Sede, Area, Status */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label htmlFor="field-fecha" className="block font-bold text-slate-700 mb-1">
                Fecha:
              </label>
              <input
                id="field-fecha"
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:ring-2 focus:ring-[#0A2958]"
                required
              />
            </div>

            <div>
              <label htmlFor="field-sede" className="block font-bold text-slate-700 mb-1">
                Sede:
              </label>
              <select
                id="field-sede"
                value={sedeId}
                onChange={(e) => setSedeId(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-semibold text-slate-800 focus:ring-2 focus:ring-[#0A2958]"
                disabled={user?.role === 'site_lead'}
              >
                {INITIAL_SEDES.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.codigo}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="field-area" className="block font-bold text-slate-700 mb-1">
                Área / Sección:
              </label>
              <input
                id="field-area"
                type="text"
                value={area}
                onChange={(e) => setArea(e.target.value)}
                placeholder="Ej. Producción, Mantenimiento"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:ring-2 focus:ring-[#0A2958]"
                required
              />
            </div>

            <div>
              <label htmlFor="field-estado" className="block font-bold text-slate-700 mb-1">
                Estado:
              </label>
              <select
                id="field-estado"
                value={estado}
                onChange={(e) => setEstado(e.target.value as SSTRecordStatus)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 font-bold text-slate-800 focus:ring-2 focus:ring-[#0A2958]"
              >
                <option value="BORRADOR">Borrador</option>
                <option value="PENDIENTE">Pendiente</option>
                <option value="EN_PROCESO">En Proceso</option>
                <option value="CERRADO">Cerrado</option>
              </select>
            </div>
          </div>

          {/* Supervisor & Worker Lookup */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="field-supervisor" className="block font-bold text-slate-700 mb-1">
                Supervisor de Área:
              </label>
              <input
                id="field-supervisor"
                type="text"
                value={supervisor}
                onChange={(e) => setSupervisor(e.target.value)}
                placeholder="Nombre del supervisor"
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:ring-2 focus:ring-[#0A2958]"
              />
            </div>

            <div>
              <label htmlFor="field-trabajador" className="block font-bold text-slate-700 mb-1">
                Trabajador Asociado (del Maestro de Personal):
              </label>
              <select
                id="field-trabajador"
                value={cedulaTrabajador}
                onChange={(e) => handleWorkerChange(e.target.value)}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-slate-800 focus:ring-2 focus:ring-[#0A2958]"
              >
                <option value="">-- No aplica / Inspección general de área --</option>
                {workers
                  .filter((w) => w.estado === 'ACTIVO')
                  .map((w) => (
                    <option key={w.cedula} value={w.cedula}>
                      {w.cedula} - {w.nombre} ({w.puesto})
                    </option>
                  ))}
              </select>
            </div>
          </div>

          {/* Worker preview badge if selected */}
          {cedulaTrabajador && nombreTrabajador && (
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-2.5 flex items-center justify-between text-blue-900">
              <div>
                <span className="font-bold">{nombreTrabajador}</span>
                <span className="text-[11px] text-blue-700 ml-2">({puestoTrabajador})</span>
              </div>
              <span className="text-[10px] font-bold bg-white px-2 py-0.5 rounded border border-blue-200">
                C.C. {cedulaTrabajador}
              </span>
            </div>
          )}

          {/* Observaciones */}
          <div>
            <label htmlFor="field-observaciones" className="block font-bold text-slate-700 mb-1">
              Observaciones / Descripción del Registro: <span className="text-red-500">*</span>
            </label>
            <textarea
              id="field-observaciones"
              rows={3}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder="Detalla los hallazgos, condiciones observadas, elementos inspeccionados o novedad..."
              className="w-full rounded-lg border border-slate-200 p-3 text-slate-800 focus:ring-2 focus:ring-[#0A2958]"
              required
            />
          </div>

          {/* Hallazgos y Acciones */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label htmlFor="field-hallazgos" className="block font-bold text-slate-700 mb-1">Hallazgos / Desviaciones:</label>
              <textarea
                id="field-hallazgos"
                rows={2}
                value={hallazgos}
                onChange={(e) => setHallazgos(e.target.value)}
                placeholder="Condiciones subestándar o no conformidades identificadas..."
                className="w-full rounded-lg border border-slate-200 p-2.5 text-slate-800 focus:ring-2 focus:ring-[#0A2958]"
              />
            </div>
            <div>
              <label htmlFor="field-acciones" className="block font-bold text-slate-700 mb-1">Acciones Inmediatas / Propuestas:</label>
              <textarea
                id="field-acciones"
                rows={2}
                value={accionesPropuestas}
                onChange={(e) => setAccionesPropuestas(e.target.value)}
                placeholder="Medidas correctivas aplicadas o por ejecutar..."
                className="w-full rounded-lg border border-slate-200 p-2.5 text-slate-800 focus:ring-2 focus:ring-[#0A2958]"
              />
            </div>
          </div>

          {/* Evidence Upload */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-bold text-slate-700 flex items-center gap-1.5">
                <Camera className="h-4 w-4 text-[#0A2958]" />
                <span>Evidencias Fotográficas y Adjuntos:</span>
              </label>
              <label className="cursor-pointer inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2.5 py-1 text-slate-700 hover:bg-slate-50 font-bold">
                <Upload className="h-3.5 w-3.5 text-[#0A2958]" />
                <span>Adjuntar archivo/foto</span>
                <input
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
            </div>

            {evidencias.length === 0 ? (
              <p className="text-slate-400 italic py-2">No se han adjuntado evidencias a este registro.</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
                {evidencias.map((ev) => (
                  <div key={ev.id} className="relative rounded-lg border border-slate-200 bg-slate-50 p-2 text-center group">
                    <span className="block truncate text-[11px] font-semibold text-slate-700">{ev.nombre}</span>
                    <span className="text-[10px] text-slate-600">{ev.tamanoKb || 150} KB</span>
                    <button
                      type="button"
                      onClick={() => removeEvidence(ev.id)}
                      className="absolute -top-1.5 -right-1.5 rounded-full bg-red-600 p-0.5 text-white shadow-xs hover:bg-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="inline-flex items-center gap-2 rounded-lg bg-[#E60000] px-5 py-2 text-xs font-bold text-white hover:bg-red-700 shadow-md"
          >
            <Save className="h-4 w-4" />
            <span>Guardar Registro SST</span>
          </button>
        </div>
      </div>
    </div>
  );
};
