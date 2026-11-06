// Sin dependencias externas: Deno y API REST oficial de Supabase.
import { validateConsultation } from '../../../js/validation.js';

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
    for (const key of ['name','company','email','phone','city','area','message']) {
      if (data[key] !== undefined && typeof data[key] !== 'string') return json({ ok:false, error:'invalid_fields' }, 400);
      data[key] = (data[key] || '').trim();
    }
    if (Object.keys(validateConsultation(data)).length || data.website || !Number.isFinite(data.startedAt) || Date.now() - data.startedAt < 3000 || Date.now() - data.startedAt > 86400000) return json({ ok:false, error:'validation_failed' }, 400);
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
    return json({ok:true,id:result},201);
  } catch (error) {
    if (error instanceof SyntaxError) return json({ok:false,error:'invalid_json'},400);
    console.error('contact_request_failed');
    return json({ok:false,error:'service_unavailable'},503);
  }
});
