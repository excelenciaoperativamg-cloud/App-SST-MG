import React, { useRef, useState, useEffect } from 'react';
import { RotateCcw, PenTool, Check } from 'lucide-react';

interface SignaturePadProps {
  label: string;
  sublabel?: string;
  value?: string;
  onChange: (dataUrl: string) => void;
  required?: boolean;
}

export const SignaturePad: React.FC<SignaturePadProps> = ({
  label,
  sublabel,
  value,
  onChange,
  required = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(!!value);

  // Initialize canvas with retina scaling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const ratio = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    ctx.scale(ratio, ratio);

    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#0A2958'; // Corporate navy ink
    ctx.lineWidth = 2.5;

    // Load initial signature if provided
    if (value && value.startsWith('data:image')) {
      const img = new Image();
      img.onload = () => {
        ctx.clearRect(0, 0, rect.width, rect.height);
        ctx.drawImage(img, 0, 0, rect.width, rect.height);
        setHasSignature(true);
      };
      img.src = value;
    }
  }, []);

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    } else {
      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
    setHasSignature(true);
  };

  const stopDrawing = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    onChange(dataUrl);
  };

  const handleClear = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width, rect.height);
    setHasSignature(false);
    onChange('');
  };

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <label className="block text-xs font-bold text-[#0A2958]">
          {label} {required && <span className="text-[#E60000]">*</span>}
        </label>
        {hasSignature && (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
            <Check className="w-3 h-3 text-emerald-600" />
            Firma capturada
          </span>
        )}
      </div>

      {sublabel && <p className="text-[11px] text-slate-500">{sublabel}</p>}

      <div className="relative rounded-xl border border-slate-300 bg-slate-50/50 p-1.5 shadow-inner hover:border-[#0A2958] transition-colors">
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="w-full h-28 bg-white rounded-lg cursor-crosshair touch-none border border-slate-200/80"
          style={{ touchAction: 'none' }}
        />

        {/* Guideline line */}
        <div className="pointer-events-none absolute bottom-8 left-6 right-6 border-b border-dashed border-slate-300 flex items-center justify-between text-[9px] text-slate-400 select-none">
          <span>X</span>
          <span>Firme sobre esta línea</span>
        </div>

        {/* Clear button */}
        <div className="mt-1 flex items-center justify-between px-1">
          <span className="text-[10px] text-slate-400 flex items-center gap-1">
            <PenTool className="w-3 h-3 text-slate-400" />
            Dibuje con el dedo o puntero
          </span>
          <button
            type="button"
            onClick={handleClear}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-red-600 px-2 py-0.5 rounded hover:bg-red-50 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Limpiar firma</span>
          </button>
        </div>
      </div>
    </div>
  );
};
