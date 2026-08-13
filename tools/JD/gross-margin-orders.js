(function(root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.JDGrossMarginOrders = api;
})(typeof self !== 'undefined' ? self : this, function() {
  function number(value) {
    var result = Number(value);
    return Number.isFinite(result) ? result : 0;
  }

  function createSession() {
    return { orders: new Map(), groups: new Map(), rowCount: 0, missingOrderRows: 0 };
  }

  function groupKey(date, sku) { return date + '\u0000' + sku; }

  function ensureGroup(session, date, sku) {
    var key = groupKey(date, sku);
    if (!session.groups.has(key)) {
      session.groups.set(key, {
        date: date,
        sku: sku,
        salesQty: 0,
        purchaseQty: 0,
        returnQty: 0,
        income: 0,
        positiveIncome: 0,
        negativeIncome: 0,
        cost: 0,
        positiveCost: 0,
        negativeCost: 0,
        incomeAdjustment: 0,
        costAdjustment: 0
      });
    }
    return session.groups.get(key);
  }

  function addAmounts(target, line) {
    var qty = number(line.salesQty);
    var income = number(line.income);
    var cost = number(line.cost);
    target.salesQty += qty;
    target.purchaseQty += Math.max(0, qty);
    target.returnQty += Math.max(0, -qty);
    target.income += income;
    target.positiveIncome += Math.max(0, income);
    target.negativeIncome += Math.min(0, income);
    target.cost += cost;
    target.positiveCost += Math.max(0, cost);
    target.negativeCost += Math.min(0, cost);
  }

  function addLine(session, line) {
    if (!session || !line || !line.date || !line.sku) return;
    session.rowCount++;
    addAmounts(ensureGroup(session, line.date, line.sku), line);
    var orderId = String(line.orderId || '').trim();
    if (!orderId) {
      session.missingOrderRows++;
      return;
    }
    if (!session.orders.has(orderId)) session.orders.set(orderId, new Map());
    var skuMap = session.orders.get(orderId);
    if (!skuMap.has(line.sku)) skuMap.set(line.sku, new Map());
    var dateMap = skuMap.get(line.sku);
    if (!dateMap.has(line.date)) dateMap.set(line.date, { date: line.date, salesQty: 0, income: 0, cost: 0 });
    var compact = dateMap.get(line.date);
    compact.salesQty += number(line.salesQty);
    compact.income += number(line.income);
    compact.cost += number(line.cost);
  }

  function applyAdjustment(session, sourceSku, targetSku, line) {
    var source = ensureGroup(session, line.date, sourceSku);
    var target = ensureGroup(session, line.date, targetSku);
    source.incomeAdjustment -= line.income;
    source.costAdjustment -= line.cost;
    target.incomeAdjustment += line.income;
    target.costAdjustment += line.cost;
  }

  function finalize(session, markedSkus) {
    var marked = typeof markedSkus === 'function'
      ? markedSkus
      : (function() {
          var set = new Set(Array.from(markedSkus || []).map(String));
          return function(date, sku) { return set.has(sku); };
        })();
    var stats = { adjustedOrders: 0, standaloneOrders: 0, ambiguousOrders: 0, adjustedLines: 0, missingOrderRows: session.missingOrderRows };
    session.groups.forEach(function(group) {
      group.incomeAdjustment = 0;
      group.costAdjustment = 0;
    });
    session.orders.forEach(function(skuMap) {
      var skus = Array.from(skuMap.keys());
      var touched = false;
      var adjusted = false;
      var standalone = false;
      var ambiguous = false;
      skus.forEach(function(sourceSku) {
        skuMap.get(sourceSku).forEach(function(line) {
          if (!marked(line.date, sourceSku)) return;
          touched = true;
          var targets = skus.filter(function(sku) { return !marked(line.date, sku); });
          if (!targets.length) { standalone = true; return; }
          if (targets.length !== 1) { ambiguous = true; return; }
          applyAdjustment(session, sourceSku, targets[0], line);
          stats.adjustedLines++;
          adjusted = true;
        });
      });
      if (!touched) return;
      if (adjusted) stats.adjustedOrders++;
      if (standalone) stats.standaloneOrders++;
      if (ambiguous) stats.ambiguousOrders++;
    });
    var groups = Array.from(session.groups.values()).map(function(group) {
      var row = Object.assign({}, group);
      row.adjustedIncome = row.income + row.incomeAdjustment;
      row.adjustedCost = row.cost + row.costAdjustment;
      return row;
    });
    return { groups: groups, stats: stats };
  }

  return { createSession: createSession, addLine: addLine, finalize: finalize };
});
