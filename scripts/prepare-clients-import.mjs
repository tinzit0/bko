// Complete, repeatable preparation; executing clients.sql never replaces CMS edits.
import {importClients} from './import-clients.mjs';
await importClients();
await import('./finalize-client-sources.mjs');
