const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'tools', 'JD', 'data-analysis.html'), 'utf8');
const sharedJs = fs.readFileSync(path.join(__dirname, '..', 'guides', 'shared.js'), 'utf8');
const sharedCss = fs.readFileSync(path.join(__dirname, '..', 'guides', 'shared.css'), 'utf8');
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
assert.match(html, /outboundTotal7:\s*metricFlags\.outboundTotal7 \? replenishmentResultText\(metrics\.outbound7, 0\)/, '7-day total should only be formatted when visible and should not be divided');
assert.match(html, /forecastDailySales = metricFlags\.outboundFormula \|\| metricFlags\.availableFormula \?/, 'forecast should only be calculated when a dependent metric is visible');
assert.match(html, /purchaseAmount = metricFlags\.purchaseAmount \? replenishmentPurchaseAmount/, 'purchase amount should only be calculated when visible');
assert.match(html, /if \(!replenishmentRenderCache\) output\.innerHTML = '<div class="replenishment-empty">正在计算补货结果…<\/div>';/, 'recalculation should keep the current results mounted to preserve scroll position');
assert.match(html, /await replenishmentInputSavePromise/, 'export should wait for the pending input save');
assert.match(html, /replenishmentRenderCache \? replenishmentRenderCache\.maps/, 'export should reuse the rendered page data');
assert.match(html, /if \(scope === 'inventoryTurnover'\) return index < 4 \? 120 : 180;/, 'inventory detail should not scan rendered rows for auto column widths');
assert.match(html, /if \(scope !== 'inventoryTurnover'\) addTableCellTitles\(table\);/, 'inventory detail should not add titles to every cell on large tables');
assert.match(html, /function renderReplenishmentVirtualWindow\(customTab\)/, 'replenishment results should render through the virtual window');
assert.doesNotMatch(html, /output\.innerHTML = visibleSkus\.map/, 'replenishment results should not render every SKU block at once');
assert.match(html, /window\.addEventListener\('scroll', scheduleReplenishmentVirtualWindow, \{ passive: true \}\)/, 'replenishment virtual window should update on scroll without blocking it');
assert.match(html, /Math\.floor\(\(viewportTop - outputTop\) \/ step\) - 1/, 'replenishment virtual window should only render one item above the viewport');
assert.match(html, /Math\.ceil\(\(viewportBottom - outputTop\) \/ step\) \+ 1/, 'replenishment virtual window should only render one item below the viewport');
assert.match(html, /if \(start === replenishmentVirtualState\.start && end === replenishmentVirtualState\.end && !replenishmentVirtualState\.openMetricSku\) return;/, 'replenishment scrolling should not rebuild DOM when the visible window is unchanged');
assert.match(html, /refreshReplenishmentBtn[\s\S]*refillAutomaticReplenishment\(true\)/, 'replenishment refresh should force recalculation and ignore manual quantities');
assert.match(html, /refreshInventoryTransferBtn[\s\S]*clearReplenishmentManualQuantities\('transfer'\)[\s\S]*renderInventoryTransferCalculator/, 'transfer refresh should clear manual transfer quantities before recalculation');
assert.match(html, /clearInventoryTurnoverData[\s\S]*clearReplenishmentManualQuantities\(\)[\s\S]*saveReplenishmentState/, 'clearing inventory should also clear manual replenishment and transfer quantities');
assert.match(html, /function updateReplenishmentSkuDisplays\(sku\)/, 'manual replenishment changes should update SKU displays');
assert.match(html, /data-replenishment-purchase-amount/, 'SKU purchase amount should have a targeted update hook');
assert.match(html, /block\.outerHTML = renderReplenishmentSkuBlock/, 'saving custom replenishment quantities should refresh SKU amount and turnover displays');
assert.match(html, /if \(!isTransfer\) updateReplenishmentSkuDisplays\(sku\);/, 'saving custom replenishment quantities should refresh visible SKU values immediately');
assert.match(html, /jdDisableFireworks/, 'JD tool should persist the mouse effect toggle');
assert.match(html, /disableFireworksToggle/, 'JD tool sidebar should expose a mouse effect toggle');
assert.match(html, /localStorage\.getItem\('jdDisableFireworks'\)!=='false'/, 'JD tool should disable mouse effects by default');
assert.match(sharedJs, /data-fireworks'\) === 'off'\) return/, 'shared fireworks should respect page-level disable flag');
assert.match(sharedCss, /\[data-fireworks="off"\] body \{ cursor: auto; \}/, 'mouse effect toggle should restore the default cursor');

const amountStart = html.indexOf('function inventoryStockAmounts');
const amountEnd = html.indexOf('function addInventoryWarehouse', amountStart);
const inventoryStockAmounts = new Function(
  'replenishmentNumber',
  'replenishmentInventoryMetrics',
  html.slice(amountStart, amountEnd) + '\nreturn inventoryStockAmounts;'
)(value => value === '' || value == null ? '' : Number(value), row => row.metrics);
assert.deepEqual(inventoryStockAmounts([
  { nationalPurchasePrice: 10, metrics: { spotStock: 2, orderableStock: 3 } },
  { nationalPurchasePrice: 4, metrics: { spotStock: 5, orderableStock: 6 } },
  { nationalPurchasePrice: '', metrics: { spotStock: 99, orderableStock: 99 } }
]), { spot: 40, orderable: 54 }, 'inventory amounts should use national purchase price and skip missing prices');

console.log('replenishment performance checks passed');
