const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'tools', 'JD', 'data-analysis.html'), 'utf8');
const start = html.indexOf('function normalizeReplenishmentFormula');
const end = html.indexOf('function replenishmentFormulaDisplay');
assert.ok(start >= 0 && end > start, 'replenishment formula functions should exist');

const api = new Function(
  'var replenishmentFormulaEvaluators = Object.create(null);\n' +
  html.slice(start, end) +
  '\nreturn { evaluateReplenishmentFormula, replenishmentFormulaEvaluators };'
)();

const values = { daily1: 2, daily7: 10, daily14: 20, daily28: 30 };
assert.equal(api.evaluateReplenishmentFormula('daily7*0.7+daily14*0.3', values), 13);
assert.equal(api.evaluateReplenishmentFormula('daily7*0.7+daily14*0.3', values), 13);
assert.equal(Object.keys(api.replenishmentFormulaEvaluators).length, 1, 'same formula should compile once');
assert.throws(() => api.evaluateReplenishmentFormula('daily7+unknown', values), /未知字段/);

['outboundTotal1', 'outboundTotal7', 'outboundTotal14', 'outboundTotal28'].forEach(key => {
  assert.match(html, new RegExp("key: '" + key + "'"), key + ' should be selectable');
});
assert.match(html, /outboundTotal7:\s*replenishmentResultText\(metrics\.outbound7, 0\)/, '7-day total should not be divided');
assert.match(html, /await replenishmentInputSavePromise/, 'export should wait for the pending input save');
assert.match(html, /replenishmentRenderCache \? replenishmentRenderCache\.maps/, 'export should reuse the rendered page data');

console.log('replenishment performance checks passed');
