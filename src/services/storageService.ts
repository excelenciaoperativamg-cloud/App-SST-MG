import {
  PersonnelWorker,
  SSTRecord,
  Sede,
  Supervisor,
  EPS,
  ARL,
  MasterImportHistory,
  AuditLog,
} from '../types';
import {
  EntregaEPPMGRecord,
  EPPCatalogItem,
  CATALOGO_EPPS,
  getMesEspanol,
  getAnioFecha,
  EPPDeliveryRecord,
} from '../types/epp';
import {
  INITIAL_SEDES,
  INITIAL_SUPERVISORES,
  INITIAL_EPS,
  INITIAL_ARL,
} from '../config/constants';
import { auditService } from './auditService';

// Storage keys
const KEYS = {
  PERSONNEL: 'mg_sst_personnel_master',
  RECORDS: 'mg_sst_records',
  EPP_DELIVERIES: 'mg_sst_entrega_epp_mg_v2',
  EPP_CATALOG: 'mg_sst_epps_catalog',
  SEDES: 'mg_sst_sedes',
  SUPERVISORES: 'mg_sst_supervisores',
  EPS: 'mg_sst_eps',
  ARL: 'mg_sst_arl',
  IMPORT_HISTORY: 'mg_sst_import_history',
};

// Initial sample seed workers from sheet Maestro of App_SST MG
const SEED_WORKERS: PersonnelWorker[] = [
  {
    id: '161008',
    cedula: '161008',
    nombre: 'ANGULO VEGA LUIS FERNANDO',
    fechaNacimiento: '1990-05-14',
    edad: 35,
    genero: 'M',
    sedeId: 'MG-HA',
    fechaIngreso: '2020-03-15',
    puesto: 'MIPE',
    eps: 'SURA EPS',
    arl: 'ARL SURA',
    estado: 'ACTIVO',
    createdAt: '2020-03-15T08:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: '125935',
    cedula: '125935',
    nombre: 'MEDINA PATIÑO DANIA LINEY',
    fechaNacimiento: '1993-08-20',
    edad: 32,
    genero: 'F',
    sedeId: 'MG-HA',
    fechaIngreso: '2021-06-01',
    puesto: 'CORTE - GYZ',
    eps: 'Sanitas EPS',
    arl: 'ARL SURA',
    estado: 'ACTIVO',
    createdAt: '2021-06-01T08:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: '743',
    cedula: '743',
    nombre: 'NOGUERA GETIAL MARGARITA DEL CARMEN',
    fechaNacimiento: '1985-11-04',
    edad: 40,
    genero: 'F',
    sedeId: 'MG-HA',
    fechaIngreso: '2019-11-10',
    puesto: 'CORTE - GYZ',
    eps: 'Compensar EPS',
    arl: 'ARL SURA',
    estado: 'ACTIVO',
    createdAt: '2019-11-10T08:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: '191447',
    cedula: '191447',
    nombre: 'MONTILLA CABRERA LEONARDO',
    fechaNacimiento: '1989-02-17',
    edad: 37,
    genero: 'M',
    sedeId: 'MG-HA',
    fechaIngreso: '2021-02-01',
    puesto: 'RESIDUO POSCOSECHA',
    eps: 'Salud Total EPS',
    arl: 'ARL SURA',
    estado: 'ACTIVO',
    createdAt: '2021-02-01T08:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: '121184',
    cedula: '121184',
    nombre: 'AVILA CABALLERO GRISELDA',
    fechaNacimiento: '1992-09-30',
    edad: 33,
    genero: 'F',
    sedeId: 'MG-HA',
    fechaIngreso: '2020-08-15',
    puesto: 'BONCHADOR',
    eps: 'Nueva EPS',
    arl: 'ARL SURA',
    estado: 'ACTIVO',
    createdAt: '2020-08-15T08:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: '153491',
    cedula: '153491',
    nombre: 'VELASQUEZ MERCADO CRISTIAN DAVID',
    fechaNacimiento: '1996-04-12',
    edad: 29,
    genero: 'M',
    sedeId: 'MG-HA',
    fechaIngreso: '2022-01-15',
    puesto: 'SURTIDO',
    eps: 'SURA EPS',
    arl: 'ARL SURA',
    estado: 'ACTIVO',
    createdAt: '2022-01-15T08:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: '131636',
    cedula: '131636',
    nombre: 'RAMIREZ ROMERO SEIDY WINNEHT',
    fechaNacimiento: '1994-07-22',
    edad: 31,
    genero: 'F',
    sedeId: 'MG-HA',
    fechaIngreso: '2021-09-01',
    puesto: 'BONCHADOR',
    eps: 'SURA EPS',
    arl: 'ARL SURA',
    estado: 'ACTIVO',
    createdAt: '2021-09-01T08:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: '120729',
    cedula: '120729',
    nombre: 'BOYACA CASTILLO JENNY LORENA',
    fechaNacimiento: '1991-10-18',
    edad: 34,
    genero: 'F',
    sedeId: 'MG-HA',
    fechaIngreso: '2020-05-10',
    puesto: 'BONCHADOR',
    eps: 'Sanitas EPS',
    arl: 'ARL SURA',
    estado: 'ACTIVO',
    createdAt: '2020-05-10T08:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: '204938',
    cedula: '204938',
    nombre: 'RIVAS SALAZAR WILFERDO JOSE',
    fechaNacimiento: '1987-12-05',
    edad: 38,
    genero: 'M',
    sedeId: 'MG-HA',
    fechaIngreso: '2022-03-20',
    puesto: 'RESIDUO POSCOSECHA',
    eps: 'Compensar EPS',
    arl: 'ARL SURA',
    estado: 'ACTIVO',
    createdAt: '2022-03-20T08:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: '203402',
    cedula: '203402',
    nombre: 'MARTINEZ MARTINEZ LUIS MANUEL',
    fechaNacimiento: '1988-06-14',
    edad: 37,
    genero: 'M',
    sedeId: 'MG-HA',
    fechaIngreso: '2022-02-15',
    puesto: 'RESIDUO POSCOSECHA',
    eps: 'Nueva EPS',
    arl: 'ARL SURA',
    estado: 'ACTIVO',
    createdAt: '2022-02-15T08:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: '14148',
    cedula: '14148',
    nombre: 'MERCADO CERPA ADRIANA MARCELA',
    fechaNacimiento: '1993-01-15',
    edad: 33,
    genero: 'F',
    sedeId: 'MG-HA',
    fechaIngreso: '2019-04-10',
    puesto: 'BONCHADOR',
    eps: 'SURA EPS',
    arl: 'ARL SURA',
    estado: 'ACTIVO',
    createdAt: '2019-04-10T08:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: '204174',
    cedula: '204174',
    nombre: 'VASQUEZ ORTIZ ANA MILENA',
    fechaNacimiento: '1995-03-25',
    edad: 31,
    genero: 'F',
    sedeId: 'MG-HA',
    fechaIngreso: '2022-04-01',
    puesto: 'BONCHADOR',
    eps: 'Salud Total EPS',
    arl: 'ARL SURA',
    estado: 'ACTIVO',
    createdAt: '2022-04-01T08:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: '203881',
    cedula: '203881',
    nombre: 'BAÑOS PONTON MARISOL',
    fechaNacimiento: '1990-11-12',
    edad: 35,
    genero: 'F',
    sedeId: 'MG-HA',
    fechaIngreso: '2022-03-01',
    puesto: 'BONCHADOR',
    eps: 'Sanitas EPS',
    arl: 'ARL SURA',
    estado: 'ACTIVO',
    createdAt: '2022-03-01T08:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: '77478',
    cedula: '77478',
    nombre: 'ALVARADO COLO DIANA PAOLA',
    fechaNacimiento: '1989-07-08',
    edad: 36,
    genero: 'F',
    sedeId: 'MG-HA',
    fechaIngreso: '2020-01-15',
    puesto: 'CORTE-BASES ALZ',
    eps: 'Compensar EPS',
    arl: 'ARL SURA',
    estado: 'ACTIVO',
    createdAt: '2020-01-15T08:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: '113605',
    cedula: '113605',
    nombre: 'LARA BRICEÑO JOSE ALEXANDER',
    fechaNacimiento: '1986-09-17',
    edad: 39,
    genero: 'M',
    sedeId: 'MG-HA',
    fechaIngreso: '2019-08-20',
    puesto: 'TRANSPORTADOR',
    eps: 'Nueva EPS',
    arl: 'ARL SURA',
    estado: 'ACTIVO',
    createdAt: '2019-08-20T08:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: '3064',
    cedula: '3064',
    nombre: 'DELGADO LOZANO OSCAR ANTONIO',
    fechaNacimiento: '1984-05-30',
    edad: 41,
    genero: 'M',
    sedeId: 'MG-HA',
    fechaIngreso: '2018-06-15',
    puesto: 'TRANSPORTADOR',
    eps: 'SURA EPS',
    arl: 'ARL SURA',
    estado: 'ACTIVO',
    createdAt: '2018-06-15T08:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: '187205',
    cedula: '187205',
    nombre: 'CARDENAS PALLARES YULI KATERIN',
    fechaNacimiento: '1994-12-14',
    edad: 31,
    genero: 'F',
    sedeId: 'MG-HA',
    fechaIngreso: '2021-04-10',
    puesto: 'CORTE-BASES ALZ',
    eps: 'Salud Total EPS',
    arl: 'ARL SURA',
    estado: 'ACTIVO',
    createdAt: '2021-04-10T08:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: '167186',
    cedula: '167186',
    nombre: 'GONZALEZ GONZALEZ DANNY CAROLINA',
    fechaNacimiento: '1992-03-08',
    edad: 33,
    genero: 'F',
    sedeId: 'MG-HA',
    fechaIngreso: '2020-09-01',
    puesto: 'CORTE-BASES ALZ',
    eps: 'Sanitas EPS',
    arl: 'ARL SURA',
    estado: 'ACTIVO',
    createdAt: '2020-09-01T08:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: '164304',
    cedula: '164304',
    nombre: 'SUAREZ ANAYA ANA CAROLINA',
    fechaNacimiento: '1991-08-19',
    edad: 34,
    genero: 'F',
    sedeId: 'MG-HA',
    fechaIngreso: '2020-07-15',
    puesto: 'CORTE-BASES ALZ',
    eps: 'Compensar EPS',
    arl: 'ARL SURA',
    estado: 'ACTIVO',
    createdAt: '2020-07-15T08:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: '12942',
    cedula: '12942',
    nombre: 'AYALA JIMENEZ INGRITH ESTELA',
    fechaNacimiento: '1988-01-22',
    edad: 38,
    genero: 'F',
    sedeId: 'MG-HA',
    fechaIngreso: '2019-02-10',
    puesto: 'CORTE-BASES ALZ',
    eps: 'Nueva EPS',
    arl: 'ARL SURA',
    estado: 'ACTIVO',
    createdAt: '2019-02-10T08:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: '75409',
    cedula: '75409',
    nombre: 'LUNA HOYOS SANDRA MILENA',
    fechaNacimiento: '1987-04-16',
    edad: 38,
    genero: 'F',
    sedeId: 'MG-HA',
    fechaIngreso: '2019-05-15',
    puesto: 'CORTE-BASES ALZ',
    eps: 'SURA EPS',
    arl: 'ARL SURA',
    estado: 'ACTIVO',
    createdAt: '2019-05-15T08:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: '93693',
    cedula: '93693',
    nombre: 'MARTINEZ SUAREZ CARLOS ALBEIRO',
    fechaNacimiento: '1985-10-30',
    edad: 40,
    genero: 'M',
    sedeId: 'MG-HA',
    fechaIngreso: '2018-09-01',
    puesto: 'CORTE-BASES ALZ',
    eps: 'Salud Total EPS',
    arl: 'ARL SURA',
    estado: 'ACTIVO',
    createdAt: '2018-09-01T08:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: '187832',
    cedula: '187832',
    nombre: 'ROJAS GUILLEN KEINER',
    fechaNacimiento: '1993-06-05',
    edad: 32,
    genero: 'M',
    sedeId: 'MG-HA',
    fechaIngreso: '2021-05-15',
    puesto: 'CORTE-BASES ALZ',
    eps: 'Sanitas EPS',
    arl: 'ARL SURA',
    estado: 'ACTIVO',
    createdAt: '2021-05-15T08:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: '150118',
    cedula: '150118',
    nombre: 'PEDROZO NIEVES ANDRES ALFONSO',
    fechaNacimiento: '1992-02-18',
    edad: 34,
    genero: 'M',
    sedeId: 'MG-HA',
    fechaIngreso: '2020-03-10',
    puesto: 'CORTE-BASES ALZ',
    eps: 'Compensar EPS',
    arl: 'ARL SURA',
    estado: 'ACTIVO',
    createdAt: '2020-03-10T08:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: '4048',
    cedula: '4048',
    nombre: 'ROMERO MORENO DIEGO ANDRES',
    fechaNacimiento: '1986-11-28',
    edad: 39,
    genero: 'M',
    sedeId: 'MG-HA',
    fechaIngreso: '2018-10-01',
    puesto: 'CORTE-BASES ALZ',
    eps: 'Nueva EPS',
    arl: 'ARL SURA',
    estado: 'ACTIVO',
    createdAt: '2018-10-01T08:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: '205205',
    cedula: '205205',
    nombre: 'FAJARDO OROZCO NEIDER FELIPE',
    fechaNacimiento: '1995-08-14',
    edad: 30,
    genero: 'M',
    sedeId: 'MG-HA',
    fechaIngreso: '2022-05-20',
    puesto: 'CORTE-BASES ALZ',
    eps: 'SURA EPS',
    arl: 'ARL SURA',
    estado: 'ACTIVO',
    createdAt: '2022-05-20T08:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: '169261',
    cedula: '169261',
    nombre: 'MOYA MIRANDA ABIMAEL DAVID',
    fechaNacimiento: '1993-09-02',
    edad: 32,
    genero: 'M',
    sedeId: 'MG-HA',
    fechaIngreso: '2021-01-15',
    puesto: 'CORTE-BASES ALZ',
    eps: 'Salud Total EPS',
    arl: 'ARL SURA',
    estado: 'ACTIVO',
    createdAt: '2021-01-15T08:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: '173528',
    cedula: '173528',
    nombre: 'PUSHAINA JUSAYU LUIS EDUARDO',
    fechaNacimiento: '1994-04-20',
    edad: 31,
    genero: 'M',
    sedeId: 'MG-HA',
    fechaIngreso: '2021-03-01',
    puesto: 'CORTE-BASES ALZ',
    eps: 'Sanitas EPS',
    arl: 'ARL SURA',
    estado: 'ACTIVO',
    createdAt: '2021-03-01T08:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: '109757',
    cedula: '109757',
    nombre: 'PEÑALOZA NUÑEZ JUAN ANTONIO',
    fechaNacimiento: '1988-12-10',
    edad: 37,
    genero: 'M',
    sedeId: 'MG-HA',
    fechaIngreso: '2019-07-15',
    puesto: 'DESBOTONE',
    eps: 'Compensar EPS',
    arl: 'ARL SURA',
    estado: 'ACTIVO',
    createdAt: '2019-07-15T08:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: '4248',
    cedula: '4248',
    nombre: 'MAMBUSCAY PIEDAD ANGELY',
    fechaNacimiento: '1985-03-17',
    edad: 40,
    genero: 'F',
    sedeId: 'MG-HA',
    fechaIngreso: '2018-04-10',
    puesto: 'DESBOTONE',
    eps: 'Nueva EPS',
    arl: 'ARL SURA',
    estado: 'ACTIVO',
    createdAt: '2018-04-10T08:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: '167841',
    cedula: '167841',
    nombre: 'ESCALANTE SILVA RUBI YUMARY',
    fechaNacimiento: '1992-07-29',
    edad: 33,
    genero: 'F',
    sedeId: 'MG-HA',
    fechaIngreso: '2020-11-01',
    puesto: 'CORTE-BASES ALZ',
    eps: 'SURA EPS',
    arl: 'ARL SURA',
    estado: 'ACTIVO',
    createdAt: '2020-11-01T08:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: '184629',
    cedula: '184629',
    nombre: 'HERNANDEZ MARTINEZ KATERINE',
    fechaNacimiento: '1994-01-15',
    edad: 32,
    genero: 'F',
    sedeId: 'MG-HA',
    fechaIngreso: '2021-08-15',
    puesto: 'CORTE-BASES ALZ',
    eps: 'Salud Total EPS',
    arl: 'ARL SURA',
    estado: 'ACTIVO',
    createdAt: '2021-08-15T08:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: '193584',
    cedula: '193584',
    nombre: 'GUTIÉRREZ GONZALEZ HUMBERTO ALBERTO',
    fechaNacimiento: '1990-10-04',
    edad: 35,
    genero: 'M',
    sedeId: 'MG-HA',
    fechaIngreso: '2021-10-20',
    puesto: 'CORTE-BASES ALZ',
    eps: 'Sanitas EPS',
    arl: 'ARL SURA',
    estado: 'ACTIVO',
    createdAt: '2021-10-20T08:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: '125190',
    cedula: '125190',
    nombre: 'MARTINEZ NUÑEZ DINA LUZ',
    fechaNacimiento: '1988-05-18',
    edad: 37,
    genero: 'F',
    sedeId: 'MG-HA',
    fechaIngreso: '2019-09-01',
    puesto: 'SUPERVISOR',
    eps: 'Compensar EPS',
    arl: 'ARL SURA',
    estado: 'ACTIVO',
    createdAt: '2019-09-01T08:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: '177123',
    cedula: '177123',
    nombre: 'HERNANDEZ JAIMES MARLIX KARINA',
    fechaNacimiento: '1993-03-12',
    edad: 32,
    genero: 'F',
    sedeId: 'MG-HA',
    fechaIngreso: '2021-02-15',
    puesto: 'CORTE-BASES ALZ',
    eps: 'Nueva EPS',
    arl: 'ARL SURA',
    estado: 'ACTIVO',
    createdAt: '2021-02-15T08:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: '151631',
    cedula: '151631',
    nombre: 'PUSHAINA IPUANA ROSA ISELA',
    fechaNacimiento: '1992-11-25',
    edad: 33,
    genero: 'F',
    sedeId: 'MG-HA',
    fechaIngreso: '2020-04-10',
    puesto: 'CORTE-BASES ALZ',
    eps: 'SURA EPS',
    arl: 'ARL SURA',
    estado: 'ACTIVO',
    createdAt: '2020-04-10T08:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
  },
  // Trabajadores adicionales de otras sedes
  {
    id: '1017123456',
    cedula: '1017123456',
    nombre: 'Mateo Arango Jaramillo',
    fechaNacimiento: '1992-05-14',
    edad: 34,
    genero: 'M',
    sedeId: 'MG-MG',
    fechaIngreso: '2021-03-15',
    puesto: 'MANTENIMIENTO',
    eps: 'SURA EPS',
    arl: 'ARL SURA',
    estado: 'ACTIVO',
    createdAt: '2021-03-15T08:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: '1020456789',
    cedula: '1020456789',
    nombre: 'Laura Camila Restrepo Morales',
    fechaNacimiento: '1995-11-20',
    edad: 31,
    genero: 'F',
    sedeId: 'MG-HA',
    fechaIngreso: '2022-06-01',
    puesto: 'BONCHADOR',
    eps: 'Sanitas EPS',
    arl: 'ARL SURA',
    estado: 'ACTIVO',
    createdAt: '2022-06-01T08:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
  },
  {
    id: '1035678901',
    cedula: '1035678901',
    nombre: 'Juan Pablo Zapata Ochoa',
    fechaNacimiento: '1988-08-04',
    edad: 38,
    genero: 'M',
    sedeId: 'MG-SC',
    fechaIngreso: '2019-11-10',
    puesto: 'ALMACEN',
    eps: 'Compensar EPS',
    arl: 'Positiva Compañía de Seguros',
    estado: 'ACTIVO',
    createdAt: '2019-11-10T08:00:00.000Z',
    updatedAt: '2026-01-10T09:00:00.000Z',
  },
];

// Initial SST Records for demonstration
const SEED_RECORDS: SSTRecord[] = [
  {
    id: 'rec-2026-001',
    numeroRegistro: 'EXT-2026-001',
    menuId: 'd19d30b0',
    subMenuId: 'sub-em-1',
    moduloNombre: 'Inspección Emergencias',
    subModuloNombre: 'Extintores',
    fecha: '2026-02-15',
    sedeId: 'MG-MG',
    area: 'Mantenimiento',
    supervisor: 'Andrés Felipe Gómez',
    responsableRegistro: 'Carlos SST Inspector',
    responsableEmail: 'sst@mgconsultores.com',
    estado: 'CERRADO',
    observaciones: 'Inspección mensual reglamentaria. Extintor multipropósito ABC 20lbs verificado. Presión en verde, pasador y precinto intactos, acceso despejado.',
    hallazgos: 'Todo en conformidad con la norma NFPA 10.',
    accionesPropuestas: 'Mantener señalización visible.',
    evidencias: [
      {
        id: 'ev-1',
        nombre: 'inspeccion_extintor_area_mant.jpg',
        url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=400&q=80',
        tipo: 'image/jpeg',
        fecha: '2026-02-15',
      },
    ],
    createdAt: '2026-02-15T09:30:00.000Z',
    updatedAt: '2026-02-15T10:00:00.000Z',
    createdBy: 'sst@mgconsultores.com',
  },
  {
    id: 'rec-2026-002',
    numeroRegistro: 'EPP-2026-014',
    menuId: 'c9189227',
    subMenuId: 'sub-per-1',
    moduloNombre: 'Personal',
    subModuloNombre: 'Entrega EPP\'s',
    fecha: '2026-03-01',
    sedeId: 'MG-HA',
    area: 'Producción',
    supervisor: 'María Eugenia Salazar',
    cedulaTrabajador: '1020456789',
    nombreTrabajador: 'Laura Camila Restrepo Morales',
    puestoTrabajador: 'Operadora de Planta',
    responsableRegistro: 'Coordinador SST Sede',
    responsableEmail: 'sst_hacienda@mgconsultores.com',
    estado: 'CERRADO',
    observaciones: 'Entrega de dotación de protección personal: Casco dieléctrico con barboquejo, gafas de seguridad antirrayadura y guantes de nitrilo calibre 15.',
    accionesPropuestas: 'Capacitación en uso y cuidado de EPP.',
    evidencias: [],
    createdAt: '2026-03-01T14:15:00.000Z',
    updatedAt: '2026-03-01T14:30:00.000Z',
    createdBy: 'sst_hacienda@mgconsultores.com',
  },
  {
    id: 'rec-2026-003',
    numeroRegistro: 'PESV-2026-088',
    menuId: '649b9099',
    subMenuId: 'sub-pesv-1',
    moduloNombre: 'PESV',
    subModuloNombre: 'Chequeo Vehículos',
    fecha: '2026-03-10',
    sedeId: 'MG-MG',
    area: 'Operaciones',
    supervisor: 'Carlos Mario Restrepo',
    cedulaTrabajador: '1017123456',
    nombreTrabajador: 'Mateo Arango Jaramillo',
    puestoTrabajador: 'Técnico de Mantenimiento',
    responsableRegistro: 'Conductor Operativo',
    responsableEmail: 'operaciones@mgconsultores.com',
    estado: 'EN_PROCESO',
    observaciones: 'Preoperacional de camioneta placa MGX-450. Nivel de refrigerante óptimo, luces altas y bajas operativas. Se detecta desgaste en plumilla limpiaparabrisas derecha.',
    hallazgos: 'Plumilla derecha requiere reemplazo preventivo.',
    accionesPropuestas: 'Orden de cambio solicitada al taller autorizado.',
    evidencias: [],
    createdAt: '2026-03-10T06:45:00.000Z',
    updatedAt: '2026-03-10T07:10:00.000Z',
    createdBy: 'operaciones@mgconsultores.com',
  },
  {
    id: 'rec-2026-004',
    numeroRegistro: 'COND-2026-005',
    menuId: 'c9189227',
    subMenuId: 'sub-per-2',
    moduloNombre: 'Personal',
    subModuloNombre: 'Condiciones Inseguras',
    fecha: '2026-03-18',
    sedeId: 'MG-SC',
    area: 'Almacén',
    supervisor: 'Guillermo León Vélez',
    responsableRegistro: 'Líder de Bodega',
    responsableEmail: 'almacen@mgconsultores.com',
    estado: 'PENDIENTE',
    observaciones: 'Se evidencia estiba averiada con riesgo de colapso en estantería nivel 3 sector B. Falta delimitación en pasillo principal.',
    hallazgos: 'Riesgo locativo y mecánico por caída de objetos.',
    accionesPropuestas: 'Aislar pasillo de inmediato y trasvasar carga a estiba plástica certificada.',
    evidencias: [],
    createdAt: '2026-03-18T11:20:00.000Z',
    updatedAt: '2026-03-18T11:20:00.000Z',
    createdBy: 'almacen@mgconsultores.com',
  },
];

const SEED_ENTREGA_EPP_MG: EntregaEPPMGRecord[] = [
  {
    id: 'epp-rec-001',
    Id_Epp: 'EPP-MG-2026-001',
    Fecha: '2026-03-01',
    Año: 2026,
    Mes: 'Marzo',
    Sede: 'MG-MG',
    Cédula: '1017123456',
    Nombre: 'Mateo Arango Jaramillo',
    Labor: 'Técnico de Mantenimiento',
    Area: 'Mantenimiento',
    Supervisor: 'Andrés Felipe Gómez',
    Código_Epp: 'EPP-CAS-01',
    Epp: 'Casco de Seguridad Dieléctrico Tipo I Clase E',
    Tipo_Entrega: 'Dotación Periódica',
    Costo: 38500, // Tomado de la hoja Epp´s
    Estado: 'Entregado y Firmado',
    Foto_Entrega: 'https://images.unsplash.com/photo-1541888946425-d0fbb18f15f7?auto=format&fit=crop&w=600&q=80',
    Firma_Trabajador: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    Responsable_SST: 'Supervisor SST Medellín (MG-MG)',
    Firma_SST: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    observaciones: 'Entrega de dotación correspondiente al primer cuatrimestre del año. Elemento verificado a satisfacción.',
    createdAt: '2026-03-01T09:00:00.000Z',
    updatedAt: '2026-03-01T09:15:00.000Z',
    createdBy: 'mg@mgconsultores.com',
  },
  {
    id: 'epp-rec-002',
    Id_Epp: 'EPP-HA-2026-002',
    Fecha: '2026-03-05',
    Año: 2026,
    Mes: 'Marzo',
    Sede: 'MG-HA',
    Cédula: '1020456789',
    Nombre: 'Laura Camila Restrepo Morales',
    Labor: 'Operadora de Planta',
    Area: 'Producción',
    Supervisor: 'María Eugenia Salazar',
    Código_Epp: 'EPP-GUA-02',
    Epp: 'Guantes de Nitrilo Verde Calibre 15 (Químico)',
    Tipo_Entrega: 'Dotación Periódica',
    Costo: 12500, // Tomado de la hoja Epp´s
    Estado: 'Entregado y Firmado',
    Foto_Entrega: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=600&q=80',
    Firma_Trabajador: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    Responsable_SST: 'Supervisor SST Hacienda (MG-HA)',
    Firma_SST: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    observaciones: 'Entrega de guantes de protección para manipulación segura en línea de ensamble.',
    createdAt: '2026-03-05T10:00:00.000Z',
    updatedAt: '2026-03-05T10:20:00.000Z',
    createdBy: 'ha@mgconsultores.com',
  },
  {
    id: 'epp-rec-003',
    Id_Epp: 'EPP-SC-2026-003',
    Fecha: '2026-03-12',
    Año: 2026,
    Mes: 'Marzo',
    Sede: 'MG-SC',
    Cédula: '1035678901',
    Nombre: 'Juan Pablo Zapata Ochoa',
    Labor: 'Coordinador de Almacén',
    Area: 'Almacén',
    Supervisor: 'Guillermo León Vélez',
    Código_Epp: 'EPP-BOT-01',
    Epp: 'Botas de Seguridad en Cuero con Puntera Dieléctrica',
    Tipo_Entrega: 'Reposición por Desgaste',
    Costo: 138000, // Tomado de la hoja Epp´s
    Estado: 'Entregado y Firmado',
    Foto_Entrega: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=600&q=80',
    Firma_Trabajador: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    Responsable_SST: 'Supervisor SST Santa Cruz (MG-SC)',
    Firma_SST: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    observaciones: 'Reposición por desgaste normal de la suela en bodegas. Talla 41 entregada y verificada.',
    createdAt: '2026-03-12T14:30:00.000Z',
    updatedAt: '2026-03-12T14:45:00.000Z',
    createdBy: 'sc@mgconsultores.com',
  },
  {
    id: 'epp-rec-004',
    Id_Epp: 'EPP-HA-2026-004',
    Fecha: '2026-03-14',
    Año: 2026,
    Mes: 'Marzo',
    Sede: 'MG-HA',
    Cédula: '1020456789',
    Nombre: 'Laura Camila Restrepo Morales',
    Labor: 'Operadora de Planta',
    Area: 'Producción',
    Supervisor: 'María Eugenia Salazar',
    Código_Epp: 'EPP-GAF-01',
    Epp: 'Gafas de Seguridad Transparentes Antirrayadura y Antiempañante',
    Tipo_Entrega: 'Dotación Periódica',
    Costo: 14500, // Tomado de la hoja Epp´s
    Estado: 'Pendiente de Firma',
    Responsable_SST: 'Supervisor SST Hacienda (MG-HA)',
    observaciones: 'Dotación periódica entregada en turno de la tarde. Pendiente firma en tablet.',
    createdAt: '2026-03-14T16:00:00.000Z',
    updatedAt: '2026-03-14T16:00:00.000Z',
    createdBy: 'ha@mgconsultores.com',
  },
];

export const storageService = {
  // Initialize storage with seeds if empty
  init() {
    if (!localStorage.getItem(KEYS.SEDES)) {
      localStorage.setItem(KEYS.SEDES, JSON.stringify(INITIAL_SEDES));
    }
    if (!localStorage.getItem(KEYS.SUPERVISORES)) {
      localStorage.setItem(KEYS.SUPERVISORES, JSON.stringify(INITIAL_SUPERVISORES));
    }
    if (!localStorage.getItem(KEYS.EPS)) {
      localStorage.setItem(KEYS.EPS, JSON.stringify(INITIAL_EPS));
    }
    if (!localStorage.getItem(KEYS.ARL)) {
      localStorage.setItem(KEYS.ARL, JSON.stringify(INITIAL_ARL));
    }
    if (!localStorage.getItem(KEYS.PERSONNEL)) {
      localStorage.setItem(KEYS.PERSONNEL, JSON.stringify(SEED_WORKERS));
    }
    if (!localStorage.getItem(KEYS.RECORDS)) {
      localStorage.setItem(KEYS.RECORDS, JSON.stringify(SEED_RECORDS));
    }
    if (!localStorage.getItem(KEYS.EPP_CATALOG)) {
      localStorage.setItem(KEYS.EPP_CATALOG, JSON.stringify(CATALOGO_EPPS));
    }
    if (!localStorage.getItem(KEYS.EPP_DELIVERIES)) {
      localStorage.setItem(KEYS.EPP_DELIVERIES, JSON.stringify(SEED_ENTREGA_EPP_MG));
    }
  },

  // ---------------- PERSONNEL MASTER ----------------
  getWorkers(): PersonnelWorker[] {
    try {
      const stored = localStorage.getItem(KEYS.PERSONNEL);
      if (!stored) return SEED_WORKERS;
      return JSON.parse(stored);
    } catch {
      return SEED_WORKERS;
    }
  },

  getWorkerByCedula(cedula: string): PersonnelWorker | undefined {
    const list = this.getWorkers();
    return list.find((w) => String(w.cedula).trim() === String(cedula).trim());
  },

  saveWorker(worker: PersonnelWorker, auditUser: { email: string; name: string }): PersonnelWorker {
    const workers = this.getWorkers();
    const index = workers.findIndex((w) => w.cedula === worker.cedula);
    let updatedWorkers: PersonnelWorker[];
    const isNew = index === -1;

    if (isNew) {
      updatedWorkers = [worker, ...workers];
      auditService.log(
        auditUser.email,
        auditUser.name,
        'CREAR',
        'Maestro de Personal',
        worker.cedula,
        `Ingreso de trabajador ${worker.nombre} (C.C. ${worker.cedula})`,
        undefined,
        worker
      );
    } else {
      const prev = workers[index];
      updatedWorkers = [...workers];
      updatedWorkers[index] = { ...worker, updatedAt: new Date().toISOString() };
      auditService.log(
        auditUser.email,
        auditUser.name,
        'EDITAR',
        'Maestro de Personal',
        worker.cedula,
        `Actualización de trabajador ${worker.nombre} (C.C. ${worker.cedula})`,
        prev,
        worker
      );
    }

    localStorage.setItem(KEYS.PERSONNEL, JSON.stringify(updatedWorkers));
    this.notify();
    return worker;
  },

  bulkUpsertWorkers(
    workersToUpsert: PersonnelWorker[],
    auditUser: { email: string; name: string }
  ) {
    const existingWorkers = this.getWorkers();
    const map = new Map<string, PersonnelWorker>();
    existingWorkers.forEach((w) => map.set(w.cedula, w));

    workersToUpsert.forEach((w) => {
      map.set(w.cedula, w);
    });

    const updatedList = Array.from(map.values());
    localStorage.setItem(KEYS.PERSONNEL, JSON.stringify(updatedList));

    auditService.log(
      auditUser.email,
      auditUser.name,
      'ACTUALIZAR_MAESTRO',
      'Maestro de Personal',
      `bulk-${Date.now()}`,
      `Actualización masiva: ${workersToUpsert.length} trabajadores procesados.`,
      undefined,
      { count: workersToUpsert.length }
    );

    this.notify();
  },

  markWorkersInactive(
    cedulas: string[],
    auditUser: { email: string; name: string }
  ) {
    if (cedulas.length === 0) return;
    const workers = this.getWorkers();
    const cedulaSet = new Set(cedulas);
    const now = new Date().toISOString();

    const updated = workers.map((w) => {
      if (cedulaSet.has(w.cedula) && w.estado === 'ACTIVO') {
        return {
          ...w,
          estado: 'INACTIVO' as const,
          fechaRetiro: now.split('T')[0],
          motivoRetiro: 'No figura en carga completa de maestro de personal',
          updatedAt: now,
        };
      }
      return w;
    });

    localStorage.setItem(KEYS.PERSONNEL, JSON.stringify(updated));

    auditService.log(
      auditUser.email,
      auditUser.name,
      'CAMBIO_ESTADO',
      'Maestro de Personal',
      `inactivos-${Date.now()}`,
      `Marcados como inactivos ${cedulas.length} trabajadores no presentes en archivo maestro.`,
      undefined,
      { cedulas }
    );

    this.notify();
  },

  // ---------------- SST RECORDS ----------------
  getRecords(filters?: {
    sedeId?: string;
    menuId?: string;
    subMenuId?: string;
    estado?: string;
    fechaInicio?: string;
    fechaFin?: string;
    cedulaTrabajador?: string;
    search?: string;
  }): SSTRecord[] {
    let list: SSTRecord[] = [];
    try {
      const stored = localStorage.getItem(KEYS.RECORDS);
      list = stored ? JSON.parse(stored) : SEED_RECORDS;
    } catch {
      list = SEED_RECORDS;
    }

    if (!filters) return list;

    return list.filter((r) => {
      if (filters.sedeId && filters.sedeId !== 'TODAS' && r.sedeId !== filters.sedeId) return false;
      if (filters.menuId && r.menuId !== filters.menuId) return false;
      if (filters.subMenuId && r.subMenuId !== filters.subMenuId) return false;
      if (filters.estado && filters.estado !== 'TODOS' && r.estado !== filters.estado) return false;
      if (filters.cedulaTrabajador && r.cedulaTrabajador !== filters.cedulaTrabajador) return false;
      if (filters.fechaInicio && r.fecha < filters.fechaInicio) return false;
      if (filters.fechaFin && r.fecha > filters.fechaFin) return false;
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matches =
          r.numeroRegistro.toLowerCase().includes(query) ||
          r.moduloNombre.toLowerCase().includes(query) ||
          r.subModuloNombre.toLowerCase().includes(query) ||
          r.area.toLowerCase().includes(query) ||
          (r.nombreTrabajador && r.nombreTrabajador.toLowerCase().includes(query)) ||
          (r.cedulaTrabajador && r.cedulaTrabajador.toLowerCase().includes(query)) ||
          r.observaciones.toLowerCase().includes(query);
        if (!matches) return false;
      }
      return true;
    });
  },

  getRecordById(id: string): SSTRecord | undefined {
    const list = this.getRecords();
    return list.find((r) => r.id === id);
  },

  saveRecord(record: SSTRecord, auditUser: { email: string; name: string }): SSTRecord {
    const records = this.getRecords();
    const index = records.findIndex((r) => r.id === record.id);
    let updatedRecords: SSTRecord[];
    const isNew = index === -1;

    if (isNew) {
      updatedRecords = [record, ...records];
      auditService.log(
        auditUser.email,
        auditUser.name,
        'CREAR',
        record.subModuloNombre,
        record.numeroRegistro,
        `Creación de registro ${record.numeroRegistro} en sede ${record.sedeId}`,
        undefined,
        record
      );
    } else {
      const prev = records[index];
      updatedRecords = [...records];
      updatedRecords[index] = { ...record, updatedAt: new Date().toISOString() };
      
      const accion = prev.estado !== record.estado ? 'CAMBIO_ESTADO' : 'EDITAR';
      auditService.log(
        auditUser.email,
        auditUser.name,
        accion,
        record.subModuloNombre,
        record.numeroRegistro,
        `Modificación de registro ${record.numeroRegistro} (Estado: ${record.estado})`,
        prev,
        record
      );
    }

    localStorage.setItem(KEYS.RECORDS, JSON.stringify(updatedRecords));
    this.notify();
    return record;
  },

  deleteRecord(id: string, auditUser: { email: string; name: string }): boolean {
    const records = this.getRecords();
    const target = records.find((r) => r.id === id);
    if (!target) return false;

    const filtered = records.filter((r) => r.id !== id);
    localStorage.setItem(KEYS.RECORDS, JSON.stringify(filtered));

    auditService.log(
      auditUser.email,
      auditUser.name,
      'EDITAR',
      target.subModuloNombre,
      target.numeroRegistro,
      `Eliminación autorizada de registro ${target.numeroRegistro} por administrador`,
      target,
      undefined
    );

    this.notify();
    return true;
  },

  // ---------------- HOJA OFICIAL: ENTREGA EPP'S MG ----------------
  getEntregaEPPRecords(filters?: {
    sedeId?: string;
    estado?: string;
    search?: string;
    cedulaTrabajador?: string;
  }): EntregaEPPMGRecord[] {
    let list: EntregaEPPMGRecord[];
    try {
      const stored = localStorage.getItem(KEYS.EPP_DELIVERIES);
      list = stored ? JSON.parse(stored) : SEED_ENTREGA_EPP_MG;
    } catch {
      list = SEED_ENTREGA_EPP_MG;
    }

    if (!filters) return list;

    return list.filter((item) => {
      if (filters.sedeId && filters.sedeId !== 'TODAS' && item.Sede !== filters.sedeId) return false;
      if (filters.estado && filters.estado !== 'TODOS' && item.Estado !== filters.estado) return false;
      if (filters.cedulaTrabajador && item.Cédula !== filters.cedulaTrabajador) return false;
      if (filters.search) {
        const query = filters.search.toLowerCase();
        const matches =
          (item.Id_Epp && item.Id_Epp.toLowerCase().includes(query)) ||
          (item.Nombre && item.Nombre.toLowerCase().includes(query)) ||
          (item.Cédula && item.Cédula.toLowerCase().includes(query)) ||
          (item.Labor && item.Labor.toLowerCase().includes(query)) ||
          (item.Area && item.Area.toLowerCase().includes(query)) ||
          (item.Supervisor && item.Supervisor.toLowerCase().includes(query)) ||
          (item.Código_Epp && item.Código_Epp.toLowerCase().includes(query)) ||
          (item.Epp && item.Epp.toLowerCase().includes(query));
        if (!matches) return false;
      }
      return true;
    });
  },

  getEntregaEPPRecordById(id: string): EntregaEPPMGRecord | undefined {
    const list = this.getEntregaEPPRecords();
    return list.find((d) => d.id === id || d.Id_Epp === id);
  },

  saveEntregaEPPRecord(record: EntregaEPPMGRecord, auditUser: { email: string; name: string }): EntregaEPPMGRecord {
    const list = this.getEntregaEPPRecords();
    const index = list.findIndex((d) => d.id === record.id || d.Id_Epp === record.Id_Epp);
    let updated: EntregaEPPMGRecord[];
    const isNew = index === -1;

    // Ensure year and month are auto-calculated from date
    const itemToSave: EntregaEPPMGRecord = {
      ...record,
      Año: record.Año || getAnioFecha(record.Fecha),
      Mes: record.Mes || getMesEspanol(record.Fecha),
      updatedAt: new Date().toISOString(),
    };

    if (isNew) {
      updated = [itemToSave, ...list];
      auditService.log(
        auditUser.email,
        auditUser.name,
        'CREAR',
        "Entrega Epp´s MG",
        itemToSave.Id_Epp,
        `Registro de Entrega de EPP ${itemToSave.Id_Epp} para ${itemToSave.Nombre} (C.C. ${itemToSave.Cédula}) en sede ${itemToSave.Sede}. Elemento: ${itemToSave.Epp} | Costo: $${itemToSave.Costo}`,
        undefined,
        itemToSave
      );
    } else {
      const prev = list[index];
      updated = [...list];
      updated[index] = itemToSave;
      auditService.log(
        auditUser.email,
        auditUser.name,
        'EDITAR',
        "Entrega Epp´s MG",
        itemToSave.Id_Epp,
        `Actualización de Entrega de EPP ${itemToSave.Id_Epp} para ${itemToSave.Nombre}`,
        prev,
        itemToSave
      );
    }

    localStorage.setItem(KEYS.EPP_DELIVERIES, JSON.stringify(updated));
    this.notify();
    return itemToSave;
  },

  deleteEntregaEPPRecord(id: string, auditUser: { email: string; name: string }): boolean {
    const list = this.getEntregaEPPRecords();
    const target = list.find((d) => d.id === id || d.Id_Epp === id);
    if (!target) return false;

    const updated = list.filter((d) => d.id !== id && d.Id_Epp !== id);
    localStorage.setItem(KEYS.EPP_DELIVERIES, JSON.stringify(updated));

    auditService.log(
      auditUser.email,
      auditUser.name,
      'EDITAR',
      "Entrega Epp´s MG",
      target.Id_Epp,
      `Eliminación del registro de Entrega de EPP ${target.Id_Epp} del trabajador ${target.Nombre}`,
      target,
      undefined
    );

    this.notify();
    return true;
  },

  // ---------------- HOJA DE COSTOS: EPP'S ----------------
  getEPPCatalog(): EPPCatalogItem[] {
    try {
      const stored = localStorage.getItem(KEYS.EPP_CATALOG);
      return stored ? JSON.parse(stored) : CATALOGO_EPPS;
    } catch {
      return CATALOGO_EPPS;
    }
  },

  getEPPCost(codigoEpp: string): number {
    const catalog = this.getEPPCatalog();
    const found = catalog.find(
      (c) =>
        c.codigoEpp.toLowerCase() === codigoEpp.toLowerCase() ||
        c.epp.toLowerCase() === codigoEpp.toLowerCase()
    );
    return found?.costo || 0;
  },

  saveEPPCatalogItem(item: EPPCatalogItem, auditUser: { email: string; name: string }): EPPCatalogItem {
    const list = this.getEPPCatalog();
    const idx = list.findIndex((c) => c.codigoEpp === item.codigoEpp);
    let updated: EPPCatalogItem[];
    if (idx === -1) {
      updated = [...list, item];
    } else {
      updated = [...list];
      updated[idx] = item;
    }
    localStorage.setItem(KEYS.EPP_CATALOG, JSON.stringify(updated));
    auditService.log(
      auditUser.email,
      auditUser.name,
      'EDITAR',
      "Catálogo Epp´s",
      item.codigoEpp,
      `Actualización de costo de ${item.epp}: $${item.costo}`
    );
    this.notify();
    return item;
  },

  // Métodos de conveniencia para compatibilidad
  getEPPDeliveries(filters?: any): any[] {
    return this.getEntregaEPPRecords(filters);
  },
  getEPPDeliveryById(id: string): any {
    return this.getEntregaEPPRecordById(id);
  },
  saveEPPDelivery(delivery: any, auditUser: { email: string; name: string }): any {
    return this.saveEntregaEPPRecord(delivery, auditUser);
  },
  deleteEPPDelivery(id: string, auditUser: { email: string; name: string }): boolean {
    return this.deleteEntregaEPPRecord(id, auditUser);
  },

  // ---------------- CATALOGS ----------------
  getSedes(): Sede[] {
    try {
      const stored = localStorage.getItem(KEYS.SEDES);
      return stored ? JSON.parse(stored) : INITIAL_SEDES;
    } catch {
      return INITIAL_SEDES;
    }
  },

  saveSede(sede: Sede, auditUser: { email: string; name: string }): Sede {
    const list = this.getSedes();
    const index = list.findIndex((s) => s.id === sede.id);
    let updated: Sede[];
    if (index === -1) {
      updated = [...list, sede];
    } else {
      updated = [...list];
      updated[index] = sede;
    }
    localStorage.setItem(KEYS.SEDES, JSON.stringify(updated));
    auditService.log(
      auditUser.email,
      auditUser.name,
      'CREAR',
      'Catálogo Sedes',
      sede.id,
      `Actualización de sede ${sede.nombre}`
    );
    this.notify();
    return sede;
  },

  getSupervisores(): Supervisor[] {
    try {
      const stored = localStorage.getItem(KEYS.SUPERVISORES);
      return stored ? JSON.parse(stored) : INITIAL_SUPERVISORES;
    } catch {
      return INITIAL_SUPERVISORES;
    }
  },

  saveSupervisor(sup: Supervisor, auditUser: { email: string; name: string }): Supervisor {
    const list = this.getSupervisores();
    const index = list.findIndex((s) => s.id === sup.id);
    let updated: Supervisor[];
    if (index === -1) {
      updated = [...list, sup];
    } else {
      updated = [...list];
      updated[index] = sup;
    }
    localStorage.setItem(KEYS.SUPERVISORES, JSON.stringify(updated));
    auditService.log(
      auditUser.email,
      auditUser.name,
      'CREAR',
      'Catálogo Supervisores',
      sup.id,
      `Actualización de supervisor ${sup.supervisor}`
    );
    this.notify();
    return sup;
  },

  getEPS(): EPS[] {
    try {
      const stored = localStorage.getItem(KEYS.EPS);
      return stored ? JSON.parse(stored) : INITIAL_EPS;
    } catch {
      return INITIAL_EPS;
    }
  },

  getARL(): ARL[] {
    try {
      const stored = localStorage.getItem(KEYS.ARL);
      return stored ? JSON.parse(stored) : INITIAL_ARL;
    } catch {
      return INITIAL_ARL;
    }
  },

  // ---------------- IMPORT HISTORY ----------------
  getImportHistory(): MasterImportHistory[] {
    try {
      const stored = localStorage.getItem(KEYS.IMPORT_HISTORY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  },

  saveImportHistory(entry: MasterImportHistory) {
    const list = this.getImportHistory();
    const updated = [entry, ...list.slice(0, 49)];
    localStorage.setItem(KEYS.IMPORT_HISTORY, JSON.stringify(updated));
    this.notify();
  },

  // ---------------- BACKUP & RESTORE ----------------
  createFullBackup(auditUser: { email: string; name: string }) {
    const backupData = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      exportedBy: auditUser.email,
      sedes: this.getSedes(),
      supervisores: this.getSupervisores(),
      eps: this.getEPS(),
      arl: this.getARL(),
      personnel: this.getWorkers(),
      records: this.getRecords(),
      eppDeliveries: this.getEPPDeliveries(),
      importHistory: this.getImportHistory(),
      auditLogs: auditService.getLogs(),
    };

    auditService.log(
      auditUser.email,
      auditUser.name,
      'RESPALDO',
      'Respaldos',
      `backup-${Date.now()}`,
      'Generación y descarga de respaldo completo de la base de datos SST'
    );

    return backupData;
  },

  restoreFullBackup(backupData: any, auditUser: { email: string; name: string }): { success: boolean; message: string } {
    if (!backupData || !backupData.personnel || !backupData.records) {
      return { success: false, message: 'El archivo de respaldo no tiene el formato válido requerido.' };
    }

    try {
      if (Array.isArray(backupData.sedes)) localStorage.setItem(KEYS.SEDES, JSON.stringify(backupData.sedes));
      if (Array.isArray(backupData.supervisores)) localStorage.setItem(KEYS.SUPERVISORES, JSON.stringify(backupData.supervisores));
      if (Array.isArray(backupData.eps)) localStorage.setItem(KEYS.EPS, JSON.stringify(backupData.eps));
      if (Array.isArray(backupData.arl)) localStorage.setItem(KEYS.ARL, JSON.stringify(backupData.arl));
      if (Array.isArray(backupData.personnel)) localStorage.setItem(KEYS.PERSONNEL, JSON.stringify(backupData.personnel));
      if (Array.isArray(backupData.records)) localStorage.setItem(KEYS.RECORDS, JSON.stringify(backupData.records));
      if (Array.isArray(backupData.eppDeliveries)) localStorage.setItem(KEYS.EPP_DELIVERIES, JSON.stringify(backupData.eppDeliveries));
      if (Array.isArray(backupData.importHistory)) localStorage.setItem(KEYS.IMPORT_HISTORY, JSON.stringify(backupData.importHistory));

      auditService.log(
        auditUser.email,
        auditUser.name,
        'RESPALDO',
        'Respaldos',
        `restore-${Date.now()}`,
        `Restauración total de información realizada por administrador. ${backupData.personnel.length} trabajadores y ${backupData.records.length} registros restaurados.`
      );

      this.notify();
      return { success: true, message: 'Base de datos restaurada exitosamente.' };
    } catch (e: any) {
      return { success: false, message: `Error al restaurar: ${e.message}` };
    }
  },

  // Notify listeners across components
  notify() {
    window.dispatchEvent(new CustomEvent('mg-sst-data-change'));
  },
};

// Auto initialize on module load
storageService.init();
