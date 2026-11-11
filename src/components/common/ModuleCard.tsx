import React from 'react';
import {
  ShieldAlert,
  HardHat,
  Flame,
  ClipboardCheck,
  Users,
  Truck,
  HeartPulse,
  Sparkles,
  ArrowRight,
  ChevronRight,
  FileText,
} from 'lucide-react';
import { MenuModuleConfig, SubMenuConfig } from '../../types';

interface ModuleCardProps {
  module: MenuModuleConfig;
  recordsCount?: number;
  onAccess: (moduleId: string, subMenuId?: string) => void;
  onOpenSubmenuPicker?: (module: MenuModuleConfig) => void;
}

export const ModuleCard: React.FC<ModuleCardProps> = ({
  module,
  recordsCount = 0,
  onAccess,
  onOpenSubmenuPicker,
}) => {
  const getIcon = (iconName: string) => {
    const iconClass = 'h-5 w-5 text-white';
    switch (iconName) {
      case 'ShieldAlert':
        return <ShieldAlert className={iconClass} />;
      case 'HardHat':
        return <HardHat className={iconClass} />;
      case 'Flame':
        return <Flame className={iconClass} />;
      case 'ClipboardCheck':
        return <ClipboardCheck className={iconClass} />;
      case 'Users':
        return <Users className={iconClass} />;
      case 'Truck':
        return <Truck className={iconClass} />;
      case 'HeartPulse':
        return <HeartPulse className={iconClass} />;
      case 'Sparkles':
        return <Sparkles className={iconClass} />;
      default:
        return <FileText className={iconClass} />;
    }
  };

  const hasMultipleSubmenus = module.submenus.length > 1;

  const handleCardClick = () => {
    if (hasMultipleSubmenus && onOpenSubmenuPicker) {
      onOpenSubmenuPicker(module);
    } else {
      onAccess(module.id, module.submenus[0]?.id);
    }
  };

  const headerBg = module.headerColor || 'bg-[#0A2958]';
  const buttonBg = module.buttonColor || 'bg-[#0A2958] hover:bg-blue-900';

  return (
    <article
      className="flex flex-col rounded-2xl bg-white shadow-md border border-slate-200/90 overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-200 group text-left"
    >
      {/* 1. Colorful Card Header */}
      <div className={`${headerBg} px-5 py-4 flex items-center gap-3 relative transition-colors`}>
        {/* Emblem circular badge on the left */}
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-xs border border-white/30 flex-shrink-0 shadow-xs">
          {getIcon(module.icono)}
        </div>

        {/* Title */}
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold text-white tracking-wide truncate">
            {module.nombre}
          </h3>
          {hasMultipleSubmenus && (
            <span className="text-[10px] text-white/85 font-medium block mt-0.5">
              {module.submenus.length} submódulos disponibles
            </span>
          )}
        </div>
      </div>

      {/* 2. Card Body */}
      <div className="p-5 flex flex-col justify-between flex-1 bg-white space-y-4">
        <div>
          {/* Description */}
          <p className="text-xs sm:text-sm text-slate-600 font-normal leading-relaxed line-clamp-3 min-h-[42px]">
            {module.descripcion}
          </p>

          {/* Submenus chips preview if multiple */}
          {hasMultipleSubmenus ? (
            <div className="mt-3 flex flex-wrap gap-1.5 pt-2 border-t border-slate-100">
              {module.submenus.slice(0, 3).map((sub) => (
                <span
                  key={sub.id}
                  className="inline-block text-[10px] font-semibold bg-slate-100 text-slate-700 px-2 py-0.5 rounded-md"
                >
                  {sub.nombre}
                </span>
              ))}
              {module.submenus.length > 3 && (
                <span className="inline-block text-[10px] font-bold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                  +{module.submenus.length - 3} más
                </span>
              )}
            </div>
          ) : (
            <div className="mt-3 flex items-center justify-between pt-2 border-t border-slate-100 text-[11px] text-slate-500">
              <span className="font-medium text-slate-600">Espacio operativo</span>
              <span className="font-bold text-slate-700">{recordsCount} registros</span>
            </div>
          )}
        </div>

        {/* 3. Action Button "ACCEDER" in matching color */}
        <div>
          <button
            type="button"
            onClick={handleCardClick}
            className={`w-full py-2.5 px-4 rounded-xl text-xs font-black uppercase tracking-wider text-white ${buttonBg} shadow-sm transition-all duration-150 flex items-center justify-center gap-2 group-hover:brightness-105 active:scale-[0.99]`}
          >
            <span>ACCEDER</span>
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </div>
    </article>
  );
};
