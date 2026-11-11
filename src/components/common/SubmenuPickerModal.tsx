import React from 'react';
import { X, ArrowRight, FileText, CheckCircle2 } from 'lucide-react';
import { MenuModuleConfig, SubMenuConfig } from '../../types';

interface SubmenuPickerModalProps {
  module: MenuModuleConfig | null;
  isOpen: boolean;
  onClose: () => void;
  onSelectSubmenu: (moduleId: string, subMenuId: string) => void;
}

export const SubmenuPickerModal: React.FC<SubmenuPickerModalProps> = ({
  module,
  isOpen,
  onClose,
  onSelectSubmenu,
}) => {
  if (!isOpen || !module) return null;

  const headerBg = module.headerColor || 'bg-[#0A2958]';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto animate-fade-in-up">
      <div className="relative w-full max-w-4xl rounded-2xl bg-slate-50 shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Modal Header */}
        <div className={`${headerBg} px-6 py-5 text-white flex items-center justify-between`}>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/80 bg-white/20 px-2 py-0.5 rounded-full">
              Submódulos del Proceso
            </span>
            <h2 className="text-xl font-black mt-1 text-white">{module.nombre}</h2>
            <p className="text-xs text-white/90 mt-0.5">{module.descripcion}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-white/80 hover:bg-white/20 hover:text-white transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Submodules Grid using the exact Card Style */}
        <div className="p-6 max-h-[75vh] overflow-y-auto">
          <p className="text-xs font-bold text-slate-700 mb-4 uppercase tracking-wider">
            Selecciona el formulario o inspección a diligenciar:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {module.submenus.map((sub, idx) => {
              const subHeaderBg = sub.headerColor || headerBg;
              const subButtonBg = sub.buttonColor || module.buttonColor || 'bg-[#0A2958] hover:bg-blue-900';

              return (
                <div
                  key={sub.id}
                  className="flex flex-col rounded-xl bg-white shadow-md border border-slate-200 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all group"
                >
                  {/* Colorful Card Header */}
                  <div className={`${subHeaderBg} px-4 py-3 flex items-center gap-2.5 text-white`}>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 backdrop-blur-xs text-white text-xs font-bold flex-shrink-0">
                      {idx + 1}
                    </div>
                    <h3 className="text-sm font-bold truncate tracking-wide text-white">
                      {sub.nombre}
                    </h3>
                  </div>

                  {/* Body */}
                  <div className="p-4 flex flex-col justify-between flex-1 bg-white space-y-3">
                    <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed min-h-[38px]">
                      {sub.descripcion}
                    </p>

                    <div>
                      <button
                        onClick={() => {
                          onSelectSubmenu(module.id, sub.id);
                          onClose();
                        }}
                        className={`w-full py-2 px-3 rounded-lg text-xs font-bold uppercase tracking-wider text-white ${subButtonBg} shadow-xs flex items-center justify-center gap-1.5 transition-all group-hover:brightness-105`}
                      >
                        <span>ACCEDER</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-slate-200 bg-white px-6 py-3.5 flex justify-end">
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};
