const fs = require('node:fs');
const assert = require('node:assert/strict');

const html = fs.readFileSync('tools/JD/data-analysis.html', 'utf8');

assert.match(html, /data-gross-margin-panel="import">数据导入<\/button>[\s\S]*data-gross-margin-panel="gift">赠品规则<\/button>[\s\S]*data-gross-margin-panel="dashboard">数据看板<\/button>[\s\S]*data-gross-margin-panel="filter">数据筛选<\/button>/, 'gross-margin tabs should follow the requested workflow');
assert.match(html, /id="grossMarginGiftPane"[\s\S]*id="financeGiftRulesSection"/, 'gift rules should have an independent pane');
assert.match(html, /id="financeGiftHideZeroSales"/, 'gift rules should allow zero-sales rows to be hidden');
assert.match(html, /!financeGiftHideZeroSales \|\| Number\(row\.financeSalesQty\) > 0/, 'zero-sales filtering should respect the toggle');
assert.match(html, /赠品与配件规则可在导入完成后的“赠品规则”标签页详细设置/, 'matched preset dialog should direct users to gift rules');
assert.match(html, /id="grossMarginDashboardDatePickerField"/, 'dashboard should expose its own date range picker');
assert.match(html, /datePickers\.grossMarginDashboard \? datePickers\.grossMarginDashboard\.getRange\(\)/, 'dashboard rows should use the visible dashboard date range');
assert.match(html, /var date = range\.startDate/, 'gross-margin imports should use dates from workbook rows');
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
