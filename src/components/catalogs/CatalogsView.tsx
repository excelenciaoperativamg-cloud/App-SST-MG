import React, { useState } from 'react';
import {
  Database,
  Building2,
  Users,
  HeartHandshake,
  ShieldAlert,
  Plus,
  Edit2,
  Check,
  X,
  Phone,
  MapPin,
} from 'lucide-react';
import { useSST } from '../../context/SSTContext';
import { useAuth } from '../../context/AuthContext';
import { Sede, Supervisor, EPS, ARL } from '../../types';
import { storageService } from '../../services/storageService';

export const CatalogsView: React.FC = () => {
  const { sedes, supervisores, epsList, arlList } = useSST();
  const { canAdmin, user } = useAuth();
  const [activeTab, setActiveTab] = useState<'sedes' | 'supervisores' | 'eps' | 'arl'>('sedes');

  // New Sede Modal State
  const [isAddSedeOpen, setIsAddSedeOpen] = useState(false);
  const [newSedeCodigo, setNewSedeCodigo] = useState('');
  const [newSedeNombre, setNewSedeNombre] = useState('');
  const [newSedeCiudad, setNewSedeCiudad] = useState('');
  const [newSedeDireccion, setNewSedeDireccion] = useState('');

  // New Supervisor Modal State
  const [isAddSupOpen, setIsAddSupOpen] = useState(false);
  const [newSupSede, setNewSupSede] = useState('MG-MG');
  const [newSupArea, setNewSupArea] = useState('');
  const [newSupNombre, setNewSupNombre] = useState('');
  const [newSupCargo, setNewSupCargo] = useState('');
  const [newSupTel, setNewSupTel] = useState('');

  const handleSaveSede = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSedeCodigo || !newSedeNombre) return;
    const newS: Sede = {
      id: newSedeCodigo.toUpperCase().trim(),
      codigo: newSedeCodigo.toUpperCase().trim(),
      nombre: newSedeNombre.trim(),
      ciudad: newSedeCiudad.trim() || 'Colombia',
      direccion: newSedeDireccion.trim() || 'Sede Operativa',
      activa: true,
    };
    storageService.saveSede(newS, {
      email: user?.email || 'admin@mgconsultores.com',
      name: user?.displayName || 'Admin',
    });
    setIsAddSedeOpen(false);
    setNewSedeCodigo('');
    setNewSedeNombre('');
    setNewSedeCiudad('');
    setNewSedeDireccion('');
  };

  const handleSaveSupervisor = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSupNombre || !newSupArea) return;
    const newSup: Supervisor = {
      id: 'sup-' + Date.now(),
      sedeId: newSupSede,
      area: newSupArea.trim(),
      supervisor: newSupNombre.trim(),
      cargo: newSupCargo.trim() || 'Supervisor de Área',
      telefono: newSupTel.trim() || undefined,
    };
    storageService.saveSupervisor(newSup, {
      email: user?.email || 'admin@mgconsultores.com',
      name: user?.displayName || 'Admin',
    });
    setIsAddSupOpen(false);
    setNewSupArea('');
    setNewSupNombre('');
    setNewSupCargo('');
    setNewSupTel('');
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-[#0A2958] p-1 text-white">
              <Database className="h-4 w-4" />
            </span>
            <h1 className="text-xl font-black text-[#0A2958] sm:text-2xl">
              Catálogos Generales del Sistema
            </h1>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            Administración de sedes operativas, supervisores por área, entidades promotoras de salud (EPS) y administradoras de riesgos laborales (ARL).
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('sedes')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
            activeTab === 'sedes'
              ? 'bg-[#0A2958] text-white shadow-sm'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Building2 className="h-4 w-4 text-[#E60000]" />
          <span>Sedes ({sedes.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('supervisores')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
            activeTab === 'supervisores'
              ? 'bg-[#0A2958] text-white shadow-sm'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Users className="h-4 w-4 text-blue-600" />
          <span>Supervisores ({supervisores.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('eps')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
            activeTab === 'eps'
              ? 'bg-[#0A2958] text-white shadow-sm'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <HeartHandshake className="h-4 w-4 text-rose-600" />
          <span>EPS ({epsList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('arl')}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-xs font-bold transition-all ${
            activeTab === 'arl'
              ? 'bg-[#0A2958] text-white shadow-sm'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <ShieldAlert className="h-4 w-4 text-amber-600" />
          <span>ARL ({arlList.length})</span>
        </button>
      </div>

      {/* SEDES TAB */}
      {activeTab === 'sedes' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-600">
              Las 5 sedes oficiales definidas en el archivo Excel de MG Consultores:
            </p>
            {canAdmin() && (
              <button
                onClick={() => setIsAddSedeOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#E60000] px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Nueva Sede</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {sedes.map((s) => (
              <div key={s.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between mb-2">
                  <span className="rounded-md bg-[#0A2958] px-2.5 py-1 text-xs font-black text-white">
                    {s.codigo}
                  </span>
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.2 text-[10px] font-bold">
                    <Check className="h-3 w-3" />
                    OPERATIVA
                  </span>
                </div>
                <h3 className="text-base font-bold text-slate-800">{s.codigo}</h3>
                <div className="mt-3 space-y-1 text-xs text-slate-500">
                  <p className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-slate-400" />
                    <span>{s.ciudad} - {s.direccion}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SUPERVISORES TAB */}
      {activeTab === 'supervisores' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-slate-600">
              Relación de supervisores por sede y área operativa (Hoja Supervisores del Excel):
            </p>
            {canAdmin() && (
              <button
                onClick={() => setIsAddSupOpen(true)}
                className="inline-flex items-center gap-1.5 rounded-lg bg-[#E60000] px-3 py-1.5 text-xs font-bold text-white hover:bg-red-700 shadow-xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Nuevo Supervisor</span>
              </button>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white shadow-xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase text-[10px]">
                <tr>
                  <th className="px-4 py-3">Sede</th>
                  <th className="px-4 py-3">Área / Sección</th>
                  <th className="px-4 py-3">Nombre del Supervisor</th>
                  <th className="px-4 py-3">Cargo</th>
                  <th className="px-4 py-3">Contacto</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {supervisores.map((sup) => (
                  <tr key={sup.id} className="hover:bg-slate-50">
                    <td className="px-4 py-3">
                      <span className="font-bold text-[#0A2958] bg-slate-100 px-2 py-0.5 rounded">
                        {sup.sedeId}
                      </span>
                    </td>
                    <td className="px-4 py-3 font-semibold text-slate-800">{sup.area}</td>
                    <td className="px-4 py-3 font-bold text-slate-900">{sup.supervisor}</td>
                    <td className="px-4 py-3 text-slate-600">{sup.cargo || 'Supervisor'}</td>
                    <td className="px-4 py-3 text-slate-600">{sup.telefono || 'Corporativo'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* EPS TAB */}
      {activeTab === 'eps' && (
        <div className="space-y-4">
          <p className="text-xs font-bold text-slate-600">
            Catálogo oficial de Entidades Promotoras de Salud (EPS):
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {epsList.map((eps) => (
              <div key={eps.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400">{eps.codigo || 'EPS'}</span>
                <h4 className="text-sm font-bold text-[#0A2958] mt-0.5">{eps.nombre}</h4>
                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                  <Phone className="h-3 w-3 text-emerald-600" />
                  <span>{eps.telefono || 'Línea Nacional'}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ARL TAB */}
      {activeTab === 'arl' && (
        <div className="space-y-4">
          <p className="text-xs font-bold text-slate-600">
            Catálogo oficial de Administradoras de Riesgos Laborales (ARL):
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {arlList.map((arl) => (
              <div key={arl.id} className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
                <span className="text-[10px] font-bold text-slate-400">Código ARL: {arl.codigo}</span>
                <h4 className="text-sm font-bold text-[#0A2958] mt-0.5">{arl.nombre}</h4>
                <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
                  <Phone className="h-3 w-3 text-amber-600" />
                  <span>Emergencias: {arl.lineaEmergencias}</span>
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Sede Modal */}
      {isAddSedeOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-[#0A2958] mb-3">Agregar Nueva Sede</h3>
            <form onSubmit={handleSaveSede} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Código Sede (Ej: MG-NO):</label>
                <input
                  type="text"
                  value={newSedeCodigo}
                  onChange={(e) => setNewSedeCodigo(e.target.value)}
                  placeholder="MG-..."
                  className="w-full rounded-lg border p-2 font-bold uppercase"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre Sede:</label>
                <input
                  type="text"
                  value={newSedeNombre}
                  onChange={(e) => setNewSedeNombre(e.target.value)}
                  placeholder="Ej. Sede Norte"
                  className="w-full rounded-lg border p-2"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Ciudad:</label>
                <input
                  type="text"
                  value={newSedeCiudad}
                  onChange={(e) => setNewSedeCiudad(e.target.value)}
                  placeholder="Ej. Medellín"
                  className="w-full rounded-lg border p-2"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Dirección:</label>
                <input
                  type="text"
                  value={newSedeDireccion}
                  onChange={(e) => setNewSedeDireccion(e.target.value)}
                  placeholder="Ej. Cra 50..."
                  className="w-full rounded-lg border p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddSedeOpen(false)}
                  className="px-4 py-2 border rounded-lg font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#E60000] text-white rounded-lg font-bold hover:bg-red-700"
                >
                  Guardar Sede
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Supervisor Modal */}
      {isAddSupOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-200">
            <h3 className="text-base font-bold text-[#0A2958] mb-3">Agregar Supervisor</h3>
            <form onSubmit={handleSaveSupervisor} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Sede:</label>
                <select
                  value={newSupSede}
                  onChange={(e) => setNewSupSede(e.target.value)}
                  className="w-full rounded-lg border p-2 font-bold"
                >
                  {sedes.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.codigo}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Área / Sección:</label>
                <input
                  type="text"
                  value={newSupArea}
                  onChange={(e) => setNewSupArea(e.target.value)}
                  placeholder="Ej. Operaciones, Planta"
                  className="w-full rounded-lg border p-2"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre Completo:</label>
                <input
                  type="text"
                  value={newSupNombre}
                  onChange={(e) => setNewSupNombre(e.target.value)}
                  placeholder="Nombre del supervisor"
                  className="w-full rounded-lg border p-2 font-bold"
                  required
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Cargo:</label>
                <input
                  type="text"
                  value={newSupCargo}
                  onChange={(e) => setNewSupCargo(e.target.value)}
                  placeholder="Ej. Coordinador de Turno"
                  className="w-full rounded-lg border p-2"
                />
              </div>
              <div>
                <label className="block font-bold text-slate-700 mb-1">Teléfono:</label>
                <input
                  type="text"
                  value={newSupTel}
                  onChange={(e) => setNewSupTel(e.target.value)}
                  placeholder="Celular corporativo"
                  className="w-full rounded-lg border p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  type="button"
                  onClick={() => setIsAddSupOpen(false)}
                  className="px-4 py-2 border rounded-lg font-bold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#E60000] text-white rounded-lg font-bold hover:bg-red-700"
                >
                  Guardar Supervisor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
