import React, { useState } from 'react';
import {
  LayoutDashboard,
  Users2,
  Database,
  FileSpreadsheet,
  DownloadCloud,
  History,
  Settings,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
  HardHat,
  Flame,
  ClipboardCheck,
  Users,
  Truck,
  HeartPulse,
  Sparkles,
  X,
  FileText,
} from 'lucide-react';
import { MGLogo } from '../common/MGLogo';
import { SST_MODULES } from '../../config/constants';
import { useAuth } from '../../context/AuthContext';
import { useSST } from '../../context/SSTContext';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  activeView: string;
  activeModuleId?: string;
  activeSubMenuId?: string;
  onNavigate: (view: string, moduleId?: string, subMenuId?: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  activeView,
  activeModuleId,
  activeSubMenuId,
  onNavigate,
}) => {
  const { user } = useAuth();
  const { stats } = useSST();
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    d19d30b0: true, // Emergency inspections open by default
    c9189227: true, // Personal open by default
  });

  const toggleModule = (modId: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [modId]: !prev[modId],
    }));
  };

  const getModuleIcon = (iconName: string) => {
    switch (iconName) {
      case 'ShieldAlert':
        return <ShieldAlert className="h-4 w-4" />;
      case 'HardHat':
        return <HardHat className="h-4 w-4" />;
      case 'Flame':
        return <Flame className="h-4 w-4 text-orange-400" />;
      case 'ClipboardCheck':
        return <ClipboardCheck className="h-4 w-4" />;
      case 'Users':
        return <Users className="h-4 w-4" />;
      case 'Truck':
        return <Truck className="h-4 w-4" />;
      case 'HeartPulse':
        return <HeartPulse className="h-4 w-4 text-rose-400" />;
      case 'Sparkles':
        return <Sparkles className="h-4 w-4 text-amber-400" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const isModuleActive = (moduleId: string) => activeView === 'sst_module' && activeModuleId === moduleId;
  const isSubMenuActive = (subId: string) => activeView === 'sst_module' && activeSubMenuId === subId;

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-xs lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 flex w-72 flex-col bg-[#0A2958] text-white shadow-2xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Top Branding Section */}
        <div className="flex min-h-[4.75rem] items-center justify-between border-b border-white/10 px-3.5 py-2.5 bg-[#071d3f]">
          <MGLogo size="md" variant="dark" showSubtitle={true} />
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-300 hover:bg-white/10 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Navigation Landmark */}
        <nav
          aria-label="Menú principal de módulos SST"
          className="flex-1 overflow-y-auto px-3 py-4 space-y-6 scrollbar-thin scrollbar-thumb-white/20"
        >
          {/* Main Dashboard */}
          <div>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Principal
            </p>
            <button
              onClick={() => onNavigate('dashboard')}
              className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-xs font-semibold transition-all ${
                activeView === 'dashboard'
                  ? 'bg-[#E60000] text-white shadow-md'
                  : 'text-slate-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <LayoutDashboard className="h-4 w-4 flex-shrink-0" />
              <span>Panel de Control</span>
            </button>
          </div>

          {/* Master Personnel */}
          <div>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Gestión de Personas
            </p>
            <button
              onClick={() => onNavigate('personnel')}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-xs font-semibold transition-all ${
                activeView === 'personnel'
                  ? 'bg-[#E60000] text-white shadow-md'
                  : 'text-slate-200 hover:bg-white/10 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-3">
                <Users2 className="h-4 w-4 flex-shrink-0" />
                <span>Maestro de Personal</span>
              </div>
              <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold">
                {stats.activeWorkers}
              </span>
            </button>
          </div>

          {/* The 8 Official SST Modules */}
          <div>
            <div className="flex items-center justify-between px-3 mb-1.5">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Módulos SST (Excel)
              </p>
              <span className="text-[10px] font-bold text-red-300 bg-red-950/70 border border-red-800/60 px-1.5 py-0.2 rounded">
                8 MÓDULOS
              </span>
            </div>

            <div className="space-y-1">
              {SST_MODULES.map((module) => {
                const isExpanded = !!expandedModules[module.id];
                const activeMod = isModuleActive(module.id);
                const hasMultipleSubmenus = module.submenus.length > 1;

                return (
                  <div key={module.id} className="rounded-lg overflow-hidden">
                    <button
                      onClick={() => {
                        if (hasMultipleSubmenus) {
                          toggleModule(module.id);
                        } else {
                          onNavigate('sst_module', module.id, module.submenus[0]?.id);
                        }
                      }}
                      className={`flex w-full items-center justify-between px-3 py-2 text-xs font-semibold rounded-lg transition-all ${
                        activeMod && !hasMultipleSubmenus
                          ? 'bg-[#E60000] text-white'
                          : activeMod
                          ? 'bg-white/15 text-white'
                          : 'text-slate-200 hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {getModuleIcon(module.icono)}
                        <span className="truncate">{module.nombre}</span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {hasMultipleSubmenus && (
                          <>
                            <span className="text-[10px] text-slate-400 bg-white/10 px-1.5 py-0.2 rounded">
                              {module.submenus.length}
                            </span>
                            {isExpanded ? (
                              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                            ) : (
                              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
                            )}
                          </>
                        )}
                      </div>
                    </button>

                    {/* Submenus Dropdown */}
                    {hasMultipleSubmenus && isExpanded && (
                      <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-white/20 pl-2">
                        {module.submenus.map((sub) => {
                          const activeSub = isSubMenuActive(sub.id);
                          return (
                            <button
                              key={sub.id}
                              onClick={() => onNavigate('sst_module', module.id, sub.id)}
                              className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-[11px] font-medium transition-all text-left ${
                                activeSub
                                  ? 'bg-[#E60000] text-white font-bold'
                                  : 'text-slate-300 hover:bg-white/10 hover:text-white'
                              }`}
                            >
                              <span className="truncate">{sub.nombre}</span>
                              {sub.formularioOficialPendiente && (
                                <span
                                  title="Formato oficial SST pendiente de entrega"
                                  className="text-[9px] bg-amber-500/30 text-amber-300 px-1 py-0.2 rounded ml-1"
                                >
                                  ESTÁNDAR
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* System & Operations */}
          <div>
            <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              Operación y Reportes
            </p>
            <div className="space-y-1">
              <button
                onClick={() => onNavigate('catalogs')}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                  activeView === 'catalogs'
                    ? 'bg-[#E60000] text-white'
                    : 'text-slate-200 hover:bg-white/10'
                }`}
              >
                <Database className="h-4 w-4" />
                <span>Catálogos Generales</span>
              </button>

              <button
                onClick={() => onNavigate('reports')}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                  activeView === 'reports'
                    ? 'bg-[#E60000] text-white'
                    : 'text-slate-200 hover:bg-white/10'
                }`}
              >
                <FileSpreadsheet className="h-4 w-4" />
                <span>Reportes y Exportaciones</span>
              </button>

              <button
                onClick={() => onNavigate('backups')}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                  activeView === 'backups'
                    ? 'bg-[#E60000] text-white'
                    : 'text-slate-200 hover:bg-white/10'
                }`}
              >
                <DownloadCloud className="h-4 w-4" />
                <span>Respaldos e Historial</span>
              </button>

              <button
                onClick={() => onNavigate('audit')}
                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                  activeView === 'audit'
                    ? 'bg-[#E60000] text-white'
                    : 'text-slate-200 hover:bg-white/10'
                }`}
              >
                <History className="h-4 w-4" />
                <span>Auditoría de Cambios</span>
              </button>

              {user?.role === 'admin' && (
                <button
                  onClick={() => onNavigate('settings')}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                    activeView === 'settings'
                      ? 'bg-[#E60000] text-white'
                      : 'text-slate-200 hover:bg-white/10'
                  }`}
                >
                  <Settings className="h-4 w-4" />
                  <span>Configuración y Usuarios</span>
                </button>
              )}
            </div>
          </div>
        </nav>

        {/* Footer info badge */}
        <div className="border-t border-white/10 p-3 bg-[#071d3f]/70 text-[11px] text-slate-400">
          <div className="flex items-center justify-between">
            <span>MG Consultores S.A.S.</span>
            <span className="text-emerald-400 font-semibold flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              SST Online
            </span>
          </div>
          <p className="text-[10px] text-slate-600 mt-0.5">Versión 1.0 - SG-SST</p>
        </div>
      </aside>
    </>
  );
};
