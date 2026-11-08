// Generates an idempotent installation seed. Never overwrites CMS edits.
import {readFile,writeFile} from 'node:fs/promises';
const root=new URL('../',import.meta.url),records=JSON.parse(await readFile(new URL('supabase/seeds/firm.json',root),'utf8'));
const sql=`insert into public.bko_content(id,kind,sort_order,active,published,data) select id,kind,sort_order,active,published,data from jsonb_to_recordset('${JSON.stringify(records).replaceAll("'","''")}'::jsonb) as x(id text,kind text,sort_order integer,active boolean,published boolean,data jsonb) on conflict(id) do nothing;\n`;
await writeFile(new URL('supabase/seeds/firm.sql',root),sql);console.log('Seed de instalación generado; conserva registros existentes.');
