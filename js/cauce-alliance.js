// Alianza BKO + CAUCE (carta de CAUCE del 12-11-2026). Textos que reemplazan a los anteriores.
// Se aplican al contenido que llega del CMS para que el sitio muestre la versión nueva aunque la
// base de datos aún conserve la anterior (supabase/updates/20261113_alianza_bko_cauce.sql la actualiza).

export const cauceDescription = 'CAUCE Gestión Integral, fundada por Luis Miranda Chavarría, trabaja en alianza con BKO para resolver la cobranza de empresas del norte de Chile. CAUCE levanta y ordena la información de cada deuda (facturas, pagos, correspondencia y antecedentes del deudor) y la entrega lista para que el equipo jurídico de BKO evalúe la causa y conduzca el cobro.';
export const luisRole = 'Ingeniero Civil | Fundador de CAUCE Gestión Integral';
export const estefaniaRole = 'Asistente contable | Coordinación de cobranza';
export const estefaniaFirstSentence = 'Estefanía es asistente contable de BKO y apoya la coordinación de los casos de cobranza que prepara CAUCE.';

// [texto anterior, texto nuevo]
export const textUpdates = [
  ['Ingeniero Civil | Creador de CAUCE Gestión Integral', luisRole],
  ['ingeniero civil y creador de CAUCE Gestión Integral', 'ingeniero civil y fundador de CAUCE Gestión Integral'],
  ['Los expedientes elaborados por CAUCE reflejan un trabajo que integra', 'Los expedientes elaborados por CAUCE integran'],
  ['En los antecedentes analizados se individualizan pagos por', 'En cada cartera se individualizan los pagos por'],
  ['El informe de traspaso examinado contiene una sección específica dedicada a información que no estaba disponible en la carpeta', 'Cada informe de traspaso contiene una sección dedicada a la información que no está disponible en la carpeta'],
  ['Estefanía es asistente contable de BKO y está a cargo de la gestión de CAUCE Gestión Integral, el sistema de la oficina para organizar y dar seguimiento documental a las carteras de cobranza.', estefaniaFirstSentence],
  ['Asistente contable | Gestión de CAUCE', estefaniaRole],
  ['Gestión de CAUCE', 'Coordinación de casos de cobranza']
];

const update = text => typeof text === 'string' ? textUpdates.reduce((t, [from, to]) => t.split(from).join(to), text) : text;
const deep = value => Array.isArray(value) ? value.map(deep) : value && typeof value === 'object' ? Object.fromEntries(Object.entries(value).map(([k, v]) => [k, deep(v)])) : update(value);

/** Devuelve el registro con los textos de la alianza aplicados (no modifica el original). */
export function allianceRecord(row) {
  if (!row || !['cauce', 'luis-miranda-chavarria', 'estefania-benitez-garcia'].includes(row.id)) return row;
  const data = deep(row.data);
  if (row.id === 'cauce' && /^Creado por Luis Miranda Chavarr[ií]a/.test(String(data.description || ''))) {
    data.description = String(data.description).replace(/^Creado por Luis Miranda Chavarr[ií]a[^\n]*/, cauceDescription);
  }
  return { ...row, data };
}
