const assert = require('node:assert/strict');
const vm = require('node:vm');
const fs = require('node:fs');

const html = fs.readFileSync('tools/JD/data-analysis.html', 'utf8');

function functionSource(name) {
  const asyncStart = html.indexOf(`async function ${name}(`);
  const start = asyncStart === -1 ? html.indexOf(`function ${name}(`) : asyncStart;
  assert.notEqual(start, -1, `missing ${name}`);
  const body = html.indexOf('{', start);
  let depth = 0;
  for (let i = body; i < html.length; i += 1) {
    if (html[i] === '{') depth += 1;
    if (html[i] === '}' && --depth === 0) return html.slice(start, i + 1);
  }
  throw new Error(`unterminated ${name}`);
}

const context = {
  REPLENISHMENT_METRIC_OPTIONS: [{ key: 'purchaseAmount', label: '采购金额' }, { key: 'spotStock', label: '现货库存' }, { key: 'purchasePending', label: '采购未到货' }, { key: 'orderableStock', label: '可订购库存' }, { key: 'outboundFormula', label: '预测' }, { key: 'outbound1', label: '1天' }, { key: 'outbound7', label: '7天' }, { key: 'outbound14', label: '14天' }, { key: 'outbound28', label: '28天' }, { key: 'availableFormula', label: '预测' }, { key: 'available1', label: '1天' }, { key: 'currentOrderable', label: '可订购' }, { key: 'currentSpot', label: '现货' }],
  REPLENISHMENT_METRIC_GROUPS: [{ label: '金额', keys: ['purchaseAmount'] }, { label: '库存数量', keys: ['spotStock', 'purchasePending', 'orderableStock'] }, { label: '出库数量', keys: ['outboundFormula', 'outbound1', 'outbound7', 'outbound14', 'outbound28'] }, { label: '补货后周转', keys: ['availableFormula', 'available1'] }, { label: '当前周转', keys: ['currentOrderable', 'currentSpot'] }],
  REPLENISHMENT_FORMULA_PRESETS: [{ key: 'balanced', formula: 'daily7*0.7+daily14*0.3' }],
  replenishmentState: {
    autoFillMode: 'raw',
    orderableTurnoverDimension: '1',
    spotTurnoverDimension: '1',
    defaultTurnover: 21,
    recommendFormula: 'daily7*0.7+daily14*0.3',
    transferFormula: 'daily1*0.5+daily7*0.5',
    skus: ['sku'],
    transferIncludeLowWarehouse: true,
    plans: { sku: { targetTurnover: '', expectedReplenishment: { A: 99 }, manualExpected: { A: true } } }
  },
  skuColumnLabels: { layer: '夹层' },
  inventoryWarehouses: ['A', 'B'],
  inventorySkuProfileMap: { sku: { shortName: '商品简称' } },
  skuFilterState: { own: {}, competitor: {} },
  replenishmentDataMaps: async () => ({ profileMap: { sku: { casePack: 6 } }, inventoryMap: { sku: { A: { recommended: 10 }, B: { recommended: 20 } } } }),
  replenishmentWarehouses: () => ['全国', 'A', 'B'],
  replenishmentNumber: value => value === '' ? '' : Number(value),
  replenishmentSignedNumber: value => value === '' || value == null ? '' : Number(value),
  inventoryMetricText: (value, decimals) => Number(value).toLocaleString('zh-CN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals }),
  sanitizeInventorySkus: value => value,
  normalizeSkuValue: value => value,
  safeReplenishmentFormula: value => value || 'daily7',
  replenishmentCasePack: profile => ({ value: profile.casePack }),
  replenishmentInventoryMetrics: (row, warehouse) => row[warehouse] || {},
  replenishmentRecommendedQuantity: metrics => metrics.recommended,
  replenishmentBoxized: (value, size) => Math.round(value / size) * size,
  saveReplenishmentState: async () => {},
  evaluateReplenishmentFormula: () => 0
};
context.esc = value => String(value);
context.textPixelEstimate = value => String(value).length * 10;
context.replenishmentFormulaDisplay = value => String(value);
context.normalizeReplenishmentFormula = value => String(value).replace(/\s+/g, '');
context.replenishmentPlanFor = sku => context.replenishmentState.plans[sku];
vm.createContext(context);
vm.runInContext([
  'replenishmentNumber',
  'replenishmentDailyAverage',
  'replenishmentCurrentTurnover',
  'replenishmentTurnoverClass',
  'replenishmentFormulaPreset',
  'replenishmentFormulaOptionsHtml',
  'replenishmentInputHtml',
  'replenishmentExpected',
  'replenishmentPurchaseAmount',
  'replenishmentPurchaseAmountText',
  'replenishmentTotalPurchaseAmount',
  'replenishmentExportAoa',
  'replenishmentHasExportDemand',
  'replenishmentDimensionOptionsHtml',
  'replenishmentMetricOptionsHtml',
  'replenishmentSkuMetricOptions',
  'replenishmentSkuNameRowsHtml',
  'skuLookupCardWidth',
  'replenishmentVisibleMetrics',
  'sanitizeReplenishmentCustomTabs',
  'replenishmentCustomTabMatches',
  'replenishmentCustomTabSkus',
  'replenishmentNeedsReplenishment',
  'inventoryTransferHasBWarehouse',
  'inventoryTransferWarehouses',
  'inventoryTransferBalance',
  'isSkuFilterColumn',
  'skuFilterValues',
  'filterSkuRows',
  'sanitizeReplenishmentMetrics',
  'sanitizeReplenishmentState',
  'refillAutomaticReplenishment'
].map(functionSource).join('\n'), context);

assert.equal(context.replenishmentCurrentTurnover({ orderableStock: 140, outbound7: 70 }, 'orderableStock', '7'), 14);
assert.equal(context.replenishmentTurnoverClass(10, 21), ' is-turnover-low');
assert.equal(context.replenishmentTurnoverClass(21, 21), ' is-turnover-fit');
assert.equal(context.replenishmentTurnoverClass(30, 21), ' is-turnover-high');
assert.deepEqual(Array.from(context.sanitizeReplenishmentMetrics(['normalizedExpected'])), ['currentOrderable']);
assert.deepEqual(Array.from(context.sanitizeReplenishmentMetrics(['recommended'])), []);
context.replenishmentState.visibleMetrics = ['spotStock', 'available1'];
assert.deepEqual(Array.from(context.replenishmentVisibleMetrics({ metricOverrides: { spotStock: false, outbound7: true } })), ['outbound7', 'available1']);
context.replenishmentState.visibleMetrics = context.REPLENISHMENT_METRIC_OPTIONS.map(item => item.key);
assert.equal(context.sanitizeReplenishmentState({}).autoFillMode, 'raw');
assert.equal(context.sanitizeReplenishmentState({}).transferIncludeLowWarehouse, true);
assert.equal(context.sanitizeReplenishmentState({ transferIncludeLowWarehouse: false }).transferIncludeLowWarehouse, false);
assert.equal(context.sanitizeReplenishmentState({ visibleMetrics: ['spotStock'] }).visibleMetrics[0], 'purchaseAmount');
assert.deepEqual(Array.from(context.sanitizeReplenishmentState({ visibleMetrics: ['spotStock'], displayRulesVersion: 1 }).visibleMetrics), ['spotStock']);
const migratedMetrics = context.sanitizeReplenishmentState({
  visibleMetrics: ['spotStock', 'available1'],
  plans: { sku: { visibleMetrics: ['spotStock', 'outbound7'] } }
}).plans.sku.metricOverrides;
assert.deepEqual(JSON.parse(JSON.stringify(migratedMetrics)), { outbound7: true, available1: false });
assert.equal(context.sanitizeReplenishmentState({ spotTurnoverDimension: '7' }).spotTurnoverDimension, '1');
assert.equal(context.sanitizeReplenishmentState({ orderableTurnoverDimension: '14', spotTurnoverDimension: '28' }).spotTurnoverDimension, '28');
assert.equal(context.replenishmentFormulaPreset('daily7 * 0.7 + daily14 * 0.3').key, 'balanced');
assert.match(context.replenishmentFormulaOptionsHtml('recommendFormula'), /active[^>]*data-replenishment-formula-choice="balanced"/);
assert.match(context.replenishmentFormulaOptionsHtml('transferFormula'), /active[^>]*data-replenishment-formula-choice="custom"[^>]*>自定义（daily1\*0\.5\+daily7\*0\.5）/);
assert.match(context.replenishmentInputHtml('sku', 'A', 'expectedReplenishment', 12, '0', false), /type="text" inputmode="decimal"/);
assert.match(context.replenishmentInputHtml('sku', 'A', 'expectedReplenishment', 12, '0', false), /replenishment-copy-value" aria-hidden="true">12<\/span>/);
assert.match(context.replenishmentInputHtml('sku', 'A', 'expectedReplenishment', 0, '', false), /value=""/);
assert.doesNotMatch(context.replenishmentInputHtml('sku', '', 'targetTurnover', 21, '', false), /replenishment-copy-value/);
assert.match(context.replenishmentMetricOptionsHtml(['spotStock', 'orderableStock'], ''), /库存[\s\S]*data-replenishment-metric="spotStock"[\s\S]*checked[\s\S]*data-replenishment-metric="purchasePending"[\s\S]*data-replenishment-metric="orderableStock"[\s\S]*checked/);
assert.match(context.replenishmentMetricOptionsHtml(['availableFormula', 'available1'], ''), /补货后周转[\s\S]*data-replenishment-metric="availableFormula"[\s\S]*data-replenishment-metric="available1"/);
assert.match(context.replenishmentMetricOptionsHtml(['outboundFormula', 'outbound7'], ''), /出库[\s\S]*data-replenishment-metric="outboundFormula"[\s\S]*data-replenishment-metric="outbound7"/);
assert.match(context.replenishmentMetricOptionsHtml(['currentSpot'], 'sku'), /当前周转[\s\S]*data-replenishment-sku-metric="currentSpot"[\s\S]*checked/);
assert.match(context.replenishmentMetricOptionsHtml(['currentSpot'], 'sku', { currentSpot: true }), /class="is-custom"[^>]*>[\s\S]*data-replenishment-sku-metric="currentSpot"/);
const lazyMetricMenu = context.replenishmentSkuMetricOptions('sku', { metricOverrides: {} });
assert.match(lazyMetricMenu, /data-replenishment-sku-metric-menu="sku"/);
assert.doesNotMatch(lazyMetricMenu, /data-replenishment-sku-metric="/);
assert.match(lazyMetricMenu, /aria-label="设置显示指标"[\s\S]*<svg/);
assert.doesNotMatch(lazyMetricMenu, /显示指标 ·|跟随默认|自定义/);
assert.match(context.replenishmentMetricOptionsHtml(['currentSpot'], ''), /当前周转[\s\S]*data-current-turnover-dimension="7"/);
assert.match(context.replenishmentMetricOptionsHtml(['currentSpot'], ''), /现货<\/label><span class="replenishment-current-dimension"[\s\S]*1天<\/button>\/</);
assert.match(context.replenishmentMetricOptionsHtml(['currentOrderable'], ''), /可订购<\/label><span class="replenishment-current-dimension"/);
assert.doesNotMatch(context.replenishmentMetricOptionsHtml(['currentSpot'], ''), /建议补货数/);
assert.doesNotMatch(context.replenishmentMetricOptionsHtml(['currentSpot'], 'sku'), /data-current-turnover-dimension/);
assert.match(context.replenishmentSkuNameRowsHtml(['sku', 'missing'], { sku: { shortName: '商品简称' } }, 1), /（商品简称）[\s\S]*is-editing/);
assert.equal(context.skuLookupCardWidth('sku', context.inventorySkuProfileMap), 240);
assert.equal(context.skuLookupCardWidth('1234567890123', { 1234567890123: { shortName: '这是一个足够长的商品简称用于自动放宽' } }), 384);
const customTab = context.sanitizeReplenishmentCustomTabs([{ id: 'x', name: ' 鲲鹏 ', mainSeries: ['北通'], subSeries: ['鲲鹏20'], skus: ['extra'] }])[0];
assert.equal(customTab.exclusive, true);
assert.equal(context.sanitizeReplenishmentCustomTabs([{ name: '保留基础页', exclusive: false }])[0].exclusive, false);
assert.equal(context.replenishmentCustomTabMatches(customTab, 'seriesSku', { mainSeries: '北通', subSeries: '鲲鹏20' }), true);
assert.equal(context.replenishmentCustomTabMatches(customTab, 'wrongSku', { mainSeries: '北通', subSeries: '鲲鹏40' }), false);
assert.equal(context.replenishmentCustomTabMatches(customTab, 'extra', { mainSeries: '其它', subSeries: '其它' }), true);
assert.deepEqual(
  Array.from(context.replenishmentCustomTabSkus(customTab, ['seriesSku', 'wrongSku', 'extra'], {
    seriesSku: { mainSeries: '北通', subSeries: '鲲鹏20' },
    wrongSku: { mainSeries: '北通', subSeries: '鲲鹏40' },
    extra: { mainSeries: '其它', subSeries: '其它' }
  })),
  ['seriesSku', 'extra']
);
assert.equal(context.replenishmentNeedsReplenishment({ A: { recommended: 0 }, B: { recommended: 0 } }, ['全国', 'A', 'B'], 21), false);
assert.equal(context.replenishmentNeedsReplenishment({ A: { recommended: 0 }, B: { recommended: 2 } }, ['全国', 'A', 'B'], 21), true);
assert.equal(context.replenishmentNeedsReplenishment({}, ['全国', 'A', 'B'], 21), false);
context.replenishmentState.autoFillMode = 'boxized';
assert.equal(context.replenishmentNeedsReplenishment({ A: { recommended: 20 } }, ['全国', 'A'], 21, 100), false);
assert.equal(context.replenishmentNeedsReplenishment({ A: { recommended: 60 } }, ['全国', 'A'], 21, 100), true);
context.replenishmentState.autoFillMode = 'raw';
assert.equal(context.replenishmentHasExportDemand({ expectedReplenishment: { A: 0, B: '' } }, ['全国', 'A', 'B']), false);
assert.equal(context.replenishmentHasExportDemand({ expectedReplenishment: { A: 0, B: 12 } }, ['全国', 'A', 'B']), true);
context.replenishmentInventoryMetrics = (row, warehouse) => warehouse === 'B仓' ? row.bWarehouse || {} : row[warehouse] || {};
assert.deepEqual(Array.from(context.inventoryTransferWarehouses({ bWarehouse: { orderableStock: 10, outbound7: 7 } })), ['B仓', 'A', 'B']);
assert.deepEqual(Array.from(context.inventoryTransferWarehouses({ bWarehouse: { orderableStock: 0, outbound7: 0 } })), ['A', 'B']);
context.replenishmentState.transferIncludeLowWarehouse = false;
assert.deepEqual(Array.from(context.inventoryTransferWarehouses({ bWarehouse: { orderableStock: 10, outbound7: 7 } })), ['A', 'B']);
context.replenishmentState.transferIncludeLowWarehouse = true;
const balancedWarehouses = [{ orderable: 100, dailySales: 10 }, { orderable: 20, dailySales: 10 }];
assert.equal(context.inventoryTransferBalance(balancedWarehouses), 6);
assert.deepEqual(Array.from(balancedWarehouses, item => item.transferQuantity), [-40, 40]);
assert.deepEqual(Array.from(balancedWarehouses, item => item.afterTurnover), [6, 6]);
assert.equal(balancedWarehouses.reduce((total, item) => total + item.transferQuantity, 0), 0);
assert.equal(context.replenishmentPurchaseAmount({ expectedReplenishment: { A: 10, B: 20 } }, { nationalPurchasePrice: 12.5 }, ['全国', 'A', 'B']), 375);
assert.equal(context.replenishmentPurchaseAmount({ expectedReplenishment: { A: 0 } }, { nationalPurchasePrice: 12.5 }, ['全国', 'A']), '');
context.replenishmentState.plans.other = { expectedReplenishment: { A: 5 }, manualExpected: {}, metricOverrides: {} };
assert.equal(context.replenishmentTotalPurchaseAmount(['sku', 'other'], { sku: { nationalPurchasePrice: 2 }, other: { nationalPurchasePrice: 4 } }, ['全国', 'A']), 218);
assert.equal(context.replenishmentPurchaseAmountText(1234.5), '¥1,234.50');
assert.equal(context.isSkuFilterColumn('mainSeries', '大系列'), true);
assert.equal(context.isSkuFilterColumn('layer', '夹层'), true);
context.skuFilterState.own = { mainSeries: ['A', 'B'], layer: ['上层'] };
assert.deepEqual(
  Array.from(context.filterSkuRows('own', [{ mainSeries: 'A', layer: '上层' }, { mainSeries: 'B', layer: '下层' }, { mainSeries: 'C', layer: '上层' }], [{ key: 'mainSeries', label: '大系列' }, { key: 'layer', label: '夹层' }])),
  [{ mainSeries: 'A', layer: '上层' }]
);
assert.deepEqual(
  Array.from(context.filterSkuRows('own', [{ mainSeries: 'A', layer: '上层' }, { mainSeries: 'B', layer: '下层' }, { mainSeries: 'C', layer: '上层' }], null, 'layer')),
  [{ mainSeries: 'A', layer: '上层' }, { mainSeries: 'B', layer: '下层' }]
);
assert.match(html, /id="replenishmentFormulaOptions"[^>]*role="radiogroup"/);
assert.match(html, /id="inventoryTransferFormulaOptions"[^>]*role="radiogroup"/);
assert.doesNotMatch(html, /id="replenishmentFormulaPresetSelect"/);
assert.match(html, /class="inventory-config-grid"[\s\S]*id="inventorySkuNameLayer"[\s\S]*id="inventoryWarehouseTags"/);
assert.match(html, /id="replenishmentCustomTabs"[\s\S]*id="addReplenishmentTabBtn"/);
assert.match(html, /class="sku-lookup-editor"[\s\S]*data-sku-lookup-name-layer/);
assert.match(html, /\.sku-lookup-grid\s*\{[\s\S]*display: flex;[\s\S]*flex-wrap: wrap;/);
assert.match(html, /\.inventory-sku-textarea\s*\{[\s\S]*padding: 8px 10px;[\s\S]*line-height: var\(--sku-row-height, 22px\) !important;/);
assert.match(html, /\.replenishment-sku-name-row\s*\{[^}]*top: -3px;/);
assert.match(html, /\.sku-lookup-editor \.replenishment-sku-name-row\s*\{[^}]*top: -6px;/);
assert.match(html, /内配计算设置[\s\S]*id="inventoryTransferScopeCount"[\s\S]*id="inventoryTransferSkuNameLayer"[\s\S]*B 仓是否参与内配[\s\S]*id="inventoryTransferIncludeLowWarehouse"[\s\S]*预测规则/);
assert.match(html, /id="exportReplenishmentBtn"[\s\S]*id="replenishmentExportTotal"/);
assert.match(html, /id="replenishmentTabModal"[\s\S]*id="replenishmentTabMainSeries"[\s\S]*id="replenishmentTabSubSeries"[\s\S]*id="replenishmentTabSkuInput"[\s\S]*id="replenishmentTabExclusiveInput"/);
assert.equal((html.match(/replenishment-setting-list replenishment-setting-list--compact/g) || []).length, 4);
assert.match(html, /推荐补货数规则[\s\S]*data-fill-replenishment="raw"[\s\S]*data-fill-replenishment="boxized"/);
assert.match(html, /function replenishmentFormulaOptionsHtml[\s\S]*均衡趋势[\s\S]*近期稳定[\s\S]*长期[\s\S]*自定义（/);
assert.deepEqual(
  Array.from(context.replenishmentExportAoa(['sku'], { sku: { shortName: '商品', materialCode: 'M001' } }, ['全国', 'A', 'B']), row => Array.from(row)),
  [['SKU', '商品简称', '商品编码', '全国', 'A', 'B'], ['sku', '商品', 'M001', 99, 99, '']]
);

(async () => {
  await context.refillAutomaticReplenishment(false);
  assert.deepEqual(context.replenishmentState.plans.sku.expectedReplenishment, { A: 99, B: 20 });
  context.replenishmentState.autoFillMode = 'boxized';
  await context.refillAutomaticReplenishment(true);
  assert.deepEqual(context.replenishmentState.plans.sku.expectedReplenishment, { A: 12, B: 18 });
  assert.equal(Object.keys(context.replenishmentState.plans.sku.manualExpected).length, 0);
  console.log('replenishment settings: ok');
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
