// La clave publishable es pública por diseño. Nunca poner service_role aquí.
export const config = Object.freeze({
  supabaseUrl: 'https://kxldsjodgfonrrlwjbws.supabase.co',
  supabasePublishableKey: 'sb_publishable_J5s_2YqtASIYSqu2k00SGA_copdr39x',
  siteUrl: '', // Se completa con npm run configure-domain -- https://dominio-real.cl
  whatsappNumber: '+56974826025', // WhatsApp de BKO: botón flotante y consultas de los formularios.
  turnstileSiteKey: '', // Opcional: activar junto con TURNSTILE_SECRET_KEY en Supabase.
  analytics: { gtmId: '', ga4Id: '' }, // Reservados. No se cargan trackers sin consentimiento.
  // contacto@ recibe además los avisos del formulario (ver CONTACT_NOTIFY_TO en Supabase).
  emails: { general: 'contacto@bko.cl', administracion: 'administracion@bko.cl', calama: '', santiagoPuertoVaras: '' },
});
