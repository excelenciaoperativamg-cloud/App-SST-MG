/**
 * Utilidades JavaScript ES6+ y TypeScript para la Plataforma SST MG Consultores
 * Formateo regional Colombia (COT), sanitización y validaciones de datos
 */

// Formateador de fecha estándar de Colombia
export const formatDateCO = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00Z`);
    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'America/Bogota',
    }).format(d);
  } catch {
    return dateStr;
  }
};

// Formateador de fecha y hora completa
export const formatDateTimeCO = (dateStr: string): string => {
  if (!dateStr) return '';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Bogota',
    }).format(d);
  } catch {
    return dateStr;
  }
};

// Cálculo de edad exacta a partir de fecha de nacimiento
export const calculateAge = (birthDateStr: string): number => {
  if (!birthDateStr) return 0;
  const birthDate = new Date(birthDateStr);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age > 0 ? age : 0;
};

// Sanitización de entradas de texto
export const sanitizeText = (text: string): string => {
  if (!text) return '';
  return text.trim().replace(/\s+/g, ' ');
};

// Generador de código correlativo de inspección SST
export const generateRecordCode = (prefix: string, customNumber?: number): string => {
  const year = new Date().getFullYear();
  const seq = customNumber || Math.floor(100 + Math.random() * 900);
  return `${prefix.toUpperCase()}-${year}-${String(seq).padStart(3, '0')}`;
};
