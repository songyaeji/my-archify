import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('../archify/', import.meta.url));
const cli = path.join(root, 'bin/archify.mjs');

function render(t, changes = {}) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'archify-connection-kinds-'));
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const source = path.join(dir, 'diagram.json');
  const output = path.join(dir, 'diagram.html');
  const diagram = {
    schema_version: 1, diagram_type: 'architecture',
    meta: { title: 'Connection kinds', quality_profile: 'standard', output: 'diagram.html' },
    components: [
      { id: 'a', type: 'frontend', label: 'A', pos: [40, 225], size: [120, 60] },
      { id: 'b', type: 'backend', label: 'B', pos: [360, 225], size: [120, 60] },
      { id: 'c', type: 'database', label: 'C', pos: [680, 225], size: [120, 60] },
    ],
    connection_kinds: [
      { id: 'http', label: 'HTTPS', tone: 'frontend' },
      { id: 'sql', label: 'SQL', tone: 'database' },
    ],
    connections: [
      { from: 'a', to: 'b', label: 'request', kind: 'http' },
      { from: 'b', to: 'c', label: 'query', kind: 'sql', both: true },
    ],
    ...changes,
  };
  fs.writeFileSync(source, JSON.stringify(diagram));
  const result = spawnSync(process.execPath, [cli, 'render', 'architecture', source, output], { encoding: 'utf8' });
  return { result, html: () => fs.readFileSync(output, 'utf8') };
}

test('connection kinds color arrows by tone and list each used kind in the legend', t => {
  const { result, html } = render(t);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  const page = html();
  assert.match(page, /data-edge-from="a" data-edge-to="b"[^>]*class="a-kind a-tone-frontend"[^>]*marker-end="url\(#arrowhead-tone-frontend\)"/);
  assert.match(page, /<marker id="arrowhead-tone-database"[^>]*orient="auto-start-reverse">/);
  assert.match(page, /data-legend-semantic-kind="connection-http"/);
  assert.match(page, /data-legend-semantic-kind="connection-sql"/);
});

test('both-way connections draw an arrowhead at each end', t => {
  const { result, html } = render(t);
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(html(), /data-edge-from="b" data-edge-to="c"[^>]*marker-end="url\(#arrowhead-tone-database\)" marker-start="url\(#arrowhead-tone-database\)"/);
  assert.match(html(), /data-legend-semantic-kind="connection-both"/);
});

test('response connections are dotted and named in the legend', t => {
  const { result, html } = render(t, { connections: [
    { from: 'a', to: 'b', label: 'request', kind: 'http' },
    { from: 'b', to: 'a', fromSide: 'top', toSide: 'top', via: [[420, 150], [100, 150]], label: 'reply', response: true },
  ] });
  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(html(), /data-edge-from="b" data-edge-to="a"[^>]*class="a-default a-response"/);
  assert.match(html(), /data-legend-semantic-kind="connection-response"/);
});

test('an undeclared connection kind is a structured error', t => {
  const { result } = render(t, { connections: [{ from: 'a', to: 'b', label: 'request', kind: 'grpc' }] });
  assert.notEqual(result.status, 0);
  assert.match(result.stdout + result.stderr, /architecture\/unknown-connection-kind|undeclared kind "grpc"/);
});
