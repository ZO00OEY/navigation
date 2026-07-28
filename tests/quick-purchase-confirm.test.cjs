const assert = require('node:assert/strict');
const fs = require('node:fs');
const { buildPlan } = require('../tools/JD/quick-purchase-confirm.js');

const purchaseRows = [
  ['配送中心', '商品编号', '确认数量（供应商填写，必填）', '不满足原因（供应商选择）'],
  ['北京', '1001', 9, ''],
  ['上海', '1001', 9, ''],
  ['北京', '1002', 9, ''],
];
const demandRows = [
  ['SKU', '商品简称', '北京', '上海'],
  ['1001', '商品一', 5, 0],
  ['1003', '商品三', 2, ''],
];

const plan = buildPlan(purchaseRows, demandRows, ['北京', '上海']);
assert.deepEqual(plan.stats, { demand: 2, matched: 1, created: 1, zeroed: 2, confirmedQuantity: 5 });
assert.deepEqual(plan.matches[0], { row: 1, sku: '1001', warehouse: '北京', quantity: 5, shortName: '商品一' });
assert.deepEqual(plan.newRows[0], { sku: '1003', shortName: '商品三', warehouse: '北京', quantity: 2 });

const html = fs.readFileSync('tools/JD/data-analysis.html', 'utf8');
assert.match(html, /data-page="purchase-confirm"[\s\S]*采购单快速回告/);
assert.match(html, /<section class="tool-page" id="purchase-confirm">/);
assert.match(html, /<script src="quick-purchase-confirm\.js"><\/script>/);
assert.doesNotMatch(html, /id="quickConfirmSkuInput"/);
console.log('quick-purchase-confirm tests passed');
