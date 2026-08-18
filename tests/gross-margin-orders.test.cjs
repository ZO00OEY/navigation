const assert = require('node:assert/strict');
const Orders = require('../tools/JD/gross-margin-orders.js');

const session = Orders.createSession();
Orders.addLine(session, { orderId: 'A', date: '2026-06-01', sku: 'MAIN', salesQty: 1, income: 80, cost: 50 });
Orders.addLine(session, { orderId: 'A', date: '2026-06-01', sku: 'GIFT', salesQty: 1, income: 20, cost: 5 });
Orders.addLine(session, { orderId: 'A2', date: '2026-06-06', sku: 'MAIN', salesQty: 1, income: 90, cost: 55 });
Orders.addLine(session, { orderId: 'A2', date: '2026-06-06', sku: 'CABLE', salesQty: 2, income: 10, cost: 4 });
Orders.addLine(session, { orderId: 'S', date: '2026-06-07', sku: 'MAIN', salesQty: 1, income: 70, cost: 45 });
Orders.addLine(session, { orderId: 'B', date: '2026-06-02', sku: 'GIFT', salesQty: 1, income: 30, cost: 10 });
Orders.addLine(session, { orderId: 'C', date: '2026-06-03', sku: 'MAIN', salesQty: 1, income: 50, cost: 30 });
Orders.addLine(session, { orderId: 'C', date: '2026-06-03', sku: 'OTHER', salesQty: 1, income: 40, cost: 20 });
Orders.addLine(session, { orderId: 'C', date: '2026-06-03', sku: 'GIFT', salesQty: 2, income: 10, cost: 2 });
Orders.addLine(session, { orderId: 'C', date: '2026-06-03', sku: 'CABLE', salesQty: 1, income: 8, cost: 3 });
Orders.addLine(session, { orderId: 'D', date: '2026-06-03', sku: 'MAIN', salesQty: 1, income: 50, cost: 30 });
Orders.addLine(session, { orderId: 'D', date: '2026-06-03', sku: 'OTHER', salesQty: 1, income: 40, cost: 20 });
Orders.addLine(session, { orderId: 'D', date: '2026-06-03', sku: 'BOX', salesQty: 1, income: 6, cost: 2 });
Orders.addLine(session, { orderId: 'E', date: '2026-06-03', sku: 'GIFT', salesQty: 2, income: 12, cost: 4 });
Orders.addLine(session, { orderId: 'E', date: '2026-06-03', sku: 'CABLE', salesQty: 1, income: 9, cost: 3 });
Orders.addLine(session, { orderId: 'R', date: '2026-06-04', sku: 'MAIN', salesQty: 1, income: 100, cost: 60 });
Orders.addLine(session, { orderId: 'R', date: '2026-06-05', sku: 'MAIN', salesQty: -1, income: -100, cost: -60 });

const result = Orders.finalize(session, ['GIFT', 'CABLE', 'BOX']);
const byKey = Object.fromEntries(result.groups.map(row => [row.date + '|' + row.sku, row]));
assert.equal(result.groups.every(row => row.date === '2026-06-01'), true, 'all order dates in the month should collapse to the month record');
assert.equal(byKey['2026-06-01|MAIN'].monthlyReturnCount, 1, 'a zero-net order should count as one monthly return for its SKU');
assert.equal(byKey['2026-06-01|MAIN'].salesQty, 5, 'positive and negative order quantities should be stored only as a monthly net quantity');
assert.equal(byKey['2026-06-01|GIFT'].standaloneQty, 3, 'standalone marked SKUs remain themselves');
assert.equal(byKey['2026-06-01|BOX'].adjustedIncome, 6, 'gift without a reliable rate remains unchanged');
assert.equal(result.stats.adjustedOrders, 3);
assert.equal(result.stats.standaloneOrders, 3);
assert.equal(result.stats.multiMainOrders, 2);
assert.equal(result.stats.proportionalOrders, 1);
assert.equal(result.stats.ambiguousOrders, 0);
assert.deepEqual(result.unresolvedOrderIds, []);
assert.deepEqual(result.unresolvedOrders, []);
assert.equal(result.fallbackAccessories.length, 4, 'every marked accessory retained as standalone should be available for diagnosis export');
assert.equal(result.fallbackAccessories.find(row => row.orderId === 'D').reason, '多主品订单缺少可用拆分比例');
assert.equal(result.fallbackAccessories.find(row => row.orderId === 'B').reason, '同订单未找到可归还主品');
assert.equal(byKey['2026-06-01|BOX'].standaloneQty, 1, 'an accessory without any candidate-main ratio should remain an independent purchase');
assert.equal(byKey['2026-06-01|BOX'].standaloneIncome, 6);
const giftRelation = result.relations.find(row => row.mainSku === 'MAIN' && row.accessorySku === 'GIFT');
const cableRelation = result.relations.find(row => row.mainSku === 'MAIN' && row.accessorySku === 'CABLE');
assert.equal(giftRelation.sampleMainQty, 3);
assert.equal(giftRelation.sampleMainOrderCount, 3, 'a fully offset monthly-return order must not enter the main-product relationship sample');
assert.equal(giftRelation.averageCarryQty, 1 / 3);
assert.equal(giftRelation.multiAllocatedQty, 2);
assert.equal(cableRelation.averageCarryQty, 2 / 3);
assert.equal(cableRelation.multiAllocatedQty, 1);
assert.ok(Math.abs(result.groups.reduce((total, row) => total + row.incomeAdjustment, 0)) < 1e-9, 'income allocation must conserve the monthly total');
assert.ok(Math.abs(result.groups.reduce((total, row) => total + row.costAdjustment, 0)) < 1e-9, 'cost allocation must conserve the monthly total');
const repeated = Orders.finalize(session, (date, sku) => date.startsWith('2026-06') && ['GIFT', 'CABLE', 'BOX'].includes(sku));
const repeatedByKey = Object.fromEntries(repeated.groups.map(row => [row.date + '|' + row.sku, row]));
assert.equal(repeatedByKey['2026-06-01|MAIN'].adjustedIncome, byKey['2026-06-01|MAIN'].adjustedIncome, 'recalculation must not accumulate prior adjustments');
assert.equal(repeatedByKey['2026-06-01|MAIN'].monthlyReturnCount, 1, 'recalculation must not accumulate prior monthly-return counts');

const returnRules = Orders.createSession();
Orders.addLine(returnRules, { orderId: 'MIXED', date: '2026-06-01', sku: 'SKU', salesQty: 1, income: 100, cost: 60 });
Orders.addLine(returnRules, { orderId: 'MIXED', date: '2026-06-20', sku: 'SKU', salesQty: -1, income: -100, cost: -60 });
Orders.addLine(returnRules, { orderId: 'NEGATIVE', date: '2026-06-21', sku: 'NEG', salesQty: -1, income: -80, cost: -50 });
const returnResult = Orders.finalize(returnRules, []);
const returnBySku = Object.fromEntries(returnResult.groups.map(row => [row.sku, row]));
assert.equal(returnBySku.SKU.monthlyReturnCount, 1, 'equal positive and absolute negative quantities for one SKU count as a monthly return');
assert.equal(returnBySku.SKU.income, 0);
assert.equal(returnResult.stats.adjustedOrders, 0, 'a fully offset monthly-return order must not enter product allocation');
assert.equal(returnBySku.NEG.monthlyReturnCount, 0, 'a wholly negative order remains a normal negative order');
assert.equal(returnBySku.NEG.income, -80);

const skuReturnRules = Orders.createSession();
Orders.addLine(skuReturnRules, { orderId: 'CROSS', date: '2026-06-01', sku: 'A', salesQty: 1, income: 100, cost: 60 });
Orders.addLine(skuReturnRules, { orderId: 'CROSS', date: '2026-06-02', sku: 'B', salesQty: -1, income: -100, cost: -60 });
Orders.addLine(skuReturnRules, { orderId: 'PARTIAL', date: '2026-06-03', sku: 'A', salesQty: 2, income: 200, cost: 120 });
Orders.addLine(skuReturnRules, { orderId: 'PARTIAL', date: '2026-06-04', sku: 'A', salesQty: -2, income: -200, cost: -120 });
Orders.addLine(skuReturnRules, { orderId: 'PARTIAL', date: '2026-06-03', sku: 'B', salesQty: 3, income: 150, cost: 90 });
Orders.addLine(skuReturnRules, { orderId: 'UNEQUAL', date: '2026-06-05', sku: 'C', salesQty: 2, income: 100, cost: 50 });
Orders.addLine(skuReturnRules, { orderId: 'UNEQUAL', date: '2026-06-06', sku: 'C', salesQty: -1, income: -50, cost: -25 });
const skuReturnResult = Orders.finalize(skuReturnRules, []);
const skuReturnBySku = Object.fromEntries(skuReturnResult.groups.map(row => [row.sku, row]));
assert.equal(skuReturnBySku.A.monthlyReturnCount, 1, 'equal positive quantity and absolute negative quantity should count once for that SKU');
assert.equal(skuReturnBySku.B.monthlyReturnCount, 0, 'opposite quantities from different SKUs must not be mistaken for a return');
assert.equal(skuReturnBySku.C.monthlyReturnCount, 0, 'unequal positive and absolute negative quantities are not a full monthly return');
assert.equal(skuReturnBySku.B.adjustedIncome, 50, 'other SKUs in a partially offset order must continue through normal calculation');

const negativeRelation = Orders.createSession();
Orders.addLine(negativeRelation, { orderId: 'NEG-REL', date: '2026-06-22', sku: 'MAIN', salesQty: -1, income: -100, cost: -60 });
Orders.addLine(negativeRelation, { orderId: 'NEG-REL', date: '2026-06-22', sku: 'GIFT', salesQty: -2, income: -20, cost: -8 });
const negativeRelationResult = Orders.finalize(negativeRelation, ['GIFT']);
const negativeCarry = negativeRelationResult.relations[0];
assert.equal(negativeCarry.sampleMainQty, -1, 'negative main-product quantity must remain in the carry baseline');
assert.equal(negativeCarry.uniqueAccessoryQty, -2, 'negative accessory quantity must remain in the carry baseline');
assert.equal(negativeCarry.averageCarryQty, 2, 'matching negative quantities should produce the same positive carry ratio as a sale');
assert.equal(negativeRelationResult.groups.find(row => row.sku === 'MAIN').adjustedIncome, -120, 'negative accessory income must still return to the negative main order');

const repeatedMainSku = Orders.createSession();
Orders.addLine(repeatedMainSku, { orderId: 'SAME-MAIN', date: '2026-06-23', sku: 'MAIN', salesQty: 1, income: 100, cost: 60 });
Orders.addLine(repeatedMainSku, { orderId: 'SAME-MAIN', date: '2026-06-23', sku: 'MAIN', salesQty: 2, income: 200, cost: 120 });
Orders.addLine(repeatedMainSku, { orderId: 'SAME-MAIN', date: '2026-06-23', sku: 'GIFT', salesQty: 1, income: 20, cost: 8 });
const repeatedMainResult = Orders.finalize(repeatedMainSku, ['GIFT']);
assert.equal(repeatedMainResult.stats.multiMainOrders, 0, 'multiple units of the same main SKU are still a single-main order');
assert.equal(repeatedMainResult.stats.adjustedOrders, 1);
assert.equal(repeatedMainResult.groups.find(row => row.sku === 'MAIN').adjustedIncome, 320);

const adAllocation = Orders.allocateAdByIncome(100, 20, [50, 30]);
assert.equal(adAllocation.retainedAmount, 20, 'the accessory keeps advertising amount matching its retained income share');
assert.equal(adAllocation.targetAmounts[0], 50, 'each main product receives advertising amount matching its allocated income share');
assert.equal(adAllocation.targetAmounts[1], 30);
const negativeAdAllocation = Orders.allocateAdByIncome(100, -20, [-80]);
assert.equal(negativeAdAllocation.retainedAmount, 20, 'refund income should use its absolute share instead of producing a negative advertising percentage');
assert.equal(negativeAdAllocation.targetAmounts[0], 80);
assert.equal(negativeAdAllocation.retainedAmount + negativeAdAllocation.targetAmounts[0], 100, 'advertising allocation must conserve the imported total');

const typicalSession = Orders.createSession({ keepOrders: false });
const typicalRows = [
  ['T1', '2026-08-01', 'MAIN', 1, 100, 60], ['T1', '2026-08-01', 'GIFT', 1, 10, 3],
  ['T2', '2026-08-01', 'MAIN', 2, 200, 120], ['T2', '2026-08-01', 'GIFT', 2, 20, 6],
  ['T3', '2026-08-01', 'MAIN', 1, 100, 60], ['T3', '2026-08-01', 'GIFT', 2, 20, 6],
  ['RETURN', '2026-08-01', 'MAIN', 1, 100, 60, 1, 0], ['RETURN', '2026-08-01', 'MAIN', -1, -100, -60, 0, 1],
  ['ONLY-GIFT', '2026-08-01', 'GIFT', 1, 10, 3]
];
const typicalCalculation = Orders.createTypicalCalculation(typicalSession, ['GIFT']);
Orders.consumeTypicalRows(typicalCalculation, typicalRows);
const typicalResult = Orders.finishTypicalCalculation(typicalCalculation);
assert.equal(typicalResult.validOrders, 3, 'only complete one-main orders with marked accessories should enter typical-combination sampling');
assert.equal(typicalResult.relations.length, 1);
assert.equal(typicalResult.relations[0].accessoryQtyPerMain, 1, 'the modal combination should normalize accessory quantity per main-product unit');
assert.equal(typicalResult.relations[0].typicalOrderCount, 2);
assert.equal(typicalResult.relations[0].sampleOrderCount, 3);
assert.equal(typicalResult.monthlyReturnCounts.get('2026-08\u0000MAIN'), 1, 'fully offset buy-and-return orders should still contribute the monthly return count');

const emptyCombinationSession = Orders.createSession({ keepOrders: false });
const emptyCombinationCalculation = Orders.createTypicalCalculation(emptyCombinationSession, ['GIFT']);
Orders.consumeTypicalRows(emptyCombinationCalculation, [
  ['N1', '2026-08-01', 'MAIN', 1, 100, 60],
  ['N2', '2026-08-01', 'MAIN', 1, 100, 60],
  ['N3', '2026-08-01', 'MAIN', 1, 100, 60], ['N3', '2026-08-01', 'GIFT', 1, 10, 3]
]);
const emptyCombinationResult = Orders.finishTypicalCalculation(emptyCombinationCalculation);
assert.equal(emptyCombinationResult.standards[0].combinationKey, '∅', 'orders without accessories must participate when selecting the most frequent combination');
assert.equal(emptyCombinationResult.relations.length, 0, 'a no-accessory winning combination should not invent a carry relation');

const monthlySession = Orders.createSession({ keepOrders: false });
Orders.addLine(monthlySession, { orderId: 'MONTH', date: '2026-08-01', sku: 'A', salesQty: 100, income: 1000, cost: 600 });
Orders.addLine(monthlySession, { orderId: 'MONTH', date: '2026-08-01', sku: 'B', salesQty: -50, income: -500, cost: -300 });
Orders.addLine(monthlySession, { orderId: 'MONTH', date: '2026-08-01', sku: 'GIFT', salesQty: 200, income: 200, cost: 80 });
const monthlyAllocation = Orders.allocateMonthlyByTypical(monthlySession, [
  { month: '2026-08', mainSku: 'A', accessorySku: 'GIFT', accessoryQtyPerMain: 1.2 },
  { month: '2026-08', mainSku: 'B', accessorySku: 'GIFT', accessoryQtyPerMain: 1.5 }
], { '2026-08-01\u0000GIFT': 100 }, new Map([['2026-08\u0000A', 2]]));
const monthlyBySku = Object.fromEntries(monthlyAllocation.rows.map(row => [row.sku, row]));
assert.equal(monthlyAllocation.allocations[0].theoreticalDemand, 120);
assert.equal(monthlyAllocation.allocations[1].theoreticalDemand, 75, 'negative monthly main quantity should use its absolute quantity as allocation weight');
assert.ok(Math.abs(monthlyBySku.GIFT.adjustedIncome) < 1e-9);
assert.ok(Math.abs(monthlyBySku.GIFT.adjustedCost) < 1e-9);
assert.ok(Math.abs(monthlyBySku.GIFT.adPerformanceAmount) < 1e-9);
assert.equal(monthlyBySku.A.monthlyReturnCount, 2);
assert.ok(Math.abs(monthlyAllocation.rows.reduce((total, row) => total + row.incomeAdjustment, 0)) < 1e-9, 'monthly modal allocation must conserve income');
assert.ok(Math.abs(monthlyAllocation.rows.reduce((total, row) => total + row.costAdjustment, 0)) < 1e-9, 'monthly modal allocation must conserve cost');
assert.ok(Math.abs(monthlyAllocation.rows.reduce((total, row) => total + row.adPerformanceAdjustment, 0)) < 1e-9, 'monthly modal allocation must conserve advertising amount');

const largeSession = Orders.createSession();
for (let index = 0; index < 20000; index++) {
  const orderId = 'P' + index;
  Orders.addLine(largeSession, { orderId, date: '2026-07-01', sku: 'MAIN', salesQty: 1, income: 80, cost: 50 });
  Orders.addLine(largeSession, { orderId, date: '2026-07-01', sku: 'GIFT', salesQty: 1, income: 20, cost: 5 });
}
const startedAt = Date.now();
const largeResult = Orders.finalize(largeSession, ['GIFT']);
assert.equal(largeResult.stats.adjustedOrders, 20000);
assert.ok(Date.now() - startedAt < 3000, '40k rows should remain a linear-time smoke check');

const streamed = Orders.createSession({ keepOrders: false });
const compactRows = [
  Orders.addLine(streamed, { orderId: 'U', date: '2026-08-01', sku: 'MAIN', salesQty: 1, income: 80, cost: 50 }),
  Orders.addLine(streamed, { orderId: 'U', date: '2026-08-01', sku: 'GIFT', salesQty: 1, income: 20, cost: 5 }),
  Orders.addLine(streamed, { orderId: 'M', date: '2026-08-01', sku: 'MAIN', salesQty: 1, income: 70, cost: 44 }),
  Orders.addLine(streamed, { orderId: 'M', date: '2026-08-01', sku: 'OTHER', salesQty: 2, income: 60, cost: 38 }),
  Orders.addLine(streamed, { orderId: 'M', date: '2026-08-01', sku: 'GIFT', salesQty: 2, income: 12, cost: 4 }),
  Orders.addLine(streamed, { orderId: 'RETURN', date: '2026-08-01', sku: 'MAIN', salesQty: 2, income: 160, cost: 100 }),
  Orders.addLine(streamed, { orderId: 'RETURN', date: '2026-08-20', sku: 'MAIN', salesQty: -2, income: -160, cost: -100 })
].filter(Boolean);
const calculation = Orders.createCalculation(streamed, ['GIFT']);
const pending = Orders.consumeCompactRows(calculation, compactRows);
assert.equal(pending.length, 1);
assert.equal(pending[0].mains[0].line.cost, 44, 'temporary multi-main data must retain main-product cost');
assert.equal(pending[0].mains[0].line.income, 70, 'temporary multi-main data must retain main-product income');
Orders.resolvePending(calculation, pending);
const streamedResult = Orders.finishCalculation(calculation);
assert.ok(Math.abs(streamedResult.groups.reduce((total, row) => total + row.costAdjustment, 0)) < 1e-9);
assert.equal(streamedResult.groups.find(row => row.sku === 'MAIN').monthlyReturnCount, 1, 'sorted compact-row processing must preserve positive and absolute negative quantities');

console.log('gross margin order checks passed');
