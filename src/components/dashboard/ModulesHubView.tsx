import React, { useState, useMemo } from 'react';
import {
  LayoutGrid,
  Search,
  Filter,
  ShieldCheck,
  Building2,
  PlusCircle,
  FileSpreadsheet,
} from 'lucide-react';
import { SST_MODULES, INITIAL_SEDES } from '../../config/constants';
import { useSST } from '../../context/SSTContext';
import { useAuth } from '../../context/AuthContext';
import { ModuleCard } from '../common/ModuleCard';
import { SubmenuPickerModal } from '../common/SubmenuPickerModal';
import { MenuModuleConfig } from '../../types';

interface ModulesHubViewProps {
  onNavigateToModule: (moduleId: string, subMenuId?: string) => void;
  onOpenNewRecordModal: () => void;
}

export const ModulesHubView: React.FC<ModulesHubViewProps> = ({
  onNavigateToModule,
  onOpenNewRecordModal,
}) => {
  const { records } = useSST();
  const { canEdit, activeSiteId } = useAuth();
  const [search, setSearch] = useState('');
  const [selectedPickerModule, setSelectedPickerModule] = useState<MenuModuleConfig | null>(null);

  const filteredModules = useMemo(() => {
    if (!search.trim()) return SST_MODULES;
    const query = search.toLowerCase();
    return SST_MODULES.filter(
      (m) =>
        m.nombre.toLowerCase().includes(query) ||
        m.descripcion.toLowerCase().includes(query) ||
        m.submenus.some((s) => s.nombre.toLowerCase().includes(query))
    );
  }, [search]);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl bg-gradient-to-r from-[#0A2958] via-[#123970] to-[#0A2958] p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="rounded-full bg-[#E60000] px-3 py-0.5 text-xs font-bold uppercase tracking-wider text-white">
              MG CONSULTORES
            </span>
            <span className="text-xs text-slate-300">
              Sistema de Gestión SG-SST
            </span>
          </div>
          <h1 className="text-2xl font-black text-white sm:text-3xl">
            Módulos del Sistema SST
          </h1>
          <p className="mt-1 text-xs text-slate-200 max-w-2xl">
            Acceso directo a los 8 procesos oficiales de Seguridad y Salud en el Trabajo: inspecciones, rondas de cuidado, gestión de contratistas, personal, PESV, salud ocupacional y metodología 5S.
          </p>
        </div>

        {canEdit() && (
          <button
            onClick={onOpenNewRecordModal}
            className="inline-flex items-center gap-2 rounded-xl bg-[#E60000] px-4 py-2.5 text-xs font-bold text-white shadow-md hover:bg-red-700 transition-all hover:scale-[1.02] flex-shrink-0"
          >
            <PlusCircle className="h-4 w-4" />
            <span>Nuevo Registro SST</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar módulo o submódulo (ej: Extintores, Vehículos, EPP, 5S)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#0A2958]"
          />
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500 font-semibold">
          <span>{filteredModules.length} módulos disponibles</span>
        </div>
      </div>

      {/* 3-Column Responsive Grid matching user's requested style */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredModules.map((module) => {
          const recordsCount = records.filter((r) => r.menuId === module.id).length;
          return (
            <ModuleCard
              key={module.id}
              module={module}
              recordsCount={recordsCount}
              onAccess={(modId, subId) => onNavigateToModule(modId, subId)}
              onOpenSubmenuPicker={(mod) => setSelectedPickerModule(mod)}
            />
          );
        })}
      </div>

      {/* Submenu Picker Modal when clicking ACCEDER on multi-submenu module */}
      <SubmenuPickerModal
        module={selectedPickerModule}
        isOpen={Boolean(selectedPickerModule)}
        onClose={() => setSelectedPickerModule(null)}
        onSelectSubmenu={(modId, subId) => onNavigateToModule(modId, subId)}
      />
    </div>
  );
};
