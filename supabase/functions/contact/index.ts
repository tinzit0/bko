// Sin dependencias externas: Deno, API REST oficial de Supabase y un cliente SMTP mínimo para Zoho Mail.
import { validateConsultation } from '../../../js/validation.js';
import { validateInsurance, insuranceArea } from '../../../js/insurance-validation.js';

type SmtpConn = { read(p: Uint8Array): Promise<number | null>; write(p: Uint8Array): Promise<number>; close(): void };

// Base64 de texto UTF-8, por bloques para no exceder la pila con mensajes largos.
const b64 = (value: string) => {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
};
const CRLF = '\r\n';
const wrap76 = (value: string) => value.replace(/.{1,76}/g, '$&' + CRLF);
const encodeHeader = (value: string) => /^[\x20-\x7e]*$/.test(value) ? value : `=?UTF-8?B?${b64(value)}?=`;

// Cliente SMTP mínimo (RFC 5321) sobre una conexión TLS ya abierta: AUTH LOGIN, un mensaje y QUIT.
export async function smtpSend(conn: SmtpConn, mail: { user: string; password: string; fromName: string; to: string[]; replyTo?: string; subject: string; text: string; html: string }) {
  const encoder = new TextEncoder(), decoder = new TextDecoder();
  let buffer = '';
  const readReply = async (): Promise<string> => {
    while (true) {
      const lines = buffer.split(CRLF);
      for (let i = 0; i < lines.length - 1; i++) {
        if (/^\d{3} /.test(lines[i])) { buffer = lines.slice(i + 1).join(CRLF); return lines[i]; }
      }
      const chunk = new Uint8Array(8192);
      const n = await conn.read(chunk);
      if (n === null) throw new Error('smtp_connection_closed');
      buffer += decoder.decode(chunk.subarray(0, n), { stream: true });
    }
  };
  const writeAll = async (text: string) => {
    let data = encoder.encode(text);
    while (data.length) data = data.subarray(await conn.write(data));
  };
  const step = async (line: string | null, code: string, label: string) => {
    if (line !== null) await writeAll(line + CRLF);
    const reply = await readReply();
    if (!reply.startsWith(code)) throw new Error(`smtp_${label}_${reply.slice(0, 3)}`);
  };
  const boundary = `bko-${crypto.randomUUID()}`;
  const headers = [
    `From: ${encodeHeader(mail.fromName)} <${mail.user}>`,
    `To: ${mail.to.join(', ')}`,
    ...(mail.replyTo ? [`Reply-To: <${mail.replyTo}>`] : []),
    `Subject: ${encodeHeader(mail.subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: <${crypto.randomUUID()}@${mail.user.split('@')[1]}>`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
  ];
  const body = [
    `--${boundary}`, 'Content-Type: text/plain; charset=utf-8', 'Content-Transfer-Encoding: base64', '', wrap76(b64(mail.text)),
    `--${boundary}`, 'Content-Type: text/html; charset=utf-8', 'Content-Transfer-Encoding: base64', '', wrap76(b64(mail.html)),
    `--${boundary}--`,
  ];
  try {
    await step(null, '220', 'greeting');
    await step(`EHLO ${mail.user.split('@')[1]}`, '250', 'ehlo');
    await step('AUTH LOGIN', '334', 'auth');
    await step(btoa(mail.user), '334', 'auth_user');
    await step(b64(mail.password), '235', 'auth_password');
    await step(`MAIL FROM:<${mail.user}>`, '250', 'mail_from');
    for (const rcpt of mail.to) await step(`RCPT TO:<${rcpt}>`, '250', 'rcpt');
    await step('DATA', '354', 'data');
    // Base64 en líneas de 76 caracteres: ninguna línea empieza con punto, no hace falta «dot-stuffing».
    await step([...headers, '', ...body].join(CRLF) + CRLF + '.', '250', 'message');
    await writeAll('QUIT' + CRLF).catch(() => {});
  } finally {
    try { conn.close(); } catch { /* ya cerrada */ }
  }
}

const escapeHtml = (value: unknown) => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c] as string));

// Envía el aviso por SMTP de Zoho Mail desde la cuenta del formulario (por defecto contacto@bko.cl).
// Sin ZOHO_SMTP_USER / ZOHO_SMTP_PASSWORD no se envía nada. Supabase bloquea el puerto 587: se usa 465 (SSL).
async function notifyByEmail(payload: Record<string, unknown>, id: string, insurance: boolean) {
  const user = Deno.env.get('ZOHO_SMTP_USER');
  const password = Deno.env.get('ZOHO_SMTP_PASSWORD');
  if (!user || !password) return;
  const to = (Deno.env.get('CONTACT_NOTIFY_TO') || 'contacto@bko.cl').split(',').map(v => v.trim()).filter(Boolean);
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
  const hostname = Deno.env.get('ZOHO_SMTP_HOST') || 'smtp.zoho.com';
  const conn = await Deno.connectTls({ hostname, port: 465 });
  const timer = setTimeout(() => { try { conn.close(); } catch { /* cerrada */ } }, 15000);
  try {
    await smtpSend(conn, { user, password, fromName: 'Sitio web BKO', to, replyTo, subject, text, html });
  } finally {
    clearTimeout(timer);
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
    await notifyByEmail(payload, result, insurance).catch(error => console.error('contact_notify_failed', error instanceof Error ? error.message : 'unknown'));
    return json({ok:true,id:result},201);
  } catch (error) {
    if (error instanceof SyntaxError) return json({ok:false,error:'invalid_json'},400);
    console.error('contact_request_failed');
    return json({ok:false,error:'service_unavailable'},503);
  }
});
