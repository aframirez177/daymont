// Single source of content for the Daymont MVP.
// Anything marked [CLIENT: ...] must be confirmed by Daymont before launch.

export const company = {
  name: 'Daymont S.A.S.',
  short: 'Daymont',
  meaning: 'Diseños, Automatizaciones y Montajes',
  founded: 1979,
  city: 'Bogotá D.C.',
  country: 'CO',
  address: 'Avenida Ciudad de Cali, Cra. 85 N° 7D-06',
  // Landline 2921340 in the national 60X format (Bogotá = 601).
  phone: '+57 601 292 1340',
  phoneDisplay: '(601) 292 1340',
  // [CLIENT: WhatsApp de ingeniería/ventas] — placeholder until Daymont confirms the number.
  whatsapp: '573000000000',
  whatsappIsPlaceholder: true,
  email: 'ventas@daymont.com.co', // [CLIENT: confirmar buzón]
  legacySite: 'https://www.daymont.com.co/website/index.php',
  youtube: 'https://www.youtube.com/channel/UCviEdKRFjQk6LpSA4WmlV_g',
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=Avenida+Ciudad+de+Cali+Cra+85+7D-06+Bogota',
};

export const years = new Date().getFullYear() - company.founded;

export const wa = (text) =>
  `https://wa.me/${company.whatsapp}?text=${encodeURIComponent(text)}`;

export const doors = [
  {
    key: 'A',
    id: 'configurar',
    title: 'Configurar un cilindro',
    text: 'Elige diámetro, carrera, montaje y presión. Te devolvemos la fuerza calculada y una solicitud lista para cotizar, sin llamadas de ida y vuelta.',
    for: 'Mantenimiento · OEM · Proyectos',
    cta: 'Abrir configurador',
    href: '#configurador',
  },
  {
    key: 'B',
    id: 'reparar',
    title: 'Reparar un cilindro',
    text: 'Envía por WhatsApp una foto de la placa y otra del daño. Diagnóstico, repuestos y prueba de presión en el mismo taller.',
    for: 'Urgencias · Equipo móvil · Planta',
    cta: 'Enviar fotos por WhatsApp',
    href: 'wa:repair',
  },
  {
    key: 'C',
    id: 'fabricar',
    title: 'Fabricar una pieza',
    text: 'Plano, STL o una pieza dañada como muestra. Prototipo en impresión 3D, pieza final en torno o CNC, soldadura y pintura.',
    for: 'Ingeniería · Diseño · Reposición',
    cta: 'Enviar plano',
    href: '#fabricar',
  },
];

export const assembly = [
  { n: '01', title: 'Camisa', spec: 'TUBO BRUÑIDO · Ø INTERIOR H8', text: 'El tubo se corta y se bruñe por dentro. De ese acabado depende que el sello no se desgaste.' },
  { n: '02', title: 'Vástago', spec: 'ACERO CROMADO · RECTIFICADO', text: 'Barra cromada y rectificada. Es la pieza que trabaja a la vista y recibe golpes, polvo y humedad.' },
  { n: '03', title: 'Pistón y sellos', spec: 'SELLOS · GUÍAS · ANTIEXTRUSIÓN', text: 'El pistón divide las dos cámaras. Los sellos contienen la presión y las guías evitan el roce metal-metal.' },
  { n: '04', title: 'Tapas', spec: 'TAPA DELANTERA · TAPA TRASERA · PUERTOS', text: 'Cierran la camisa, guían el vástago y llevan los puertos por donde entra y sale el aceite.' },
  { n: '05', title: 'Tirantes', spec: '4 TIRANTES · TUERCAS · TORQUE', text: 'Cuatro tirantes aprietan tapas contra camisa. Es el formato de cilindro industrial más fácil de reparar.' },
  { n: '06', title: 'Prueba de presión', spec: 'BANCO DE PRUEBA · FUGAS · CARRERA', text: 'Cada cilindro sale probado: carrera completa, presión sostenida y cero fugas antes de entregarse.' },
  { n: '07', title: 'Pintura', spec: 'CUARTO DE PINTURA · ACABADO INDUSTRIAL', text: 'Acabado en nuestro propio cuarto de pintura. Sale del taller listo para instalar.' },
];

export const capabilities = [
  { code: 'CAP-01', word: 'Torno', kind: 'Sustractivo', text: 'Camisas, vástagos, tapas y roscas. El corazón de la fabricación de cilindros.' },
  { code: 'CAP-02', word: 'CNC', kind: 'Sustractivo', text: 'Fresado de bloques de metal: bridas, soportes, moldes y piezas únicas.' },
  { code: 'CAP-03', word: 'Impresión 3D', kind: 'Aditivo', text: 'PLA para prototipos y galgas; resina para detalle fino y superficies lisas.' },
  { code: 'CAP-04', word: 'Soldadura', kind: 'Unión', text: 'Estructuras, montajes y recuperación de bastidores y cilindros.' },
  { code: 'CAP-05', word: 'Pintura', kind: 'Acabado', text: 'Cuarto de pintura propio: la pieza sale lista para instalar.' },
];

export const catalog = [
  {
    group: 'Hidráulica',
    items: [
      { name: 'Cilindros hidráulicos Daymont', tag: 'Fabricación propia', specs: [['TIPO', 'Tirantes · Soldado'], ['MEDIDA', 'A medida'], ['MONTAJE', 'Según aplicación']] },
      { name: 'Cilindros para equipo móvil', tag: 'Fabricación propia', specs: [['USO', 'Maquinaria móvil'], ['MEDIDA', 'A medida'], ['SERVICIO', 'Reparación']] },
      { name: 'Equipos hidráulicos', tag: 'Ingeniería', specs: [['TIPO', 'Unidades de potencia'], ['DISEÑO', 'Según carga'], ['MONTAJE', 'En sitio']] },
      { name: 'Bombas y motores de paletas Vickers', tag: 'Distribución', specs: [['MARCA', 'Vickers by Danfoss'], ['TIPO', 'Paletas'], ['SERVICIO', 'Repuesto']] },
    ],
  },
  {
    group: 'Neumática',
    items: [
      { name: 'Cilindros neumáticos Daymont', tag: 'Fabricación propia', specs: [['MEDIDA', 'A medida'], ['MONTAJE', 'Según aplicación'], ['SERVICIO', 'Reparación']] },
      { name: 'Cilindros neumáticos ISO 6431', tag: 'Distribución', specs: [['NORMA', 'ISO 6431'], ['USO', 'Automatización'], ['STOCK', '[CLIENT]']] },
      { name: 'Cilindros compactos', tag: 'Distribución', specs: [['FORMATO', 'Carrera corta'], ['USO', 'Espacio reducido'], ['STOCK', '[CLIENT]']] },
      { name: 'Válvulas y unidades de mantenimiento', tag: 'Distribución', specs: [['LÍNEA', 'Electroválvulas'], ['LÍNEA', 'Válvulas manuales'], ['LÍNEA', 'Unidades FRL']] },
    ],
  },
];

export const solutions = [
  {
    slug: 'cilindros-hidraulicos',
    title: 'Cilindros hidráulicos a medida en Bogotá',
    short: 'Cilindros hidráulicos',
    description: 'Fabricación de cilindros hidráulicos a medida en Bogotá desde 1979: diseño, torno, prueba de presión y pintura en taller propio. Cotiza con diámetro, carrera y montaje.',
    answer: 'Daymont fabrica cilindros hidráulicos a medida en su taller de Bogotá desde 1979. Se diseñan a partir del diámetro de camisa, el diámetro del vástago, la carrera, el tipo de montaje y la presión de trabajo, y cada unidad se prueba a presión antes de entregarse.',
    points: ['Diseño según carga, carrera y montaje', 'Mecanizado propio: torno y CNC', 'Sellos y guías según fluido y temperatura', 'Prueba de presión y fugas antes de entrega', 'Pintura industrial en cuarto propio'],
    door: 'A',
    faq: [
      ['¿Qué datos necesito para cotizar un cilindro hidráulico?', 'Diámetro de camisa, diámetro de vástago, carrera, tipo de montaje en ambos extremos, presión de trabajo, cantidad y fecha requerida. Si no los tienes, una foto del cilindro instalado y de su placa sirve para empezar.'],
      ['¿Fabrican cilindros que no están en catálogo?', 'Sí. La fabricación a medida es el núcleo del taller: se diseña a partir de la aplicación o de una muestra.'],
    ],
  },
  {
    slug: 'reparacion-de-cilindros',
    title: 'Reparación de cilindros hidráulicos y neumáticos',
    short: 'Reparación',
    description: 'Reparación de cilindros hidráulicos y neumáticos en Bogotá: diagnóstico, cambio de sellos, recuperación de vástago y camisa, prueba de presión. Envía foto de la placa por WhatsApp.',
    answer: 'Daymont repara cilindros hidráulicos y neumáticos en Bogotá: diagnóstico, cambio de sellos, recuperación o fabricación de vástago y camisa, y prueba de presión. Para empezar basta con una foto de la placa y otra del daño.',
    points: ['Diagnóstico con desarme y medición', 'Kit de sellos según referencia', 'Vástago nuevo o recuperado', 'Prueba de presión y fugas', 'Pintura y entrega lista para montar'],
    door: 'B',
    faq: [
      ['¿Cómo empiezo una reparación?', 'Envía por WhatsApp una foto de la placa del cilindro, una foto del daño y la ciudad donde está el equipo. Con eso se define si se diagnostica en taller o en sitio.'],
      ['¿Reparan cilindros de maquinaria móvil?', 'Sí, cilindros de equipo móvil e industrial, hidráulicos y neumáticos.'],
    ],
  },
  {
    slug: 'cilindros-neumaticos',
    title: 'Cilindros neumáticos Daymont e ISO 6431',
    short: 'Cilindros neumáticos',
    description: 'Cilindros neumáticos de fabricación propia, ISO 6431 y compactos, electroválvulas, válvulas manuales y unidades de mantenimiento en Bogotá.',
    answer: 'Daymont ofrece cilindros neumáticos de fabricación propia, cilindros bajo norma ISO 6431, cilindros compactos, electroválvulas, válvulas manuales y unidades de mantenimiento para automatización industrial.',
    points: ['Cilindros neumáticos Daymont a medida', 'Cilindros ISO 6431 intercambiables', 'Cilindros compactos de carrera corta', 'Electroválvulas y válvulas manuales', 'Unidades de mantenimiento (FRL) y accesorios'],
    door: 'A',
    faq: [
      ['¿Qué ventaja tiene un cilindro ISO 6431?', 'Las dimensiones de montaje están normalizadas, así que es intercambiable con cilindros de otras marcas bajo la misma norma.'],
    ],
  },
  {
    slug: 'bombas-y-motores-vickers',
    title: 'Bombas y motores de paletas Vickers',
    short: 'Vickers',
    description: 'Bombas y motores de paletas Vickers (hoy Vickers by Danfoss) y equipos hidráulicos en Bogotá. Referencias, reposición y asesoría técnica.',
    answer: 'Daymont trabaja bombas y motores de paletas Vickers, marca que desde 2021 pertenece a Danfoss y se comercializa como Vickers by Danfoss, junto con el diseño y montaje de equipos hidráulicos.',
    points: ['Bombas de paletas Vickers', 'Motores de paletas Vickers', 'Identificación de referencia por placa', 'Equipos y unidades hidráulicas', 'Asesoría de reemplazo'],
    door: 'B',
    faq: [
      ['¿Vickers sigue existiendo?', 'Sí. Eaton vendió su negocio hidráulico, incluida la marca Vickers, a Danfoss; la operación cerró el 2 de agosto de 2021 y la marca continúa como Vickers by Danfoss.'],
    ],
  },
  {
    slug: 'fabricacion-de-piezas',
    title: 'Fabricación de piezas: CNC, torno e impresión 3D',
    short: 'Piezas a medida',
    description: 'Fabricación de piezas a medida en Bogotá: prototipo en impresión 3D (PLA y resina), pieza final en torno o fresado CNC, soldadura y pintura en un solo taller.',
    answer: 'Daymont fabrica piezas a medida en Bogotá combinando impresión 3D para prototipos, torno y fresado CNC para la pieza final, soldadura y pintura, sin salir del mismo taller.',
    points: ['Prototipo rápido en PLA o resina', 'Pieza final en torno o CNC', 'Soldadura y ensamble', 'Pintura industrial', 'A partir de plano, STL o muestra'],
    door: 'C',
    faq: [
      ['¿En qué formatos puedo enviar un plano?', 'PDF, DWG/DXF, STEP o STL. Si no hay plano, una pieza de muestra con fotos y medidas también sirve.'],
    ],
  },
];

export const faq = [
  ['¿Dónde queda Daymont?', `En ${company.address}, ${company.city}, Colombia. Atendemos clientes en todo el país.`],
  ['¿Desde cuándo fabrican cilindros?', `Desde ${company.founded}. Son más de ${years} años fabricando y reparando cilindros hidráulicos y neumáticos para la industria colombiana.`],
  ['¿Qué necesito para cotizar un cilindro?', 'Diámetro de camisa, diámetro de vástago, carrera, montaje, presión de trabajo, cantidad y fecha. El configurador de esta página los organiza y calcula la fuerza.'],
  ['¿Reparan cilindros de otras marcas?', 'Sí. Se reparan cilindros hidráulicos y neumáticos de cualquier marca: diagnóstico, sellos, vástago, camisa y prueba de presión.'],
  ['¿Pueden fabricar piezas que no son cilindros?', 'Sí. Con torno, CNC, impresión 3D, soldadura y pintura propios fabricamos piezas a partir de plano, STL o muestra.'],
  ['¿Trabajan con Vickers?', 'Sí, bombas y motores de paletas Vickers, hoy comercializados como Vickers by Danfoss.'],
];
