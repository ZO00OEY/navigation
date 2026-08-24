const assert = require('node:assert/strict');
const fs = require('node:fs');
const SupplyChain = require('../tools/JD/supply-chain-analysis.js');
const html = fs.readFileSync('tools/JD/data-analysis.html', 'utf8');

const rows = SupplyChain.parseRows([{ rows: [
  { SKU编码: '汇总', 区域: '', 配送中心: '', 可用库存: 300, 周转天数: 10 },
  { SKU编码: '1001', 区域: '华东', 配送中心: '上海', 可用库存: 100, 采购在途: 8, 周转天数: 10 },
  { SKU编码: '1001', 区域: '华东', 配送中心: '杭州', 可用库存: 40, 周转天数: 20 },
  { SKU编码: '1001', 区域: '华南', 配送中心: '广州', 可用库存: 60, 周转天数: 5 },
  { SKU编码: '1001', 区域: '华南', 配送中心: '深圳', 可用库存: 0, 周转天数: 0 }
]}]);

assert.equal(rows.length, 4);
assert.equal(rows[0].dailyOutbound, 10);
assert.equal(rows[0].purchaseTransit, 8);
assert.equal(rows[1].purchaseTransit, 0);
const provinceSales = SupplyChain.parseProvinceSales([{ rows: [
  { 城市: '广州市', 成交商品件数: 44 },
  { 城市: '深圳市', 成交商品件数: 32 },
  { 省份: '湖北省', 成交商品件数: 20 }
]}], [
  { warehouse: '广州', region: '华南' },
  { warehouse: '深圳配送中心', region: '华南' }
]);
assert.deepEqual(provinceSales, [
  { province: '广州', region: '华南', defaultWarehouse: '广州', salesQty: 44, skus: [] },
  { province: '深圳', region: '华南', defaultWarehouse: '深圳配送中心', salesQty: 32, skus: [] },
  { province: '湖北', region: '华中', defaultWarehouse: '', salesQty: 20, skus: [] }
]);
assert.deepEqual(SupplyChain.parseDistributionAllocations([{ matrix: [
  ['', '100001', '100002'],
  ['配送中心', '商品一', '商品二'],
  ['北京', 10, 20],
  ['上海', 30, 40]
]}]), [
  { sku: '100001', warehouse: '北京', quantity: 10 },
  { sku: '100002', warehouse: '北京', quantity: 20 },
  { sku: '100001', warehouse: '上海', quantity: 30 },
  { sku: '100002', warehouse: '上海', quantity: 40 }
]);
assert.deepEqual(SupplyChain.parseDistributionAllocations([{ matrix: [
  ['SKU', '北京', '上海'],
  ['100001', 0, ''],
  ['100002', 20, 40]
]}]), [
  { sku: '100001', warehouse: '北京', quantity: 0 },
  { sku: '100001', warehouse: '上海', quantity: 0 },
  { sku: '100002', warehouse: '北京', quantity: 20 },
  { sku: '100002', warehouse: '上海', quantity: 40 }
]);
assert.deepEqual(SupplyChain.parseDistributionAllocations([{ matrix: [
  ['批次', '备注', '100001', '100002'],
  ['序号', '仓库名称', '商品一', '商品二'],
  [1, '北京', 10, 20],
  [2, '上海', 30, 40]
]}]), [
  { sku: '100001', warehouse: '北京', quantity: 10 },
  { sku: '100002', warehouse: '北京', quantity: 20 },
  { sku: '100001', warehouse: '上海', quantity: 30 },
  { sku: '100002', warehouse: '上海', quantity: 40 }
]);
assert.equal(SupplyChain.provinceRegion('成都市'), '西南');
assert.equal(SupplyChain.provinceRegion('海淀区'), '华北');
assert.equal(SupplyChain.provinceRegion('山东省'), '华北');
assert.equal(SupplyChain.provinceRegion('青岛市'), '华北');
assert.equal(SupplyChain.provinceRegion('江西省'), '华中');
assert.equal(SupplyChain.provinceRegion('南昌市'), '华中');
assert.equal(SupplyChain.provinceRegion('福建省'), '华南');
assert.equal(SupplyChain.provinceRegion('厦门市'), '华南');
assert.equal(SupplyChain.provinceRegion('新西兰'), '未划分');
assert.equal(SupplyChain.provinces().filter(item => item.region === '华南').some(item => item.province === '广东'), true);
assert.deepEqual(SupplyChain.allocateByShare([{ salesQty: 50 }, { salesQty: 30 }, { salesQty: 20 }], 11), [6, 3, 2]);
assert.equal(SupplyChain.allocateByShare([{ salesQty: 1 }, { salesQty: 1 }, { salesQty: 1 }], 10).reduce((sum, value) => sum + value, 0), 10);
assert.deepEqual(SupplyChain.allocateByGroup([{ salesQty: 50 }, { salesQty: 30 }, { salesQty: 20 }], 58, 5), [30, 15, 10]);
assert.equal(SupplyChain.allocateByGroup([{ salesQty: 1 }], 4, 5)[0], 0);
const turnoverAllocation = SupplyChain.allocateStockByTurnover([
  { availableStock: -10, dailyOutbound: 2 },
  { availableStock: 0, dailyOutbound: 1 },
  { availableStock: 99, dailyOutbound: 0 }
], 20);
assert.equal(turnoverAllocation.reduce((sum, value) => sum + value, 0), 20);
assert.equal(turnoverAllocation[2], 0);
assert.ok(Math.abs((-10 + turnoverAllocation[0]) / 2 - turnoverAllocation[1]) <= 0.5);
const packedAllocation = SupplyChain.allocateStockByTurnoverPack([
  { availableStock: -10, dailyOutbound: 2 },
  { availableStock: 0, dailyOutbound: 1 },
  { availableStock: -3, dailyOutbound: 1 }
], 23, 5);
assert.equal(packedAllocation.reduce((sum, value) => sum + value, 0), 23);
assert.equal(packedAllocation.filter(value => value % 5 !== 0).length, 1);
assert.deepEqual(SupplyChain.warehouseRegions(rows, '2026-08-07'), [
  { warehouse: '上海', region: '华东', updatedAt: '2026-08-07' },
  { warehouse: '杭州', region: '华东', updatedAt: '2026-08-07' },
  { warehouse: '广州', region: '华南', updatedAt: '2026-08-07' },
  { warehouse: '深圳', region: '华南', updatedAt: '2026-08-07' }
]);

const result = SupplyChain.analyze(rows, { '华东\u0000上海': -20 });
assert.equal(result.filter(row => row.region === '华东').reduce((sum, row) => sum + row.regionQuantity, 0), 0);
assert.equal(result.reduce((sum, row) => sum + (Number.isFinite(row.allQuantity) ? row.allQuantity : 0), 0), 0);
assert.equal(result.find(row => row.warehouse === '上海').actualTurnover, 8);
assert.equal(result.find(row => row.warehouse === '上海').actualQuantity, -20);
assert.equal(result.find(row => row.warehouse === '深圳').allQuantity, 0);
assert.equal(result.find(row => row.warehouse === '深圳').regionQuantity, 0);
const rounded = SupplyChain.balance([
  { region: '华北', warehouse: '仓1', availableStock: 1, dailyOutbound: 0.149 },
  { region: '华北', warehouse: '仓2', availableStock: 1, dailyOutbound: 0.149 },
  { region: '华北', warehouse: '仓3', availableStock: 1, dailyOutbound: 0.149 },
  { region: '华北', warehouse: '仓4', availableStock: 1, dailyOutbound: 0.149 },
  { region: '华北', warehouse: '呼和浩特', availableStock: 2, dailyOutbound: 0.004 }
]);
assert.equal(Object.values(rounded.suggestions).reduce((sum, quantity) => sum + quantity, 0), 0);
assert.equal(rounded.suggestions['华北\u0000呼和浩特'], -2);
const routed = SupplyChain.planTransfers([
  { sku: '1001', region: '华北', warehouse: '北京', actualQuantity: -5 },
  { sku: '1001', region: '华北', warehouse: '天津', actualQuantity: 3 },
  { sku: '1001', region: '华南', warehouse: '广州', actualQuantity: -5 },
  { sku: '1001', region: '华南', warehouse: '深圳', actualQuantity: 7 }
]);
assert.deepEqual(routed.transfers.map(item => [item.fromWarehouse, item.toWarehouse, item.quantity, item.scope]), [
  ['北京', '天津', 3, 'region'],
  ['广州', '深圳', 5, 'region'],
  ['北京', '深圳', 2, 'cross-region']
]);
assert.equal(routed.unmatchedOut, 0);
assert.equal(routed.unmatchedIn, 0);
const unbalanced = SupplyChain.planTransfers([
  { sku: '1002', region: '华东', warehouse: '上海', actualQuantity: -2 },
  { sku: '1002', region: '华东', warehouse: '杭州', actualQuantity: 1 }
]);
assert.equal(unbalanced.unmatchedOut, 1);
assert.equal(unbalanced.unmatchedIn, 0);
const equalRegions = SupplyChain.planTransfers([
  { sku: '1003', region: '西南', warehouse: '成都', actualQuantity: -4 },
  { sku: '1003', region: '西北', warehouse: '西安', actualQuantity: 4 },
  { sku: '1003', region: '华东', warehouse: '上海', actualQuantity: -10 },
  { sku: '1003', region: '华中', warehouse: '武汉', actualQuantity: 10 },
  { sku: '1003', region: '东北', warehouse: '沈阳', actualQuantity: -5 },
  { sku: '1003', region: '华南', warehouse: '广州', actualQuantity: 5 }
]);
assert.deepEqual(equalRegions.transfers.map(item => [item.fromRegion, item.toRegion, item.quantity]), [
  ['华东', '华中', 10],
  ['东北', '华南', 5],
  ['西南', '西北', 4]
]);
const summary = SupplyChain.summarize(result);
assert.equal(summary.overall.warehouses, 4);
assert.equal(summary.regions['华东'].allQuantity + summary.regions['华南'].allQuantity, 0);
assert.equal(summary.regions['华东'].actualTurnover, 10);
assert.equal(summary.regions['华东'].actualCount, 1);
const balancedActualSummary = SupplyChain.summarize(SupplyChain.analyze(rows, { '华东\u0000上海': -20, '华东\u0000杭州': 20 }));
assert.equal(balancedActualSummary.regions['华东'].actualQuantity, 0);
assert.equal(balancedActualSummary.regions['华东'].actualCount, 2);
assert.equal(SupplyChain.summarize(SupplyChain.analyze(rows, { '华南\u0000深圳': 0 })).regions['华南'].actualCount, 0);
assert.match(html, /data-page="supply-chain">供应链内配<span class="tab-kicker">07<\/span>/);
assert.match(html, /<section class="tool-page" id="supply-chain">[\s\S]*data-supply-chain-panel="import"[\s\S]*data-supply-chain-panel="analysis"/);
assert.match(html, /id="supplyChainSkuSearch"[\s\S]*id="supplyChainPrevBtn"[\s\S]*id="supplyChainNextBtn"/);
assert.match(html, /supply-chain-toolbar supply-chain-toolbar--compact[\s\S]*id="supplyChainSkuSearch"[\s\S]*supply-chain-pagination[\s\S]*id="supplyChainNextBtn"/);
assert.match(html, /supplyChainSkuSearch'[\s\S]*addEventListener\('click'[\s\S]*this\.showPicker\(\)/);
assert.match(html, /search\.value = '';[\s\S]*search\.placeholder = supplyChainSkuDisplay\(sku\);/);
assert.match(html, /id="supplyChainExpandAllBtn"[\s\S]*id="supplyChainCollapseAllBtn"/);
assert.match(html, /id="supplyChainExpandFilledBtn"[\s\S]*function expandFilledSupplyChainRegions\(\)[\s\S]*supplyChainOnlyFilledSku = sku[\s\S]*filledRegions\.has\(region\)/);
assert.match(html, /id="supplyChainConfiguredToday"[\s\S]*id="supplyChainExportBtn"/);
assert.match(html, /id="supplyChainClearBtn"[\s\S]*function clearSupplyChainTable\(\)[\s\S]*remove\('app_settings', 'supplyChainSnapshot'\)[\s\S]*remove\('app_settings', 'supplyChainActual'\)[\s\S]*remove\('app_settings', 'supplyChainActualDates'\)[\s\S]*addEventListener\('click', clearSupplyChainTable\)/);
assert.match(html, /createObjectStore\('warehouse_region_assignments', \{ keyPath: 'warehouse' \}\)/);
assert.match(html, /function ensureWarehouseRegionStore\(\)[\s\S]*db\.version \+ 1[\s\S]*await ensureWarehouseRegionStore\(\)/);
assert.match(html, /JDSupplyChain\.warehouseRegions\(rows, supplyChainSnapshot\.importedAt\)[\s\S]*put\('warehouse_region_assignments', item\)/);
assert.match(html, /id="supplyChainProvinceDatePickerField"/);
assert.match(html, /key: 'supplyChainProvince'[\s\S]*inputId: 'supplyChainProvinceDateInput'/);
assert.match(html, /data-date-shortcut="7">近7日[\s\S]*data-date-shortcut="30">近30日/);
assert.match(html, /function handleSupplyChainProvinceImportFiles\(files\)[\s\S]*JDSupplyChain\.parseProvinceSales[\s\S]*key: 'supplyChainProvinceSnapshot'/);
assert.match(html, /id="supplyChainProvinceImportModal"[\s\S]*id="supplyChainProvinceSku"[\s\S]*id="supplyChainProvinceDatePickerField"/);
assert.match(html, /pendingSupplyChainProvinceImport = \{ rows: rows, fileName: file\.name \}[\s\S]*classList\.add\('open'\)/);
assert.match(html, /function confirmSupplyChainProvinceImport\(\)[\s\S]*key: 'supplyChainProvinceSnapshots'/);
assert.match(html, /function supplyChainProvinceSku\(value\)[\s\S]*return exact \|\| normalizeSkuValue\(text\);[\s\S]*confirmSupplyChainProvinceImport\(\)[\s\S]*supplyChainProvinceSku\(\$\('supplyChainProvinceSku'\)\.value\)/);
assert.doesNotMatch(html, /单品分析地域销量导入[\s\S]{0,800}<label for="supplyChainProvinceSku">/);
assert.match(html, /data-supply-chain-panel="distribution">各地区销售/);
assert.match(html, /data-supply-chain-panel="reservation">预订与分货/);
assert.match(html, /id="supplyChainReservationPane"[\s\S]*待发货总量[\s\S]*原分货总量[\s\S]*调整后总量[\s\S]*剩余可分配/);
assert.match(html, /库存口径[\s\S]*id="supplyChainReservationStockSourceOptions"/);
assert.match(html, /function supplyChainReservationRows\(sku\)[\s\S]*supplyChainReservationStockSource === 'withTransit'[\s\S]*Number\(row\.purchaseTransit/);
assert.match(html, /SUPPLY_CHAIN_DEFAULT_REGION_WAREHOUSES = \{ 华北: '北京', 东北: '沈阳', 华东: '上海', 华中: '武汉', 华南: '广州', 西南: '成都', 西北: '西安' \}[\s\S]*function supplyChainReservationRows\(sku\)[\s\S]*shippingWarehouses\.has\(row\.warehouse\)/);
assert.match(html, /<th>余量<\/th><th>周转（天）<\/th>/);
assert.match(html, /function supplyChainReservationRows\(sku\)[\s\S]*supplyChainDistributionRows\(latestSales\)[\s\S]*remaining = redistributed \+ stock[\s\S]*turnover: outbound > 0 \? remaining \/ outbound : ''/);
assert.match(html, /function saveSupplyChainRedistribution\(input\)[\s\S]*supplyChainRedistributionQuantities/);
assert.match(html, /id="supplyChainReservationRestoreBtn"[^>]*>恢复分货<\/button>[\s\S]*id="supplyChainReservationAutoBtn"[^>]*>自动分货<\/button>/);
assert.match(html, /<strong>分货设置<\/strong>[\s\S]*supply-chain-reservation-actions[\s\S]*supplyChainReservationRestoreBtn[\s\S]*supplyChainReservationShippingOnlyToggle[\s\S]*supply-chain-distribution-heading[\s\S]*supplyChainReservationExportBtn[\s\S]*supplyChainReservationClearAllBtn/);
assert.match(html, /jdSupplyChainReservationShippingOnly'[\s\S]*!supplyChainReservationShippingOnly \|\| shippingWarehouses\.has\(row\.warehouse\)/);
assert.match(html, /发货用配送中心请在“设置 → 仓配关系档案”中配置/);
assert.match(html, /销量预估依据[\s\S]*id="supplyChainReservationSalesSourceOptions"/);
assert.match(html, /data-supply-chain-reservation-sales-source="province">单品分析地域销量<\/button>[\s\S]*data-supply-chain-reservation-sales-source="inventory">库存周转<\/button>[\s\S]*replenishment-current-dimension/);
assert.doesNotMatch(html, /data-supply-chain-sales-source-link/);
assert.match(html, /supplyChainReservationSalesSource === 'inventory'[\s\S]*replenishmentInventoryMetrics\(inventoryRow, row\.warehouse\)[\s\S]*replenishmentForecastDailySales[\s\S]*outbound' \+ supplyChainReservationSalesPeriod/);
assert.match(html, /jdSupplyChainReservationSalesSource[\s\S]*data-supply-chain-reservation-sales-source/);
assert.match(html, /jdSupplyChainReservationSalesPeriod[\s\S]*data-supply-chain-reservation-sales-period/);
assert.match(html, /jdSupplyChainReservationStockSource[\s\S]*data-supply-chain-reservation-stock-source/);
assert.match(html, /class="supply-chain-overall-summary"><td>全国合计<\/td><td>' \+ rows\.length \+ ' 个配送中心[\s\S]*stockRemainingTotal[\s\S]*turnoverTotal/);
assert.match(html, /function restoreSupplyChainRedistribution\(\)[\s\S]*delete supplyChainRedistributionQuantities\[key\]/);
assert.match(html, /function autoSupplyChainRedistribution\(\)[\s\S]*allocateStockByTurnover\(rows, total\)/);
assert.match(html, /id="supplyChainReservationArchiveCasePack">档案箱规：-<\/small>[\s\S]*id="supplyChainReservationPackAutoBtn"[^>]*>自动分货（最小分货量<\/button>[\s\S]*id="supplyChainReservationCasePackInput"/);
assert.match(html, /function autoSupplyChainRedistributionByPack\(\)[\s\S]*allocateStockByTurnoverPack\(rows, total, pack\)/);
assert.match(html, /id="supplyChainReservationExportBtn"[^>]*>导出分货<\/button>/);
assert.match(html, /id="supplyChainReservationPushBtn"[^>]*>推送到补货计算<\/button>/);
assert.match(html, /id="supplyChainReservationPushModal"[\s\S]*增加合并[\s\S]*直接覆盖/);
assert.match(html, /REPLENISHMENT_STOPPED_TAB_ID = 'stopped_products'[\s\S]*tabs\.unshift\(\{ id: REPLENISHMENT_STOPPED_TAB_ID, name: '停采产品'/);
assert.match(html, /deleteReplenishmentTabBtn'\)\.hidden = !id \|\| id === REPLENISHMENT_STOPPED_TAB_ID[\s\S]*fixedStopped = replenishmentEditingTabId === REPLENISHMENT_STOPPED_TAB_ID/);
assert.match(html, /stoppedSkus = new Set[\s\S]*if \(stoppedSkus\.has\(sku\)\)[\s\S]*plan\.expectedReplenishment\[warehouse\] = 0/);
assert.match(html, /class="sku-jd-link" href="https:\/\/item\.jd\.com\/' \+ encodeURIComponent\(sku\) \+ '\.html"[\s\S]*打开京东商品页/);
assert.match(html, /function skuFilterHtml\(type, key, label, rows\)[\s\S]*筛选：'[\s\S]*placeholder="搜索内容"[\s\S]*counts\[value\][\s\S]*data-sku-filter-only=[\s\S]*仅筛选此项/);
assert.match(html, /sku-filter-popover \.finance-return-filter-only \{ min-height: 26px; height: 26px;/);
assert.match(html, /table-filter-actions \[data-filter-clear\],[\s\S]*\[data-sku-filter-clear\] \{ margin-left: auto; \}/);
assert.match(html, /function filterActionBarHtml\(config\)[\s\S]*aria-label="正序"[\s\S]*aria-label="倒序"[\s\S]*config\.clear[\s\S]*>清除筛选<\/button>/);
assert.match(html, /filterOnly = e\.target\.closest\('\[data-sku-filter-only\]'\)[\s\S]*skuFilterState\[onlyType\][\s\S]*await renderSkus\(\)/);
assert.match(html, /table\.addEventListener\('change', async function\(e\)[\s\S]*data-sku-filter-value[\s\S]*saveSkuFilterState\(\);[\s\S]*await renderSkus\(\)/);
assert.match(html, /if \(filterAll \|\| filterInvert \|\| filterClear \|\| filterSort\)[\s\S]*saveSkuFilterState\(\);[\s\S]*await renderSkus\(\)/);
assert.match(html, /document\.addEventListener\('click', function\(e\) \{[\s\S]*e\.target\.closest\('\[data-sku-filter\]'\)[\s\S]*querySelectorAll\('\[data-sku-filter\]\[open\]'\)[\s\S]*filter\.open = false/);
assert.match(html, /id="supplyChainProvinceMainSeriesFilter"[\s\S]*全部大系列[\s\S]*id="supplyChainProvinceSubSeriesFilter"[\s\S]*全部小系列/);
assert.match(html, /function renderSupplyChainProvinceSales\(\)[\s\S]*profile\.mainSeries[\s\S]*profile\.subSeries[\s\S]*skuOptions\.innerHTML = profiles\.filter/);
assert.match(html, /id="supplyChainSalesSplitModal"[\s\S]*目标仓[\s\S]*拆分数量[\s\S]*恢复全部拆分/);
assert.match(html, /supplyChainSalesSplits\[quantityKey\][\s\S]*warehouseMap\[sourceKey\]\.salesQty -= quantity[\s\S]*warehouseMap\[split\.target\]\.salesQty \+= quantity/);
assert.match(html, /function confirmSupplyChainSalesSplit\(\)[\s\S]*quantity > sourceRow\.salesQty[\s\S]*supplyChainSalesSplits\[key\]\.push[\s\S]*key: 'supplyChainSalesSplits'/);
assert.match(html, /function pushSupplyChainReservations\(\)[\s\S]*expectedReplenishment\[item\.warehouse\][\s\S]*function applySupplyChainReservationPush\(mode\)[\s\S]*mode === 'merge' \? current \+ item\.quantity : item\.quantity[\s\S]*plan\.manualExpected\[item\.warehouse\] = true/);
assert.match(html, /inventorySkuList = sanitizeInventorySkus\(inventorySkuList\.concat\(pushedSkus\)\)[\s\S]*saveInventorySkus\(\)[\s\S]*saveReplenishmentState\(\)/);
assert.match(html, /function exportSupplyChainReservations\(\)[\s\S]*\['SKU', '商品简称'\]\.concat\(warehouses\)[\s\S]*XLSX\.writeFile\(workbook, '分货计划_'/);
assert.match(html, /没有原分货时，可直接手动制定并导出分货计划/);
assert.match(html, /supplyChainReservationExportBtn'\)\.disabled[\s\S]*supplyChainRedistributionQuantities[\s\S]*function exportSupplyChainReservations\(\)[\s\S]*Number\(supplyChainRedistributionQuantities\[key\]\) > 0/);
assert.match(html, /var remaining = shippedTotal > 0 \? shippedTotal - redistributedTotal : ''/);
assert.match(html, /function exportSupplyChainReservations\(\)[\s\S]*\{ wch: 16 \}, \{ wch: 24 \}[\s\S]*Math\.max\(10, Math\.min\(16, Array\.from\(warehouse\)\.length \* 2 \+ 2\)\)[\s\S]*sheet\['!rows'\] = rows\.map[\s\S]*font: \{ name: '微软雅黑', sz: 9[\s\S]*columnIndex === 1 \? 'left' : 'center'/);
assert.match(html, /supplyChainReservationCasePackInput[\s\S]*replenishmentCasePack\(supplyChainProfiles\[sku\]\)\.value/);
assert.match(html, /data-supply-chain-redistribution data-sku=[\s\S]*data-region=[\s\S]*data-warehouse=/);
assert.match(html, /function saveSupplyChainRedistribution\(input\)[\s\S]*input\.getAttribute\('data-sku'\) \+ '\\u0000' \+ input\.getAttribute\('data-region'\) \+ '\\u0000' \+ input\.getAttribute\('data-warehouse'\)/);
assert.match(html, /id="supplyChainReservationClearBtn"[^>]*>删除当前分货<\/button>/);
assert.match(html, /id="supplyChainReservationClearAllBtn"[^>]*>删除所有分货<\/button>/);
assert.match(html, /function clearCurrentSupplyChainReservation\(\)[\s\S]*delete supplyChainImportedAllocations\[key\][\s\S]*delete supplyChainRedistributionQuantities\[key\]/);
assert.match(html, /function clearAllSupplyChainReservations\(\)[\s\S]*supplyChainImportedAllocations = \{\}[\s\S]*supplyChainRedistributionQuantities = \{\}/);
assert.match(html, /id="supplyChainDistributionSkuSearch"[\s\S]*id="supplyChainDistributionPeriod"[\s\S]*id="supplyChainDistributionBody"/);
assert.match(html, /supply-chain-toolbar supply-chain-toolbar--distribution[\s\S]*supplyChainDistributionSkuSearch[\s\S]*supplyChainDistributionPeriod[\s\S]*supplyChainDistributionPrevBtn/);
assert.match(html, /function renderSupplyChainDistribution\(\)[\s\S]*当前周期[\s\S]*supplyChainDistributionWarehouse/);
assert.match(html, /function supplyChainDistributionWarehouse\(row\)[\s\S]*supplyChainProvinceWarehouses\[row\.province\] \|\| regionDefault \|\| row\.defaultWarehouse/);
assert.match(html, /id="supplyChainDistributionExpandAllBtn"[\s\S]*id="supplyChainDistributionCollapseAllBtn"/);
assert.doesNotMatch(html, /id="supplyChainDistributionExpandFilledBtn"/);
assert.match(html, /id="supplyChainDistributionCollapseAllBtn"[^>]*>仅显示配送中心<\/button>/);
assert.match(html, /supply-chain-distribution-table[\s\S]*<colgroup><col style="width:160px"><col style="width:300px">/);
assert.match(html, /分货数量（按最小分组）/);
assert.match(html, /data-supply-chain-distribution-unit\] \{ width: 72px !important; min-width: 72px !important;/);
assert.match(html, /data-supply-chain-distribution-unit[\s\S]*saveSupplyChainDistributionUnit[\s\S]*supplyChainDistributionUnits/);
assert.match(html, /saveSupplyChainDistributionSettings\(\)[\s\S]*delete supplyChainDistributionFinalQuantities\[itemKey\][\s\S]*key: 'supplyChainDistributionFinalQuantities'/);
assert.match(html, /row\.isFinalCustom[\s\S]*row\.isFinalCustom \? ' is-custom' : ''/);
assert.match(html, /function supplyChainDistributionRegion\(row\)[\s\S]*matched \? matched\.region : row\.region/);
assert.match(html, /warehouse === '未设置' \? region \+ '\\u0000' \+ warehouse : warehouse/);
assert.match(html, /id="supplyChainDistributionExportBtn"[\s\S]*id="supplyChainDistributionExportModal"[\s\S]*value="1001"[\s\S]*按产品分组[\s\S]*按配送中心分组/);
assert.match(html, /id="supplyChainDistributionArrivalDate" type="date"/);
assert.match(html, /function exportSupplyChainDistribution\(\)[\s\S]*supplyChainDistributionArrivalDate[\s\S]*arrivalDateValue \? arrivalDateValue\.split\('-'\)[\s\S]*String\(Number\(part\)\)[\s\S]*'\*商品编号'[\s\S]*'采购渠道ID'[\s\S]*'有限预订'[\s\S]*'新增'[\s\S]*item\.warehouse[\s\S]*item\.finalQuantity, arrivalDate[\s\S]*shortName/);
assert.match(html, /group !== nextGroup[\s\S]*new Array\(headers\.length\)\.fill\(''\)/);
assert.match(html, /function exportSupplyChainDistribution\(\)[\s\S]*sheet\['!rows'\] = rows\.map\(function\(\) \{ return \{ hpt: 15 \}; \}\)/);
assert.doesNotMatch(html, /data-supply-chain-distribution-group/);
assert.match(html, /not\(\.supply-chain-distribution-table\)/);
assert.match(html, /function supplyChainDistributionRows\(snapshot\)[\s\S]*warehouseMap\[key\][\s\S]*JDSupplyChain\.allocateByShare[\s\S]*Math\.round\(row\.distributionQuantity \/ distributionUnit\) \* distributionUnit[\s\S]*function renderSupplyChainDistribution\(\)[\s\S]*supplyChainDistributionRows\(current\)[\s\S]*supplyChainDistributionOnlyWarehouses[\s\S]*data-supply-chain-distribution-final[\s\S]*data-supply-chain-distribution-edit-province/);
assert.match(html, /function editSupplyChainDistributionWarehouse\(trigger\)[\s\S]*data-supply-chain-archive-province[\s\S]*prepareSupplyChainArchiveOptions\(input\)/);
assert.doesNotMatch(html, /warehouseNames = regionRows\.map/);
assert.match(html, /function setAllSupplyChainDistributionRegionsCollapsed\(collapsed\)[\s\S]*jdSupplyChainDistributionOnlyWarehouses/);
assert.match(html, /function saveSupplyChainDistributionSettings\(\)[\s\S]*key: 'supplyChainDistributionQuantities'/);
assert.match(html, /function saveSupplyChainDistributionFinal\(input\)[\s\S]*key: 'supplyChainDistributionFinalQuantities'/);
assert.match(html, /id="supplyChainDistributionClearBtn"[\s\S]*id="supplyChainDistributionClearScope" type="hidden"[\s\S]*data-supply-chain-clear-scope="current"[\s\S]*当前商品[\s\S]*所有商品[\s\S]*id="supplyChainDistributionClearType" type="hidden"[\s\S]*销售数据[\s\S]*分货数据[\s\S]*所有数据/);
assert.match(html, /data-supply-chain-clear-scope[\s\S]*data-supply-chain-clear-type[\s\S]*classList\.toggle\('active', item === button\)/);
assert.match(html, /function clearSupplyChainDistributionData\(\)[\s\S]*scope === 'all'[\s\S]*type !== 'allocation'[\s\S]*supplyChainProvinceSnapshots = supplyChainProvinceSnapshots\.filter[\s\S]*type !== 'sales'[\s\S]*delete supplyChainDistributionQuantities[\s\S]*delete supplyChainDistributionUnits[\s\S]*delete supplyChainDistributionFinalQuantities/);
assert.match(html, /bindImportUpload\('supplyChainProvinceDropZone', 'supplyChainProvinceFileInput', 'supply-chain-province'\)/);
assert.match(html, /id="supplyChainDistributionImportDropZone"[\s\S]*首行 SKU、首列仓库[\s\S]*首列 SKU、首行仓库/);
assert.match(html, /function handleSupplyChainDistributionImportFiles\(files\)[\s\S]*parseDistributionAllocations[\s\S]*supplyChainImportedAllocations/);
assert.match(html, /按 SKU＋仓库覆盖：数量为 0 或空白均按 0 覆盖；未导入的 SKU 和仓库保留原数据/);
assert.match(html, /function handleSupplyChainDistributionImportFiles\(files\)[\s\S]*nextAllocations = Object\.assign\(\{\}, supplyChainImportedAllocations\)[\s\S]*nextAllocations\[key\] = item\.quantity;[\s\S]*delete nextRedistribution\[key\][\s\S]*supplyChainRedistributionQuantities = nextRedistribution/);
assert.match(html, /function parseWorkbookSheets\(file\)[\s\S]*return \{ name: name, rows: matrixToObjects\(matrix\), matrix: matrix \}/);
assert.match(html, /bindImportUpload\('supplyChainDistributionImportDropZone', 'supplyChainDistributionImportFileInput', 'supply-chain-distribution'\)/);
assert.doesNotMatch(html, /id="supplyChainProvinceResult"|id="supplyChainProvinceBody"|<th>城市\/省份<\/th>/);
assert.match(html, /data-management-link="supply-chain-archive"[\s\S]*仓配关系档案/);
assert.match(html, /id="supply-chain-archive"[\s\S]*id="supplyChainArchiveGrid"/);
assert.match(html, /id="supply-chain-archive"[\s\S]*这里配置用于发货的配送中心[\s\S]*按各地区销量计算预订与分货[\s\S]*<th>区域 \/ 省份<\/th><th>配送中心（发货仓）<\/th>/);
assert.doesNotMatch(html.match(/<section class="tool-page" id="supply-chain-archive">[\s\S]*?<\/section>/)[0], /仓配层级|colspan="3"/);
assert.match(html, /function renderSupplyChainArchive\(\)[\s\S]*JDSupplyChain\.provinces\(\)[\s\S]*data-supply-chain-archive-region[\s\S]*data-supply-chain-archive-province/);
assert.match(html, /class="supply-chain-region-summary"><td>' \+ esc\(region\) \+ '汇总<\/td><td><\/td>/);
assert.match(html, /function prepareSupplyChainArchiveOptions\(input\)[\s\S]*supplyChainWarehouseRegions\.map/);
assert.doesNotMatch(html, /默认配送中心只能选择该大区内的配送中心/);
assert.match(html, /supply-chain-archive-overall[\s\S]*全国合计[\s\S]*supply-chain-archive-region-summary[\s\S]*supply-chain-archive-province-row/);
assert.match(html, /function toggleSupplyChainArchiveRegion\(region\)[\s\S]*jdSupplyChainArchiveCollapsedRegions/);
assert.match(html, /function supplyChainDistributionWarehouse\(row\)[\s\S]*SUPPLY_CHAIN_DEFAULT_REGION_WAREHOUSES\[row\.region\]/);
assert.match(html, /savedDefaultWarehouse[\s\S]*placeholder="默认：/);
assert.match(html, /var defaultWarehouse = savedDefaultWarehouse \|\| SUPPLY_CHAIN_DEFAULT_REGION_WAREHOUSES\[region\][\s\S]*value="' \+ esc\(defaultWarehouse\)[\s\S]*placeholder="默认：' \+ esc\(defaultWarehouse/);
assert.match(html, /not\(\.supply-chain-archive-table\)/);
assert.doesNotMatch(html, /prepareSupplyChainArchiveOptions\(event\.target\);[\s\S]{0,120}event\.target\.showPicker/);
assert.match(html, /function saveSupplyChainArchive\(input\)[\s\S]*supplyChainRegionWarehouses[\s\S]*supplyChainProvinceWarehouses/);
assert.match(html, /function supplyChainConfiguredSkus\(\)[\s\S]*Object\.keys\(supplyChainActual\[sku\] \|\| \{\}\)\.some/);
assert.doesNotMatch(html, /今日已手动配置实际内配|今天还没有手动配置实际内配|supplyChainActualDates\[sku\] === date/);
assert.match(html, /function exportSupplyChainDemand\(\)[\s\S]*JDSupplyChain\.planTransfers[\s\S]*配出配送中心[\s\S]*商品简称[\s\S]*supplyChainProfiles\[item\.sku\][\s\S]*北通-内配申请_/);
assert.match(html, /'商品简称', '内配类型'[\s\S]*item\.scope === 'region' \? '大区内内配' : '跨区内配'/);
assert.match(html, /Number\(item\.sku\)[\s\S]*columnIndex === 6[\s\S]*dataCell\.t = 'n'[\s\S]*dataCell\.z = '0'/);
assert.match(html, /function setAllSupplyChainRegionsCollapsed\(collapsed\)[\s\S]*jdSupplyChainCollapsedRegions/);
assert.match(html, /function saveSupplyChainActual\(input\)[\s\S]*key: 'supplyChainActual'/);
assert.match(html, /page === 'supply-chain'[\s\S]*loadSupplyChainState\(\)[\s\S]*renderSupplyChainAnalysis\(\)/);
assert.match(html, /\.supply-chain-table \{ width: 1090px; min-width: 1090px; max-width: 1090px;/);
assert.match(html, /class="supply-chain-region-summary"[\s\S]*data-supply-chain-region-toggle/);
assert.match(html, /var regionRow = '<tr class="supply-chain-region-summary">[\s\S]*'<td>-<\/td>'/);
assert.match(html, /supplyChainCollapsedRegions\[key\][\s\S]*jdSupplyChainCollapsedRegions/);
assert.match(html, /value >= baseline \* 2[\s\S]*value < baseline \/ 2/);
assert.match(html, /id="supplyChainHideThreshold"[\s\S]*id="supplyChainHideTurnover"/);
assert.match(html, /id="supplyChainHideToggle"[\s\S]*id="supplyChainHideThreshold"/);
assert.match(html, /id="supplyChainHideToggle" type="checkbox"[\s\S]*id="supplyChainHideSkuToggle" type="checkbox"[\s\S]*id="supplyChainHideNoActualSkuToggle" type="checkbox"/);
assert.doesNotMatch(html, /class="supply-chain-filter-toggle"/);
assert.match(html, /id="supplyChainHideSkuToggle"[\s\S]*隐藏不在 SKU 档案中的 SKU[\s\S]*id="supplyChainHideNoActualSkuToggle"[\s\S]*隐藏无实际内配数量的 SKU/);
assert.doesNotMatch(html, /区内与全仓建议量都较小|排除近期不需要关注的 SKU/);
assert.match(html, /jdSupplyChainHideSkuEnabled'\) !== 'false'[\s\S]*jdSupplyChainHideNoActualSkuEnabled'\) === 'true'/);
assert.match(html, /function refreshSupplyChainSkuList\(preferredSku\)[\s\S]*hasOwnProperty\.call\(supplyChainProfiles, sku\)[\s\S]*supplyChainHideNoActualSkuEnabled[\s\S]*Number\(supplyChainActual\[sku\]\[key\]\) !== 0/);
assert.match(html, /function supplyChainShouldHideRow\(row\)[\s\S]*row\.availableStock === 0 && row\.turnoverDays === 0[\s\S]*Math\.abs\(regionQuantity\) < supplyChainHideThreshold[\s\S]*Math\.abs\(allQuantity\) < supplyChainHideThreshold[\s\S]*row\.turnoverDays <= supplyChainHideTurnover[\s\S]*row\.actualQuantity === ''/);
assert.match(html, /regionRows\.filter\(function\(row\)[\s\S]*!supplyChainShouldHideRow\(row\)/);
assert.match(html, /supplyChainOnlyFilledSku !== sku \|\| row\.actualQuantity !== ''/);
assert.match(html, /supply-chain-head-region[\s\S]*supply-chain-head-all[\s\S]*supply-chain-head-actual/);
assert.match(html, /supply-chain-actual-input/);
assert.match(html, /周转超过 100 天的小仓/);
assert.doesNotMatch(html, /总周转：<strong>/);
assert.match(html, /class="supply-chain-overall-summary"[\s\S]*全国合计[\s\S]*summary\.overall\.actualQuantity[\s\S]*summary\.overall\.actualTurnover/);
assert.match(html, /function supplyChainSuggestionHtml\(value\)[\s\S]*data-supply-chain-suggestion/);
assert.match(html, /class="supply-chain-suggestion-cell">[\s\S]*supplyChainSuggestionHtml\(row\.regionQuantity\)/);
assert.match(html, /suggestion\.closest\('tr'\)\.querySelector\('\[data-supply-chain-actual\]'\)[\s\S]*saveSupplyChainActual\(actualInput\)/);
assert.match(html, /隐藏低内配需求的仓[\s\S]*建议内配量绝对值小于[\s\S]*商品周转不超过[\s\S]*天时隐藏[\s\S]*且无实际内配规划/);
assert.match(html, /supply-chain-head-region" colspan="2">区内均衡<\/th><th class="supply-chain-head-all" colspan="2">全仓均衡<\/th><th class="supply-chain-head-actual" colspan="2">实际内配<\/th>/);

console.log('supply chain analysis checks passed');
