// La clave publishable es pública por diseño. Nunca poner service_role aquí.
export const config = Object.freeze({
  supabaseUrl: 'https://kxldsjodgfonrrlwjbws.supabase.co',
  supabasePublishableKey: 'sb_publishable_J5s_2YqtASIYSqu2k00SGA_copdr39x',
  siteUrl: '', // Se completa con npm run configure-domain -- https://dominio-real.cl
  turnstileSiteKey: '', // Opcional: activar junto con TURNSTILE_SECRET_KEY en Supabase.
  analytics: { gtmId: '', ga4Id: '' }, // Reservados. No se cargan trackers sin consentimiento.
  emails: { general: '', calama: '', santiagoPuertoVaras: '' },
});
