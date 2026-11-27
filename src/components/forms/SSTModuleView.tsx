import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Plus,
  Search,
  Download,
  FileText,
  AlertTriangle,
  Trash2,
  Edit3,
  ExternalLink,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  Link2,
} from 'lucide-react';
import { useSST } from '../../context/SSTContext';
import { useAuth } from '../../context/AuthContext';
import { SST_MODULES, INITIAL_SEDES } from '../../config/constants';
import { exportService } from '../../services/exportService';
import { storageService } from '../../services/storageService';
import { googleDriveService } from '../../services/googleDriveService';
import { SSTRecord, SSTRecordStatus } from '../../types';
import { EmergencySheetData, EmergencySheetRow } from '../../types/emergency';
import { DynamicSSTFormModal } from './DynamicSSTFormModal';
import { EmergencyDriveConnectionModal } from '../emergency/EmergencyDriveConnectionModal';
import { EmergencySheetFormModal } from '../emergency/EmergencySheetFormModal';

interface SSTModuleViewProps {
  moduleId: string;
  activeSubMenuId?: string;
  onSelectSubMenu: (subId: string) => void;
}

const EMERGENCY_MODULE_ID = 'd19d30b0';

const normalizeSheetKey = (val: string): string =>
  String(val || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\bde\b/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

const isIdHeader = (header: string): boolean => {
  const n = normalizeSheetKey(header);
  return (
    n === 'id' ||
    n.startsWith('id ') ||
    n.endsWith(' id') ||
    n === 'idregistro' ||
    n === 'n registro' ||
    n === 'nro registro'
  );
};

const parseDateTimestamp = (val: string | undefined): number => {
  const str = String(val || '').trim();
  if (!str) return 0;
  const iso = str.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3])).getTime();
  }
  const dmy = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (dmy) {
    return new Date(Number(dmy[3]), Number(dmy[2]) - 1, Number(dmy[1])).getTime();
  }
  const parsed = Date.parse(str);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const matchEmergencySheet = (
  subName: string,
  sheets: EmergencySheetData[]
): EmergencySheetData | undefined => {
  if (!sheets.length) return undefined;
  const target = normalizeSheetKey(subName);
  const exact = sheets.find((s) => normalizeSheetKey(s.sheetName) === target);
  if (exact) return exact;
  return sheets.find((s) => {
    const sk = normalizeSheetKey(s.sheetName);
    return sk.includes(target) || target.includes(sk);
  });
};

export const SSTModuleView: React.FC<SSTModuleViewProps> = ({
  moduleId,
  activeSubMenuId,
  onSelectSubMenu,
}) => {
  const { records, deleteRecord } = useSST();
  const { user, canEdit, canAdmin, activeSiteId, switchSite } = useAuth();

  const isEmergencyModule = moduleId === EMERGENCY_MODULE_ID;
  const currentModule = SST_MODULES.find((m) => m.id === moduleId) || SST_MODULES[0];

  const [emergencySheets, setEmergencySheets] = useState<EmergencySheetData[]>(() =>
    storageService.getEmergencySheets()
  );
  const [isSyncingDrive, setIsSyncingDrive] = useState(false);
  const [driveBanner, setDriveBanner] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);
  const [isEmergencyDriveModalOpen, setIsEmergencyDriveModalOpen] = useState(false);
  const [isEmergencyFormOpen, setIsEmergencyFormOpen] = useState(false);
  const [emergencyRowToEdit, setEmergencyRowToEdit] = useState<EmergencySheetRow | null>(null);

  const [search, setSearch] = useState('');
  const selectedSede =
    user?.role === 'admin'
      ? activeSiteId || 'TODAS'
      : user?.siteId || 'TODAS';
  const [selectedEstado, setSelectedEstado] = useState<string>('TODOS');
  const [viewMode, setViewMode] = useState<'table' | 'submodule_cards'>('table');
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [recordToEdit, setRecordToEdit] = useState<SSTRecord | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    code: string;
    emergencySheetName?: string;
    rowNumber?: number;
  } | null>(null);

  // Refresh emergency sheets when storage changes
  useEffect(() => {
    const refresh = () => {
      setEmergencySheets(storageService.getEmergencySheets());
    };
    refresh();
    window.addEventListener('mg-sst-data-change', refresh);
    window.addEventListener('mg-sst-emergency-script-updated', refresh);
    return () => {
      window.removeEventListener('mg-sst-data-change', refresh);
      window.removeEventListener('mg-sst-emergency-script-updated', refresh);
    };
  }, []);

  const handleSyncEmergencyDrive = useCallback(async (silent = false) => {
    setIsSyncingDrive(true);
    if (!silent) setDriveBanner(null);
    const res = await googleDriveService.syncEmergencySheetsFromDrive();
    setIsSyncingDrive(false);

    if (res.success) {
      setEmergencySheets(res.sheets);
      if (!silent) {
        setDriveBanner({ type: 'success', message: res.message });
      }
    } else if (!silent) {
      if (res.needsConfig) {
        setIsEmergencyDriveModalOpen(true);
      } else {
        setDriveBanner({ type: 'error', message: res.message });
      }
    }
  }, []);

  // Auto-sync silently on module open if configured
  useEffect(() => {
    if (isEmergencyModule && googleDriveService.isEmergencyDriveConfigured()) {
      handleSyncEmergencyDrive(true);
    }
  }, [isEmergencyModule, handleSyncEmergencyDrive]);

  // Build unified tabs: official submenus + any extra sheets discovered in Drive workbook
  const moduleTabs = useMemo(() => {
    if (!isEmergencyModule) {
      return currentModule.submenus.map((sub) => ({
        ...sub,
        linkedSheet: undefined as EmergencySheetData | undefined,
      }));
    }

    const usedSheets = new Set<string>();
    const baseTabs = currentModule.submenus.map((sub) => {
      const matched = matchEmergencySheet(sub.nombre, emergencySheets);
      if (matched) usedSheets.add(matched.sheetName);
      return {
        ...sub,
        linkedSheet: matched,
      };
    });

    const extraTabs = emergencySheets
      .filter((sh) => !usedSheets.has(sh.sheetName))
      .map((sh, idx) => ({
        id: `drive-sheet-${sh.sheetName}`,
        menuId: EMERGENCY_MODULE_ID,
        nombre: sh.sheetName,
        descripcion: `Hoja vinculada desde Google Drive (${sh.headers.length} columnas).`,
        codigo: `DRIVE_${idx + 1}`,
        headerColor: idx % 2 === 0 ? 'bg-[#EA580C]' : 'bg-[#C2410C]',
        buttonColor: idx % 2 === 0 ? 'bg-[#EA580C] hover:bg-orange-700' : 'bg-[#C2410C] hover:bg-orange-800',
        formularioOficialPendiente: false,
        linkedSheet: sh,
      }));

    return [...baseTabs, ...extraTabs];
  }, [isEmergencyModule, currentModule.submenus, emergencySheets]);

  const activeTab =
    moduleTabs.find((s) => s.id === activeSubMenuId) || moduleTabs[0];
  const linkedSheet = activeTab?.linkedSheet;

  // Filter local SST records (used for non-emergency modules or when sheet is not yet synced)
  const filteredRecords = useMemo(() => {
    return records
      .filter((r) => {
        if (r.menuId !== currentModule.id) return false;
        if (activeTab && r.subMenuId !== activeTab.id) return false;
        const recSede = String(r.sedeId || '').trim().toUpperCase();
        if (user?.role !== 'admin' && user?.siteId && user.siteId !== 'TODAS') {
          if (recSede !== user.siteId.trim().toUpperCase()) return false;
        } else if (selectedSede !== 'TODAS') {
          if (recSede !== selectedSede.trim().toUpperCase()) return false;
        }
        if (selectedEstado !== 'TODOS' && r.estado !== selectedEstado) return false;
        if (search.trim()) {
          const query = search.toLowerCase();
          const matches =
            r.area.toLowerCase().includes(query) ||
            (r.nombreTrabajador && r.nombreTrabajador.toLowerCase().includes(query)) ||
            (r.cedulaTrabajador && r.cedulaTrabajador.includes(query)) ||
            r.observaciones.toLowerCase().includes(query);
          if (!matches) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const diff = parseDateTimestamp(b.fecha) - parseDateTimestamp(a.fecha);
        if (diff !== 0) return diff;
        return (
          parseDateTimestamp(b.updatedAt || b.createdAt) -
          parseDateTimestamp(a.updatedAt || a.createdAt)
        );
      });
  }, [records, currentModule.id, activeTab, selectedSede, selectedEstado, search, user]);

  // Filter synced Google Drive rows for active emergency sheet (sorted descending, newest first)
  const getFilteredEmergencyRows = useCallback(
    (sheet: EmergencySheetData | undefined, searchQuery: string) => {
      if (!sheet) return [];
      const sedeHeader = sheet.headers.find((h) => normalizeSheetKey(h).includes('sede'));
      const dateHeader =
        sheet.headers.find((h) => {
          const nh = normalizeSheetKey(h);
          return (
            nh === 'fecha' ||
            nh === 'fecha inspeccion' ||
            nh === 'fecha registro' ||
            nh === 'marca temporal' ||
            nh === 'timestamp'
          );
        }) || sheet.headers.find((h) => normalizeSheetKey(h).includes('fecha'));

      const effectiveSede =
        user?.role !== 'admin' && user?.siteId && user.siteId !== 'TODAS'
          ? user.siteId
          : selectedSede;

      return sheet.rows
        .filter((row) => {
          if (sedeHeader && effectiveSede && effectiveSede !== 'TODAS') {
            const rowSede = String(row.values[sedeHeader] || '').trim().toUpperCase();
            if (rowSede && rowSede !== effectiveSede.trim().toUpperCase()) {
              return false;
            }
          }
          if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            const anyMatch = Object.entries(row.values).some(
              ([k, v]) => !isIdHeader(k) && String(v || '').toLowerCase().includes(q)
            );
            if (!anyMatch) return false;
          }
          return true;
        })
        .sort((a, b) => {
          if (dateHeader) {
            const dateDiff =
              parseDateTimestamp(b.values[dateHeader]) -
              parseDateTimestamp(a.values[dateHeader]);
            if (dateDiff !== 0) return dateDiff;
          }
          return (b.rowNumber || 0) - (a.rowNumber || 0);
        });
    },
    [selectedSede, user]
  );

  const filteredEmergencyRows = useMemo(
    () => getFilteredEmergencyRows(linkedSheet, search),
    [linkedSheet, search, getFilteredEmergencyRows]
  );

  const visibleEmergencyHeaders = useMemo(
    () => (linkedSheet ? linkedSheet.headers.filter((h) => !isIdHeader(h)) : []),
    [linkedSheet]
  );

  const handleCreateNew = (targetTab = activeTab) => {
    if (isEmergencyModule && targetTab?.linkedSheet) {
      setEmergencyRowToEdit(null);
      setIsEmergencyFormOpen(true);
      return;
    }
    setRecordToEdit(null);
    setIsFormModalOpen(true);
  };

  const handleEditRecord = (rec: SSTRecord) => {
    setRecordToEdit(rec);
    setIsFormModalOpen(true);
  };

  const handleEditEmergencyRow = (row: EmergencySheetRow) => {
    setEmergencyRowToEdit(row);
    setIsEmergencyFormOpen(true);
  };

  const handleDelete = (id: string, code: string) => {
    setDeleteTarget({ id, code });
  };

  const handleDeleteEmergencyRow = (row: EmergencySheetRow) => {
    if (!linkedSheet) return;
    setDeleteTarget({
      id: row.rowId,
      code: row.rowId,
      emergencySheetName: linkedSheet.sheetName,
      rowNumber: row.rowNumber,
    });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    if (deleteTarget.emergencySheetName) {
      const sheetName = deleteTarget.emergencySheetName;
      const rowId = deleteTarget.id;
      const rowNumber = deleteTarget.rowNumber;
      setDeleteTarget(null);

      storageService.deleteEmergencySheetRow(sheetName, rowId, rowNumber, {
        email: user?.email || 'admin@mgconsultores.com',
        name: user?.displayName || 'Administrador',
      });
      const remoteRes = await googleDriveService.deleteEmergencyRowFromDrive(
        sheetName,
        rowId,
        rowNumber
      );
      setDriveBanner({
        type: remoteRes.success ? 'success' : 'error',
        message: remoteRes.message,
      });
      return;
    }

    deleteRecord(deleteTarget.id);
    setDeleteTarget(null);
  };

  const getStatusBadge = (status: SSTRecordStatus) => {
    switch (status) {
      case 'CERRADO':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'EN_PROCESO':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'PENDIENTE':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-300';
    }
  };

  const renderEmergencyCell = (header: string, val: string) => {
    const clean = String(val || '').trim();
    if (!clean) return <span className="text-slate-300">—</span>;

    const nh = normalizeSheetKey(header);
    if (clean.startsWith('data:image') || clean.includes('Inspeccion_Emergencias_Images/')) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 border border-blue-200 px-2 py-0.5 text-[10px] font-bold text-blue-700">
          {nh.includes('firma') ? '✍️ Firma' : '📷 Foto'}
        </span>
      );
    }

    const upper = clean.toUpperCase();
    if (upper === 'BUENO' || upper === 'SI' || upper === 'CUMPLE' || upper === 'OPTIMO') {
      return (
        <span className="inline-flex rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[10px] font-bold">
          {clean}
        </span>
      );
    }
    if (upper === 'MALO' || upper === 'NO' || upper === 'NO CUMPLE' || upper === 'CRITICO') {
      return (
        <span className="inline-flex rounded-full bg-red-100 text-red-800 px-2 py-0.5 text-[10px] font-bold">
          {clean}
        </span>
      );
    }
    if (upper === 'REGULAR' || upper === 'PENDIENTE') {
      return (
        <span className="inline-flex rounded-full bg-amber-100 text-amber-800 px-2 py-0.5 text-[10px] font-bold">
          {clean}
        </span>
      );
    }
    if (nh.includes('sede')) {
      return (
        <span className="font-bold text-[#0A2958] bg-slate-100 px-1.5 py-0.5 rounded">
          {clean}
        </span>
      );
    }
    return <span className="text-slate-700">{clean}</span>;
  };

  const isEmergencyDriveConnected = googleDriveService.isEmergencyDriveConfigured();
  const activeCount = linkedSheet ? filteredEmergencyRows.length : filteredRecords.length;

  return (
    <div className="space-y-6">
      {/* Module Title Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0A2958] to-[#123970] p-6 text-white shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-white">{currentModule.nombre}</h1>
            <p className="mt-1 text-xs text-slate-200 max-w-2xl">
              {currentModule.descripcion}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 flex-shrink-0">
            {isEmergencyModule && canEdit() && (
              <>
                <button
                  type="button"
                  onClick={() => handleSyncEmergencyDrive(false)}
                  disabled={isSyncingDrive}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 px-3.5 py-2.5 text-xs font-bold text-white transition-all cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw className={`h-4 w-4 ${isSyncingDrive ? 'animate-spin' : ''}`} />
                  <span>{isSyncingDrive ? 'Sincronizando...' : 'Sincronizar Drive'}</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsEmergencyDriveModalOpen(true)}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 px-3.5 py-2.5 text-xs font-bold text-slate-950 shadow-md transition-all cursor-pointer"
                >
                  <Link2 className="h-4 w-4" />
                  <span>{isEmergencyDriveConnected ? 'Configurar Drive' : 'Conectar Drive Emergencias'}</span>
                </button>
              </>
            )}

            {canEdit() && (
              <button
                type="button"
                onClick={() => handleCreateNew(activeTab)}
                className="inline-flex items-center gap-2 rounded-xl bg-[#E60000] px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-red-700 transition-all hover:scale-[1.02] cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Nuevo Registro en {activeTab?.nombre}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Drive Sync Banner */}
      {isEmergencyModule && driveBanner && (
        <div
          className={`rounded-xl border p-3.5 text-xs font-semibold flex items-center justify-between gap-3 ${
            driveBanner.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-red-50 border-red-200 text-red-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {driveBanner.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
            )}
            <span>{driveBanner.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setDriveBanner(null)}
            className="text-[11px] font-bold underline cursor-pointer"
          >
            Ocultar
          </button>
        </div>
      )}

      {/* Prompt to connect Inspección Emergencias if no sheets synced yet */}
      {isEmergencyModule && emergencySheets.length === 0 && canEdit() && (
        <div className="rounded-xl border border-orange-200 bg-orange-50/80 p-4 text-xs text-orange-950 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-start gap-3">
            <FileSpreadsheet className="h-5 w-5 text-[#EA580C] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-[#0A2958]">
                Vincula el archivo "Inspección Emergencias" de Google Drive
              </p>
              <p className="text-slate-700 mt-0.5">
                Conecta tu Google Sheet para detectar automáticamente todas sus hojas (Extintores, Cilindros, Camillas, Kit Derrames, Sensores de humo, etc.) y vincular cada pestaña directamente con su formulario.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsEmergencyDriveModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#EA580C] hover:bg-orange-700 px-4 py-2 text-xs font-bold text-white shadow-sm flex-shrink-0 cursor-pointer"
          >
            <Link2 className="h-4 w-4" />
            <span>Vincular Archivo Drive</span>
          </button>
        </div>
      )}

      {/* Submenu Navigation & View Mode Toggle */}
      {moduleTabs.length > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-3">
          {/* Submenu Tabs */}
          <div className="flex flex-wrap gap-1.5">
            {moduleTabs.map((tab) => {
              const isSelected = activeTab?.id === tab.id;
              const count = tab.linkedSheet
                ? getFilteredEmergencyRows(tab.linkedSheet, '').length
                : records.filter((r) => {
                    if (r.subMenuId !== tab.id) return false;
                    if (selectedSede !== 'TODAS') {
                      return (
                        String(r.sedeId || '').trim().toUpperCase() ===
                        selectedSede.trim().toUpperCase()
                      );
                    }
                    return true;
                  }).length;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    onSelectSubMenu(tab.id);
                    setViewMode('table');
                  }}
                  className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-xs font-bold transition-all cursor-pointer ${
                    isSelected && viewMode === 'table'
                      ? 'bg-[#0A2958] text-white shadow-sm ring-2 ring-[#0A2958]'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>{tab.nombre}</span>
                  {tab.linkedSheet && (
                    <span
                      className={`h-2 w-2 rounded-full ${
                        isSelected && viewMode === 'table' ? 'bg-emerald-300' : 'bg-emerald-500'
                      }`}
                      title={`Vinculado a hoja Drive "${tab.linkedSheet.sheetName}"`}
                    />
                  )}
                  <span
                    className={`rounded-full px-1.5 py-0.2 text-[10px] ${
                      isSelected && viewMode === 'table'
                        ? 'bg-white/20 text-white'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* View Mode Toggle: Cards vs Table */}
          <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1 border border-slate-200 flex-shrink-0">
            <button
              type="button"
              onClick={() => setViewMode('table')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'table'
                  ? 'bg-white text-[#0A2958] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Registros ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setViewMode('submodule_cards')}
              className={`rounded-lg px-2.5 py-1 text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'submodule_cards'
                  ? 'bg-[#0A2958] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Catálogo de Submódulos ({moduleTabs.length})
            </button>
          </div>
        </div>
      )}

      {/* Submodule Cards View */}
      {viewMode === 'submodule_cards' && moduleTabs.length > 1 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Subprocesos e Inspecciones Disponibles ({currentModule.nombre})
            </h2>
            <span className="text-xs text-slate-500">
              Selecciona un submódulo para ver sus registros o realizar una nueva inspección
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {moduleTabs.map((sub, idx) => {
              const subCount = sub.linkedSheet
                ? getFilteredEmergencyRows(sub.linkedSheet, '').length
                : records.filter((r) => {
                    if (r.subMenuId !== sub.id) return false;
                    if (selectedSede !== 'TODAS') {
                      return (
                        String(r.sedeId || '').trim().toUpperCase() ===
                        selectedSede.trim().toUpperCase()
                      );
                    }
                    return true;
                  }).length;
              const cardHeaderBg = sub.headerColor || currentModule.headerColor || 'bg-[#0A2958]';
              const cardButtonBg = sub.buttonColor || currentModule.buttonColor || 'bg-[#0A2958] hover:bg-blue-900';

              return (
                <article
                  key={sub.id}
                  className="flex flex-col rounded-2xl bg-white shadow-md border border-slate-200/90 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200 group text-left"
                >
                  <div className={`${cardHeaderBg} px-5 py-4 flex items-center gap-3 relative transition-colors`}>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-xs border border-white/30 flex-shrink-0 shadow-xs text-white font-black text-sm">
                      {idx + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-base font-bold text-white tracking-wide truncate">
                        {sub.nombre}
                      </h3>
                    </div>
                  </div>

                  <div className="p-5 flex flex-col justify-between flex-1 bg-white space-y-4">
                    <div>
                      <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed line-clamp-3 min-h-[42px]">
                        {sub.descripcion}
                      </p>

                      <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
                        <span className="font-medium text-slate-600">Historial de inspecciones</span>
                        <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md">
                          {subCount} registros
                        </span>
                      </div>
                    </div>

                    <div className="space-y-2 pt-1">
                      <button
                        type="button"
                        onClick={() => {
                          onSelectSubMenu(sub.id);
                          setViewMode('table');
                        }}
                        className={`w-full py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider text-white ${cardButtonBg} shadow-sm transition-all duration-150 flex items-center justify-center gap-2 group-hover:brightness-105 active:scale-[0.99] cursor-pointer`}
                      >
                        <span>ACCEDER</span>
                        <ExternalLink className="h-4 w-4" />
                      </button>

                      {canEdit() && (
                        <button
                          type="button"
                          onClick={() => {
                            onSelectSubMenu(sub.id);
                            handleCreateNew(sub);
                          }}
                          className="w-full py-1.5 px-3 rounded-lg text-[11px] font-bold text-[#0A2958] bg-blue-50 hover:bg-blue-100 transition-colors flex items-center justify-center gap-1.5 border border-blue-200/60 cursor-pointer"
                        >
                          <Plus className="h-3.5 w-3.5 text-[#E60000]" />
                          <span>Diligenciar Inspección</span>
                        </button>
                      )}
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </div>
      )}

      {/* Table View (Filters and Records) */}
      {viewMode === 'table' && (
        <div className="space-y-4">
          {activeTab?.formularioOficialPendiente && !linkedSheet && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 text-xs text-amber-900 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">
                  Submódulo: {activeTab.nombre} (Espacio de trabajo operativo listo)
                </p>
                <p className="text-amber-800">
                  Este submódulo opera con el motor estándar de registros SST (sede, área, supervisor, trabajador del maestro, evidencias fotográficas, observaciones y trazabilidad).
                </p>
              </div>
            </div>
          )}

          {/* Filter and Action Toolbar */}
          <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder={
                    linkedSheet
                      ? `Buscar en hoja "${linkedSheet.sheetName}" por cualquier columna...`
                      : `Buscar en ${activeTab?.nombre || 'este módulo'} (área, trabajador, hallazgo)...`
                  }
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={selectedSede}
                  onChange={(e) => switchSite(e.target.value)}
                  disabled={user?.role !== 'admin'}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0A2958] disabled:bg-slate-100"
                >
                  <option value="TODAS">Todas las Sedes</option>
                  {INITIAL_SEDES.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.codigo}
                    </option>
                  ))}
                </select>

                {!linkedSheet && (
                  <select
                    value={selectedEstado}
                    onChange={(e) => setSelectedEstado(e.target.value)}
                    className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
                  >
                    <option value="TODOS">Todos los Estados</option>
                    <option value="CERRADO">Cerrado</option>
                    <option value="EN_PROCESO">En Proceso</option>
                    <option value="PENDIENTE">Pendiente</option>
                    <option value="BORRADOR">Borrador</option>
                  </select>
                )}

                <button
                  type="button"
                  onClick={() =>
                    linkedSheet
                      ? exportService.exportEmergencySheetToExcel(
                          linkedSheet.sheetName,
                          visibleEmergencyHeaders,
                          filteredEmergencyRows
                        )
                      : exportService.exportRecordsToExcel(
                          filteredRecords,
                          `Reporte_${activeTab?.nombre}`
                        )
                  }
                  className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-xs cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5 text-emerald-600" />
                  <span>Excel</span>
                </button>
              </div>
            </div>
          </div>

          {/* Dynamic Drive Table when sheet is linked */}
          {linkedSheet ? (
            <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
              <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
                <table
                  className="w-full text-left text-xs"
                  aria-label={`Registros de ${linkedSheet.sheetName}`}
                >
                  <thead className="bg-[#0A2958] text-white font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10">
                    <tr>
                      {visibleEmergencyHeaders.map((h) => (
                        <th key={h} scope="col" className="px-3.5 py-3 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                      {(canEdit() || canAdmin()) && (
                        <th scope="col" className="px-3.5 py-3 text-right whitespace-nowrap sticky right-0 z-20 bg-[#0A2958]">
                          Acciones
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredEmergencyRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={visibleEmergencyHeaders.length + (canEdit() || canAdmin() ? 1 : 0)}
                          className="p-8 text-center text-slate-500"
                        >
                          <FileSpreadsheet className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                          <p className="font-semibold text-slate-700">
                            No hay registros en la hoja "{linkedSheet.sheetName}".
                          </p>
                          <p className="text-xs text-slate-600 mt-0.5">
                            Haz clic en "Nuevo Registro en {activeTab?.nombre}" para guardar directamente en esta hoja.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredEmergencyRows.map((row, rIdx) => (
                        <tr
                          key={`${row.rowId}-${row.rowNumber || rIdx}`}
                          className="hover:bg-slate-50/80 transition-colors"
                        >
                          {visibleEmergencyHeaders.map((h) => (
                            <td
                              key={`${rIdx}-${h}`}
                              className="px-3.5 py-3 max-w-[220px] truncate"
                              title={row.values[h] || ''}
                            >
                              {renderEmergencyCell(h, row.values[h] || '')}
                            </td>
                          ))}

                          {(canEdit() || canAdmin()) && (
                            <td className="px-3.5 py-3 text-right whitespace-nowrap space-x-1 sticky right-0 bg-white/95">
                              {canEdit() && (
                                <button
                                  type="button"
                                  onClick={() => handleEditEmergencyRow(row)}
                                  title="Editar registro en Drive"
                                  className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                                >
                                  <Edit3 className="h-3.5 w-3.5" />
                                  <span>Editar</span>
                                </button>
                              )}
                              {canAdmin() && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteEmergencyRow(row)}
                                  title="Eliminar registro de la hoja (Solo Admin)"
                                  className="inline-flex items-center rounded-lg border border-red-200 bg-red-50 p-1 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            /* Standard SST Records Table fallback */
            <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
              <div className="overflow-x-auto overflow-y-auto max-h-[60vh]">
                <table
                  className="w-full text-left text-xs"
                  aria-label={`Registros e inspecciones de ${activeTab?.nombre || 'SST'}`}
                >
                  <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px] tracking-wider sticky top-0 z-10">
                    <tr>
                      <th scope="col" className="px-4 py-3">Fecha</th>
                      <th scope="col" className="px-4 py-3">Sede & Área</th>
                      <th scope="col" className="px-4 py-3">Trabajador / Sujeto</th>
                      <th scope="col" className="px-4 py-3">Observaciones / Hallazgo</th>
                      <th scope="col" className="px-4 py-3">Estado</th>
                      <th scope="col" className="px-4 py-3 text-right">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredRecords.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-slate-500">
                          <FileText className="mx-auto h-10 w-10 text-slate-300 mb-2" />
                          <p className="font-semibold text-slate-700">
                            No hay registros en {activeTab?.nombre}.
                          </p>
                          <p className="text-xs text-slate-600 mt-0.5">
                            Haz clic en "Nuevo Registro" para diligenciar el formato.
                          </p>
                        </td>
                      </tr>
                    ) : (
                      filteredRecords.map((rec) => (
                        <tr key={rec.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-4 py-3 text-slate-700 font-semibold whitespace-nowrap">
                            {rec.fecha}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-bold text-[#0A2958] bg-slate-100 px-1.5 py-0.5 rounded mr-1">
                              {rec.sedeId}
                            </span>
                            <span className="text-slate-700">{rec.area}</span>
                          </td>
                          <td className="px-4 py-3">
                            {rec.nombreTrabajador ? (
                              <div>
                                <div className="font-bold text-slate-800">{rec.nombreTrabajador}</div>
                                <div className="text-[10px] text-slate-600">C.C. {rec.cedulaTrabajador}</div>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Inspección general de área</span>
                            )}
                          </td>
                          <td className="px-4 py-3 max-w-xs">
                            <p className="truncate text-slate-700 font-medium">{rec.observaciones}</p>
                            {rec.evidencias && rec.evidencias.length > 0 && (
                              <span className="inline-block mt-0.5 text-[10px] text-blue-600 font-semibold">
                                📷 {rec.evidencias.length} evidencias adjuntas
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold ${getStatusBadge(
                                rec.estado
                              )}`}
                            >
                              {rec.estado}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right whitespace-nowrap space-x-1">
                            <button
                              type="button"
                              onClick={() => exportService.generateRecordPDF(rec)}
                              title="Descargar PDF Oficial con membrete de MG Consultores"
                              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-bold text-[#0A2958] hover:bg-blue-50 hover:border-blue-200 transition-colors cursor-pointer"
                            >
                              <FileText className="h-3.5 w-3.5 text-[#E60000]" />
                              <span>PDF</span>
                            </button>

                            {canEdit() && (
                              <button
                                type="button"
                                onClick={() => handleEditRecord(rec)}
                                title="Editar registro"
                                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[11px] font-semibold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                              >
                                <Edit3 className="h-3.5 w-3.5" />
                                <span>Editar</span>
                              </button>
                            )}

                            {canAdmin() && (
                              <button
                                type="button"
                                onClick={() => handleDelete(rec.id, rec.numeroRegistro)}
                                title="Eliminar registro (Solo Admin)"
                                className="inline-flex items-center rounded-lg border border-red-200 bg-red-50 p-1 text-red-600 hover:bg-red-100 transition-colors cursor-pointer"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Standard Dynamic SST Form Modal */}
      <DynamicSSTFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        recordToEdit={recordToEdit}
        initialMenuId={moduleId}
        initialSubMenuId={activeTab?.id || activeSubMenuId}
        onSaved={() => {}}
      />

      {/* Google Drive Emergency Connection Modal */}
      {isEmergencyModule && (
        <EmergencyDriveConnectionModal
          isOpen={isEmergencyDriveModalOpen}
          onClose={() => setIsEmergencyDriveModalOpen(false)}
          onSynced={(sheets, message) => {
            setEmergencySheets(sheets);
            setDriveBanner({ type: 'success', message });
          }}
        />
      )}

      {/* Dynamic Emergency Sheet Form Modal (1-to-1 with Drive Sheet) */}
      {isEmergencyModule && (
        <EmergencySheetFormModal
          isOpen={isEmergencyFormOpen}
          onClose={() => setIsEmergencyFormOpen(false)}
          sheet={linkedSheet || null}
          rowToEdit={emergencyRowToEdit}
          onSaved={(message) => {
            setDriveBanner({ type: 'success', message });
          }}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="bg-red-50 border-b border-red-100 p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-black text-red-900">Confirmar Eliminación</h3>
                <p className="text-[11px] text-red-700">Esta acción quedará registrada en la auditoría.</p>
              </div>
            </div>
            <div className="p-5 text-xs text-slate-700">
              ¿Está seguro de eliminar este registro
              {deleteTarget.emergencySheetName
                ? ` de la hoja "${deleteTarget.emergencySheetName}"`
                : ''}
              ?
            </div>
            <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTarget(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl bg-[#E60000] hover:bg-red-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                Sí, Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
