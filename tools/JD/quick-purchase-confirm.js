(function(root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.QuickPurchaseConfirm = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  function text(value) {
    return String(value == null ? '' : value).trim();
  }

  function headerKey(value) {
    return text(value).replace(/[\s*＊()（）,，:：]/g, '').toLowerCase();
  }

  function sku(value) {
    return text(value).replace(/^(\d+)\.0+$/, '$1');
  }

  function quantity(value) {
    var number = Number(text(value).replace(/,/g, ''));
    return isFinite(number) && number > 0 ? number : 0;
  }

  function uniqueWarehouses(list) {
    var seen = {};
    return (Array.isArray(list) ? list : []).map(text).filter(function(item) {
      if (!item || seen[item]) return false;
      seen[item] = true;
      return true;
    });
  }

  function findColumn(headers, aliases, contains) {
    var keys = aliases.map(headerKey);
    for (var i = 0; i < headers.length; i++) {
      var key = headerKey(headers[i]);
      if (keys.indexOf(key) !== -1 || (contains && keys.some(function(alias) { return key.indexOf(alias) !== -1; }))) return i;
    }
    return -1;
  }

  function findPurchaseHeader(rows) {
    for (var r = 0; r < Math.min(rows.length, 50); r++) {
      var headers = rows[r] || [];
      var warehouseCol = findColumn(headers, ['配送中心', '仓库', '仓库名称']);
      var skuCol = findColumn(headers, ['商品编号', '商品编码', 'SKU', '商品编号SKU']);
      var confirmCol = findColumn(headers, ['确认数量'], true);
      var reasonCol = findColumn(headers, ['不满足原因'], true);
      if (warehouseCol >= 0 && skuCol >= 0 && confirmCol >= 0 && reasonCol >= 0) {
        return { row: r, warehouseCol: warehouseCol, skuCol: skuCol, confirmCol: confirmCol, reasonCol: reasonCol };
      }
    }
    return null;
  }

  function findDemandHeader(rows, warehouses) {
    warehouses = uniqueWarehouses(warehouses);
    for (var r = 0; r < Math.min(rows.length, 50); r++) {
      var headers = rows[r] || [];
      var skuCol = findColumn(headers, ['SKU', '商品编号', '商品编码']);
      var shortNameCol = findColumn(headers, ['商品简称']);
      var warehouseCols = warehouses.map(function(warehouse) {
        return { warehouse: warehouse, col: findColumn(headers, [warehouse]) };
      }).filter(function(item) { return item.col >= 0; });
      if (skuCol >= 0 && shortNameCol >= 0 && warehouseCols.length) {
        return { row: r, skuCol: skuCol, shortNameCol: shortNameCol, warehouseCols: warehouseCols };
      }
    }
    return null;
  }

  function buildPlan(purchaseRows, demandRows, warehouses) {
    var purchase = findPurchaseHeader(purchaseRows);
    var demand = findDemandHeader(demandRows, warehouses);
    if (!purchase) throw new Error('采购订单回告明细缺少配送中心、商品编号、确认数量或不满足原因列');
    if (!demand) throw new Error('补货需求缺少 SKU、商品简称或已启用仓库列');

    var demandMap = new Map();
    demandRows.slice(demand.row + 1).forEach(function(row) {
      var productSku = sku(row[demand.skuCol]);
      if (!productSku) return;
      var shortName = text(row[demand.shortNameCol]);
      demand.warehouseCols.forEach(function(item) {
        var qty = quantity(row[item.col]);
        if (!qty) return;
        var key = productSku + '\n' + item.warehouse;
        var existing = demandMap.get(key);
        demandMap.set(key, {
          sku: productSku,
          shortName: shortName || (existing && existing.shortName) || '',
          warehouse: item.warehouse,
          quantity: qty + (existing ? existing.quantity : 0)
        });
      });
    });

    var purchaseItems = [];
    purchaseRows.slice(purchase.row + 1).forEach(function(row, index) {
      var productSku = sku(row[purchase.skuCol]);
      var warehouse = text(row[purchase.warehouseCol]);
      if (productSku && warehouse) purchaseItems.push({ row: purchase.row + 1 + index, sku: productSku, warehouse: warehouse });
    });

    var used = new Set();
    var matches = [];
    purchaseItems.forEach(function(item) {
      var key = item.sku + '\n' + item.warehouse;
      var entry = demandMap.get(key);
      if (!entry || used.has(key)) return;
      used.add(key);
      matches.push({
        row: item.row,
        sku: item.sku,
        warehouse: item.warehouse,
        quantity: entry.quantity,
        shortName: entry.shortName
      });
    });

    var newRows = [];
    demandMap.forEach(function(entry, key) {
      if (!used.has(key)) newRows.push(entry);
    });

    return {
      purchase: purchase,
      purchaseItems: purchaseItems,
      matches: matches,
      newRows: newRows,
      stats: {
        demand: demandMap.size,
        matched: matches.length,
        created: newRows.length,
        zeroed: purchaseItems.length - matches.length,
        confirmedQuantity: matches.reduce(function(sum, item) { return sum + item.quantity; }, 0)
      },
      preview: matches.map(function(item) {
        return Object.assign({ status: '回填原单' }, item);
      }).concat(newRows.map(function(item) {
        return Object.assign({ status: '新建单' }, item);
      }))
    };
  }

  return {
    buildPlan: buildPlan,
    findDemandHeader: findDemandHeader,
    findPurchaseHeader: findPurchaseHeader,
    uniqueWarehouses: uniqueWarehouses
  };
});
