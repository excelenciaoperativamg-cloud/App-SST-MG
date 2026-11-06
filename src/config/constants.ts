import { MenuModuleConfig, Sede, Supervisor, EPS, ARL, RoleInfo } from '../types';

export const ROLES: Record<string, RoleInfo> = {
  admin: {
    id: 'admin',
    name: 'Administrador General',
    description: 'Acceso total, gestión de usuarios, catálogos, maestro y respaldos',
    badgeColor: 'bg-red-100 text-red-800 border-red-300',
  },
  sst_lead: {
    id: 'sst_lead',
    name: 'Responsable SST',
    description: 'Acceso y registro a módulos SST autorizados, reportes e indicadores',
    badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  site_lead: {
    id: 'site_lead',
    name: 'Responsable de Sede',
    description: 'Diligenciamiento y consulta de información de su sede asignada',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  viewer: {
    id: 'viewer',
    name: 'Usuario de Consulta',
    description: 'Solo lectura de registros autorizados sin permisos de edición',
    badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
  },
};

export const INITIAL_SEDES: Sede[] = [
  { id: 'MG-MG', codigo: 'MG-MG', nombre: 'Sede Principal MG', ciudad: 'Medellín', direccion: 'Cra 43A # 1-50', activa: true },
  { id: 'MG-HA', codigo: 'MG-HA', nombre: 'Sede Hacienda / Planta', ciudad: 'Rionegro', direccion: 'Km 7 Vía Aeropuerto', activa: true },
  { id: 'MG-SC', codigo: 'MG-SC', nombre: 'Sede Santa Cruz', ciudad: 'Bello', direccion: 'Calle 50 # 45-20', activa: true },
  { id: 'MG-JA', codigo: 'MG-JA', nombre: 'Sede Jardín', ciudad: 'Envigado', direccion: 'Transversal 39 # 72-11', activa: true },
  { id: 'MG-ER', codigo: 'MG-ER', nombre: 'Sede El Retiro', ciudad: 'El Retiro', direccion: 'Sector Las Palmas', activa: true },
];

export const INITIAL_SUPERVISORES: Supervisor[] = [
  { id: 'sup-1', sedeId: 'MG-MG', area: 'Operaciones', supervisor: 'Carlos Mario Restrepo', cargo: 'Supervisor Operativo', telefono: '3104501122' },
  { id: 'sup-2', sedeId: 'MG-MG', area: 'Mantenimiento', supervisor: 'Andrés Felipe Gómez', cargo: 'Líder Técnico', telefono: '3128904321' },
  { id: 'sup-3', sedeId: 'MG-HA', area: 'Producción', supervisor: 'María Eugenia Salazar', cargo: 'Supervisora de Planta', telefono: '3146709823' },
  { id: 'sup-4', sedeId: 'MG-HA', area: 'Logística', supervisor: 'Juan David Correa', cargo: 'Coordinador Logístico', telefono: '3187654320' },
  { id: 'sup-5', sedeId: 'MG-SC', area: 'Almacén', supervisor: 'Guillermo León Vélez', cargo: 'Supervisor Almacén', telefono: '3156678912' },
  { id: 'sup-6', sedeId: 'MG-JA', area: 'Servicios Generales', supervisor: 'Martha Lucía Henao', cargo: 'Líder de Servicios', telefono: '3112233445' },
  { id: 'sup-7', sedeId: 'MG-ER', area: 'Seguridad Física', supervisor: 'Jorge Eliécer Mora', cargo: 'Coordinador de Seguridad', telefono: '3209988776' },
];

export const INITIAL_EPS: EPS[] = [
  { id: 'eps-1', nombre: 'SURA EPS', codigo: 'EPS010', telefono: '018000519519', activa: true },
  { id: 'eps-2', nombre: 'Sanitas EPS', codigo: 'EPS005', telefono: '018000919100', activa: true },
  { id: 'eps-3', nombre: 'Compensar EPS', codigo: 'EPS008', telefono: '6014441234', activa: true },
  { id: 'eps-4', nombre: 'Nueva EPS', codigo: 'EPS037', telefono: '018000954400', activa: true },
  { id: 'eps-5', nombre: 'Salud Total EPS', codigo: 'EPS002', telefono: '018000114524', activa: true },
  { id: 'eps-6', nombre: 'Famisanar EPS', codigo: 'EPS017', telefono: '018000127363', activa: true },
  { id: 'eps-7', nombre: 'Savia Salud EPS', codigo: 'EPS040', telefono: '018000423683', activa: true },
];

export const INITIAL_ARL: ARL[] = [
  { id: 'arl-1', nombre: 'ARL SURA', codigo: '14-23', lineaEmergencias: '018000511414', activa: true },
  { id: 'arl-2', nombre: 'Positiva Compañía de Seguros', codigo: '14-28', lineaEmergencias: '018000111170', activa: true },
  { id: 'arl-3', nombre: 'Seguros Bolívar ARL', codigo: '14-25', lineaEmergencias: '018000123322', activa: true },
  { id: 'arl-4', nombre: 'Colmena Seguros ARL', codigo: '14-29', lineaEmergencias: '018000919667', activa: true },
  { id: 'arl-5', nombre: 'AXA Colpatria ARL', codigo: '14-18', lineaEmergencias: '018000512620', activa: true },
];

/**
 * The 8 official modules and their submenus as per App_SST MG.xlsx
 */
export const SST_MODULES: MenuModuleConfig[] = [
  {
    id: 'ec4f1989',
    nombre: 'Rondas de Cuidado',
    vista: 'Rondas de Cuidado',
    icono: 'ShieldAlert',
    descripcion: 'Supervisión en sitio y verificación de comportamientos seguros y condiciones de trabajo.',
    submenus: [
      {
        id: 'sub-rc-1',
        menuId: 'ec4f1989',
        nombre: 'Rondas de Cuidado',
        descripcion: 'Inspección de rondas operativas en puestos de trabajo.',
        codigo: 'RC_RONDAS',
        formularioOficialPendiente: true,
      },
    ],
  },
  {
    id: '6818e75c',
    nombre: 'Contratistas',
    vista: 'Contratistas',
    icono: 'HardHat',
    descripcion: 'Gestión, selección, afiliaciones y control operacional de empresas contratistas.',
    submenus: [
      {
        id: 'sub-ct-1',
        menuId: '6818e75c',
        nombre: 'Seguimiento Contratistas',
        descripcion: 'Control periódico de ejecución y cumplimiento de normas SST por contratistas.',
        codigo: 'CT_SEGUIMIENTO',
        formularioOficialPendiente: true,
      },
      {
        id: 'sub-ct-2',
        menuId: '6818e75c',
        nombre: 'Selección Contratistas',
        descripcion: 'Evaluación inicial de requisitos SST para admisión y contratación.',
        codigo: 'CT_SELECCION',
        formularioOficialPendiente: true,
      },
    ],
  },
  {
    id: 'd19d30b0',
    nombre: 'Inspección Emergencias',
    vista: 'Inspección Emergencias',
    icono: 'Flame',
    descripcion: 'Inspecciones periódicas de equipos de protección contra fuego y atención de emergencias.',
    submenus: [
      {
        id: 'sub-em-1',
        menuId: 'd19d30b0',
        nombre: 'Extintores',
        descripcion: 'Verificación de vigencia, presión, precinto, señalización y ubicación de extintores.',
        codigo: 'EM_EXTINTORES',
        formularioOficialPendiente: true,
      },
      {
        id: 'sub-em-2',
        menuId: 'd19d30b0',
        nombre: 'Cilindros',
        descripcion: 'Control e inspección de gases comprimidos, anclajes y válvulas de seguridad.',
        codigo: 'EM_CILINDROS',
        formularioOficialPendiente: true,
      },
      {
        id: 'sub-em-3',
        menuId: 'd19d30b0',
        nombre: 'Camillas',
        descripcion: 'Estado físico, correas, limpieza y señalización de camillas de primeros auxilios.',
        codigo: 'EM_CAMILLAS',
        formularioOficialPendiente: true,
      },
      {
        id: 'sub-em-4',
        menuId: 'd19d30b0',
        nombre: 'Kit Derrames',
        descripcion: 'Chequeo de paños absorbentes, cordones, guantes y palas del kit de derrames.',
        codigo: 'EM_KIT_DERRAMES',
        formularioOficialPendiente: true,
      },
      {
        id: 'sub-em-5',
        menuId: 'd19d30b0',
        nombre: 'Sensores de humo',
        descripcion: 'Pruebas de operatividad, baterías y cobertura de detectores de humo y fuego.',
        codigo: 'EM_SENSORES_HUMO',
        formularioOficialPendiente: true,
      },
      {
        id: 'sub-em-6',
        menuId: 'd19d30b0',
        nombre: 'Lámpara Emergencia',
        descripcion: 'Revisión de autonomía eléctrica, focos y estado de luminarias de evacuación.',
        codigo: 'EM_LAMPARAS',
        formularioOficialPendiente: true,
      },
      {
        id: 'sub-em-7',
        menuId: 'd19d30b0',
        nombre: 'Lava Ojos',
        descripcion: 'Prueba de flujo hídrico, limpieza de tapas y presión en estaciones de lava ojos.',
        codigo: 'EM_LAVA_OJOS',
        formularioOficialPendiente: true,
      },
      {
        id: 'sub-em-8',
        menuId: 'd19d30b0',
        nombre: 'Kit rescate acuático',
        descripcion: 'Inspección de salvavidas, aros, cuerdas y chalecos de rescate.',
        codigo: 'EM_RESCATE_ACUATICO',
        formularioOficialPendiente: true,
      },
    ],
  },
  {
    id: '19bd6vha0',
    nombre: 'Inspecciones Integrales',
    vista: 'Inspecciones Integrales',
    icono: 'ClipboardCheck',
    descripcion: 'Inspecciones planeadas multidimensionales de instalaciones y puestos de trabajo.',
    submenus: [
      {
        id: 'sub-ii-1',
        menuId: '19bd6vha0',
        nombre: 'M_InsIntegrales',
        descripcion: 'Matriz e inspección integral por sede y áreas críticas de operación.',
        codigo: 'II_MINSINTEGRALES',
        formularioOficialPendiente: true,
      },
    ],
  },
  {
    id: 'c9189227',
    nombre: 'Personal',
    vista: 'Personal',
    icono: 'Users',
    descripcion: 'Gestión de elementos de protección personal, actos inseguros y plan anual de trabajo.',
    submenus: [
      {
        id: 'sub-per-1',
        menuId: 'c9189227',
        nombre: 'Entrega EPP\'s',
        descripcion: 'Constancia de entrega y renovación de Elementos de Protección Personal.',
        codigo: 'PER_ENTREGA_EPP',
        formularioOficialPendiente: true,
      },
      {
        id: 'sub-per-2',
        menuId: 'c9189227',
        nombre: 'Condiciones Inseguras',
        descripcion: 'Reporte e intervención de actos y condiciones subestándar en puestos de trabajo.',
        codigo: 'PER_CONDICIONES_INSEGURAS',
        formularioOficialPendiente: true,
      },
      {
        id: 'sub-per-3',
        menuId: 'c9189227',
        nombre: 'PAT_SST',
        descripcion: 'Seguimiento a compromisos del Plan Anual de Trabajo en SST.',
        codigo: 'PER_PAT_SST',
        formularioOficialPendiente: true,
      },
    ],
  },
  {
    id: '649b9099',
    nombre: 'PESV',
    vista: 'PESV',
    icono: 'Truck',
    descripcion: 'Plan Estratégico de Seguridad Vial - Control de vehículos, motocicletas y conductores.',
    submenus: [
      {
        id: 'sub-pesv-1',
        menuId: '649b9099',
        nombre: 'Chequeo Vehículos',
        descripcion: 'Inspección preoperacional diaria de automotores, frenos, llantas y documentos.',
        codigo: 'PESV_CHEQUEO',
        formularioOficialPendiente: true,
      },
    ],
  },
  {
    id: '8ddfd774',
    nombre: 'Salud',
    vista: 'Salud',
    icono: 'HeartPulse',
    descripcion: 'Medicina preventiva, valoraciones ocupacionales, pausas activas y primeros auxilios.',
    submenus: [
      {
        id: 'sub-sal-1',
        menuId: '8ddfd774',
        nombre: 'Agenda Médica',
        descripcion: 'Programación de exámenes médicos periódicos, de ingreso y egreso.',
        codigo: 'SAL_AGENDA_MEDICA',
        formularioOficialPendiente: true,
      },
      {
        id: 'sub-sal-2',
        menuId: '8ddfd774',
        nombre: 'Atenciones en Campo',
        descripcion: 'Registro de valoraciones de enfermería, signos vitales y primeros auxilios en sitio.',
        codigo: 'SAL_ATENCIONES_CAMPO',
        formularioOficialPendiente: true,
      },
      {
        id: 'sub-sal-3',
        menuId: '8ddfd774',
        nombre: 'Pausas Saludables',
        descripcion: 'Registro de asistencia y ejecución de pausas activas osteomusculares.',
        codigo: 'SAL_PAUSAS_SALUDABLES',
        formularioOficialPendiente: true,
      },
      {
        id: 'sub-sal-4',
        menuId: '8ddfd774',
        nombre: 'Reporte Salud',
        descripcion: 'Consolidado epidemiológico y seguimiento a sintomáticos o restricciones.',
        codigo: 'SAL_REPORTE_SALUD',
        formularioOficialPendiente: true,
      },
    ],
  },
  {
    id: '2a6f4386',
    nombre: '5S',
    vista: '5S',
    icono: 'Sparkles',
    descripcion: 'Metodología 5S: Clasificación, Orden, Limpieza, Estandarización y Disciplina.',
    submenus: [
      {
        id: 'sub-5s-1',
        menuId: '2a6f4386',
        nombre: 'Orden y Aseo',
        descripcion: 'Auditoría y calificación de estándares de orden, señalización y aseo en áreas.',
        codigo: '5S_ORDEN_ASEO',
        formularioOficialPendiente: true,
      },
    ],
  },
];
