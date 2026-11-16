import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const path = new URL('../lib/model.ts', import.meta.url);
test('the frozen snapshot yields a ranked, complete and varied pre-token board', async () => {
  const { buildRadar } = await import(path.href).catch(() => ({}));
  assert.equal(typeof buildRadar, 'function', 'buildRadar must implement the snapshot-to-board pipeline');
  const snapshot = JSON.parse(readFileSync('/home/ape/makefun-workspace/kits/token-radar-01/token-radar-01-kit/input/snapshot.json', 'utf8'));
  const result = buildRadar(snapshot);
  assert.ok(result.rows.length >= 100 && result.rows.length <= 4000);
  const slugs = new Set(result.rows.map(r => r.slug));
  assert.equal(slugs.size, result.rows.length);
  for (const slug of snapshot.watchlist) assert.ok(slugs.has(slug), `watchlist coverage: ${slug}`);
  for (const [i, row] of result.rows.entries()) {
    assert.equal(row.rank, i + 1);
    assert.ok(Number.isSafeInteger(row.implied_value_usd) && row.implied_value_usd > 0);
    if (i) assert.ok(result.rows[i - 1].implied_value_usd >= row.implied_value_usd);
    assert.ok(row.farm_steps.length >= 3 && row.farm_steps.length <= 12);
    for (const step of row.farm_steps) {
      assert.ok(step.trim().length >= 20 && step.trim().length <= 600);
      assert.ok(step.includes(row.name) || step.includes(row.chain), 'each plan step must name its protocol or selected chain');
    }
    assert.ok(row.scenario_low_usd <= row.implied_value_usd && row.scenario_high_usd >= row.implied_value_usd);
  }
  assert.ok(new Set(result.rows.map(r=>r.implied_value_usd)).size > 20);
  assert.deepEqual(buildRadar(snapshot), result, 'same input must produce identical output');
});
