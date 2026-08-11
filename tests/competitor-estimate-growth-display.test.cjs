const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const source = fs.readFileSync(path.join(__dirname, '..', 'tools', 'JD', 'data-analysis.html'), 'utf8');

assert.match(source, /<th>金额区间<\/th><th>金额增长率<\/th><th>件数区间<\/th><th>件数增长率<\/th>/);
assert.match(source, /rankingGrowthValue\(ranking, 'amountGrowthRate', 'amountGrowthRateRaw'\)/);
assert.match(source, /rankingGrowthValue\(ranking, 'qtyGrowthRate', 'qtyGrowthRateRaw'\)/);
assert.match(source, /estimateViewMode === 'product' \? 9 : 8/);

console.log('competitor estimate growth display tests passed');
