const assert = require('node:assert/strict');
const fs = require('node:fs');
const { buildPlan, buildDemandPlan } = require('../tools/JD/quick-purchase-confirm.js');

const purchaseRows = [
  ['配送中心', '商品编号', '订单号', '确认数量（供应商填写，必填）', '不满足原因（供应商选择）'],
  ['北京', '1001', 'PO1', 9, ''],
  ['上海', '1001', 'PO2', 9, ''],
  ['北京', '1002', 'PO3', 9, ''],
];
const demandRows = [
  ['物料编码', 'SKU', '商品简称', '周转', '箱规', '主赠品属性', '全国', '北京', '上海', '杭州'],
  ['M1', '1001', '商品一', 25, 30, '主', 5, 5, 0, 0],
  ['M3', '1003', '商品三', 30, 20, '', 2, 2, '', 4],
];

const plan = buildPlan(purchaseRows, demandRows, ['北京', '上海']);
assert.deepEqual(plan.stats, { demand: 2, matched: 1, created: 1, zeroed: 2, confirmedQuantity: 5 });
assert.deepEqual(plan.matches[0], { row: 1, sku: '1001', warehouse: '北京', quantity: 5, shortName: '商品一' });
assert.deepEqual(plan.newRows[0], { sku: '1003', shortName: '商品三', packageSpec: '20', warehouse: '北京', quantity: 2 });
assert.deepEqual(plan.rejectedOrders, [
  { orderNo: 'PO2', warehouses: ['上海'], rows: 1, matched: 0, created: 0 },
  { orderNo: 'PO3', warehouses: ['北京'], rows: 1, matched: 0, created: 1 }
]);
const demandOnlyPlan = buildDemandPlan(demandRows, ['北京', '上海']);
assert.equal(demandOnlyPlan.stats.created, 2);
assert.deepEqual(demandOnlyPlan.newRows.map(row => [row.sku, row.warehouse, row.quantity]), [['1001', '北京', 5], ['1003', '北京', 2]]);
assert.deepEqual(demandOnlyPlan.newRows.map(row => row.packageSpec), ['30', '20']);
const multiWarehouseDemandPlan = buildDemandPlan(demandRows, ['北京', '上海', '杭州']);
assert.equal(multiWarehouseDemandPlan.newRows.length, 3);
assert.equal(multiWarehouseDemandPlan.stats.created, 2);

const html = fs.readFileSync('tools/JD/data-analysis.html', 'utf8');
assert.match(html, /data-page="purchase-confirm"[\s\S]*采购单快速回告/);
assert.match(html, /<section class="tool-page" id="purchase-confirm">/);
assert.match(html, /<script src="quick-purchase-confirm\.js"><\/script>/);
assert.doesNotMatch(html, /id="quickConfirmSkuInput"/);
assert.match(html, /补货需求需包含一列 SKU，其余分仓数量只识别下方已配置仓库/);
assert.match(html, /id="exportQuickConfirmTemplateLink"[\s\S]*下载补货需求参考模板/);
assert.doesNotMatch(html, /id="exportQuickConfirmTemplateBtn"/);
assert.match(html, /id="quickConfirmSupplierCodeInput"/);
assert.match(html, /localStorage\.setItem\('jdQuickConfirmSupplierCode', quickConfirmSupplierCode\)/);
assert.match(html, /quickConfirmSummaryText'\)\.textContent = \(text \|\| ''\) \+ rejectedText;/);
assert.match(html, /完全驳回采购单：[\s\S]*新建单：[\s\S]*item\.created \? '有，' \+ item\.created \+ ' 行' : '无'/);
assert.deepEqual(buildPlan(purchaseRows, demandRows, ['北京', '上海']).newRows.map(row => row.warehouse), ['北京']);
assert.match(html, /function exportQuickConfirmRejectedNewOrder\(\)[\s\S]*var newWarehouses = inventoryWarehouses\.filter[\s\S]*\['供应商简码', '商品编号', '商品名称', '箱规'\]\.concat\(newWarehouses\)[\s\S]*新建采购单_/);
assert.doesNotMatch(html, /function exportQuickConfirmRejectedNewOrder\(\)[\s\S]*\['供应商简码', '商品编号', '商品名称'\]\.concat\(inventoryWarehouses\)/);
assert.match(html, /id="exportQuickConfirmRejectedOrderBtn"[\s\S]*导出需另建采购单/);
assert.match(html, /exportQuickConfirmRejectedOrderBtn'\)\)\s+\$\(.*exportQuickConfirmRejectedOrderBtn.*\.addEventListener\('click', exportQuickConfirmRejectedNewOrder\)/);
assert.doesNotMatch(html, /XLSX\.writeFile\(quickConfirmResultWorkbook[\s\S]{0,240}exportQuickConfirmRejectedNewOrder\(\);/);
assert.match(html, /if \(!quickConfirmFiles\.purchase\) return quickConfirmPlan\.newRows;/);
assert.match(html, /function quickConfirmSkuValue\(value\)[\s\S]*return \/\^\\d\+\$\/\.test\(text\) \? Number\(text\) : text;/);
assert.match(html, /function formatQuickConfirmSkuColumn\(sheet, header\)[\s\S]*header\.skuCol[\s\S]*cell\.v = quickConfirmSkuValue\(cell\.v\);[\s\S]*cell\.t = typeof cell\.v === 'number' \? 'n' : 's';[\s\S]*cell\.z = typeof cell\.v === 'number' \? '0' : cell\.z;/);
assert.match(html, /var plan = QuickPurchaseConfirm\.buildPlan\(purchaseSheet\.rows, demandSheet\.rows, inventoryWarehouses\);[\s\S]*formatQuickConfirmSkuColumn\(purchaseSheet\.sheet, plan\.purchase\);/);
assert.match(html, /setQuickConfirmCell\(sheet, row, 2, quickConfirmSkuValue\(item\.sku\)\);[\s\S]*\.z = '0';/);
assert.doesNotMatch(html, /\.z = '@';/);
assert.match(html, /aoa_to_sheet\(\[\['商品编号', '商品简称'\]\.concat\(inventoryWarehouses\)\]\)/);
assert.match(html, /sheet\.A2 = \{ t: 'n', z: '0' \};/);
console.log('quick-purchase-confirm tests passed');
