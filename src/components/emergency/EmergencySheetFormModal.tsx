import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Save,
  Camera,
  Flame,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Trash2,
  Building2,
  Calendar,
} from 'lucide-react';
import { EmergencySheetData, EmergencySheetRow } from '../../types/emergency';
import { useAuth } from '../../context/AuthContext';
import { useSST } from '../../context/SSTContext';
import { storageService } from '../../services/storageService';
import { googleDriveService } from '../../services/googleDriveService';
import { CATALOGO_AREAS, getAnioFecha, getMesEspanol } from '../../types/epp';
import { SignaturePad } from '../common/SignaturePad';

interface EmergencySheetFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheet: EmergencySheetData | null;
  rowToEdit?: EmergencySheetRow | null;
  onSaved?: (message: string) => void;
}

const normalizeHeader = (text: string): string =>
  String(text || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const isIdHeader = (header: string): boolean => {
  const n = normalizeHeader(header);
  return (
    n === 'id' ||
    n.startsWith('id ') ||
    n.endsWith(' id') ||
    n === 'idregistro' ||
    n === 'n registro' ||
    n === 'nro registro'
  );
};

const compressImageDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('No se pudo leer la imagen.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => resolve(String(reader.result || ''));
      img.onload = () => {
        const maxSide = 1200;
        let { width, height } = img;
        if (width > maxSide || height > maxSide) {
          if (width > height) {
            height = Math.round((height * maxSide) / width);
            width = maxSide;
          } else {
            width = Math.round((width * maxSide) / height);
            height = maxSide;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(String(reader.result || ''));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.78));
      };
      img.src = String(reader.result || '');
    };
    reader.readAsDataURL(file);
  });
};

const generateRowId = (sheetName: string): string => {
  const prefix =
    normalizeHeader(sheetName)
      .replace(/[^a-z0-9]/g, '')
      .slice(0, 3)
      .toUpperCase() || 'EMG';
  const rand = Math.floor(1000 + Math.random() * 9000);
  const tail = Date.now().toString().slice(-4);
  return `${prefix}-${tail}${rand}`;
};

export const EmergencySheetFormModal: React.FC<EmergencySheetFormModalProps> = ({
  isOpen,
  onClose,
  sheet,
  rowToEdit,
  onSaved,
}) => {
  const { user, activeSiteId } = useAuth();
  const { workers } = useSST();
  const sedes = useMemo(() => storageService.getSedes(), []);

  const [values, setValues] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isAdmin = user?.role === 'admin';
  const userSiteId = user?.siteId || '';
  const scopedSiteId =
    !isAdmin && userSiteId && userSiteId !== 'TODAS'
      ? userSiteId.trim()
      : activeSiteId && activeSiteId !== 'TODAS'
      ? activeSiteId.trim()
      : '';

  const availableSedes = useMemo(() => {
    if (!scopedSiteId) return sedes;
    const filtered = sedes.filter(
      (s) => s.id.toUpperCase() === scopedSiteId.toUpperCase()
    );
    return filtered.length > 0 ? filtered : sedes;
  }, [sedes, scopedSiteId]);

  const resolveSedeCode = (rawVal: string): string => {
    const raw = String(rawVal || '').trim();
    if (!raw) return '';
    const upper = raw.toUpperCase();
    const matched = sedes.find(
      (s) =>
        s.id.toUpperCase() === upper ||
        s.codigo.toUpperCase() === upper ||
        upper.startsWith(s.codigo.toUpperCase() + ' ') ||
        upper.startsWith(s.codigo.toUpperCase() + '—') ||
        upper.startsWith(s.codigo.toUpperCase() + '-') ||
        s.nombre.toUpperCase() === upper
    );
    return matched ? matched.id : raw;
  };

  const defaultSede = useMemo(() => {
    if (scopedSiteId) return scopedSiteId;
    return sedes[0]?.id || 'MG-MG';
  }, [scopedSiteId, sedes]);

  // Identify Sede header on this sheet so workers/supervisors filter cleanly
  const sedeHeaderName = useMemo(() => {
    if (!sheet) return '';
    return sheet.headers.find((h) => normalizeHeader(h).includes('sede')) || '';
  }, [sheet]);

  const currentFormSede = (sedeHeaderName ? values[sedeHeaderName] : '') || defaultSede;

  // Supervisors from Maestro scoped to currentFormSede (excluding JERSSON SUAREZ)
  const supervisorOptions = useMemo(() => {
    const cleanSede = currentFormSede.trim().toUpperCase();
    const list = workers
      .filter((w) => {
        if (w.estado !== 'ACTIVO') return false;
        const cargo = String(w.puesto || '').toUpperCase();
        if (!cargo.includes('SUPERVISOR')) return false;
        if (String(w.nombre || '').trim().toUpperCase() === 'JERSSON SUAREZ') return false;
        if (cleanSede && cleanSede !== 'TODAS') {
          return String(w.sedeId || '').trim().toUpperCase() === cleanSede;
        }
        return true;
      })
      .map((w) => w.nombre);
    return Array.from(new Set(list)).sort();
  }, [workers, currentFormSede]);

  // Workers scoped to currentFormSede for Cedula / Inspector lookup
  const scopedWorkers = useMemo(() => {
    const cleanSede = currentFormSede.trim().toUpperCase();
    return workers.filter((w) => {
      if (w.estado !== 'ACTIVO') return false;
      if (cleanSede && cleanSede !== 'TODAS') {
        return String(w.sedeId || '').trim().toUpperCase() === cleanSede;
      }
      return true;
    });
  }, [workers, currentFormSede]);

  useEffect(() => {
    if (!isOpen || !sheet) return;
    setErrorMsg(null);

    const todayISO = new Date().toISOString().split('T')[0];
    const initial: Record<string, string> = {};

    sheet.headers.forEach((header, idx) => {
      const n = normalizeHeader(header);
      const existing = rowToEdit?.values?.[header];

      if (rowToEdit) {
        if (n.includes('sede')) {
          if (!isAdmin && userSiteId && userSiteId !== 'TODAS') {
            initial[header] = userSiteId.trim();
          } else {
            initial[header] = resolveSedeCode(existing !== undefined ? String(existing) : '');
          }
        } else {
          initial[header] = existing !== undefined ? String(existing) : '';
        }
        return;
      }

      // Smart defaults for new inspection row
      if (idx === 0 && (n.startsWith('id') || n.includes('codigo') || n.includes('consecutivo'))) {
        initial[header] = generateRowId(sheet.sheetName);
      } else if (n === 'fecha' || n === 'fecha inspeccion' || n === 'fecha registro') {
        initial[header] = todayISO;
      } else if (n === 'ano' || n === 'año') {
        initial[header] = String(getAnioFecha(todayISO));
      } else if (n === 'mes') {
        initial[header] = String(getMesEspanol(todayISO));
      } else if (n.includes('sede')) {
        initial[header] = defaultSede;
      } else if (n.includes('inspector') || (n.includes('responsable') && !n.includes('firma'))) {
        initial[header] = user?.displayName || '';
      } else {
        initial[header] = '';
      }
    });

    setValues(initial);
  }, [isOpen, sheet, rowToEdit, defaultSede, user]);

  if (!isOpen || !sheet) return null;

  const handleFieldChange = (header: string, newVal: string) => {
    const n = normalizeHeader(header);
    setValues((prev) => {
      const next: Record<string, string> = { ...prev, [header]: newVal };

      // Sync Año / Mes when primary Fecha changes
      if (n === 'fecha' || n === 'fecha inspeccion' || n === 'fecha registro') {
        if (/^\d{4}-\d{2}-\d{2}$/.test(newVal)) {
          sheet.headers.forEach((h) => {
            const nh = normalizeHeader(h);
            if (nh === 'ano' || nh === 'año') next[h] = String(getAnioFecha(newVal));
            if (nh === 'mes') next[h] = String(getMesEspanol(newVal));
          });
        }
      }

      // Auto-fill worker fields when Cedula matches Maestro
      if (n.includes('cedula') || n.includes('documento') || n.includes('identificacion')) {
        const cleanDoc = newVal.split(' - ')[0].trim();
        next[header] = cleanDoc;
        const matchedWorker = scopedWorkers.find(
          (w) => String(w.cedula).trim() === cleanDoc
        );
        if (matchedWorker) {
          sheet.headers.forEach((h) => {
            const nh = normalizeHeader(h);
            if (nh === 'nombre' || nh.includes('nombre trabajador') || nh === 'trabajador') {
              next[h] = matchedWorker.nombre;
            } else if (nh === 'cargo' || nh === 'labor' || nh === 'puesto') {
              next[h] = matchedWorker.puesto;
            } else if (nh === 'area' && matchedWorker.area) {
              next[h] = matchedWorker.area;
            } else if (
              nh.includes('supervisor') &&
              matchedWorker.supervisor &&
              matchedWorker.supervisor.toUpperCase() !== 'JERSSON SUAREZ'
            ) {
              next[h] = matchedWorker.supervisor;
            }
          });
        }
      }

      return next;
    });
  };

  const handleImageUpload = async (header: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await compressImageDataUrl(file);
      handleFieldChange(header, dataUrl);
    } catch {
      setErrorMsg('No se pudo procesar la imagen seleccionada.');
    }
  };

  const getFieldKind = (header: string, idx: number) => {
    const n = normalizeHeader(header);
    if (n.includes('firma')) return 'signature';
    if (n.includes('foto') || n.includes('imagen') || n.includes('evidencia')) return 'image';
    if (
      n.includes('observacion') ||
      n.includes('hallazgo') ||
      n.includes('accion') ||
      n.includes('comentario') ||
      n.includes('recomendacion') ||
      n.includes('novedad')
    ) {
      return 'textarea';
    }
    if (n.includes('sede')) return 'sede';
    if (n.includes('fecha') || n.includes('vencimiento') || n.includes('recarga') || n.includes('proxima')) {
      return 'date';
    }
    if (n.includes('cedula') || n.includes('documento') || n.includes('identificacion')) {
      return 'cedula';
    }
    if (n.includes('supervisor')) return 'supervisor';
    if (n === 'area' || n.includes('area')) return 'area';
    if (idx === 0 && (n.startsWith('id') || n.includes('codigo') || n.includes('consecutivo'))) {
      return 'id';
    }
    return 'text';
  };

  const getSmartSuggestions = (header: string): string[] => {
    const n = normalizeHeader(header);
    const fromSheet = sheet.suggestions?.[header] || [];
    const merged = new Set<string>(fromSheet);

    if (n === 'area' || n.includes('area')) {
      CATALOGO_AREAS.forEach((a) => merged.add(a));
    } else if (n.includes('supervisor')) {
      supervisorOptions.forEach((s) => merged.add(s));
    } else if (
      n.includes('estado') ||
      n.includes('condicion') ||
      n.includes('presion') ||
      n.includes('manometro') ||
      n.includes('manguera') ||
      n.includes('boquilla') ||
      n.includes('cilindro') ||
      n.includes('pintura') ||
      n.includes('soporte') ||
      n.includes('ruedas') ||
      n.includes('correas') ||
      n.includes('limpieza') ||
      n.includes('autonomia') ||
      n.includes('bateria')
    ) {
      ['BUENO', 'REGULAR', 'MALO', 'N/A'].forEach((opt) => merged.add(opt));
    } else if (
      n.includes('senalizacion') ||
      n.includes('señalizacion') ||
      n.includes('acceso') ||
      n.includes('despejado') ||
      n.includes('precinto') ||
      n.includes('pasador') ||
      n.includes('etiqueta') ||
      n.includes('cumple') ||
      n.includes('funciona') ||
      n.includes('completo')
    ) {
      ['SI', 'NO', 'N/A'].forEach((opt) => merged.add(opt));
    }

    return Array.from(merged);
  };

  const isFieldRequired = (header: string, idx: number, kind: string): boolean => {
    if (isIdHeader(header)) return false;
    const n = normalizeHeader(header);
    if (kind === 'textarea' || kind === 'image' || kind === 'signature') return false;
    if (n.includes('observa') || n.includes('comentario') || n.includes('nota')) return false;
    if (idx === 0 || kind === 'sede' || n === 'fecha' || n === 'fecha inspeccion') return true;
    return false;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    // Validate critical required fields
    for (let i = 0; i < sheet.headers.length; i++) {
      const h = sheet.headers[i];
      const kind = getFieldKind(h, i);
      if (isFieldRequired(h, i, kind) && !String(values[h] || '').trim()) {
        setErrorMsg(`El campo "${h}" es obligatorio.`);
        return;
      }
    }

    setIsSaving(true);
    try {
      const firstHeader = sheet.headers[0];
      const rowId = String(values[firstHeader] || rowToEdit?.rowId || generateRowId(sheet.sheetName)).trim();
      const enforcedValues: Record<string, string> = { ...values };
      if (!isAdmin && userSiteId && userSiteId !== 'TODAS' && sedeHeaderName) {
        enforcedValues[sedeHeaderName] = userSiteId.trim();
      }
      const rowPayload: EmergencySheetRow = {
        rowNumber: rowToEdit?.rowNumber,
        rowId,
        values: {
          ...enforcedValues,
          ...(firstHeader ? { [firstHeader]: rowId } : {}),
        },
      };

      const remoteRes = await googleDriveService.saveEmergencyRowToDrive(sheet.sheetName, rowPayload);

      const finalRow: EmergencySheetRow = {
        ...rowPayload,
        rowNumber: remoteRes.row || rowPayload.rowNumber,
        rowId: remoteRes.rowId || rowPayload.rowId,
      };

      storageService.upsertEmergencySheetRow(sheet.sheetName, finalRow, {
        email: user?.email || 'sst@mgconsultores.com',
        name: user?.displayName || 'Responsable SST',
      });

      if (onSaved) {
        onSaved(remoteRes.message);
      }
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'Error al guardar el registro.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0A2958] via-[#123970] to-[#0A2958] text-white p-5 flex items-start justify-between border-b-2 border-[#EA580C]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <Flame className="w-5 h-5 text-orange-300" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-white bg-[#EA580C] px-2.5 py-0.5 rounded-full">
                Hoja Drive: {sheet.sheetName}
              </span>
              <h2 className="text-lg font-bold text-white mt-1">
                {rowToEdit
                  ? `Editar Inspección — ${sheet.sheetName}`
                  : `Nuevo Registro — ${sheet.sheetName}`}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5 max-h-[80vh] overflow-y-auto text-xs">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-800 flex items-center gap-2 font-semibold">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sheet.headers.map((header, idx) => {
              if (isIdHeader(header)) return null;
              const kind = getFieldKind(header, idx);
              const val = values[header] ?? '';
              const required = isFieldRequired(header, idx, kind);
              const datalistId = `em-dl-${idx}-${header.replace(/[^a-zA-Z0-9]/g, '')}`;
              const suggestions = getSmartSuggestions(header);

              if (kind === 'textarea') {
                return (
                  <div key={header} className="md:col-span-2 space-y-1.5">
                    <label className="block font-bold text-[#0A2958]">
                      {header}
                    </label>
                    <textarea
                      rows={3}
                      value={val}
                      onChange={(e) => handleFieldChange(header, e.target.value)}
                      placeholder={`Ingresa ${header.toLowerCase()}...`}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
                    />
                  </div>
                );
              }

              if (kind === 'signature') {
                const isDriveRef = val && !val.startsWith('data:image');
                return (
                  <div key={header} className="md:col-span-2 space-y-2">
                    {isDriveRef && (
                      <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 text-emerald-800">
                        <span className="font-semibold flex items-center gap-1.5">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                          Firma registrada en Drive ({val})
                        </span>
                        <button
                          type="button"
                          onClick={() => handleFieldChange(header, '')}
                          className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
                        >
                          Cambiar firma
                        </button>
                      </div>
                    )}
                    {!isDriveRef && (
                      <SignaturePad
                        label={header}
                        value={val}
                        onChange={(dataUrl) => handleFieldChange(header, dataUrl)}
                      />
                    )}
                  </div>
                );
              }

              if (kind === 'image') {
                const isBase64 = val.startsWith('data:image');
                const isDriveRef = Boolean(val && !isBase64);
                return (
                  <div key={header} className="md:col-span-2 space-y-2">
                    <label className="block font-bold text-[#0A2958]">{header}</label>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-xl border border-dashed border-slate-300 bg-slate-50">
                      <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0A2958] hover:bg-[#123970] text-white font-bold cursor-pointer transition-colors w-fit">
                        <Camera className="w-4 h-4" />
                        <span>{val ? 'Reemplazar Foto / Evidencia' : 'Adjuntar o Tomar Foto'}</span>
                        <input
                          type="file"
                          accept="image/*"
                          capture="environment"
                          onChange={(e) => handleImageUpload(header, e)}
                          className="hidden"
                        />
                      </label>

                      {isBase64 && (
                        <div className="flex items-center gap-3">
                          <img
                            src={val}
                            alt={header}
                            className="h-16 w-16 object-cover rounded-lg border border-slate-300"
                          />
                          <button
                            type="button"
                            onClick={() => handleFieldChange(header, '')}
                            className="inline-flex items-center gap-1 text-red-600 font-semibold hover:underline cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Quitar</span>
                          </button>
                        </div>
                      )}

                      {isDriveRef && (
                        <div className="flex items-center gap-2 text-emerald-700 font-semibold">
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="truncate max-w-xs">{val}</span>
                          <button
                            type="button"
                            onClick={() => handleFieldChange(header, '')}
                            className="text-red-600 hover:underline cursor-pointer ml-1"
                          >
                            Quitar
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              }

              if (kind === 'sede') {
                const locked = !isAdmin && Boolean(userSiteId && userSiteId !== 'TODAS');
                const knownIds = new Set(availableSedes.map((s) => s.id));
                return (
                  <div key={header} className="space-y-1.5">
                    <label className="block font-bold text-[#0A2958]">
                      {header} {required && <span className="text-[#E60000]">*</span>}
                    </label>
                    <div className="relative">
                      <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <select
                        value={val}
                        onChange={(e) => handleFieldChange(header, e.target.value)}
                        disabled={locked}
                        required={required}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0A2958] disabled:bg-slate-100"
                      >
                        {!scopedSiteId && <option value="">Seleccionar Sede...</option>}
                        {val && !knownIds.has(val) && !scopedSiteId && (
                          <option value={val}>{val}</option>
                        )}
                        {availableSedes.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.codigo}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                );
              }

              if (kind === 'date') {
                const isIso = !val || /^\d{4}-\d{2}-\d{2}$/.test(val);
                return (
                  <div key={header} className="space-y-1.5">
                    <label className="block font-bold text-[#0A2958]">
                      {header} {required && <span className="text-[#E60000]">*</span>}
                    </label>
                    <div className="relative">
                      <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type={isIso ? 'date' : 'text'}
                        value={val}
                        onChange={(e) => handleFieldChange(header, e.target.value)}
                        required={required}
                        className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
                      />
                    </div>
                  </div>
                );
              }

              if (kind === 'cedula') {
                return (
                  <div key={header} className="space-y-1.5">
                    <label className="block font-bold text-[#0A2958]">
                      {header} {required && <span className="text-[#E60000]">*</span>}
                    </label>
                    <input
                      type="text"
                      list={datalistId}
                      value={val}
                      onChange={(e) => handleFieldChange(header, e.target.value)}
                      required={required}
                      placeholder="Buscar cédula o nombre del trabajador..."
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
                    />
                    <datalist id={datalistId}>
                      {scopedWorkers.slice(0, 300).map((w) => (
                        <option key={w.id} value={`${w.cedula} - ${w.nombre}`} />
                      ))}
                    </datalist>
                  </div>
                );
              }

              return (
                <div key={header} className="space-y-1.5">
                  <label className="block font-bold text-[#0A2958]">
                    {header} {required && <span className="text-[#E60000]">*</span>}
                  </label>
                  <input
                    type="text"
                    list={suggestions.length > 0 ? datalistId : undefined}
                    value={val}
                    onChange={(e) => handleFieldChange(header, e.target.value)}
                    required={required}
                    placeholder={
                      suggestions.length > 0
                        ? `Seleccionar o escribir ${header.toLowerCase()}...`
                        : `Ingresa ${header.toLowerCase()}...`
                    }
                    className={`w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0A2958] ${
                      kind === 'id' ? 'font-mono font-bold text-[#0A2958] bg-slate-50' : ''
                    }`}
                  />
                  {suggestions.length > 0 && (
                    <datalist id={datalistId}>
                      {suggestions.map((opt) => (
                        <option key={opt} value={opt} />
                      ))}
                    </datalist>
                  )}
                </div>
              );
            })}
          </div>

          {/* Footer actions */}
          <div className="pt-4 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#EA580C] hover:bg-orange-700 text-white text-xs font-bold shadow-md transition-colors disabled:opacity-60 cursor-pointer"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Guardando en Drive...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>{rowToEdit ? 'Actualizar en Drive' : `Guardar en ${sheet.sheetName}`}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
