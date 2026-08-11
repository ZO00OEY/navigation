const assert = require('assert');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'tools', 'JD', 'data-analysis.html'), 'utf8');

assert(html.includes('async function rebuildGeneratedEstimatesForSkus(skus)'), 'missing estimate rebuild');
assert(html.includes("await rebuildGeneratedEstimatesForSkus([sku]);"), 'growth changes must rebuild estimates');
assert(html.includes("await rebuildGeneratedEstimatesForSkus(parsedRows.map(function(row) { return row.sku; }));"), 'ranking changes must rebuild estimates');
assert(html.includes("candidate.generatedBy !== 'estimate_algorithm'"), 'imported estimate anchors must be preserved');
assert(html.includes("estimateAutoAttemptedKeys = {};"), 'rebuild must invalidate prior auto-generation attempts');
assert(html.includes('await repairStoredCompetitorEstimatesOnce();'), 'existing stale estimates must be repaired once');

const previous = { min: 322.56, max: 392 };
const coefficient = { min: 1, max: 1.02 };
const query = { min: 200, max: 400 };
const predicted = {
  min: previous.min * coefficient.min,
  max: previous.max * coefficient.max
};
assert(Math.abs(predicted.min - 322.56) < 1e-9);
assert(Math.abs(predicted.max - 399.84) < 1e-9);
assert.deepStrictEqual({
  min: Math.max(predicted.min, query.min),
  max: Math.min(predicted.max, query.max)
}, predicted);

console.log('competitor estimate rebuild checks passed');
