import React, { useState, useEffect } from 'react';
import {
  X,
  Code2,
  Copy,
  Check,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  RefreshCw,
  Link2,
  Trash2,
  FileSpreadsheet,
  Layers,
} from 'lucide-react';
import { APPS_SCRIPT_CODE, EMERGENCY_APPS_SCRIPT_CODE } from '../../config/appsScriptTemplate';
import { googleDriveService, TARGET_DRIVE_FOLDER } from '../../services/googleDriveService';
import { EmergencySheetData } from '../../types/emergency';

interface EmergencyDriveConnectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSynced?: (sheets: EmergencySheetData[], message: string) => void;
}

export const EmergencyDriveConnectionModal: React.FC<EmergencyDriveConnectionModalProps> = ({
  isOpen,
  onClose,
  onSynced,
}) => {
  const [webAppUrl, setWebAppUrl] = useState('');
  const [spreadsheetInput, setSpreadsheetInput] = useState('');
  const [copied, setCopied] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showCode, setShowCode] = useState(true);
  const [syncedSheets, setSyncedSheets] = useState<EmergencySheetData[]>([]);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    if (isOpen) {
      setWebAppUrl(googleDriveService.getEmergencyAppsScriptUrl());
      setSpreadsheetInput(googleDriveService.getEmergencySpreadsheetId());
      setStatus(null);
      setCopied(false);
      setSyncedSheets([]);
    }
  }, [isOpen]);

  const [scriptMode, setScriptMode] = useState<'unified' | 'emergency'>(() =>
    googleDriveService.isAppsScriptConfigured() ? 'unified' : 'emergency'
  );
  const activeScriptCode = scriptMode === 'unified' ? APPS_SCRIPT_CODE : EMERGENCY_APPS_SCRIPT_CODE;

  if (!isOpen) return null;

  const handleCopyScript = async () => {
    try {
      await navigator.clipboard.writeText(activeScriptCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch {
      const textarea = document.createElement('textarea');
      textarea.value = activeScriptCode;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    }
  };

  const handleConnectAndSync = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUrl = webAppUrl.trim();
    const fallbackMainUrl = googleDriveService.getAppsScriptUrl();
    const effectiveUrl = cleanUrl || fallbackMainUrl;

    if (!effectiveUrl || !effectiveUrl.startsWith('https://script.google.com/')) {
      setStatus({
        type: 'error',
        message: 'Pega una URL válida de Aplicación Web de Google Apps Script (https://script.google.com/...).',
      });
      return;
    }

    setIsSyncing(true);
    setStatus(null);

    try {
      if (cleanUrl) {
        googleDriveService.setEmergencyAppsScriptUrl(cleanUrl);
      }
      if (spreadsheetInput.trim()) {
        googleDriveService.setEmergencySpreadsheetId(spreadsheetInput.trim());
      }

      const res = await googleDriveService.syncEmergencySheetsFromDrive(
        effectiveUrl,
        spreadsheetInput.trim() || undefined
      );

      if (!res.success) {
        setStatus({ type: 'error', message: res.message });
        return;
      }

      setSyncedSheets(res.sheets);
      if (res.spreadsheetId && !spreadsheetInput.trim()) {
        setSpreadsheetInput(res.spreadsheetId);
      }
      googleDriveService.syncAllFormsFromDrive().catch(() => null);
      setStatus({ type: 'success', message: res.message });
      if (onSynced) {
        onSynced(res.sheets, res.message);
      }
    } catch (err: any) {
      setStatus({
        type: 'error',
        message: err?.message || 'Error al conectar con Inspección Emergencias en Drive.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = () => {
    googleDriveService.setEmergencyAppsScriptUrl('');
    googleDriveService.setEmergencySpreadsheetId('');
    setWebAppUrl('');
    setSpreadsheetInput('');
    setSyncedSheets([]);
    setStatus({
      type: 'success',
      message: 'Configuración dedicada de Inspección Emergencias eliminada.',
    });
  };

  const hasMainScript = googleDriveService.isAppsScriptConfigured();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#0A2958] via-[#123970] to-[#0A2958] text-white p-5 flex items-start justify-between border-b-2 border-[#EA580C]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center border border-white/20">
              <FileSpreadsheet className="w-5 h-5 text-orange-300" />
            </div>
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#0A2958] bg-orange-300 px-2.5 py-0.5 rounded-full">
                Vinculación Multi-Hoja Google Sheets
              </span>
              <h2 className="text-lg font-bold text-white mt-1">
                Conectar Archivo Drive — Inspección Emergencias
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

        {/* Body */}
        <div className="p-5 sm:p-6 space-y-5 max-h-[82vh] overflow-y-auto text-xs">
          {/* Drive Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-500 block">
                Archivo Destino en Drive:
              </span>
              <span className="font-bold text-[#0A2958] block mt-0.5">
                Inspección Emergencias (Extintores, Cilindros, Camillas, etc.)
              </span>
              <span className="block text-[11px] text-slate-600 mt-0.5">
                Cada hoja del libro se vincula automáticamente a su propio formulario y tabla.
              </span>
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase text-slate-500 block">
                Carpeta Drive Corporativa:
              </span>
              <a
                href={TARGET_DRIVE_FOLDER.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold text-[#0A2958] hover:underline inline-flex items-center gap-1 mt-0.5"
              >
                <span>{TARGET_DRIVE_FOLDER.name}</span>
                <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
              </a>
              <span className="block font-mono text-[10px] text-slate-500 mt-0.5">
                ID Carpeta: {TARGET_DRIVE_FOLDER.id}
              </span>
            </div>
          </div>

          {/* Instructions */}
          <div className="bg-orange-50/70 border border-orange-200 rounded-xl p-4 space-y-2.5">
            <h3 className="font-bold text-[#0A2958] text-xs uppercase tracking-wide">
              Conexión en Vercel y Google Drive (Sin duplicar variables):
            </h3>
            {hasMainScript ? (
              <div className="text-[11px] text-emerald-900 bg-emerald-50 border border-emerald-200 rounded-lg p-3 space-y-1.5">
                <p className="font-bold">
                  Ya tienes configurada la variable <code className="bg-white px-1.5 py-0.5 rounded border border-emerald-200">VITE_APPS_SCRIPT_URL</code> (Entrega Epp´s MG). No necesitas crear otra variable con ese nombre en Vercel:
                </p>
                <ol className="list-decimal pl-5 space-y-1">
                  <li>
                    Abre tu proyecto de Apps Script actual (el de <strong>Entrega Epp´s MG</strong>), reemplaza el código con el <strong>Script Unificado</strong> de abajo y presiona Guardar (💾).
                  </li>
                  <li>
                    Ve a <strong>Implementar ➔ Administrar implementaciones ➔ Editar (✏️) ➔ Versión: Nueva versión ➔ Implementar</strong> (mantiene la misma URL, no cambias nada en Vercel).
                  </li>
                  <li>
                    Si prefieres un script aparte para Inspección Emergencias, en Vercel usa el nombre distinto{' '}
                    <code className="bg-white px-1.5 py-0.5 rounded border border-emerald-200">VITE_EMERGENCY_APPS_SCRIPT_URL</code> o pega esa segunda URL en el campo de abajo.
                  </li>
                </ol>
              </div>
            ) : (
              <ol className="list-decimal pl-5 space-y-1.5 text-slate-700 leading-relaxed">
                <li>
                  Abre el archivo <strong>Inspección Emergencias</strong> en Google Drive dentro de la carpeta{' '}
                  <strong>{TARGET_DRIVE_FOLDER.name}</strong> y entra a{' '}
                  <strong>Extensiones ➔ Apps Script</strong>.
                </li>
                <li>
                  Borra el contenido actual, haz clic en <strong>Copiar Script</strong> abajo y pégalo en{' '}
                  <code>Código.gs</code>. Guarda el proyecto (💾).
                </li>
                <li>
                  Haz clic en <strong>Implementar ➔ Nueva implementación</strong>, selecciona tipo{' '}
                  <strong>Aplicación web</strong>, en <em>Ejecutar como</em> elige <strong>Yo</strong> y en{' '}
                  <em>Quién tiene acceso</em> elige <strong>Cualquier usuario</strong>.
                </li>
                <li>
                  Copia la <strong>URL de la aplicación web</strong> generada, pégala abajo y presiona{' '}
                  <strong>Conectar y Sincronizar Hojas</strong> (en Vercel puedes guardarla como{' '}
                  <code>VITE_EMERGENCY_APPS_SCRIPT_URL</code>).
                </li>
              </ol>
            )}
          </div>

          {/* Connection Form */}
          <form onSubmit={handleConnectAndSync} className="space-y-3 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <div>
              <label className="block font-bold text-[#0A2958] mb-1">
                URL de la Aplicación Web (Apps Script de Inspección Emergencias):
              </label>
              <div className="relative">
                <Link2 className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="url"
                  value={webAppUrl}
                  onChange={(e) => setWebAppUrl(e.target.value)}
                  placeholder={
                    hasMainScript
                      ? 'Opcional si usas el Script Principal, o pega aquí https://script.google.com/macros/s/.../exec'
                      : 'https://script.google.com/macros/s/AKfycb.../exec'
                  }
                  className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
                />
              </div>
            </div>

            <div>
              <label className="block font-bold text-[#0A2958] mb-1">
                URL o ID del Archivo Google Sheets "Inspección Emergencias" (Opcional si el script está dentro del archivo):
              </label>
              <input
                type="text"
                value={spreadsheetInput}
                onChange={(e) => setSpreadsheetInput(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/... o ID directo del archivo"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl font-mono text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="submit"
                disabled={isSyncing}
                className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[#0A2958] hover:bg-[#123e80] text-white rounded-xl font-bold transition-colors disabled:opacity-60 cursor-pointer"
              >
                <RefreshCw className={`w-4 h-4 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Sincronizando hojas...' : 'Conectar y Sincronizar Hojas'}</span>
              </button>

              {(googleDriveService.getEmergencyAppsScriptUrl() || googleDriveService.getEmergencySpreadsheetId()) && (
                <button
                  type="button"
                  onClick={handleDisconnect}
                  className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white hover:bg-red-50 text-red-600 border border-red-200 rounded-xl font-semibold transition-colors cursor-pointer"
                  title="Limpiar configuración"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Desvincular</span>
                </button>
              )}
            </div>

            {status && (
              <div
                className={`p-3 rounded-xl border flex items-start gap-2 font-semibold ${
                  status.type === 'success'
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-red-50 border-red-200 text-red-800'
                }`}
              >
                {status.type === 'success' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                )}
                <span>{status.message}</span>
              </div>
            )}

            {syncedSheets.length > 0 && (
              <div className="p-3 rounded-xl bg-white border border-emerald-200 space-y-2">
                <div className="flex items-center gap-1.5 font-bold text-[#0A2958]">
                  <Layers className="w-4 h-4 text-[#EA580C]" />
                  <span>Hojas detectadas y vinculadas al formulario:</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {syncedSheets.map((sh) => (
                    <span
                      key={sh.sheetName}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-orange-50 border border-orange-200 text-[11px] font-bold text-orange-900"
                    >
                      <span>{sh.sheetName}</span>
                      <span className="text-[10px] font-medium text-orange-700">
                        ({sh.headers.length} cols · {sh.rows.length} reg.)
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            )}
          </form>

          {/* Apps Script Code */}
          <div className="space-y-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowCode(!showCode)}
                  className="font-bold text-[#0A2958] hover:underline flex items-center gap-1.5 cursor-pointer"
                >
                  <Code2 className="w-4 h-4 text-[#EA580C]" />
                  <span>
                    {showCode ? 'Ocultar Código.gs' : 'Mostrar Código.gs'}
                  </span>
                </button>
                <div className="inline-flex rounded-lg border border-slate-200 bg-slate-100 p-0.5 text-[11px]">
                  <button
                    type="button"
                    onClick={() => { setScriptMode('unified'); setCopied(false); }}
                    className={`px-2.5 py-1 rounded-md font-bold cursor-pointer ${
                      scriptMode === 'unified' ? 'bg-[#0A2958] text-white' : 'text-slate-600'
                    }`}
                  >
                    Script Unificado (VITE_APPS_SCRIPT_URL)
                  </button>
                  <button
                    type="button"
                    onClick={() => { setScriptMode('emergency'); setCopied(false); }}
                    className={`px-2.5 py-1 rounded-md font-bold cursor-pointer ${
                      scriptMode === 'emergency' ? 'bg-[#EA580C] text-white' : 'text-slate-600'
                    }`}
                  >
                    Solo Emergencias (VITE_EMERGENCY_APPS_SCRIPT_URL)
                  </button>
                </div>
              </div>

              <button
                type="button"
                onClick={handleCopyScript}
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg font-bold transition-all cursor-pointer ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-[#EA580C] hover:bg-orange-700 text-white shadow-xs'
                }`}
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? '¡Script Copiado!' : 'Copiar Script'}</span>
              </button>
            </div>

            {showCode && (
              <pre className="rounded-xl bg-slate-900 text-slate-100 p-4 font-mono text-[11px] overflow-x-auto max-h-72 overflow-y-auto border border-slate-700 leading-relaxed">
                {activeScriptCode}
              </pre>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition-colors cursor-pointer"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
