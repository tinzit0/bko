// Deno y API REST oficial de Supabase. El aviso por correo usa SMTP de Zoho Mail (denomailer, carga diferida).
import { validateConsultation } from '../../../js/validation.js';
import { validateInsurance, insuranceArea } from '../../../js/insurance-validation.js';

const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c] as string));

// Envía el aviso por SMTP de Zoho Mail desde la cuenta del formulario (por defecto contacto@bko.cl).
// Sin ZOHO_SMTP_USER / ZOHO_SMTP_PASSWORD no se envía nada. Supabase bloquea el puerto 587: se usa 465 (SSL).
async function notifyByEmail(payload: Record<string, unknown>, id: string, insurance: boolean) {
  const user = Deno.env.get('ZOHO_SMTP_USER');
  const password = Deno.env.get('ZOHO_SMTP_PASSWORD');
  if (!user || !password) return;
  const to = (Deno.env.get('CONTACT_NOTIFY_TO') || 'contacto@bko.cl').split(',').map(v => v.trim()).filter(Boolean);
  const from = `Sitio web BKO <${user}>`; // Zoho exige que el remitente sea la cuenta autenticada.
  const labels: [string, string][] = [
    ['name','Nombre'],['company','Empresa'],['email','Correo'],['phone','Teléfono'],['city','Ciudad'],['area','Área de interés'],
    ...(insurance ? [['insuranceType','Tipo de seguro'],['companyRut','RUT empresa'],['activity','Actividad'],['expectedDate','Fecha estimada']] as [string,string][] : []),
  ];
  const rows = labels.filter(([key]) => String(payload[key] ?? '').trim())
    .map(([key, label]) => `<tr><td style="padding:8px 16px 8px 0;color:#6b7a85;font-size:13px;vertical-align:top;white-space:nowrap">${label}</td><td style="padding:8px 0;font-size:14px;color:#071c2b">${escapeHtml(payload[key])}</td></tr>`).join('');
  const html = `<div style="font-family:Arial,Helvetica,sans-serif;max-width:620px;margin:auto;border-top:3px solid #E87524;padding:28px;background:#fbf8f2">
<p style="margin:0 0 6px;font-size:11px;letter-spacing:2px;color:#a5662d">BKO · FORMULARIO WEB</p>
<h1 style="margin:0 0 20px;font-family:Georgia,serif;font-weight:400;font-size:26px;color:#071c2b">Nueva ${insurance ? 'solicitud de seguros' : 'consulta'}</h1>
<table style="border-collapse:collapse;width:100%">${rows}</table>
<p style="margin:22px 0 6px;font-size:13px;color:#6b7a85">Mensaje</p>
<div style="white-space:pre-wrap;font-size:14px;line-height:1.7;color:#071c2b;background:#fff;border:1px solid #e6dccb;padding:16px">${escapeHtml(payload.message)}</div>
<p style="margin:22px 0 0;font-size:12px;color:#8a97a0">Responde directamente a este correo para contestar a la persona. Registro ${escapeHtml(id)} guardado en el panel de administración.</p></div>`;
  const text = labels.filter(([key]) => String(payload[key] ?? '').trim()).map(([key, label]) => `${label}: ${payload[key]}`).join('\n') + `\n\nMensaje:\n${payload.message}\n\nRegistro: ${id}`;
  const subject = `Nueva ${insurance ? 'solicitud de seguros' : 'consulta'} web — ${String(payload.area || '').slice(0, 60)} — ${String(payload.name || '').slice(0, 60)}`.replace(/[\r\n]+/g, ' ');
  const replyTo = /^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(String(payload.email || '')) ? String(payload.email) : undefined;
  // Carga diferida: la librería solo se descarga cuando hay credenciales (las pruebas en Node no la necesitan).
  const { SMTPClient } = await import('https://deno.land/x/denomailer@1.6.0/mod.ts');
  const client = new SMTPClient({ connection: { hostname: Deno.env.get('ZOHO_SMTP_HOST') || 'smtp.zoho.com', port: 465, tls: true, auth: { username: user, password } } });
  try {
    await Promise.race([
      client.send({ from, to, replyTo, subject, content: text, html }),
      new Promise((_, reject) => setTimeout(() => reject(new Error('smtp_timeout')), 10000)),
    ]);
  } finally {
    await client.close().catch(() => {});
  }
}

const allowedOrigins = (Deno.env.get('ALLOWED_ORIGINS') || 'http://localhost:3000,http://127.0.0.1:3000')
  .split(',').map(value => value.trim()).filter(Boolean);

Deno.serve(async (request: Request) => {
  const origin = request.headers.get('origin') || '';
  const cors = {
    'Access-Control-Allow-Origin': allowedOrigins.includes(origin) ? origin : 'null',
    'Access-Control-Allow-Headers': 'content-type, apikey',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Vary': 'Origin',
    'Cache-Control': 'no-store',
  };
  const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
    status, headers: { ...cors, 'Content-Type': 'application/json; charset=utf-8' },
  });
  if (!allowedOrigins.includes(origin)) return json({ ok:false, error:'origin_not_allowed' }, 403);
  if (request.method === 'OPTIONS') return new Response(null, { status:204, headers:cors });
  if (request.method !== 'POST') return json({ ok:false, error:'method_not_allowed' }, 405);
  if (!(request.headers.get('content-type') || '').startsWith('application/json')) return json({ ok:false, error:'invalid_content_type' }, 415);
  const publishableKey = Deno.env.get('BKO_PUBLISHABLE_KEY');
  const url = Deno.env.get('SUPABASE_URL');
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  const fingerprintSecret = Deno.env.get('CONTACT_FINGERPRINT_SECRET');
  if (!publishableKey || !url || !serviceKey || !fingerprintSecret) return json({ ok:false, error:'service_unavailable' }, 503);
  if (request.headers.get('apikey') !== publishableKey) return json({ ok:false, error:'invalid_key' }, 401);
  try {
    // Límite real incluso cuando no existe Content-Length.
    if (!request.body) return json({ ok:false, error:'empty_body' }, 400);
    const reader = request.body.getReader();
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 24000) { await reader.cancel(); return json({ ok:false, error:'payload_too_large' }, 413); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength; }
    const data = JSON.parse(new TextDecoder().decode(bytes));
    if (!data || typeof data !== 'object' || Array.isArray(data)) return json({ ok:false, error:'invalid_body' }, 400);
    for (const key of ['name','company','email','phone','city','area','message','insuranceType','companyRut','activity','expectedDate']) {
      if (data[key] !== undefined && typeof data[key] !== 'string') return json({ ok:false, error:'invalid_fields' }, 400);
      data[key] = (data[key] || '').trim();
    }
    const insurance = data.area === insuranceArea;
    if (Object.keys(insurance ? validateInsurance(data) : validateConsultation(data)).length || data.website || !Number.isFinite(data.startedAt) || Date.now() - data.startedAt < 3000 || Date.now() - data.startedAt > 86400000) return json({ ok:false, error:'validation_failed' }, 400);
    const turnstileSecret = Deno.env.get('TURNSTILE_SECRET_KEY');
    if (turnstileSecret) {
      const verification = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method:'POST', body:new URLSearchParams({secret:turnstileSecret, response:String(data.turnstileToken || '')}), signal:AbortSignal.timeout(8000),
      });
      const challenge = await verification.json();
      if (!challenge.success) return json({ ok:false, error:'security_check_failed' }, 400);
    }
    // Solo se persiste un HMAC, nunca la dirección IP original.
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    const hmacKey = await crypto.subtle.importKey('raw', new TextEncoder().encode(fingerprintSecret), { name:'HMAC', hash:'SHA-256' }, false, ['sign']);
    const signature = await crypto.subtle.sign('HMAC', hmacKey, new TextEncoder().encode(ip));
    const fingerprint = [...new Uint8Array(signature)].map(value => value.toString(16).padStart(2,'0')).join('');
    const payload = Object.fromEntries(['name','company','email','phone','city','area','message','privacy'].map(key => [key,data[key]]));
    if (insurance) for (const key of ['insuranceType','companyRut','activity','expectedDate','commercialConsent']) payload[key] = data[key];
    const saved = await fetch(`${url}/rest/v1/rpc/submit_consultation`, {
      method:'POST', headers:{'apikey':serviceKey,'Authorization':`Bearer ${serviceKey}`,'Content-Type':'application/json'},
      body:JSON.stringify({payload,client_fingerprint:fingerprint}), signal:AbortSignal.timeout(12000),
    });
    const result = await saved.json();
    if (!saved.ok) {
      if (result.message?.includes('rate_limit_exceeded')) return json({ok:false,error:'rate_limit_exceeded'},429);
      console.error('contact_storage_failed', saved.status); // Sin mensajes ni datos personales.
      return json({ok:false,error:'storage_unavailable'},503);
    }
    if (typeof result !== 'string' || !/^[0-9a-f-]{36}$/i.test(result)) return json({ok:false,error:'invalid_storage_response'},503);
    // Aviso por correo a contacto@bko.cl. La consulta ya quedó guardada: un fallo aquí no afecta a quien escribe.
    await notifyByEmail(payload, result, insurance).catch(() => console.error('contact_notify_failed'));
    return json({ok:true,id:result},201);
  } catch (error) {
    if (error instanceof SyntaxError) return json({ok:false,error:'invalid_json'},400);
    console.error('contact_request_failed');
    return json({ok:false,error:'service_unavailable'},503);
  }
});
