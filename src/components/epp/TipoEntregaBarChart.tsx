import React, { useMemo, useState } from 'react';
import { BarChart3, DollarSign, Layers, X } from 'lucide-react';
import { EntregaEPPMGRecord, formatCOP } from '../../types/epp';

interface TipoEntregaBarChartProps {
  deliveries: EntregaEPPMGRecord[];
  tiposCatalog: string[];
  selectedTipo: string;
  onSelectTipo: (tipo: string) => void;
  scopeLabel: string;
}

interface TipoChartItem {
  tipo: string;
  count: number;
  totalCosto: number;
  percentage: number;
}

const BAR_COLORS = [
  { bg: 'bg-[#0A2958]', hover: 'hover:bg-[#103b7b]', ring: 'ring-[#0A2958]', dot: 'bg-[#0A2958]' },
  { bg: 'bg-[#E60000]', hover: 'hover:bg-[#c40000]', ring: 'ring-[#E60000]', dot: 'bg-[#E60000]' },
  { bg: 'bg-emerald-600', hover: 'hover:bg-emerald-700', ring: 'ring-emerald-600', dot: 'bg-emerald-600' },
  { bg: 'bg-blue-600', hover: 'hover:bg-blue-700', ring: 'ring-blue-600', dot: 'bg-blue-600' },
  { bg: 'bg-amber-500', hover: 'hover:bg-amber-600', ring: 'ring-amber-500', dot: 'bg-amber-500' },
  { bg: 'bg-indigo-600', hover: 'hover:bg-indigo-700', ring: 'ring-indigo-600', dot: 'bg-indigo-600' },
  { bg: 'bg-slate-600', hover: 'hover:bg-slate-700', ring: 'ring-slate-600', dot: 'bg-slate-600' },
];

export const TipoEntregaBarChart: React.FC<TipoEntregaBarChartProps> = ({
  deliveries,
  tiposCatalog,
  selectedTipo,
  onSelectTipo,
  scopeLabel,
}) => {
  const [metric, setMetric] = useState<'count' | 'cost'>('count');
  const [hoveredTipo, setHoveredTipo] = useState<string | null>(null);

  const chartData = useMemo<TipoChartItem[]>(() => {
    const map = new Map<string, { tipo: string; count: number; totalCosto: number }>();

    const normalizeKey = (val: string) =>
      String(val || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim()
        .toUpperCase();

    // Seed with configured catalog types so all official categories appear
    tiposCatalog.forEach((tipo) => {
      const clean = String(tipo || '').trim();
      if (!clean) return;
      const key = normalizeKey(clean);
      if (!map.has(key)) {
        map.set(key, { tipo: clean, count: 0, totalCosto: 0 });
      }
    });

    // Aggregate deliveries
    deliveries.forEach((item) => {
      const rawTipo = String(item.Tipo_Entrega || 'SIN TIPO').trim() || 'SIN TIPO';
      const key = normalizeKey(rawTipo);
      const existing = map.get(key);
      const itemCost = Number(item.Costo) || 0;
      if (existing) {
        existing.count += 1;
        existing.totalCosto += itemCost;
      } else {
        map.set(key, { tipo: rawTipo, count: 1, totalCosto: itemCost });
      }
    });

    const totalDeliveries = deliveries.length;

    return Array.from(map.values())
      .map((entry) => ({
        ...entry,
        percentage: totalDeliveries > 0 ? Math.round((entry.count / totalDeliveries) * 100) : 0,
      }))
      .sort((a, b) => {
        if (metric === 'cost') {
          if (b.totalCosto !== a.totalCosto) return b.totalCosto - a.totalCosto;
        } else {
          if (b.count !== a.count) return b.count - a.count;
        }
        return a.tipo.localeCompare(b.tipo);
      });
  }, [deliveries, tiposCatalog, metric]);

  const maxValue = useMemo(() => {
    const vals = chartData.map((d) => (metric === 'cost' ? d.totalCosto : d.count));
    return Math.max(...vals, 1);
  }, [chartData, metric]);

  const activeDetails = useMemo(() => {
    const target = hoveredTipo || (selectedTipo !== 'TODOS' ? selectedTipo : null);
    if (!target) return null;
    return (
      chartData.find((d) => d.tipo.toUpperCase() === target.toUpperCase()) || null
    );
  }, [hoveredTipo, selectedTipo, chartData]);

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-[#0A2958] shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm font-black text-[#0A2958]">
                Gráfica Interactiva: Tipo de Entrega
              </h2>
              <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                {scopeLabel}
              </span>
              {selectedTipo !== 'TODOS' && (
                <button
                  type="button"
                  onClick={() => onSelectTipo('TODOS')}
                  className="inline-flex items-center gap-1 text-[10px] font-bold text-[#E60000] bg-red-50 hover:bg-red-100 px-2 py-0.5 rounded-md border border-red-200 transition-colors cursor-pointer"
                  title="Quitar filtro por Tipo de Entrega"
                >
                  <span>Filtro: {selectedTipo}</span>
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Haz clic sobre una barra para filtrar la tabla por tipo de entrega o pasa el cursor para ver detalles.
            </p>
          </div>
        </div>

        {/* Metric toggle */}
        <div className="inline-flex items-center rounded-xl bg-slate-100 p-1 border border-slate-200 self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setMetric('count')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all cursor-pointer ${
              metric === 'count'
                ? 'bg-[#0A2958] text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Cantidad</span>
          </button>
          <button
            type="button"
            onClick={() => setMetric('cost')}
            className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-bold transition-all cursor-pointer ${
              metric === 'cost'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            <span>Costo (COP)</span>
          </button>
        </div>
      </div>

      {/* Interactive Inspector Strip */}
      <div className="min-h-[38px] rounded-xl bg-slate-50 border border-slate-200/80 px-3.5 py-2 flex flex-wrap items-center justify-between gap-2 text-xs">
        {activeDetails ? (
          <>
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-black text-[#0A2958]">{activeDetails.tipo}</span>
              <span className="text-slate-300">•</span>
              <span className="font-bold text-slate-700">
                {activeDetails.count} {activeDetails.count === 1 ? 'entrega' : 'entregas'} ({activeDetails.percentage}%)
              </span>
              <span className="text-slate-300">•</span>
              <span className="font-mono font-bold text-emerald-700">
                {formatCOP(activeDetails.totalCosto)}
              </span>
            </div>
            <span className="text-[10px] font-semibold text-slate-500">
              {selectedTipo.toUpperCase() === activeDetails.tipo.toUpperCase()
                ? 'Clic nuevamente para mostrar todos'
                : 'Clic en la barra para filtrar registros'}
            </span>
          </>
        ) : (
          <div className="w-full flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
            <span>
              Total analizado: <strong className="text-slate-800">{deliveries.length}</strong> registros en{' '}
              <strong className="text-slate-800">{chartData.filter((d) => d.count > 0).length}</strong> categorías activas
            </span>
            <span>Pasa el mouse o haz clic en cualquier barra</span>
          </div>
        )}
      </div>

      {/* Bar Chart Canvas */}
      <div className="overflow-x-auto pb-1">
        <div className="min-w-[540px] pt-6 pb-2 px-2 relative">
          {/* Horizontal guide lines */}
          <div className="pointer-events-none absolute inset-x-2 top-6 bottom-16 flex flex-col justify-between">
            <div className="border-t border-dashed border-slate-200 w-full" />
            <div className="border-t border-dashed border-slate-200 w-full" />
            <div className="border-t border-slate-300 w-full" />
          </div>

          {/* Bars Row */}
          <div
            className="relative z-10 grid gap-3 items-end"
            style={{
              gridTemplateColumns: `repeat(${Math.max(chartData.length, 1)}, minmax(72px, 1fr))`,
            }}
          >
            {chartData.map((item, idx) => {
              const value = metric === 'cost' ? item.totalCosto : item.count;
              const rawHeightPct = maxValue > 0 ? (value / maxValue) * 100 : 0;
              const barHeightPct = value > 0 ? Math.max(rawHeightPct, 8) : 2;
              const palette = BAR_COLORS[idx % BAR_COLORS.length];
              const isSelected =
                selectedTipo !== 'TODOS' &&
                selectedTipo.toUpperCase() === item.tipo.toUpperCase();
              const isDimmed =
                selectedTipo !== 'TODOS' && !isSelected;

              return (
                <button
                  key={item.tipo}
                  type="button"
                  onClick={() => onSelectTipo(isSelected ? 'TODOS' : item.tipo)}
                  onMouseEnter={() => setHoveredTipo(item.tipo)}
                  onMouseLeave={() => setHoveredTipo(null)}
                  onFocus={() => setHoveredTipo(item.tipo)}
                  onBlur={() => setHoveredTipo(null)}
                  className={`group flex flex-col items-center focus:outline-none cursor-pointer transition-opacity duration-200 ${
                    isDimmed ? 'opacity-40 hover:opacity-80' : 'opacity-100'
                  }`}
                  title={`${item.tipo}: ${item.count} entregas (${formatCOP(item.totalCosto)})`}
                >
                  {/* Bar Plot Container */}
                  <div className="w-full h-44 flex flex-col items-center justify-end relative">
                    {/* Value above bar */}
                    <span
                      className={`mb-1.5 text-[10px] sm:text-[11px] font-black transition-transform group-hover:-translate-y-0.5 ${
                        value > 0 ? 'text-slate-800' : 'text-slate-400'
                      }`}
                    >
                      {metric === 'cost' ? formatCOP(item.totalCosto) : item.count}
                    </span>

                    {/* Actual Bar */}
                    <div
                      className={`w-10 sm:w-12 rounded-t-xl transition-all duration-300 relative ${
                        value > 0
                          ? `${palette.bg} ${palette.hover} shadow-sm`
                          : 'bg-slate-200'
                      } ${
                        isSelected
                          ? `ring-2 ring-offset-2 ${palette.ring} shadow-md scale-[1.03]`
                          : 'group-hover:brightness-110'
                      }`}
                      style={{ height: `${barHeightPct}%` }}
                    >
                      {value > 0 && item.percentage > 0 && (
                        <span className="hidden sm:block absolute bottom-1.5 inset-x-0 text-center text-[9px] font-bold text-white/90">
                          {item.percentage}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Category Label */}
                  <div className="mt-2.5 w-full text-center px-1">
                    <div className="flex items-center justify-center gap-1">
                      <span className={`w-2 h-2 rounded-sm shrink-0 ${value > 0 ? palette.dot : 'bg-slate-300'}`} />
                      <span
                        className={`text-[10px] font-bold leading-tight line-clamp-2 ${
                          isSelected ? 'text-[#0A2958] underline' : 'text-slate-700'
                        }`}
                      >
                        {item.tipo}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
