/**
 * Tipos específicos para la Hoja y Formulario Oficial: "Entrega Epp´s MG"
 * y las hojas del libro de Drive: "Area", "Tipo_Entrega", "Epp´s", "Labores", "Maestro"
 * MG Consultores S.A.S. - Sistema SG-SST
 */

export interface EPPCatalogItem {
  codigoEpp: string;
  epp: string;
  categoria: string;
  costo: number; // Costo unitario en Pesos Colombianos (COP) tomado de la hoja "Epp´s"
  unidad?: string;
  normaTecnica?: string;
  descripcion?: string;
}

/**
 * Registro oficial de la hoja "Entrega Epp´s MG"
 * Contiene exactamente los 19 campos requeridos:
 * 1. Id_Epp
 * 2. Fecha
 * 3. Año
 * 4. Mes
 * 5. Sede
 * 6. Cédula
 * 7. Nombre
 * 8. Labor
 * 9. Area
 * 10. Supervisor
 * 11. Código Epp
 * 12. Epp
 * 13. Tipo_Entrega
 * 14. Costo
 * 15. Estado
 * 16. Foto_Entrega
 * 17. Firma_Trabajador
 * 18. Responsable SST
 * 19. Firma SST
 */
export interface EntregaEPPMGRecord {
  id: string; // Identificador interno
  Id_Epp: string;
  Fecha: string; // YYYY-MM-DD
  Año: number; // e.g. 2026
  Mes: number | string; // e.g. 1
  Sede: string; // e.g. "MG-HA"
  Cédula: string;
  Nombre: string;
  Labor: string; // Tomado de la hoja Labores
  Area: string; // Tomado de la hoja Area
  Supervisor: string; // Tomado de la lista de supervisores del Maestro
  Código_Epp: string; // Código de la hoja Epp´s (ej. 7PRGUA47)
  Epp: string; // Nombre / descripción del Epp
  Tipo_Entrega: string; // Tomado de la hoja Tipo_Entrega (ej. REPOSICIÓN)
  Costo: number; // Obtenido del catálogo de la hoja "Epp´s"
  Estado: 'Entregado y Firmado' | 'Pendiente de Firma' | 'Borrador' | string;
  Foto_Entrega?: string; // Evidencia fotográfica (Data URL o URL)
  Firma_Trabajador?: string; // Firma digitalizada del trabajador receptor
  Responsable_SST: string; // Responsable SST que realiza la entrega
  Firma_SST?: string; // Firma digitalizada del responsable SST
  observaciones?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

/**
 * Opciones de la hoja "Labores" del archivo Entrega Epp´s MG
 * Lista oficial completa de labores
 */
export const CATALOGO_LABORES: string[] = [
  'ADM',
  'ALIMENTADOR1',
  'ALMACÉN',
  'ALTURAS',
  'APLICACION CAL',
  'ARMADO DE CARTON',
  'BASES ALZ',
  'BONCHADOR',
  'BOTON ALZ',
  'CALIDAD',
  'CHECK LIST',
  'COMPOSTERA',
  'CORTE - GYZ',
  'CORTE- BASES DUZ',
  'CORTE-BASES ALZ',
  'DESBOTONE',
  'DESHIERBE- SIEMBRA GYZ',
  'DESINFECCION CUARTO FRIO',
  'DESPACHADOR',
  'DESTAPAR TABACOS',
  'EMPAQUE',
  'EMPIOLE',
  'ENCAPUCHE',
  'FINAL DE BANDA',
  'FORMADOR',
  'FRIO FORZADO',
  'HIDRATADOR',
  'HIDRÁULICOS',
  'HORNOS CASINO',
  'LÍDER DE BANDA',
  'MANTENIMIENTO POSCO',
  'MESAS',
  'METEORO',
  'MIPE',
  'MIRFE',
  'NACIONAL CLASIFICACIÓN',
  'PATINADOR',
  'PEGADO DE COMIDAS',
  'PEGADO UPC',
  'PODAS',
  'PREPARACIÓN SOLUCIONES',
  'PUNTAS QUEMADAS',
  'RECEPCION CUARTO FRIO',
  'REPORTE NACIONAL',
  'RESIDUO POSCOSECHA',
  'REVISIÓN CAJAS',
  'RIEGO TRANSPORTADOR',
  'SACADO VEGETAL',
  'SERVICIOD GENERALES',
  'SIEMBRA',
  'STOCK',
  'SUPERVISOR',
  'SURTIDO',
  'TINTURADO',
  'TRANSPORTADOR',
  'ZUNCHADO',
];

/**
 * Opciones de la hoja "Area" del archivo Entrega Epp´s MG
 */
export const CATALOGO_AREAS: string[] = [
  'MIPE',
  'GYPSO',
  'POSCOSECHA',
  'F1',
  'F2',
  'F3',
  'F4',
  'F5',
  'MANTENIMIENTO',
  'CALIDAD',
  'ADMINISTRACION',
  'ALMACEN',
  'PROPAGACION',
  'SERVICIOS GENERALES',
];

/**
 * Opciones de la hoja "Tipo_Entrega" del archivo Entrega Epp´s MG
 */
export const CATALOGO_TIPO_ENTREGA: string[] = [
  'REPOSICIÓN',
  'DOTACIÓN',
  'INGRESO',
  'CAMBIO POR DAÑO',
  'PÉRDIDA O HURTO',
  'ACCIDENTE',
];

/**
 * Lista de supervisores de la hoja "Maestro" / "Supervisores"
 */
export const CATALOGO_SUPERVISORES: string[] = [
  'JERSSON SUAREZ',
  'JULIO LOPEZ',
  'LEYSLA RODRIGUEZ',
  'ANDREA FINO',
  'YULIETH ESCOBAR',
  'DINA MARTINEZ',
];

/**
 * Catálogo Oficial de la Hoja "Epp´s" con los Costos Unitarios vigentes (COP)
 * Códigos oficiales de la hoja Epp´s de MG Consultores
 */
export const CATALOGO_EPPS: EPPCatalogItem[] = [
  // Ítems oficiales del archivo de Drive Entrega Epp´s MG
  {
    codigoEpp: '7PRGUA47',
    epp: 'GUANTE CAUCHO CAL 55 NO.9',
    categoria: 'Protección Manos',
    costo: 10544,
    unidad: 'Par',
    descripcion: 'Guante de caucho industrial calibre 55 talla 9 para labores de campo.',
  },
  {
    codigoEpp: '7PRGUA123',
    epp: 'GUANTE KLEENGUARD G40 POL',
    categoria: 'Protección Manos',
    costo: 7000,
    unidad: 'Par',
    descripcion: 'Guante de protección mecánica y maniobrabilidad fina.',
  },
  {
    codigoEpp: '7PRGUA109',
    epp: 'GUANTE JACKSON SAFETY G40',
    categoria: 'Protección Manos',
    costo: 10860,
    unidad: 'Par',
    descripcion: 'Guante de alta destreza con recubrimiento de poliuretano.',
  },
  {
    codigoEpp: '7PRGUA257',
    epp: 'GUANTE DE CAUCHO CALIBRE 25',
    categoria: 'Protección Manos',
    costo: 3180,
    unidad: 'Par',
    descripcion: 'Guante de caucho flexible para labores de corte, bonche y cosecha.',
  },
  {
    codigoEpp: '7PRGUA85',
    epp: 'GUANTE NITRILO 9.5 TALLA 8',
    categoria: 'Protección Manos',
    costo: 640,
    unidad: 'Par',
    descripcion: 'Guante desechable de nitrilo calibre 9.5 para labores de desbotone.',
  },
  {
    codigoEpp: '7PRCAS01',
    epp: 'CASCO DE SEGURIDAD DIELECTRICO CLASE E',
    categoria: 'Cabeza y Rostro',
    costo: 38500,
    unidad: 'Unidad',
    descripcion: 'Protección contra impactos y descargas eléctricas hasta 20.000V con tafilete ratchet.',
  },
  {
    codigoEpp: '7PRBAR01',
    epp: 'BARBOQUEJO ELASTICO 3 PUNTOS CON MENTONERA',
    categoria: 'Cabeza y Rostro',
    costo: 8200,
    unidad: 'Unidad',
    descripcion: 'Sujeción fija mentonera para casco de seguridad.',
  },
  {
    codigoEpp: '7PRGAF01',
    epp: 'GAFAS DE SEGURIDAD TRANSPARENTES ANTIEMPAÑANTE',
    categoria: 'Protección Visual',
    costo: 14500,
    unidad: 'Par',
    descripcion: 'Lente de policarbonato con filtro UV 99.9% para protección ocular.',
  },
  {
    codigoEpp: '7PRGAF02',
    epp: 'GAFAS DE SEGURIDAD OSCURAS UV400',
    categoria: 'Protección Visual',
    costo: 16000,
    unidad: 'Par',
    descripcion: 'Para protección visual contra deslumbramiento solar e intemperie.',
  },
  {
    codigoEpp: '7PRAUD01',
    epp: 'PROTECTORES AUDITIVOS TIPO INSERCION CON CORDON',
    categoria: 'Protección Auditiva',
    costo: 6800,
    unidad: 'Par',
    descripcion: 'Tapones auditivos reutilizables hipoalergénicos NRR 26 dB.',
  },
  {
    codigoEpp: '7PRAUD02',
    epp: 'PROTECTOR AUDITIVO TIPO COPA PARA CASCO (DIADEMA)',
    categoria: 'Protección Auditiva',
    costo: 48000,
    unidad: 'Unidad',
    descripcion: 'Atenuación acústica NRR 29 dB para áreas de alta intensidad sonora.',
  },
  {
    codigoEpp: '7PRRES01',
    epp: 'MASCARILLA AUTOFILTRANTE N95 MATERIAL PARTICULADO',
    categoria: 'Protección Respiratoria',
    costo: 7500,
    unidad: 'Unidad',
    descripcion: 'Filtro contra polvos, neblinas y aerosoles (eficiencia 95%).',
  },
  {
    codigoEpp: '7PRRES02',
    epp: 'RESPIRADOR DE MEDIA CARA CON DOBLE CARTUCHO',
    categoria: 'Protección Respiratoria',
    costo: 89000,
    unidad: 'Unidad',
    descripcion: 'Pieza facial reutilizable para vapores orgánicos y agroquímicos.',
  },
  {
    codigoEpp: '7PRBOT01',
    epp: 'BOTAS DE SEGURIDAD EN CUERO CON PUNTERA DIELECTRICA',
    categoria: 'Protección Pies',
    costo: 138000,
    unidad: 'Par',
    descripcion: 'Calzado ergonómico de seguridad industrial con puntera composite.',
  },
  {
    codigoEpp: '7PRBOT02',
    epp: 'BOTAS DE CAUCHO IMPERMEABLES CAÑA ALTA',
    categoria: 'Protección Pies',
    costo: 65000,
    unidad: 'Par',
    descripcion: 'Impermeables 100% para labores de riego y terrenos húmedos.',
  },
  {
    codigoEpp: '7PRCHA01',
    epp: 'CHALECO DE ALTA VISIBILIDAD CON CINTAS REFLECTIVAS 3M',
    categoria: 'Protección Corporal',
    costo: 24500,
    unidad: 'Unidad',
    descripcion: 'Malla transpirable con franjas fluorescentes para tránsito seguro.',
  },
  {
    codigoEpp: '7PROVE01',
    epp: 'OVEROL DE TRABAJO EN DRIL 100% ALGODON CON CINTAS REFLECTIVAS',
    categoria: 'Protección Corporal',
    costo: 72000,
    unidad: 'Unidad',
    descripcion: 'Prenda enteriza de alta resistencia para talleres y operaciones de planta.',
  },
  {
    codigoEpp: '7PRARN01',
    epp: 'ARNES DE SEGURIDAD MULTIPROPOSITO DE 4 ARGOLLAS',
    categoria: 'Protección Caídas',
    costo: 195000,
    unidad: 'Unidad',
    descripcion: 'Para detención de caídas y posicionamiento en trabajos en altura.',
  },
  {
    codigoEpp: '7PRESL01',
    epp: 'ESLINGA DE DETENCION DE CAIDAS CON ABSORBEDOR',
    categoria: 'Protección Caídas',
    costo: 115000,
    unidad: 'Unidad',
    descripcion: 'Doble terminal tipo mosquetón para conexión segura a estructura.',
  },
];

export const MESES_ESPANOL = [
  'Enero',
  'Febrero',
  'Marzo',
  'Abril',
  'Mayo',
  'Junio',
  'Julio',
  'Agosto',
  'Septiembre',
  'Octubre',
  'Noviembre',
  'Diciembre',
];

/**
 * Función auxiliar para obtener el mes en español a partir de una fecha YYYY-MM-DD
 */
export const getMesEspanol = (fechaStr: string): string => {
  try {
    const parts = fechaStr.split('-');
    if (parts.length >= 2) {
      const monthIdx = parseInt(parts[1], 10) - 1;
      if (monthIdx >= 0 && monthIdx < 12) {
        return MESES_ESPANOL[monthIdx];
      }
    }
    const d = new Date(fechaStr);
    return MESES_ESPANOL[d.getMonth()] || 'Enero';
  } catch {
    return 'Enero';
  }
};

/**
 * Función auxiliar para obtener el número de mes (1 al 12) como aparece en la hoja de Drive
 */
export const getMesNumero = (fechaStr: string): number => {
  try {
    const parts = fechaStr.split('-');
    if (parts.length >= 2) {
      const monthNum = parseInt(parts[1], 10);
      if (!isNaN(monthNum) && monthNum >= 1 && monthNum <= 12) {
        return monthNum;
      }
    }
    const d = new Date(fechaStr);
    return d.getMonth() + 1;
  } catch {
    return 1;
  }
};

/**
 * Función auxiliar para obtener el año a partir de una fecha YYYY-MM-DD
 */
export const getAnioFecha = (fechaStr: string): number => {
  try {
    const parts = fechaStr.split('-');
    if (parts.length >= 1) {
      const y = parseInt(parts[0], 10);
      if (!isNaN(y)) return y;
    }
    return new Date(fechaStr).getFullYear();
  } catch {
    return new Date().getFullYear();
  }
};

/**
 * Formateador de moneda colombiana COP
 */
export const formatCOP = (valor: number): string => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(valor || 0);
};

// Aliases para compatibilidad
export type EPPDeliveryRecord = EntregaEPPMGRecord;
export type EPPItemCatalog = EPPCatalogItem;
export const EPP_CATALOG = CATALOGO_EPPS;
export type EPPDeliveryReason = string;
