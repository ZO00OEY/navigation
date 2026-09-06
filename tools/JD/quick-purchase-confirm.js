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
      var orderCol = findColumn(headers, ['订单号', '采购订单号', '订单编号']);
      if (orderCol < 0 && headers.length > 2) orderCol = 2;
      var skuCol = findColumn(headers, ['商品编号', '商品编码', 'SKU', '商品编号SKU']);
      var confirmCol = findColumn(headers, ['确认数量'], true);
      var reasonCol = findColumn(headers, ['不满足原因'], true);
      if (warehouseCol >= 0 && skuCol >= 0 && confirmCol >= 0 && reasonCol >= 0) {
        return { row: r, warehouseCol: warehouseCol, orderCol: orderCol, skuCol: skuCol, confirmCol: confirmCol, reasonCol: reasonCol };
      }
    }
    return null;
  }

  function findDemandHeader(rows, warehouses) {
    warehouses = uniqueWarehouses(warehouses);
    for (var r = 0; r < Math.min(rows.length, 50); r++) {
      var headers = rows[r] || [];
      var skuCol = findColumn(headers, ['SKU', '商品编号', '商品编码']);
      var shortNameCol = findColumn(headers, ['商品简称', '商品名称']);
      var packageSpecCol = findColumn(headers, ['箱规', '装箱数', '装箱规格', '箱装']);
      var warehouseCols = warehouses.map(function(warehouse) {
        return { warehouse: warehouse, col: findColumn(headers, [warehouse]) };
      }).filter(function(item) { return item.col >= 0; });
      if (skuCol >= 0 && shortNameCol >= 0 && warehouseCols.length) {
        return { row: r, skuCol: skuCol, shortNameCol: shortNameCol, packageSpecCol: packageSpecCol, warehouseCols: warehouseCols };
      }
      var reservationWarehouseCol = findColumn(headers, ['配送中心名称'], true);
      var reservationQuantityCol = findColumn(headers, ['有限预订数量'], true);
      var reservationShortNameCol = findColumn(headers, ['审批原因/报备信息']);
      if (skuCol >= 0 && reservationWarehouseCol >= 0 && reservationQuantityCol >= 0) {
        return { row: r, skuCol: skuCol, shortNameCol: reservationShortNameCol, packageSpecCol: -1, warehouseCols: [], reservationWarehouseCol: reservationWarehouseCol, reservationQuantityCol: reservationQuantityCol };
      }
    }
    return null;
  }

  function buildDemandEntries(rows, header) {
    var entries = [];
    rows.slice(header.row + 1).forEach(function(row) {
      var productSku = sku(row[header.skuCol]);
      if (!productSku) return;
      var shortName = header.shortNameCol >= 0 ? text(row[header.shortNameCol]) : '';
      if (header.reservationWarehouseCol >= 0) {
        var reservationQuantity = quantity(row[header.reservationQuantityCol]);
        var reservationWarehouse = text(row[header.reservationWarehouseCol]);
        if (reservationWarehouse && reservationQuantity) entries.push({ sku: productSku, shortName: shortName, packageSpec: '', warehouse: reservationWarehouse, quantity: reservationQuantity });
        return;
      }
      header.warehouseCols.forEach(function(item) {
        var qty = quantity(row[item.col]);
        if (qty) entries.push({ sku: productSku, shortName: shortName, packageSpec: header.packageSpecCol >= 0 ? text(row[header.packageSpecCol]) : '', warehouse: item.warehouse, quantity: qty });
      });
    });
    return entries;
  }

  function buildPlan(purchaseRows, demandRows, warehouses) {
    var purchase = findPurchaseHeader(purchaseRows);
    var demand = findDemandHeader(demandRows, warehouses);
    if (!purchase) throw new Error('采购订单回告明细缺少配送中心、商品编号、确认数量或不满足原因列');
    if (!demand) throw new Error('补货需求缺少 SKU、商品简称或已启用仓库列');

    var demandMap = new Map();
    buildDemandEntries(demandRows, demand).forEach(function(entry) {
      var key = entry.sku + '\n' + entry.warehouse;
      var existing = demandMap.get(key);
      demandMap.set(key, {
        sku: entry.sku,
        shortName: entry.shortName || (existing && existing.shortName) || '',
        packageSpec: entry.packageSpec,
        warehouse: entry.warehouse,
        quantity: entry.quantity + (existing ? existing.quantity : 0)
      });
    });

    var purchaseItems = [];
    purchaseRows.slice(purchase.row + 1).forEach(function(row, index) {
      var productSku = sku(row[purchase.skuCol]);
      var warehouse = text(row[purchase.warehouseCol]);
      var orderNo = purchase.orderCol >= 0 ? text(row[purchase.orderCol]) : '';
      if (productSku && warehouse) purchaseItems.push({ row: purchase.row + 1 + index, sku: productSku, warehouse: warehouse, orderNo: orderNo });
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
    var matchedRows = new Set(matches.map(function(item) { return item.row; }));
    var rejectedGroups = {};
    purchaseItems.forEach(function(item) {
      if (!item.orderNo) return;
      var key = item.orderNo;
      if (!rejectedGroups[key]) rejectedGroups[key] = { orderNo: item.orderNo, warehouses: [], rows: 0, matched: 0 };
      if (rejectedGroups[key].warehouses.indexOf(item.warehouse) === -1) rejectedGroups[key].warehouses.push(item.warehouse);
      rejectedGroups[key].rows++;
      if (matchedRows.has(item.row)) rejectedGroups[key].matched++;
    });
    var rejectedOrders = Object.keys(rejectedGroups).map(function(key) {
      return rejectedGroups[key];
    }).filter(function(item) {
      return item.rows > 0 && item.matched === 0;
    }).map(function(item) {
      item.created = newRows.filter(function(row) { return item.warehouses.indexOf(row.warehouse) !== -1; }).length;
      return item;
    });

    return {
      purchase: purchase,
      purchaseItems: purchaseItems,
      matches: matches,
      newRows: newRows,
      rejectedOrders: rejectedOrders,
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

  function buildDemandPlan(demandRows, warehouses) {
    var demand = findDemandHeader(demandRows, warehouses);
    if (!demand) throw new Error('补货需求缺少 SKU、商品简称或已启用仓库列');
    var newRows = [];
    newRows = buildDemandEntries(demandRows, demand);
    return {
      matches: [], newRows: newRows, rejectedOrders: [],
      stats: { demand: newRows.length, matched: 0, created: newRows.length, zeroed: 0, confirmedQuantity: 0 },
      preview: newRows.map(function(item) { return Object.assign({ status: '新建单' }, item); })
    };
  }

  function buildReservationItems(plan) {
    var items = {};
    (plan && (plan.matches || []).concat(plan.newRows || [])).forEach(function(item) {
      var productSku = sku(item.sku);
      var warehouse = text(item.warehouse);
      var qty = quantity(item.quantity);
      if (!productSku || !warehouse || !qty) return;
      var key = productSku + '\n' + warehouse;
      if (!items[key]) items[key] = { sku: productSku, shortName: text(item.shortName), warehouse: warehouse, quantity: 0 };
      items[key].shortName = items[key].shortName || text(item.shortName);
      items[key].quantity += qty;
    });
    return Object.keys(items).map(function(key) { return items[key]; }).sort(function(a, b) {
      return a.sku.localeCompare(b.sku, 'zh-CN', { numeric: true }) || a.warehouse.localeCompare(b.warehouse, 'zh-CN');
    });
  }

  return {
    buildPlan: buildPlan,
    buildDemandPlan: buildDemandPlan,
    buildReservationItems: buildReservationItems,
    findDemandHeader: findDemandHeader,
    findPurchaseHeader: findPurchaseHeader,
    uniqueWarehouses: uniqueWarehouses
  };
});
