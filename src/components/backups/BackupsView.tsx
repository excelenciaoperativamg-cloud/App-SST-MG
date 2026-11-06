import React, { useState } from 'react';
import {
  DownloadCloud,
  UploadCloud,
  Database,
  FileCheck,
  AlertTriangle,
  History,
  ShieldCheck,
  Server,
  Terminal,
  HelpCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { useSST } from '../../context/SSTContext';
import { useAuth } from '../../context/AuthContext';
import { storageService } from '../../services/storageService';
import { exportService } from '../../services/exportService';

export const BackupsView: React.FC = () => {
  const { workers, records, sedes, supervisores, epsList, arlList } = useSST();
  const { user, canAdmin } = useAuth();

  const [restoreFile, setRestoreFile] = useState<File | null>(null);
  const [restoreStatus, setRestoreStatus] = useState<{
    success?: boolean;
    message?: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<'manual' | 'automatic' | 'restore'>('manual');

  // Manual Full JSON Snapshot Backup
  const handleDownloadFullJSONBackup = () => {
    const backupData = storageService.createFullBackup({
      email: user?.email || 'admin@mgconsultores.com',
      name: user?.displayName || 'Administrador',
    });

    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(backupData, null, 2)
    )}`;
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', jsonString);
    downloadAnchor.setAttribute(
      'download',
      `Backup_Completo_SST_MG_${new Date().toISOString().split('T')[0]}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleDownloadPersonnelExcel = () => {
    exportService.exportPersonnelToExcel(workers, 'Respaldo_Maestro_Personal_MG');
  };

  const handleDownloadRecordsExcel = () => {
    exportService.exportRecordsToExcel(records, 'Respaldo_Todos_Registros_SST_MG');
  };

  // Restore logic
  const handleRestoreFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setRestoreFile(file);
    setRestoreStatus(null);
  };

  const handleExecuteRestore = () => {
    if (!restoreFile) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target?.result as string);
        const result = storageService.restoreFullBackup(parsed, {
          email: user?.email || 'admin@mgconsultores.com',
          name: user?.displayName || 'Administrador',
        });
        setRestoreStatus(result);
      } catch (err: any) {
        setRestoreStatus({
          success: false,
          message: 'Error al interpretar el archivo JSON de respaldo: ' + err.message,
        });
      }
    };
    reader.readAsText(restoreFile);
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[#0A2958] p-1 text-white">
              <DownloadCloud className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-black text-[#0A2958] sm:text-2xl">
              Respaldos y Exportación de Información
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Copias de seguridad integrales, respaldos automáticos en Cloud Storage y procedimientos de restauración para la continuidad del negocio.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('manual')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
            activeTab === 'manual'
              ? 'bg-[#0A2958] text-white shadow-sm'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Database className="h-4 w-4 text-[#E60000]" />
          <span>Respaldo Manual y Descargas</span>
        </button>

        <button
          onClick={() => setActiveTab('automatic')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
            activeTab === 'automatic'
              ? 'bg-[#0A2958] text-white shadow-sm'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Server className="h-4 w-4 text-blue-600" />
          <span>Arquitectura de Respaldo Automático</span>
        </button>

        <button
          onClick={() => setActiveTab('restore')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
            activeTab === 'restore'
              ? 'bg-[#0A2958] text-white shadow-sm'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <History className="h-4 w-4 text-emerald-600" />
          <span>Restauración y Recuperación</span>
        </button>
      </div>

      {/* TAB 1: MANUAL BACKUP */}
      {activeTab === 'manual' && (
        <div className="space-y-6">
          {/* Complete System Snapshot */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="rounded-full bg-red-100 text-[#E60000] border border-red-200 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                  Recomendado para Administradores
                </span>
                <h3 className="text-base font-black text-[#0A2958] mt-1.5">
                  Copia de Seguridad Completa del Sistema (Snapshot JSON)
                </h3>
                <p className="text-xs text-slate-600 mt-1 max-w-2xl">
                  Genera un archivo integral que contiene todas las colecciones: Maestro de Personal ({workers.length} registros), Todos los Registros SST ({records.length}), Sedes ({sedes.length}), Supervisores ({supervisores.length}), EPS, ARL y registro de trazabilidad. Este archivo es 100% restaurable.
                </p>
              </div>

              <button
                onClick={handleDownloadFullJSONBackup}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0A2958] px-5 py-3 text-xs font-bold text-white hover:bg-blue-900 shadow-md transition-all hover:scale-[1.02] flex-shrink-0"
              >
                <DownloadCloud className="h-4 w-4 text-[#E60000]" />
                <span>Generar y Descargar Respaldo Total (.json)</span>
              </button>
            </div>
          </div>

          {/* Module-by-Module Download Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <FileSpreadsheet className="h-6 w-6 text-emerald-600 mb-2" />
              <h4 className="text-sm font-bold text-slate-800">Maestro de Personal</h4>
              <p className="text-xs text-slate-500 mt-1">
                Exportación de todos los trabajadores activos e inactivos con cargos, sedes y afiliaciones.
              </p>
              <button
                onClick={handleDownloadPersonnelExcel}
                className="mt-4 w-full rounded-lg border border-slate-200 bg-slate-50 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Descargar Excel ({workers.length})
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <Database className="h-6 w-6 text-[#0A2958] mb-2" />
              <h4 className="text-sm font-bold text-slate-800">Todos los Registros SST</h4>
              <p className="text-xs text-slate-500 mt-1">
                Consolidado histórico de todas las inspecciones, entregas de EPP, rondas y reportes.
              </p>
              <button
                onClick={handleDownloadRecordsExcel}
                className="mt-4 w-full rounded-lg border border-slate-200 bg-slate-50 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Descargar Excel ({records.length})
              </button>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
              <ShieldCheck className="h-6 w-6 text-blue-600 mb-2" />
              <h4 className="text-sm font-bold text-slate-800">Catálogos Operativos</h4>
              <p className="text-xs text-slate-500 mt-1">
                Estructura de las 5 sedes, supervisores por área y tablas maestras de EPS y ARL.
              </p>
              <button
                onClick={handleDownloadFullJSONBackup}
                className="mt-4 w-full rounded-lg border border-slate-200 bg-slate-50 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
              >
                Exportar Catálogos
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: AUTOMATIC BACKUPS IN GOOGLE CLOUD */}
      {activeTab === 'automatic' && (
        <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div>
            <h3 className="text-base font-bold text-[#0A2958] flex items-center gap-2">
              <Server className="h-5 w-5 text-blue-600" />
              Estrategia y Arquitectura de Respaldo Automático (Cloud Firestore a GCS)
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Guía técnica y configuración para respaldos automáticos programados hacia buckets protegidos en Google Cloud Storage.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4">
              <h4 className="font-bold text-[#0A2958] mb-1">
                1. Exportación Programada con Cloud Scheduler y Cloud Functions
              </h4>
              <p className="text-slate-700">
                En el proyecto de Google Cloud / Firebase asociado a MG Consultores, se configura una tarea cron diaria (ej. medianoche 00:00 COT) que invoca la API administrada de Firestore:
              </p>
              <pre className="mt-2 rounded-lg bg-slate-900 p-3 text-slate-100 font-mono text-[11px] overflow-x-auto">
{`# Comando gcloud para exportar Firestore a bucket seguro:
gcloud firestore export gs://mg-consultores-sst-backups/$(date +%Y-%m-%d) \\
  --collection-ids='personnel,sst_records,sedes,supervisores,audit_logs'`}
              </pre>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
              <h4 className="font-bold text-slate-800 mb-1">
                2. Respaldo de Evidencias y Archivos (Firebase Storage)
              </h4>
              <p className="text-slate-600">
                Las fotografías y documentos adjuntos almacenados en el bucket de Firebase Storage se respaldan mediante reglas de retención y ciclo de vida de Google Cloud Storage (Object Lifecycle Management), manteniendo copias inmutables durante 5 años conforme a la normativa de SG-SST (Decreto 1072 de 2015).
              </p>
            </div>

            <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
              <h4 className="font-bold text-emerald-900 mb-1">
                3. Trazabilidad de Copias de Seguridad
              </h4>
              <p className="text-emerald-800">
                Cada evento de exportación o descarga de respaldo queda registrado automáticamente en el módulo de auditoría del sistema con el correo del administrador, fecha exacta, número de documentos y resultado de la operación.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: RESTORE */}
      {activeTab === 'restore' && (
        <div className="space-y-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
          <div>
            <h3 className="text-base font-bold text-[#0A2958] flex items-center gap-2">
              <History className="h-5 w-5 text-emerald-600" />
              Restauración de Información desde Copia de Seguridad
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Permite a un administrador autorizado restaurar la base de datos a partir de un archivo oficial de Snapshot JSON previamente generado.
            </p>
          </div>

          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-900 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Advertencia Crítica de Restauración:</p>
              <p className="mt-0.5">
                La restauración sincronizará la información con la copia cargada. Se recomienda generar una copia de seguridad del estado actual antes de proceder.
              </p>
            </div>
          </div>

          {/* Upload Restore File */}
          <div className="space-y-3">
            <label className="block text-xs font-bold text-slate-700">
              Seleccionar archivo de respaldo (.json):
            </label>
            <div className="flex items-center gap-3">
              <input
                type="file"
                accept=".json"
                onChange={handleRestoreFileChange}
                className="text-xs"
              />
              {restoreFile && (
                <button
                  onClick={handleExecuteRestore}
                  className="rounded-xl bg-[#E60000] px-4 py-2 text-xs font-bold text-white hover:bg-red-700 shadow-xs"
                >
                  Ejecutar Restauración
                </button>
              )}
            </div>
          </div>

          {restoreStatus && (
            <div
              className={`rounded-xl border p-4 text-xs font-bold flex items-center gap-2.5 ${
                restoreStatus.success
                  ? 'border-emerald-300 bg-emerald-50 text-emerald-900'
                  : 'border-red-300 bg-red-50 text-red-900'
              }`}
            >
              {restoreStatus.success ? (
                <FileCheck className="h-5 w-5 text-emerald-600" />
              ) : (
                <AlertTriangle className="h-5 w-5 text-red-600" />
              )}
              <span>{restoreStatus.message}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
