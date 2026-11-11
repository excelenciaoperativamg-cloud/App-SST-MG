/**
 * Tipos específicos para el Formulario y Gestión de Entrega de EPP's (Elementos de Protección Personal)
 * MG Consultores S.A.S. - Sistema SG-SST
 */

export type EPPCategory =
  | 'CABEZA_ROSTRO'
  | 'VISUAL'
  | 'AUDITIVA'
  | 'RESPIRATORIA'
  | 'MANOS'
  | 'PIES'
  | 'CORPORAL_ALTURAS';

export interface EPPItemCatalog {
  id: string;
  categoria: EPPCategory;
  nombre: string;
  descripcion: string;
  unidad: string;
  tallasDisponibles?: string[];
  normaTecnica?: string; // Ej: ANSI Z87.1, NTC 1523, EN 388
}

export interface EPPDeliveryItem {
  itemId: string;
  categoria: EPPCategory;
  nombre: string;
  cantidad: number;
  talla?: string;
  estado: 'NUEVO' | 'REPOSICION' | 'BUEN_ESTADO';
  observacion?: string;
}

export type EPPDeliveryReason =
  | 'DOTACION_PERIODICA'
  | 'INGRESO_NUEVO'
  | 'REPOSICION_DESGASTE'
  | 'CAMBIO_DANO'
  | 'PERDIDA_ROBO'
  | 'REPOSICION_ACCIDENTE'
  | 'OTRO';

export interface EPPDeliveryRecord {
  id: string;
  numeroActa: string; // ej: EPP-2026-001
  fecha: string;
  sedeId: string;
  area: string;
  supervisor: string;
  // Trabajador receptor del Maestro de Personal
  cedulaTrabajador: string;
  nombreTrabajador: string;
  puestoTrabajador: string;
  motivo: EPPDeliveryReason;
  // Lista de elementos entregados
  items: EPPDeliveryItem[];
  observaciones: string;
  // Compromiso y aceptación
  compromisoAceptado: boolean;
  firmaTrabajadorUrl?: string; // Data URL de la firma o confirmación
  responsableEntrega: string;
  responsableEmail: string;
  estado: 'BORRADOR' | 'PENDIENTE_FIRMA' | 'ENTREGADO_FIRMADO';
  evidenciasFotos?: Array<{ id: string; nombre: string; url: string }>;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
}

/**
 * Catálogo estándar de Elementos de Protección Personal utilizados en MG Consultores
 */
export const EPP_CATALOG: EPPItemCatalog[] = [
  // 1. Cabeza y Rostro
  {
    id: 'epp-casco',
    categoria: 'CABEZA_ROSTRO',
    nombre: 'Casco de Seguridad Dieléctrico Tipo I Clase E',
    descripcion: 'Protección contra impactos, penetración y descargas eléctricas hasta 20.000V.',
    unidad: 'Unidad',
    tallasDisponibles: ['Ajustable (52-64cm)'],
    normaTecnica: 'ANSI/ISEA Z89.1',
  },
  {
    id: 'epp-barboquejo',
    categoria: 'CABEZA_ROSTRO',
    nombre: 'Barboquejo con mentonera elástica de 3 puntos',
    descripcion: 'Fijación segura del casco en trabajos de altura o movimiento.',
    unidad: 'Unidad',
    tallasDisponibles: ['Universal'],
  },
  {
    id: 'epp-careta-facial',
    categoria: 'CABEZA_ROSTRO',
    nombre: 'Careta Facial en Policarbonato Transparente 8x15.5',
    descripcion: 'Protección contra salpicaduras químicas y proyección de partículas.',
    unidad: 'Unidad',
    normaTecnica: 'ANSI Z87.1',
  },

  // 2. Visual
  {
    id: 'epp-gafas-claras',
    categoria: 'VISUAL',
    nombre: 'Gafas de Seguridad Transparentes Antirrayadura y Antiempañante',
    descripcion: 'Lente de policarbonato de alta resistencia con protección UV 99.9%.',
    unidad: 'Par',
    normaTecnica: 'ANSI Z87.1',
  },
  {
    id: 'epp-gafas-oscuras',
    categoria: 'VISUAL',
    nombre: 'Gafas de Seguridad Oscuras con Filtro Solar UV400',
    descripcion: 'Para trabajos a la intemperie y protección contra deslumbramiento.',
    unidad: 'Par',
    normaTecnica: 'ANSI Z87.1',
  },

  // 3. Auditiva
  {
    id: 'epp-protectores-insercion',
    categoria: 'AUDITIVA',
    nombre: 'Protectores Auditivos Tipo Inserción con Cordón (Silicona)',
    descripcion: 'Tapones reutilizables con atenuación NRR 25-27 dB.',
    unidad: 'Par',
    normaTecnica: 'ANSI S3.19',
  },
  {
    id: 'epp-protectores-copa',
    categoria: 'AUDITIVA',
    nombre: 'Protector Auditivo Tipo Copa para Casco (Diadema)',
    descripcion: 'Para áreas de alto impacto sonoro continuo (NRR 29 dB).',
    unidad: 'Unidad',
    normaTecnica: 'ANSI S3.19',
  },

  // 4. Respiratoria
  {
    id: 'epp-mascarilla-n95',
    categoria: 'RESPIRATORIA',
    nombre: 'Mascarilla Autofiltrante N95 para Material Particulado',
    descripcion: 'Filtro para polvos, neblinas y humos no oleosos (eficiencia 95%).',
    unidad: 'Unidad',
    normaTecnica: 'NIOSH N95',
  },
  {
    id: 'epp-respirador-media-cara',
    categoria: 'RESPIRATORIA',
    nombre: 'Respirador de Media Cara Elastómero con Doble Cartucho',
    descripcion: 'Pieza facial reutilizable para vapores orgánicos y gases.',
    unidad: 'Unidad',
    tallasDisponibles: ['M', 'L'],
    normaTecnica: 'NIOSH',
  },

  // 5. Manos
  {
    id: 'epp-guantes-vaqueta',
    categoria: 'MANOS',
    nombre: 'Guantes de Vaqueta Tipo Ingeniero',
    descripcion: 'Cuero suave de alta maniobrabilidad para labores mecánicas generales.',
    unidad: 'Par',
    tallasDisponibles: ['8 (M)', '9 (L)', '10 (XL)'],
  },
  {
    id: 'epp-guantes-nitrilo',
    categoria: 'MANOS',
    nombre: 'Guantes de Nitrilo Verde Calibre 15 (Químico)',
    descripcion: 'Resistentes a solventes, aceites, lubricantes y desinfectantes.',
    unidad: 'Par',
    tallasDisponibles: ['8', '9', '10'],
    normaTecnica: 'EN 388 / EN 374',
  },
  {
    id: 'epp-guantes-anticorte',
    categoria: 'MANOS',
    nombre: 'Guantes de Tejido HPPE Anticorte Nivel 5',
    descripcion: 'Palma con recubrimiento en poliuretano para manipulación de cuchillas o vidrios.',
    unidad: 'Par',
    tallasDisponibles: ['8 (M)', '9 (L)'],
    normaTecnica: 'EN 388 Nivel 5',
  },

  // 6. Pies
  {
    id: 'epp-botas-cuero',
    categoria: 'PIES',
    nombre: 'Botas de Seguridad en Cuero con Puntera Dieléctrica',
    descripcion: 'Suela antideslizante en poliuretano bidensidad, resistente a hidrocarburos.',
    unidad: 'Par',
    tallasDisponibles: ['37', '38', '39', '40', '41', '42', '43', '44'],
    normaTecnica: 'NTC ISO 20345 / ASTM F2413',
  },
  {
    id: 'epp-botas-caucho',
    categoria: 'PIES',
    nombre: 'Botas de Caucho Impermeables Caña Alta',
    descripcion: 'Para labores en zonas húmedas o lavado de instalaciones.',
    unidad: 'Par',
    tallasDisponibles: ['38', '39', '40', '41', '42', '43'],
  },

  // 7. Corporal y Alturas
  {
    id: 'epp-chaleco-reflectivo',
    categoria: 'CORPORAL_ALTURAS',
    nombre: 'Chaleco de Alta Visibilidad con Cintas Reflectivas 3M',
    descripcion: 'Norma de señalización diurna y nocturna para zonas de tránsito vehicular.',
    unidad: 'Unidad',
    tallasDisponibles: ['M', 'L', 'XL'],
    normaTecnica: 'ANSI/ISEA 107',
  },
  {
    id: 'epp-overol',
    categoria: 'CORPORAL_ALTURAS',
    nombre: 'Overol de Trabajo en Dril con Cintas Reflectivas',
    descripcion: 'Prenda de dos piezas o entera para protección contra suciedad y abrasión.',
    unidad: 'Unidad',
    tallasDisponibles: ['S', 'M', 'L', 'XL', 'XXL'],
  },
  {
    id: 'epp-arnes-alturas',
    categoria: 'CORPORAL_ALTURAS',
    nombre: 'Arnés de Seguridad Multipropósito de 4 Argollas',
    descripcion: 'Para detención de caídas y posicionamiento en trabajos sobre 2.0 metros.',
    unidad: 'Unidad',
    normaTecnica: 'ANSI Z359.11',
  },
];
