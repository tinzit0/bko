export const areas = ['Corporativo y empresarial','Minería, construcción y servicios asociados','Marítimo, naviero, lacustre y seguros','Acuicultura y recursos hidrobiológicos','Derecho laboral','Inmobiliario y familia','Necesito orientación'];
export const cities = ['Calama','Santiago','Puerto Varas','Otra ciudad'];
export function validateConsultation(data) {
  const errors = {};
  const length = key => typeof data[key] === 'string' ? data[key].trim().length : 0;
  if (length('name') < 3 || length('name') > 120) errors.name = 'Ingresa tu nombre completo (3 a 120 caracteres).';
  if (typeof data.email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim()) || length('email') > 254) errors.email = 'Ingresa un correo electrónico válido.';
  if (length('company') > 160) errors.company = 'La empresa puede tener hasta 160 caracteres.';
  if (data.phone && (!/^[+\d\s().-]{7,25}$/.test(data.phone.trim()) || (data.phone.match(/\d/g) || []).length < 7)) errors.phone = 'Ingresa un teléfono válido, con código de país.';
  if (!cities.includes(data.city)) errors.city = 'Selecciona una ciudad.';
  if (!areas.includes(data.area)) errors.area = 'Selecciona un área de interés.';
  if (length('message') < 20 || length('message') > 4000) errors.message = 'Escribe entre 20 y 4.000 caracteres.';
  if (data.privacy !== true) errors.privacy = 'Debes aceptar la política de privacidad.';
  return errors;
}
