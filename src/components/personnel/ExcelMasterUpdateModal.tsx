import React, { useState } from 'react';
import {
  UploadCloud,
  Download,
  AlertCircle,
  CheckCircle,
  FileSpreadsheet,
  X,
  UserPlus,
  RefreshCw,
  UserX,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { personnelService } from '../../services/personnelService';
import { storageService } from '../../services/storageService';
import { useAuth } from '../../context/AuthContext';
import { MasterImportDiff, MasterImportHistory } from '../../types';

interface ExcelMasterUpdateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ExcelMasterUpdateModal: React.FC<ExcelMasterUpdateModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [isFullReplacement, setIsFullReplacement] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [diff, setDiff] = useState<MasterImportDiff | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [confirmInactive, setConfirmInactive] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    analyzeFile(selected, isFullReplacement);
  };

  const handleModeChange = (fullMode: boolean) => {
    setIsFullReplacement(fullMode);
    if (file) {
      analyzeFile(file, fullMode);
    }
  };

  const analyzeFile = async (targetFile: File, fullMode: boolean) => {
    setIsAnalyzing(true);
    setAnalysisError(null);
    setDiff(null);
    try {
      const result = await personnelService.parseAndValidateExcel(targetFile, fullMode);
      setDiff(result);
    } catch (err: any) {
      setAnalysisError(err.message || 'Error al procesar el archivo Excel.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyChanges = async () => {
    if (!diff || !user) return;
    setIsSaving(true);
    try {
      const auditUser = {
        email: user.email,
        name: user.displayName,
      };

      // 1. Prepare list of workers to upsert (new + updated)
      const workersToUpsert = [
        ...diff.newWorkers,
        ...diff.updatedWorkers.map((u) => u.updated),
      ];

      if (workersToUpsert.length > 0) {
        storageService.bulkUpsertWorkers(workersToUpsert, auditUser);
      }

      // 2. If full replacement and user confirmed inactive marking
      let markedInactiveCount = 0;
      if (isFullReplacement && confirmInactive && diff.missingInFile.length > 0) {
        const cedulasToMark = diff.missingInFile.map((w) => w.cedula);
        storageService.markWorkersInactive(cedulasToMark, auditUser);
        markedInactiveCount = cedulasToMark.length;
      }

      // 3. Save import history log
      const historyEntry: MasterImportHistory = {
        id: 'imp-' + Date.now(),
        fecha: new Date().toISOString(),
        usuarioEmail: user.email,
        usuarioNombre: user.displayName,
        nombreArchivo: file?.name || 'Maestro_Actualizado.xlsx',
        tipoCarga: isFullReplacement ? 'COMPLETA' : 'PARCIAL',
        totalLeidos: diff.totalInFile,
        nuevos: diff.newWorkers.length,
        actualizados: diff.updatedWorkers.length,
        marcadosInactivos: markedInactiveCount,
        erroresCount: diff.validationErrors.length,
      };
      storageService.saveImportHistory(historyEntry);

      onSuccess();
      onClose();
    } catch (err: any) {
      setAnalysisError('Error al guardar cambios: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const hasCriticalErrors = (diff?.validationErrors.length || 0) > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl bg-white shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 bg-[#0A2958] px-6 py-4 text-white">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-600/30 border border-red-500/40 text-white">
              <FileSpreadsheet className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">Actualizar Maestro de Personal</h2>
              <p className="text-xs text-slate-300">
                Carga masiva, validación de columnas y control estricto de novedades
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

        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Step 1: Download Template */}
          <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-xs font-bold text-[#0A2958] flex items-center gap-1.5">
                <Info className="h-4 w-4 text-blue-600" />
                Paso 1: Descarga la Plantilla Oficial de Excel
              </h3>
              <p className="text-xs text-slate-600 mt-0.5">
                Utiliza las columnas requeridas: Cédula, Nombre, Fecha Nacimiento, Edad, Género, Sede, Fecha Ingreso, Puesto, EPS, ARL.
              </p>
            </div>
            <button
              onClick={() => personnelService.downloadTemplate()}
              className="inline-flex items-center gap-2 rounded-lg bg-[#0A2958] px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-900 transition-colors flex-shrink-0"
            >
              <Download className="h-4 w-4" />
              <span>Descargar Plantilla (.xlsx)</span>
            </button>
          </div>

          {/* Step 2: Choose Upload Type */}
          <div>
            <label className="block text-xs font-bold text-[#0A2958] mb-1.5">
              Paso 2: Tipo de Actualización
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => handleModeChange(false)}
                className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                  !isFullReplacement
                    ? 'border-[#0A2958] bg-blue-50/40 ring-1 ring-[#0A2958]'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="mode"
                    checked={!isFullReplacement}
                    onChange={() => handleModeChange(false)}
                    className="text-[#0A2958]"
                  />
                  <span className="text-xs font-bold text-slate-800">Carga Parcial / Novedades</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 pl-5">
                  Inserta nuevos trabajadores y actualiza existentes. <strong>NUNCA</strong> modifica ni desactiva trabajadores no presentes.
                </p>
              </div>

              <div
                onClick={() => handleModeChange(true)}
                className={`cursor-pointer rounded-xl border p-3.5 transition-all ${
                  isFullReplacement
                    ? 'border-[#E60000] bg-red-50/40 ring-1 ring-[#E60000]'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="mode"
                    checked={isFullReplacement}
                    onChange={() => handleModeChange(true)}
                    className="text-[#E60000]"
                  />
                  <span className="text-xs font-bold text-slate-800">Carga Completa del Maestro</span>
                </div>
                <p className="text-[11px] text-slate-500 mt-1 pl-5">
                  El archivo contiene la totalidad de la nómina. Detecta y propone marcar como <strong>inactivos</strong> a los trabajadores ausentes.
                </p>
              </div>
            </div>
          </div>

          {/* Step 3: File Input */}
          <div>
            <label className="block text-xs font-bold text-[#0A2958] mb-1.5">
              Paso 3: Selecciona o arrastra el archivo Excel (.xlsx / .xls)
            </label>
            <label className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 p-6 hover:border-[#0A2958] hover:bg-slate-50/80 cursor-pointer transition-all">
              <UploadCloud className="h-10 w-10 text-slate-400 mb-2" />
              <span className="text-xs font-bold text-[#0A2958]">
                {file ? file.name : 'Haz clic para seleccionar el archivo Excel'}
              </span>
              <span className="text-[11px] text-slate-600 mt-1">
                Formatos compatibles: .xlsx, .xls, .csv (La hoja Maestro ADM se omitirá)
              </span>
              <input
                type="file"
                accept=".xlsx, .xls, .csv"
                onChange={handleFileChange}
                className="hidden"
              />
            </label>
          </div>

          {/* Analysis Loading */}
          {isAnalyzing && (
            <div className="flex items-center justify-center p-6 text-xs text-[#0A2958] font-bold gap-2">
              <RefreshCw className="h-4 w-4 animate-spin text-[#E60000]" />
              <span>Validando estructura y comparando con la base de datos...</span>
            </div>
          )}

          {/* Analysis Error */}
          {analysisError && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700 flex items-start gap-2.5">
              <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Error durante el análisis del archivo:</p>
                <p className="mt-0.5">{analysisError}</p>
              </div>
            </div>
          )}

          {/* Step 4: Preview Diff Summary */}
          {diff && (
            <div className="space-y-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                <h3 className="text-xs font-bold text-[#0A2958] uppercase tracking-wider">
                  Resumen Previo de Validación (Pre-Visualización)
                </h3>
                <span className="text-xs text-slate-500 font-semibold">
                  Total filas leídas: {diff.totalInFile}
                </span>
              </div>

              {/* Counters Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3">
                  <div className="flex items-center gap-1.5 text-emerald-800 font-bold">
                    <UserPlus className="h-4 w-4" />
                    <span>Nuevos:</span>
                  </div>
                  <span className="text-xl font-black text-emerald-700 mt-1 block">
                    {diff.newWorkers.length}
                  </span>
                </div>

                <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
                  <div className="flex items-center gap-1.5 text-blue-800 font-bold">
                    <RefreshCw className="h-4 w-4" />
                    <span>Modificados:</span>
                  </div>
                  <span className="text-xl font-black text-blue-700 mt-1 block">
                    {diff.updatedWorkers.length}
                  </span>
                </div>

                <div className="rounded-lg border border-slate-200 bg-white p-3">
                  <div className="flex items-center gap-1.5 text-slate-700 font-bold">
                    <CheckCircle className="h-4 w-4 text-slate-500" />
                    <span>Sin cambios:</span>
                  </div>
                  <span className="text-xl font-black text-slate-600 mt-1 block">
                    {diff.unchangedCount}
                  </span>
                </div>

                <div
                  className={`rounded-lg border p-3 ${
                    diff.missingInFile.length > 0 && isFullReplacement
                      ? 'border-amber-300 bg-amber-50 text-amber-900'
                      : 'border-slate-200 bg-white text-slate-500'
                  }`}
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    <UserX className="h-4 w-4" />
                    <span>No en archivo:</span>
                  </div>
                  <span className="text-xl font-black mt-1 block">
                    {diff.missingInFile.length}
                  </span>
                </div>
              </div>

              {/* Validation Errors Table */}
              {diff.validationErrors.length > 0 && (
                <div className="rounded-lg border border-red-300 bg-red-50 p-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-red-800 mb-2">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <span>
                      Se detectaron {diff.validationErrors.length} errores críticos. Corrige el archivo antes de continuar:
                    </span>
                  </div>
                  <div className="max-h-36 overflow-y-auto space-y-1 text-[11px] text-red-700 font-mono">
                    {diff.validationErrors.map((err, i) => (
                      <div key={i} className="bg-white/80 p-1.5 rounded border border-red-200">
                        <strong>Fila {err.row}:</strong> {err.cedula ? `[C.C. ${err.cedula}] ` : ''}
                        {err.error}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Modifications Details Preview */}
              {diff.updatedWorkers.length > 0 && (
                <div className="rounded-lg border border-blue-200 bg-white p-3">
                  <p className="text-xs font-bold text-[#0A2958] mb-1.5">
                    Detalle de modificaciones detectadas ({diff.updatedWorkers.length}):
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1 text-xs">
                    {diff.updatedWorkers.slice(0, 10).map((u, i) => (
                      <div key={i} className="border-b border-slate-100 pb-1">
                        <span className="font-bold text-slate-800">
                          {u.updated.nombre} (C.C. {u.updated.cedula}):
                        </span>{' '}
                        <span className="text-blue-700">{u.changes.join(' | ')}</span>
                      </div>
                    ))}
                    {diff.updatedWorkers.length > 10 && (
                      <p className="text-[11px] text-slate-600 italic">
                        ...y {diff.updatedWorkers.length - 10} trabajadores más con cambios.
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Missing in file warning (Full mode) */}
              {isFullReplacement && diff.missingInFile.length > 0 && (
                <div className="rounded-lg border border-amber-300 bg-amber-50 p-3">
                  <div className="flex items-start gap-2">
                    <input
                      type="checkbox"
                      id="confirmInactive"
                      checked={confirmInactive}
                      onChange={(e) => setConfirmInactive(e.target.checked)}
                      className="mt-0.5 text-amber-600 rounded"
                    />
                    <label htmlFor="confirmInactive" className="text-xs text-amber-900 cursor-pointer">
                      <strong className="block text-amber-950">
                        Confirmar marcación como INACTIVOS ({diff.missingInFile.length} trabajadores)
                      </strong>
                      Se conservarán intactos todos los registros históricos, inspecciones y entregas asociadas. Ningún dato se eliminará físicamente.
                    </label>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="rounded-lg border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors"
          >
            Cancelar
          </button>

          <button
            onClick={handleApplyChanges}
            disabled={!diff || hasCriticalErrors || isSaving || isAnalyzing}
            className={`inline-flex items-center gap-2 rounded-lg px-5 py-2 text-xs font-bold text-white transition-all ${
              !diff || hasCriticalErrors || isSaving || isAnalyzing
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-[#E60000] hover:bg-red-700 shadow-md hover:scale-[1.01]'
            }`}
          >
            {isSaving ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>Aplicando Actualización Segura...</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>Confirmar y Aplicar al Maestro</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
