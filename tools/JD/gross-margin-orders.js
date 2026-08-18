(function(root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.JDGrossMarginOrders = api;
})(typeof self !== 'undefined' ? self : this, function() {
  function number(value) {
    var result = Number(value);
    return Number.isFinite(result) ? result : 0;
  }

  function createSession(options) {
    options = options || {};
    return { orders: options.keepOrders === false ? null : new Map(), groups: new Map(), rowCount: 0, missingOrderRows: 0 };
  }

  function monthDate(date) { return String(date || '').slice(0, 7) + '-01'; }

  function groupKey(date, sku) { return monthDate(date) + '\u0000' + sku; }

  function ensureGroup(session, date, sku) {
    date = monthDate(date);
    var key = groupKey(date, sku);
    if (!session.groups.has(key)) {
      session.groups.set(key, {
        date: date,
        sku: sku,
        salesQty: 0,
        income: 0,
        cost: 0,
        monthlyReturnCount: 0,
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
    target.income += income;
    target.cost += cost;
  }

  function addLine(session, line) {
    if (!session || !line || !line.date || !line.sku) return;
    session.rowCount++;
    var date = monthDate(line.date);
    addAmounts(ensureGroup(session, date, line.sku), line);
    var qty = number(line.salesQty);
    var orderId = String(line.orderId || '').trim();
    if (!orderId) {
      session.missingOrderRows++;
      return null;
    }
    if (!session.orders) return [orderId, date, line.sku, qty, number(line.income), number(line.cost), Math.max(qty, 0), Math.max(-qty, 0)];
    if (!session.orders.has(orderId)) session.orders.set(orderId, new Map());
    var skuMap = session.orders.get(orderId);
    if (!skuMap.has(line.sku)) skuMap.set(line.sku, new Map());
    var dateMap = skuMap.get(line.sku);
    if (!dateMap.has(date)) dateMap.set(date, { date: date, salesQty: 0, income: 0, cost: 0, positiveQty: 0, negativeQty: 0 });
    var compact = dateMap.get(date);
    compact.salesQty += number(line.salesQty);
    compact.income += number(line.income);
    compact.cost += number(line.cost);
    compact.positiveQty += Math.max(qty, 0);
    compact.negativeQty += Math.max(-qty, 0);
    return null;
  }

  function applyAdjustment(session, sourceSku, targetSku, line, ratio) {
    ratio = ratio == null ? 1 : ratio;
    var source = ensureGroup(session, line.date, sourceSku);
    var target = ensureGroup(session, line.date, targetSku);
    var income = line.income * ratio;
    var cost = line.cost * ratio;
    source.incomeAdjustment -= income;
    source.costAdjustment -= cost;
    target.incomeAdjustment += income;
    target.costAdjustment += cost;
  }

  function orderBuckets(skuMap, excluded) {
    var dates = new Map();
    skuMap.forEach(function(dateMap, sku) {
      dateMap.forEach(function(line, date) {
        if (excluded && excluded.has(date + '\u0000' + sku)) return;
        if (!dates.has(date)) dates.set(date, new Map());
        dates.get(date).set(sku, line);
      });
    });
    return dates;
  }

  function relationKey(month, mainSku, accessorySku) {
    return month + '\u0000' + mainSku + '\u0000' + accessorySku;
  }

  function ensureRelation(relations, month, mainSku, accessorySku) {
    var key = relationKey(month, mainSku, accessorySku);
    if (!relations.has(key)) {
      relations.set(key, {
        month: month,
        mainSku: mainSku,
        accessorySku: accessorySku,
        uniqueAccessoryQty: 0,
        uniqueIncome: 0,
        uniqueCost: 0,
        multiAllocatedQty: 0,
        multiAllocatedIncome: 0,
        multiAllocatedCost: 0,
        uniqueOrderCount: 0,
        multiOrderCount: 0
      });
    }
    return relations.get(key);
  }

  function createCalculation(session, markedSkus) {
    var marked = typeof markedSkus === 'function'
      ? markedSkus
      : (function() {
          var set = new Set(Array.from(markedSkus || []).map(String));
          return function(date, sku) { return set.has(sku); };
        })();
    var unresolvedOrderIds = new Set();
    var unresolvedOrders = new Map();
    var mainExposures = new Map();
    var relations = new Map();
    var fallbackAccessories = [];
    session.groups.forEach(function(group) {
      group.incomeAdjustment = 0;
      group.costAdjustment = 0;
      group.monthlyReturnCount = 0;
      group.standaloneQty = 0;
      group.standaloneIncome = 0;
      group.standaloneCost = 0;
    });
    return {
      session: session,
      marked: marked,
      adjustedOrders: 0,
      standaloneOrders: 0,
      multiMainOrders: 0,
      proportionalOrders: 0,
      unresolvedOrderIds: unresolvedOrderIds,
      unresolvedOrders: unresolvedOrders,
      mainExposures: mainExposures,
      relations: relations,
      fallbackAccessories: fallbackAccessories,
      adjustedLines: 0
    };
  }

  function consumeOrderMap(calculation, orders) {
    var pending = [];
    orders.forEach(function(skuMap, orderId) {
      var orderSkuGroups = new Set();
      skuMap.forEach(function(dateMap, sku) {
        dateMap.forEach(function(line, date) {
          orderSkuGroups.add(date + '\u0000' + sku);
        });
      });
      var offsetSkuGroups = new Set();
      skuMap.forEach(function(dateMap, sku) {
        dateMap.forEach(function(line, date) {
          var positiveQty = number(line.positiveQty);
          var negativeQty = number(line.negativeQty);
          if (positiveQty > 0 && negativeQty > 0 && Math.abs(positiveQty - negativeQty) < 1e-9) {
            ensureGroup(calculation.session, date, sku).monthlyReturnCount++;
            if (Math.abs(number(line.salesQty)) < 1e-9 && Math.abs(number(line.income)) < 1e-9 && Math.abs(number(line.cost)) < 1e-9) {
              offsetSkuGroups.add(date + '\u0000' + sku);
            }
          }
        });
      });
      if (offsetSkuGroups.size === orderSkuGroups.size) return;
      var orderAdjusted = false;
      var orderStandalone = false;
      var orderMultiMain = false;
      orderBuckets(skuMap, offsetSkuGroups).forEach(function(lines, date) {
        var month = String(date).slice(0, 7);
        var mainLines = [];
        var accessoryLines = [];
        lines.forEach(function(line, sku) {
          (calculation.marked(date, sku) ? accessoryLines : mainLines).push({ sku: sku, line: line });
        });
        if (mainLines.length === 1) {
          var exposureKey = month + '\u0000' + mainLines[0].sku;
          if (!calculation.mainExposures.has(exposureKey)) calculation.mainExposures.set(exposureKey, { qty: 0, orderCount: 0 });
          var exposure = calculation.mainExposures.get(exposureKey);
          exposure.qty += number(mainLines[0].line.salesQty);
          exposure.orderCount++;
        }
        if (!accessoryLines.length) return;
        if (!mainLines.length) {
          orderStandalone = true;
          accessoryLines.forEach(function(item) {
            var group = ensureGroup(calculation.session, date, item.sku);
            group.standaloneQty += number(item.line.salesQty);
            group.standaloneIncome += number(item.line.income);
            group.standaloneCost += number(item.line.cost);
            calculation.fallbackAccessories.push({
              orderId: orderId,
              month: month,
              accessorySku: item.sku,
              qty: number(item.line.salesQty),
              income: number(item.line.income),
              cost: number(item.line.cost),
              mainSkus: '',
              reason: '同订单未找到可归还主品'
            });
          });
          return;
        }
        if (mainLines.length === 1) {
          accessoryLines.forEach(function(item) {
            applyAdjustment(calculation.session, item.sku, mainLines[0].sku, item.line);
            var relation = ensureRelation(calculation.relations, month, mainLines[0].sku, item.sku);
            relation.uniqueAccessoryQty += number(item.line.salesQty);
            relation.uniqueIncome += number(item.line.income);
            relation.uniqueCost += number(item.line.cost);
            relation.uniqueOrderCount++;
            calculation.adjustedLines++;
          });
          orderAdjusted = true;
          return;
        }
        orderMultiMain = true;
        pending.push({ orderId: orderId, date: date, month: month, mains: mainLines, accessories: accessoryLines });
      });
      if (orderAdjusted) calculation.adjustedOrders++;
      if (orderStandalone) calculation.standaloneOrders++;
      if (orderMultiMain) calculation.multiMainOrders++;
    });
    return pending;
  }

  function compactRowsToOrders(rows) {
    var orders = new Map();
    (rows || []).forEach(function(row) {
      var orderId = String(row[0] || '');
      var date = monthDate(row[1]);
      var sku = row[2];
      if (!orderId || !date || !sku) return;
      if (!orders.has(orderId)) orders.set(orderId, new Map());
      var skuMap = orders.get(orderId);
      if (!skuMap.has(sku)) skuMap.set(sku, new Map());
      var dateMap = skuMap.get(sku);
      if (!dateMap.has(date)) dateMap.set(date, { date: date, salesQty: 0, income: 0, cost: 0, positiveQty: 0, negativeQty: 0 });
      var line = dateMap.get(date);
      line.salesQty += number(row[3]);
      line.income += number(row[4]);
      line.cost += number(row[5]);
      line.positiveQty += row[6] == null ? Math.max(number(row[3]), 0) : number(row[6]);
      line.negativeQty += row[7] == null ? Math.max(-number(row[3]), 0) : number(row[7]);
    });
    return orders;
  }

  function consumeCompactRows(calculation, rows) {
    return consumeOrderMap(calculation, compactRowsToOrders(rows));
  }

  function resolvePending(calculation, pending) {
    pending.forEach(function(order) {
      var resolvedAny = false;
      var standaloneAny = false;
      order.accessories.forEach(function(accessory) {
        var weights = order.mains.map(function(main) {
          var relation = calculation.relations.get(relationKey(order.month, main.sku, accessory.sku));
          var exposure = calculation.mainExposures.get(order.month + '\u0000' + main.sku);
          var rate = relation && exposure && exposure.qty ? relation.uniqueAccessoryQty / exposure.qty : 0;
          return Math.abs(number(main.line.salesQty)) * rate;
        });
        var totalWeight = weights.reduce(function(total, value) { return total + value; }, 0);
        var targetIndexes = weights.map(function(weight, index) { return weight > 0 ? index : -1; }).filter(function(index) { return index !== -1; });
        if (!Number.isFinite(totalWeight) || totalWeight <= 0 || !targetIndexes.length) {
          var standalone = ensureGroup(calculation.session, accessory.line.date, accessory.sku);
          standalone.standaloneQty += number(accessory.line.salesQty);
          standalone.standaloneIncome += number(accessory.line.income);
          standalone.standaloneCost += number(accessory.line.cost);
          calculation.fallbackAccessories.push({
            orderId: order.orderId,
            month: order.month,
            accessorySku: accessory.sku,
            qty: number(accessory.line.salesQty),
            income: number(accessory.line.income),
            cost: number(accessory.line.cost),
            mainSkus: order.mains.map(function(main) { return main.sku; }).join('、'),
            reason: '多主品订单缺少可用拆分比例'
          });
          standaloneAny = true;
          return;
        }
        var usedRatio = 0;
        targetIndexes.forEach(function(index, targetIndex) {
          var main = order.mains[index];
          var ratio = targetIndex === targetIndexes.length - 1 ? 1 - usedRatio : weights[index] / totalWeight;
          usedRatio += ratio;
          applyAdjustment(calculation.session, accessory.sku, main.sku, accessory.line, ratio);
          var relation = ensureRelation(calculation.relations, order.month, main.sku, accessory.sku);
          relation.multiAllocatedQty += number(accessory.line.salesQty) * ratio;
          relation.multiAllocatedIncome += number(accessory.line.income) * ratio;
          relation.multiAllocatedCost += number(accessory.line.cost) * ratio;
          relation.multiOrderCount++;
        });
        calculation.adjustedLines++;
        resolvedAny = true;
      });
      if (resolvedAny) {
        calculation.adjustedOrders++;
        calculation.proportionalOrders++;
      }
      if (standaloneAny) calculation.standaloneOrders++;
    });
  }

  function finishCalculation(calculation) {
    var relationRows = Array.from(calculation.relations.values()).map(function(relation) {
      var exposure = calculation.mainExposures.get(relation.month + '\u0000' + relation.mainSku) || { qty: 0, orderCount: 0 };
      return {
        month: relation.month,
        mainSku: relation.mainSku,
        accessorySku: relation.accessorySku,
        sampleMainQty: exposure.qty,
        sampleMainOrderCount: exposure.orderCount,
        uniqueOrderCount: relation.uniqueOrderCount,
        uniqueAccessoryQty: relation.uniqueAccessoryQty,
        averageCarryQty: exposure.qty ? relation.uniqueAccessoryQty / exposure.qty : 0,
        uniqueIncome: relation.uniqueIncome,
        uniqueCost: relation.uniqueCost,
        multiOrderCount: relation.multiOrderCount,
        multiAllocatedQty: relation.multiAllocatedQty,
        multiAllocatedIncome: relation.multiAllocatedIncome,
        multiAllocatedCost: relation.multiAllocatedCost
      };
    });
    var groups = Array.from(calculation.session.groups.values()).map(function(group) {
      var row = Object.assign({}, group);
      row.adjustedIncome = row.income + row.incomeAdjustment;
      row.adjustedCost = row.cost + row.costAdjustment;
      return row;
    });
    return {
      groups: groups,
      relations: relationRows,
      unresolvedOrderIds: Array.from(calculation.unresolvedOrderIds),
      unresolvedOrders: Array.from(calculation.unresolvedOrders.values()),
      fallbackAccessories: calculation.fallbackAccessories.slice(),
      stats: {
        adjustedOrders: calculation.adjustedOrders,
        standaloneOrders: calculation.standaloneOrders,
        multiMainOrders: calculation.multiMainOrders,
        proportionalOrders: calculation.proportionalOrders,
        ambiguousOrders: calculation.unresolvedOrderIds.size,
        adjustedLines: calculation.adjustedLines,
        missingOrderRows: calculation.session.missingOrderRows
      }
    };
  }

  function finalize(session, markedSkus) {
    var calculation = createCalculation(session, markedSkus);
    resolvePending(calculation, consumeOrderMap(calculation, session.orders || new Map()));
    return finishCalculation(calculation);
  }

  function allocateAdByIncome(amount, retainedIncome, targetIncomes) {
    var retainedBasis = Math.abs(number(retainedIncome));
    var targetBases = (targetIncomes || []).map(function(value) { return Math.abs(number(value)); });
    var totalBasis = targetBases.reduce(function(total, value) { return total + value; }, retainedBasis);
    if (!totalBasis) return { retainedAmount: number(amount), targetAmounts: targetBases.map(function() { return 0; }) };
    return {
      retainedAmount: number(amount) * retainedBasis / totalBasis,
      targetAmounts: targetBases.map(function(value) { return number(amount) * value / totalBasis; })
    };
  }

  function createTypicalCalculation(session, markedSkus) {
    var marked = typeof markedSkus === 'function' ? markedSkus : (function() {
      var set = new Set(Array.from(markedSkus || []).map(String));
      return function(date, sku) { return set.has(sku); };
    })();
    return { session: session, marked: marked, combinations: new Map(), monthlyReturnCounts: new Map(), validOrders: 0 };
  }

  function consumeTypicalRows(calculation, rows) {
    var orders = compactRowsToOrders(rows);
    orders.forEach(function(skuMap) {
      orderBuckets(skuMap).forEach(function(lines, date) {
        var mains = [];
        var accessories = [];
        lines.forEach(function(line, sku) {
          if (number(line.positiveQty) > 0 && number(line.negativeQty) > 0 && Math.abs(number(line.positiveQty) - number(line.negativeQty)) < 1e-9) {
            var returnKey = String(date).slice(0, 7) + '\u0000' + sku;
            calculation.monthlyReturnCounts.set(returnKey, (calculation.monthlyReturnCounts.get(returnKey) || 0) + 1);
          }
          (calculation.marked(date, sku) ? accessories : mains).push({ sku: sku, line: line });
        });
        if (mains.length !== 1) return;
        var mainQty = Math.abs(number(mains[0].line.salesQty));
        if (!mainQty) return;
        var parts = accessories.map(function(item) {
          return { sku: item.sku, qtyPerMain: Math.abs(number(item.line.salesQty)) / mainQty };
        }).filter(function(item) { return item.qtyPerMain > 0; }).sort(function(a, b) { return String(a.sku).localeCompare(String(b.sku), 'zh-Hans-CN', { numeric: true }); });
        var month = String(date).slice(0, 7);
        var mainSku = mains[0].sku;
        var combinationKey = parts.length ? parts.map(function(item) { return item.sku + ':' + item.qtyPerMain.toFixed(6); }).join('|') : '∅';
        var key = month + '\u0000' + mainSku + '\u0000' + combinationKey;
        if (!calculation.combinations.has(key)) calculation.combinations.set(key, { month: month, mainSku: mainSku, combinationKey: combinationKey, accessories: parts, orderCount: 0, sampleMainQty: 0 });
        calculation.combinations.get(key).orderCount++;
        calculation.combinations.get(key).sampleMainQty += mainQty;
        calculation.validOrders++;
      });
    });
  }

  function finishTypicalCalculation(calculation) {
    var byMain = new Map();
    calculation.combinations.forEach(function(combo) {
      var key = combo.month + '\u0000' + combo.mainSku;
      if (!byMain.has(key)) byMain.set(key, []);
      byMain.get(key).push(combo);
    });
    var relations = [];
    var standards = [];
    byMain.forEach(function(combos) {
      combos.sort(function(a, b) { return b.orderCount - a.orderCount || b.sampleMainQty - a.sampleMainQty || a.combinationKey.localeCompare(b.combinationKey); });
      var sampleOrderCount = combos.reduce(function(total, combo) { return total + combo.orderCount; }, 0);
      var winner = combos[0];
      standards.push({
        month: winner.month,
        mainSku: winner.mainSku,
        combinationKey: winner.combinationKey,
        accessories: winner.accessories,
        typicalOrderCount: winner.orderCount,
        sampleOrderCount: sampleOrderCount,
        typicalRate: sampleOrderCount ? winner.orderCount / sampleOrderCount : 0
      });
      winner.accessories.forEach(function(accessory) {
        relations.push({
          month: winner.month,
          mainSku: winner.mainSku,
          accessorySku: accessory.sku,
          accessoryQtyPerMain: accessory.qtyPerMain,
          typicalOrderCount: winner.orderCount,
          sampleOrderCount: sampleOrderCount,
          typicalRate: sampleOrderCount ? winner.orderCount / sampleOrderCount : 0,
          combinationKey: winner.combinationKey
        });
      });
    });
    return { relations: relations, standards: standards, monthlyReturnCounts: calculation.monthlyReturnCounts, validOrders: calculation.validOrders };
  }

  function allocateMonthlyByTypical(session, relations, adByKey, monthlyReturnCounts) {
    var rows = new Map();
    session.groups.forEach(function(group) {
      var key = String(group.date).slice(0, 7) + '\u0000' + group.sku;
      rows.set(key, {
        month: String(group.date).slice(0, 7), sku: group.sku,
        salesQty: number(group.salesQty), income: number(group.income), cost: number(group.cost),
        monthlyReturnCount: monthlyReturnCounts && monthlyReturnCounts.get(key) || 0,
        incomeAdjustment: 0, costAdjustment: 0, rawAdPerformanceAmount: 0, adPerformanceAdjustment: 0
      });
    });
    Object.keys(adByKey || {}).forEach(function(key) {
      var parts = key.split('\u0000');
      var month = String(parts[0] || '').slice(0, 7);
      var sku = parts[1];
      var rowKey = month + '\u0000' + sku;
      if (!rows.has(rowKey)) rows.set(rowKey, { month: month, sku: sku, salesQty: 0, income: 0, cost: 0, monthlyReturnCount: 0, incomeAdjustment: 0, costAdjustment: 0, rawAdPerformanceAmount: 0, adPerformanceAdjustment: 0 });
      rows.get(rowKey).rawAdPerformanceAmount += number(adByKey[key]);
    });
    var byAccessory = new Map();
    (relations || []).forEach(function(relation) {
      var main = rows.get(relation.month + '\u0000' + relation.mainSku);
      var demand = Math.abs(number(main && main.salesQty)) * number(relation.accessoryQtyPerMain);
      var key = relation.month + '\u0000' + relation.accessorySku;
      if (!byAccessory.has(key)) byAccessory.set(key, []);
      byAccessory.get(key).push({ relation: relation, demand: demand });
    });
    var allocations = [];
    byAccessory.forEach(function(targets, sourceKey) {
      var source = rows.get(sourceKey);
      var totalDemand = targets.reduce(function(total, item) { return total + item.demand; }, 0);
      if (!source || totalDemand <= 0) return;
      targets.forEach(function(item) {
        var target = rows.get(item.relation.month + '\u0000' + item.relation.mainSku);
        if (!target) return;
        var ratio = item.demand / totalDemand;
        var income = source.income * ratio;
        var cost = source.cost * ratio;
        var ad = source.rawAdPerformanceAmount * ratio;
        source.incomeAdjustment -= income;
        source.costAdjustment -= cost;
        source.adPerformanceAdjustment -= ad;
        target.incomeAdjustment += income;
        target.costAdjustment += cost;
        target.adPerformanceAdjustment += ad;
        allocations.push(Object.assign({}, item.relation, {
          theoreticalDemand: item.demand,
          allocationRatio: ratio,
          allocatedIncome: income,
          allocatedCost: cost,
          allocatedAdPerformanceAmount: ad
        }));
      });
    });
    return {
      rows: Array.from(rows.values()).map(function(row) {
        row.adjustedIncome = row.income + row.incomeAdjustment;
        row.adjustedCost = row.cost + row.costAdjustment;
        row.adPerformanceAmount = row.rawAdPerformanceAmount + row.adPerformanceAdjustment;
        return row;
      }),
      allocations: allocations
    };
  }

  return {
    createSession: createSession,
    addLine: addLine,
    createCalculation: createCalculation,
    consumeCompactRows: consumeCompactRows,
    resolvePending: resolvePending,
    finishCalculation: finishCalculation,
    finalize: finalize,
    allocateAdByIncome: allocateAdByIncome,
    createTypicalCalculation: createTypicalCalculation,
    consumeTypicalRows: consumeTypicalRows,
    finishTypicalCalculation: finishTypicalCalculation,
    allocateMonthlyByTypical: allocateMonthlyByTypical
  };
});
