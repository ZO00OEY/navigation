const assert = require('node:assert/strict');
const Orders = require('../tools/JD/gross-margin-orders.js');

const session = Orders.createSession();
Orders.addLine(session, { orderId: 'A', date: '2026-06-01', sku: 'MAIN', salesQty: 1, income: 80, cost: 50 });
Orders.addLine(session, { orderId: 'A', date: '2026-06-01', sku: 'GIFT', salesQty: 1, income: 20, cost: 5 });
Orders.addLine(session, { orderId: 'B', date: '2026-06-02', sku: 'GIFT', salesQty: 1, income: 30, cost: 10 });
Orders.addLine(session, { orderId: 'C', date: '2026-06-03', sku: 'MAIN', salesQty: 1, income: 50, cost: 30 });
Orders.addLine(session, { orderId: 'C', date: '2026-06-03', sku: 'OTHER', salesQty: 1, income: 40, cost: 20 });
Orders.addLine(session, { orderId: 'C', date: '2026-06-03', sku: 'GIFT', salesQty: 1, income: 10, cost: 2 });
Orders.addLine(session, { orderId: 'R', date: '2026-06-04', sku: 'MAIN', salesQty: 1, income: 100, cost: 60 });
Orders.addLine(session, { orderId: 'R', date: '2026-06-05', sku: 'MAIN', salesQty: -1, income: -100, cost: -60 });

const result = Orders.finalize(session, ['GIFT']);
const byKey = Object.fromEntries(result.groups.map(row => [row.date + '|' + row.sku, row]));
assert.equal(byKey['2026-06-01|MAIN'].adjustedIncome, 100);
assert.equal(byKey['2026-06-01|MAIN'].adjustedCost, 55);
assert.equal(byKey['2026-06-01|GIFT'].adjustedIncome, 0);
assert.equal(byKey['2026-06-01|GIFT'].adjustedCost, 0);
assert.equal(byKey['2026-06-02|GIFT'].adjustedIncome, 30, 'standalone marked SKU remains itself');
assert.equal(byKey['2026-06-03|GIFT'].adjustedIncome, 10, 'ambiguous multi-main order remains unchanged');
assert.equal(byKey['2026-06-04|MAIN'].purchaseQty, 1);
assert.equal(byKey['2026-06-05|MAIN'].returnQty, 1);
assert.equal(result.stats.adjustedOrders, 1);
assert.equal(result.stats.standaloneOrders, 1);
assert.equal(result.stats.ambiguousOrders, 1);
const repeated = Orders.finalize(session, (date, sku) => date.startsWith('2026-06') && sku === 'GIFT');
const repeatedByKey = Object.fromEntries(repeated.groups.map(row => [row.date + '|' + row.sku, row]));
assert.equal(repeatedByKey['2026-06-01|MAIN'].adjustedIncome, 100, 'recalculation must not accumulate prior adjustments');

console.log('gross margin order checks passed');
