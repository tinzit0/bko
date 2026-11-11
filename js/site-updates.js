// Contenido de «Arreglos a la página II» (11-11-2026).
// Transformaciones puras: se aplican igual al contenido local por defecto y a la copia vigente del CMS.

export const teamOrder = [
  'jorge-ivan-saavedra-bentjerodt',
  'camila-alejandra-kopplin-lanata',
  'roxana-ximena-oyarzun-bustamante',
  'luis-miranda-chavarria',
  'fenella-reyes-gonzalo',
  'makarena-andrea-ponce-villarroel',
  'estefania-benitez-garcia'
];

export const roxanaIntro = [
  'Profesional especializada en financiamiento de proyectos, negocios y seguros corporativos, con un enfoque de asesoría a empresas y personas de los sectores minero, marítimo, de la construcción y comercial.',
  'Especialista en intermediación para vincular a pequeñas y medianas empresas con agentes financiadores. Su labor facilita la búsqueda de financiamiento, el diálogo entre las partes y apoya la presentación de necesidades de inversión y la búsqueda de alternativas, especialmente para adquirir maquinaria o desarrollar proyectos, de acuerdo con las características y los objetivos de cada iniciativa.',
  'Desde BKO, lidera el desarrollo del área de seguros y financiamiento, orientando a sus clientes en la identificación de coberturas acordes con su actividad económica. Su asesoría abarca garantías y licitaciones, responsabilidad civil, seguros para empresas, protección de maquinaria, seguros de vida y soluciones para actividades mineras, marítimas y comerciales.'
].join('\n\n');

export const fenellaIntro = [
  'La Dra. Fenella Reyes Gonzalo es Médico Cirujano por la Universidad de Santiago de Chile y especialista certificada en Psiquiatría Pediátrica y de la Adolescencia por la misma universidad. Complementa su formación con estudios de posgrado en otras instituciones. Entre ellos se encuentran el Diplomado en Destrezas Clínicas en Adicciones de la Pontificia Universidad Católica de Chile y el Diplomado en Apego y Psicopatología del Desarrollo del Centro de Apego y Regulación Emocional (CARE) de la Universidad del Desarrollo.',
  'A lo largo de su trayectoria ha profundizado especialmente en el abordaje del trauma y sus manifestaciones en niños, niñas y adolescentes. En este ámbito, ha incorporado formación y entrenamiento en EMDR (Eye Movement Desensitization and Reprocessing, o Desensibilización y Reprocesamiento por Movimientos Oculares). Este enfoque psicoterapéutico se utiliza en el abordaje de experiencias traumáticas y recuerdos perturbadores. Su formación incluye entrenamiento en protocolos EMDR para atención temprana y estrés traumático continuo, así como en EMDR y habilidades parentales.',
  'Esta preparación se complementa con formación en terapia cognitivo-conductual, intervención temprana, microanálisis y videofeedback, terapia de juego infantil y neurodesarrollo, configurando una mirada especializada sobre la salud mental infantojuvenil y los múltiples factores que pueden incidir en el desarrollo y bienestar de niños, niñas y adolescentes.',
  'Su intervención en el Estudio se concentra especialmente en casos de alta complejidad, particularmente en aquellos relacionados con el ámbito proteccional y con situaciones de vulneración de derechos de niños, niñas y adolescentes, en los que la naturaleza de los antecedentes hace relevante incorporar una perspectiva médica y psiquiátrica especializada al análisis del caso.',
  'En estas situaciones, la Dra. trabaja de manera coordinada con el equipo jurídico y social, incorporando la perspectiva médico-psiquiátrica infantojuvenil a un abordaje interdisciplinario que considera conjuntamente las dimensiones médicas, de salud mental, familiares, jurídicas y psicosociales presentes en cada situación.',
  'Su participación adquiere especial relevancia en aquellos casos en los que resulta necesario comprender cómo determinados procesos traumáticos, condiciones de salud mental, elementos del desarrollo o circunstancias familiares y psicosociales pueden estar incidiendo en la situación del niño, niña o adolescente.',
  'De esta manera, el trabajo interdisciplinario permite abordar los casos de mayor complejidad desde una perspectiva más amplia e integrada, articulando el análisis jurídico y social con el conocimiento especializado de la psiquiatría infantojuvenil, y situando las necesidades, el bienestar y las circunstancias particulares de cada niño, niña o adolescente como centro de la intervención.'
].join('\n\n');

export const estefaniaRole = 'Asistente contable | Gestión de CAUCE';
export const estefaniaIntro = 'Estefanía es asistente contable de BKO y está a cargo de la gestión de CAUCE Gestión Integral, el sistema de la oficina para organizar y dar seguimiento documental a las carteras de cobranza. Su labor comprende la organización y revisión de antecedentes comerciales y contables, la conciliación de pagos y el seguimiento de saldos, identificando inconsistencias y documentación pendiente. Asimismo, apoya la preparación de expedientes para su evaluación por el área jurídica, contribuyendo a mantener información ordenada, respaldada y trazable durante las distintas etapas del proceso de recuperación.';

/** Cambios por registro de bko_content (se fusionan con los datos existentes). */
export function firmPatches() {
  const patches = Object.fromEntries(teamOrder.map((id, i) => [id, { sort_order: (i + 1) * 10, data: {} }]));
  patches['roxana-ximena-oyarzun-bustamante'].data = { intro: roxanaIntro };
  patches['fenella-reyes-gonzalo'].data = { intro: fenellaIntro };
  patches['estefania-benitez-garcia'].data = { role: estefaniaRole, intro: estefaniaIntro, specialties: ['Asistencia contable', 'Gestión de CAUCE'], areas: [] };
  return patches;
}

export const insuranceGroupOrder = ['mineria', 'maritimos', 'garantias', 'constructoras', 'responsabilidad-civil', 'generales'];
export const insuranceNavigation = [
  ['mineria', 'Seguros para la minería'],
  ['maritimos', 'Seguros marítimos'],
  ['garantias', 'Garantías y Licitaciones'],
  ['constructoras', 'Empresas Constructoras'],
  ['responsabilidad-civil', 'Responsabilidad Civil'],
  ['generales', 'Seguros generales']
];

const maritimeImages = {
  casco: ['assets/seguros/maritimo/marina-embarcaciones.jpeg', 'Marina con yates y veleros amarrados en aguas del sur de Chile'],
  'rc-maritima': ['assets/seguros/maritimo/puerto-carga.jpeg', 'Naves atracadas junto a un recinto portuario con carga'],
  'accidentes-bordo': ['assets/seguros/maritimo/muelle-pesquero.jpeg', 'Muelle con embarcaciones pesqueras y pasarela de acceso'],
  'trabajo-maritimo': ['assets/seguros/maritimo/astillero.jpeg', 'Astillero con grúa, pontones y embarcaciones de trabajo']
};

const miningServices = [
  ['rc-minera', 'Responsabilidad Civil para Faenas Mineras', 'Responsabilidad Civil', 'Cobertura frente a reclamaciones de terceros derivadas de trabajos y servicios ejecutados en faenas mineras, conforme a las condiciones y exclusiones de la póliza.', ['Contratistas y subcontratistas de la minería', 'Daños a instalaciones del mandante', 'Daños a terceros durante la operación']],
  ['equipos-mineros', 'Equipos y Maquinaria Minera', 'Maquinaria', 'Alternativas de cobertura para maquinaria pesada y equipos móviles utilizados en faena, que pueden considerar daños propios, robo y responsabilidad civil según cada producto.', ['Camiones y equipos de carguío', 'Maquinaria de movimiento de tierra', 'Equipos de perforación y apoyo']],
  ['accidentes-faena', 'Accidentes Personales para Trabajadores de Faena', 'Seguros Empresariales', 'Protección complementaria para trabajadores que se desempeñan en faenas mineras y servicios asociados, según el seguro contratado.', ['Muerte accidental, cuando esté contemplada', 'Invalidez, según el seguro contratado', 'Gastos médicos, según condiciones']],
  ['garantias-mineras', 'Garantías para Contratos Mineros', 'Licitaciones y Garantías', 'Garantías de seriedad de la oferta y de fiel cumplimiento exigidas en licitaciones y contratos con compañías mineras, sujetas a las bases de cada mandante.', ['Licitaciones con mandantes mineros', 'Contratos de servicios y obras']],
  ['transporte-carga', 'Transporte de Insumos y Equipos', 'Seguros Empresariales', 'Coberturas para el traslado de insumos, equipos y materiales hacia y desde las faenas, según las condiciones del seguro.', ['Transporte terrestre de insumos', 'Traslado de maquinaria']]
];

/** Reorganiza Negocios y Seguros conservando el resto del contenido editado en el CMS. */
export function transformInsurance(source) {
  const c = structuredClone(source);
  const byId = Object.fromEntries(c.groups.map(g => [g.id, g]));
  if (!byId.mineria) byId.mineria = {
    id: 'mineria',
    title: 'Seguros para la minería',
    description: 'Protección para faenas, contratistas, maquinaria y operaciones vinculadas a la actividad minera del norte de Chile.',
    note: 'Las coberturas exigidas dependen de los contratos, reglamentos y estándares de cada mandante minero; se evalúan según la operación y la aceptación de la aseguradora.'
  };
  if (!byId.generales) byId.generales = {
    id: 'generales',
    title: 'Seguros generales',
    description: 'Protección personal, familiar y empresarial: seguros de vida, ahorro previsional, cesantía, protección de pagos y beneficios para trabajadores.',
    note: [byId['vida-ahorro']?.note, byId.cesantia?.note].filter(Boolean).join(' ')
  };
  c.groups = insuranceGroupOrder.map(id => byId[id]).filter(Boolean);
  for (const s of c.services) {
    if (['vida-ahorro', 'cesantia'].includes(s.group)) s.group = 'generales';
    if (maritimeImages[s.id]) [s.image, s.imageAlt] = maritimeImages[s.id];
  }
  const template = c.services.find(s => s.id === 'equipos') || c.services[0];
  const nextOrder = Math.max(...c.services.map(s => s.order)) + 1;
  miningServices.forEach(([id, title, category, description, risks], i) => {
    if (c.services.some(s => s.id === id)) return;
    c.services.push({ ...template, id, group: 'mineria', title, category, description, risks, order: nextOrder + i, active: true, informational: false, image: '', imageAlt: '', cta: template.cta || 'SOLICITAR ASESORÍA' });
  });
  c.highlights = ['Seguros para la minería', 'Seguros marítimos', 'Garantías y licitaciones', 'Empresas constructoras', 'Responsabilidad Civil', 'Seguros generales'];
  c.roxana = { ...c.roxana, description: roxanaIntro };
  return c;
}

export const newClient = {
  slug: 'llanada-grande-lodge',
  name: 'Llanada Grande Lodge',
  original_name: 'Llanada Grande Lodge',
  website_url: 'https://www.llanadagrandelodge.cl/',
  website_original: 'https://www.llanadagrandelodge.cl',
  website_verified: true,
  logo_local_path: 'assets/clientes/llanada-grande-lodge.png',
  logo_storage_path: '',
  logo_verified: true,
  logo_authorized: true,
  logo_source: 'https://www.llanadagrandelodge.cl/wp-content/uploads/2017/09/Logo-Llanada.png',
  logo_source_original: 'https://www.llanadagrandelodge.cl/',
  logo_status_original: 'Logotipo original de la cabecera del sitio oficial',
  verification_status: 'verified',
  observations: 'Cliente agregado por instrucción del responsable del sitio (11-11-2026). Logotipo oficial descargado sin modificaciones desde la cabecera de su sitio.',
  sector: 'turismo',
  sector_source: 'https://www.llanadagrandelodge.cl/',
  description: 'Lodge de pesca con mosca en Llanada Grande, Región de Los Lagos.',
  sort_order: 240,
  active: true,
  published: true,
  featured: false,
  relation_authorized: true,
  authorization_reference: 'Instrucción del responsable del sitio, 11-11-2026: agregar www.llanadagrandelodge.cl como nuevo cliente.',
  logo_authorization_reference: 'Instrucción del responsable del sitio de mostrar los logotipos de las empresas asociadas.',
  original_row: 'www.llanadagrandelodge.cl, nuevo cliente',
  logo_width: 558,
  logo_height: 272,
  logo_background: 'white'
};

/** Nuevos logotipos entregados por el responsable del sitio en la carpeta clientes/. */
export const clientLogos = {
  'constructora-werner': ['assets/clientes/constructora-werner.jpeg', 1254, 1279, 'clientes/CONSTRUCTORAWERNER.jpeg'],
  'machinery-chile': ['assets/clientes/machinery-chile.jpeg', 588, 259, 'clientes/Machinery chile.jpeg'],
  ipsanort: ['assets/clientes/ipsanort.jpeg', 1280, 426, 'clientes/ipsanort ltda.jpeg'],
  'up-social-club-osorno': ['assets/clientes/up-social-club-osorno.jpeg', 1280, 1158, 'clientes/up social club.jpeg']
};
