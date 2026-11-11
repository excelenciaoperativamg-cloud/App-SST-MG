export interface ChecklistItemDef {
  id: string;
  criterio: string;
  referenciaNormativa?: string;
}

export const CHECKLIST_STANDARDS: Record<string, ChecklistItemDef[]> = {
  // Inspección Emergencias: Extintores
  'sub-em-1': [
    { id: 'ext-1', criterio: 'Manómetro en zona verde de presión operativa (aplica PQS / Agua)' },
    { id: 'ext-2', criterio: 'Pasador de seguridad y sello de inviolabilidad plástica intactos' },
    { id: 'ext-3', criterio: 'Manguera, corneta o tobera limpias, sin obstrucciones ni fisuras' },
    { id: 'ext-4', criterio: 'Señalización visible a distancia y acceso despejado (mínimo 1 metro libre)' },
    { id: 'ext-5', criterio: 'Tarjeta de inspección al día y fecha de vencimiento/recarga vigente' },
    { id: 'ext-6', criterio: 'Cilindro sin corrosión, abolladuras o pérdida de pintura' },
  ],
  // Inspección Emergencias: Botiquines
  'sub-em-2': [
    { id: 'bot-1', criterio: 'Insumos vigentes (fechas de caducidad revisadas y al día)' },
    { id: 'bot-2', criterio: 'Gasas estériles, apósitos y vendas elásticas completos' },
    { id: 'bot-3', criterio: 'Solución antiséptica y suero fisiológico disponibles' },
    { id: 'bot-4', criterio: 'Tijeras de trauma, guantes de examen y linterna médica funcionales' },
    { id: 'bot-5', criterio: 'Gabinete señalizado, limpio y con listado oficial de inventario' },
  ],
  // Inspección Emergencias: Camillas
  'sub-em-3': [
    { id: 'cam-1', criterio: 'Camilla rígida limpia, sin fisuras, roturas ni deformaciones' },
    { id: 'cam-2', criterio: 'Juego de correas de sujeción (tipo araña o cinturones) completo' },
    { id: 'cam-3', criterio: 'Inmovilizadores laterales de cráneo y collarín cervical disponibles' },
    { id: 'cam-4', criterio: 'Ubicación señalizada, soporte seguro y libre de obstáculos' },
  ],
  // Inspección Emergencias: Gabinetes contra incendio
  'sub-em-4': [
    { id: 'gab-1', criterio: 'Manguera contra incendios plegada correctamente sin humedad ni moho' },
    { id: 'gab-2', criterio: 'Válvula de globo y boquilla reguladora operativas sin fuga' },
    { id: 'gab-3', criterio: 'Llave spanner y hacha presentes en su soporte' },
    { id: 'gab-4', criterio: 'Puerta con vidrio o acrílico señalizado y de fácil apertura' },
  ],
  // Inspección Emergencias: Alarma
  'sub-em-5': [
    { id: 'ala-1', criterio: 'Pulsadores o estaciones manuales de alarma señalizadas y accesibles' },
    { id: 'ala-2', criterio: 'Sirenas y estroboscopios visuales audibles y operacionales' },
    { id: 'ala-3', criterio: 'Panel principal sin luces de avería ni baterías descargadas' },
  ],
  // Inspección Emergencias: Señalización
  'sub-em-6': [
    { id: 'sen-1', criterio: 'Rutas de evacuación y salidas señalizadas con material fotoluminiscente' },
    { id: 'sen-2', criterio: 'Señales de advertencia de riesgos específicos (eléctrico, químicos, alturas)' },
    { id: 'sen-3', criterio: 'Señales de obligatoriedad de uso de EPP instaladas en puestos' },
  ],
  // Inspección Emergencias: Salidas de emergencia
  'sub-em-7': [
    { id: 'sal-1', criterio: 'Puertas de evacuación libres de candados o cerrojos no permitidos' },
    { id: 'sal-2', criterio: 'Barra antipánico operativa con apertura hacia afuera' },
    { id: 'sal-3', criterio: 'Pasillos y escaleras libres de cajas, cables o materiales' },
  ],
  // Inspección Emergencias: Detectores de humo
  'sub-em-8': [
    { id: 'det-1', criterio: 'Sensor limpio, sin capas de polvo, suciedad o pintura' },
    { id: 'det-2', criterio: 'Luz LED de monitoreo destellando en estado normal' },
    { id: 'det-3', criterio: 'Área de cobertura despejada sin tabiques que impidan el flujo de humo' },
  ],
  // PESV - Inspección Preoperacional de Vehículos
  'sub-pesv-1': [
    { id: 'pesv-1', criterio: 'Documentación al día: SOAT, RTM y Licencia de Conducción vigente' },
    { id: 'pesv-2', criterio: 'Estado y presión de llantas (incluyendo repuesto con profundidad >2mm)' },
    { id: 'pesv-3', criterio: 'Frenos: pedal firme, freno de estacionamiento y nivel de líquido de frenos' },
    { id: 'pesv-4', criterio: 'Luces: direccionales, altas, bajas, reversa y stop operativas' },
    { id: 'pesv-5', criterio: 'Cinturones de seguridad de 3 puntos funcionales en todos los asientos' },
    { id: 'pesv-6', criterio: 'Equipo de carretera completo (gato, cruceta, tacos, señales, linterna)' },
    { id: 'pesv-7', criterio: 'Extintor de vehículo cargado, vigente y con soporte seguro' },
  ],
  // Metodología 5S
  'sub-5s-1': [
    { id: '5s-1', criterio: '1S - Seiri (Clasificar): Se eliminaron elementos obsoletos o innecesarios' },
    { id: '5s-2', criterio: '2S - Seiton (Ordenar): Cada herramienta y material tiene ubicación rotulada' },
    { id: '5s-3', criterio: '3S - Seiso (Limpiar): Área de trabajo, pisos y equipos limpios sin fugas' },
    { id: '5s-4', criterio: '4S - Seiketsu (Estandarizar): Normas visuales y delimitaciones visibles' },
    { id: '5s-5', criterio: '5S - Shitsuke (Disciplina): El personal respeta las normas de orden diariamente' },
  ],
  // Contratistas
  'sub-cont-1': [
    { id: 'con-1', criterio: 'Planilla de seguridad social PILA vigente (EPS, ARL, Pensión verificada)' },
    { id: 'con-2', criterio: 'Inducción de SST de MG Consultores realizada y firmada' },
    { id: 'con-3', criterio: 'Elementos de Protección Personal (EPP) completos y en buen estado' },
    { id: 'con-4', criterio: 'Permiso para trabajo de alto riesgo diligenciado y autorizado (si aplica)' },
  ],
  // Rondas de Cuidado
  'sub-rc-1': [
    { id: 'rc-1', criterio: 'Cumplimiento de procedimientos operativos estándar (SOP) y autocuidado' },
    { id: 'rc-2', criterio: 'Uso correcto, continuo y adecuado de los EPP asignados' },
    { id: 'rc-3', criterio: 'Posturas ergonómicas y manipulación manual de cargas segura' },
    { id: 'rc-4', criterio: 'Retroalimentación preventiva brindada en campo con compromiso del trabajador' },
  ],
  // Salud Ocupacional
  'sub-sal-1': [
    { id: 'sal-1', criterio: 'Certificado de aptitud médica ocupacional emitido por médico especialista' },
    { id: 'sal-2', criterio: 'Recomendaciones o restricciones médico laborales claras y registradas' },
    { id: 'sal-3', criterio: 'Notificación formal y seguimiento acordado con la jefatura de área' },
  ],
};
