import assert from 'node:assert/strict';
import {writeFile} from 'node:fs/promises';
import {config} from '../js/config.js';
import {publicClientColumns} from '../js/clients-model.js';
const headers={apikey:config.supabasePublishableKey};
const publicResponse=await fetch(config.supabaseUrl+'/rest/v1/bko_clients?select='+publicClientColumns,{headers,signal:AbortSignal.timeout(15000)});assert.equal(publicResponse.status,200);const published=await publicResponse.json();assert.ok(Array.isArray(published));
const internal=await fetch(config.supabaseUrl+'/rest/v1/bko_clients?select=observations,authorization_reference',{headers,signal:AbortSignal.timeout(15000)});assert.ok([401,403].includes(internal.status));
const logo=await fetch(config.supabaseUrl+'/functions/v1/client-logo?id=00000000-0000-0000-0000-000000000001&apikey='+encodeURIComponent(config.supabasePublishableKey),{signal:AbortSignal.timeout(15000)});assert.equal(logo.status,404);
await writeFile(new URL('../artifacts/clients-live-qa.json',import.meta.url),JSON.stringify({publicApiStatus:publicResponse.status,published:published.length,privateColumnsStatus:internal.status,privateLogoProxyStatus:logo.status,checkedAt:new Date().toISOString()},null,2));console.log('API pública, columnas privadas y endpoint de logotipos verificados contra Supabase real.');
