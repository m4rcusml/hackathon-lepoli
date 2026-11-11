import { spawn } from 'node:child_process';
import assert from 'node:assert/strict';
import { setTimeout as pause } from 'node:timers/promises';

const server = spawn(process.execPath, ['node_modules/next/dist/bin/next', 'start', '--hostname', '127.0.0.1', '--port', '3121'], {
  windowsHide: true,
  stdio: 'ignore',
  env: { ...process.env, DOCTOR_DEMO_ENABLED: 'false', DOCTOR_API_UPSTREAM_URL: '' },
});
try {
  let ready = false;
  for (let i = 0; i < 60; i++) {
    try { ready = (await fetch('http://127.0.0.1:3121/doctor')).ok; } catch { /* Wait for the local process only. */ }
    if (ready) break;
    await pause(200);
  }
  assert(ready, 'Production process failed to start');
  assert.equal((await fetch('http://127.0.0.1:3121/demo/doctor')).status, 404);
  const html = await (await fetch('http://127.0.0.1:3121/doctor/patients/usr-dan-2026')).text();
  assert(!/Daniel Vaz|Ferritina Sérica|22 ng\/mL/.test(html), 'Clinical content must not be in initial HTML');
  const response = await fetch('http://127.0.0.1:3121/api/doctor/v0/session');
  assert.equal(response.status, 503);
  assert.equal((await response.json()).code, 'UPSTREAM_NOT_CONFIGURED');
  assert.match(response.headers.get('cache-control'), /no-store/);
  console.log('Production: demo disabled returns 404; initial HTML has no clinical data; missing upstream fails explicitly with no-store.');
} finally {
  server.kill();
}
