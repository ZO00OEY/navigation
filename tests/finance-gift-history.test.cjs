const fs = require('node:fs');
const assert = require('node:assert/strict');

const html = fs.readFileSync('tools/JD/data-analysis.html', 'utf8');

assert.match(html, /data-gross-margin-panel="import">数据导入与核对<\/button>[\s\S]*data-gross-margin-panel="algorithm">毛保算法<\/button>[\s\S]*data-gross-margin-panel="dashboard">数据看板<\/button>[\s\S]*data-gross-margin-panel="filter">数据筛选<\/button>/, 'finance tabs should expose one import workflow');
assert.doesNotMatch(html, /data-gross-margin-panel="auto"|data-gross-margin-panel="manual"|>自动计算模式<|>手动标记模式</, 'automatic and manual modes should be removed');
assert.match(html, /id="grossMarginGiftPane"[\s\S]*id="financeDataImportSection"[\s\S]*id="financeDropZone"/, 'the single finance importer should remain available');
assert.doesNotMatch(html, /id="financeGiftManualPane"|id="financeGiftAutoPane"|id="financeGiftManualOperations"|id="financeGiftAutoOperations"/, 'obsolete mode panes should be removed');
assert.match(html, /function currentFinanceGiftMode\(\) \{[\s\S]*return 'direct';/, 'imports should use the direct workflow');
assert.match(html, /if \(syncedFinanceRange\) \{[\s\S]*await recalculatePendingFinanceOrders\(\);/, 'successful imports should calculate and persist without a mode dialog');

assert.match(html, /function renderGrossMarginDashboardOutput\(\)[\s\S]*loadGrossMarginDashboardCustomFields\(\)[\s\S]*loadGrossMarginDashboardTemplateWorkbookFromDb\(\)[\s\S]*buildGrossMarginDashboardWorkbook\(\)[\s\S]*renderGrossMarginDashboardPreview/, 'the dashboard should rebuild from current database rows on every render');
assert.match(html, /onChange: renderGrossMarginDashboardOutput/, 'changing the dashboard month should trigger a live database refresh');
assert.match(html, /if \(panel === 'dashboard'\) await renderGrossMarginDashboardOutput\(\)/, 'opening the dashboard should trigger a live database refresh');
assert.match(html, /grossMarginDashboardHideZeroSales[\s\S]*await renderGrossMarginDashboardOutput\(\)/, 'dashboard filtering should rebuild live data');
assert.match(html, /grossMarginDashboardActiveSheet = loaded\.workbook\.SheetNames\.indexOf\('模板'\) !== -1 \? '模板'/, 'an imported dashboard should default to its template sheet');
assert.match(html, /datePickers\.grossMarginDashboard \? datePickers\.grossMarginDashboard\.getRange\(\)/, 'dashboard rows should use the visible dashboard date range');
assert.match(html, /function refreshGrossMarginDashboardPreviewWorkbook\(\)[\s\S]*buildGrossMarginDashboardWorkbook\(\)[\s\S]*upsertPreviewSheet/, 'an imported template should receive rebuilt live data sheets');
assert.match(html, /applyReportTemplateFormulas\(preview, '模板'\)/, 'dashboard template formulas should be recalculated after live sheets are replaced');

assert.match(html, /<script src="gross-margin-orders\.js"><\/script>/, 'order compaction module should load before page logic');
assert.match(html, /key: 'orderId', label: '订单编号'[\s\S]*不长期保存订单编号/, 'order ids should remain transient import fields');
assert.match(html, /JDGrossMarginOrders\.createSession[\s\S]*订单编号/, 'large finance files should still be compacted by order');
assert.doesNotMatch(html, /put\([^\n]*orderId/, 'order ids must not be persisted');

console.log('finance dashboard live-refresh checks passed');
