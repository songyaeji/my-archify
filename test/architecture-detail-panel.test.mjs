import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../archify/', import.meta.url));
const cli = path.join(root, 'bin/archify.mjs');

function render(t) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'archify-detail-panel-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const source = path.join(dir, 'diagram.json');
  const output = path.join(dir, 'diagram.html');
  fs.writeFileSync(source, JSON.stringify({
    schema_version: 1, diagram_type: 'architecture',
    meta: { title: 'Detail panel', quality_profile: 'standard', output: 'diagram.html' },
    components: [
      { id: 'a', type: 'frontend', label: 'A', pos: [40, 225], size: [120, 60], details: ['Sends "requests" & reads <replies>'] },
      { id: 'b', type: 'backend', label: 'B', pos: [360, 225], size: [120, 60] },
    ],
    connection_kinds: [{ id: 'http', label: 'HTTPS', tone: 'frontend' }],
    connections: [
      { from: 'a', to: 'b', label: 'request', kind: 'http' },
      { from: 'b', to: 'a', fromSide: 'top', toSide: 'top', via: [[420, 150], [100, 150]], label: 'reply', response: true },
    ],
  }));
  const result = spawnSync(process.execPath, [cli, 'render', 'architecture', source, output], { encoding: 'utf8' });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  return fs.readFileSync(output, 'utf8');
}

test('component details travel to the viewer as escaped JSON', t => {
  const page = render(t);
  assert.match(page, /data-node-id="a"[^>]*data-node-details="\[&quot;Sends \\&quot;requests\\&quot; &amp; reads &lt;replies&gt;&quot;\]"/);
  assert.doesNotMatch(page, /data-node-id="b"[^>]*data-node-details=/);
});

test('connections carry the response flag and kind label the panel groups by', t => {
  const page = render(t);
  assert.match(page, /<path data-edge-from="b" data-edge-to="a"[^>]*data-edge-response="true"/);
  assert.match(page, /<path data-edge-from="a" data-edge-to="b"[^>]*data-edge-kind-label="HTTPS"/);
});

test('the viewer ships the docked panel sections and their strings', t => {
  const page = render(t);
  assert.match(page, /id="focus-sections"/);
  assert.match(page, /html\[data-passport-open\] \.focus-chip:not\(\[hidden\]\)/);
  assert.match(page, /viewer\.passport\.section\.callers/);
});
