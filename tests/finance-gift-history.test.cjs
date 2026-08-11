const fs = require('node:fs');
const assert = require('node:assert/strict');

const html = fs.readFileSync('tools/JD/data-analysis.html', 'utf8');

assert.match(html, /id="financeGiftHistoryRange"/, 'history month selector should exist');
assert.match(html, /id="importFinanceGiftHistoryBtn"/, 'history import button should exist');
assert.match(html, /id="importFinanceGiftHistoryBtn"[^>]*>导入过往配置<\/button>[\s\S]*id="financeGiftHistoryRange"/, 'import button should appear before the plain-text range selector');
assert.match(html, /function importFinanceGiftHistory\(\)/, 'history import handler should exist');
assert.doesNotMatch(html, /rule\.sourceType === 'gift_accessory_rule' && rule\.startDate/, 'legacy rules without sourceType should remain importable');
assert.match(html, /return rule\.sku && rule\.startDate && rule\.endDate && rule\.endDate < query\.start;/, 'history ranges should not require non-empty accessory arrays');
assert.match(html, /row\.sourceType === 'finance_gross_margin' && row\.startDate/, 'imported finance months should also populate history choices');
assert.match(html, /rule\.startDate >= parts\[0\] && rule\.endDate <= parts\[1\]/, 'legacy rules within the selected month should be importable');
assert.match(html, /Number\(row\.financeSalesQty\) > 0 \|\| \(row\.accessories \|\| \[\]\)\.length \|\| \(row\.gifts \|\| \[\]\)\.length/, 'imported rules should remain visible without current-month finance data');

console.log('finance gift history checks passed');
