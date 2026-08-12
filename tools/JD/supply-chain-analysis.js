(function(root, factory) {
  var api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.JDSupplyChain = api;
})(typeof self !== 'undefined' ? self : this, function() {
  function number(value) {
    if (value === '' || value == null) return '';
    var parsed = Number(String(value).replace(/,/g, '').trim());
    return Number.isFinite(parsed) ? parsed : '';
  }

  function value(row, aliases) {
    var keys = Object.keys(row || {});
    for (var i = 0; i < aliases.length; i++) {
      var alias = aliases[i].replace(/\s+/g, '').toLowerCase();
      var key = keys.find(function(item) { return String(item).replace(/\s+/g, '').toLowerCase() === alias; });
      if (key) return row[key];
    }
    return '';
  }

  function parseRows(sheets) {
    var found = {};
    (sheets || []).forEach(function(sheet) {
      (sheet.rows || []).forEach(function(row) {
        var sku = String(value(row, ['SKU编码', 'SKU', '商品编码']) || '').trim().replace(/\.0$/, '');
        var region = String(value(row, ['区域', '大区']) || '').trim();
        var warehouse = String(value(row, ['配送中心', '仓库', '仓库名称']) || '').trim();
        var availableStock = number(value(row, ['可用库存', '可订购库存']));
        var turnoverDays = number(value(row, ['周转天数', '周转']));
        if (!sku || sku === '汇总' || sku === '合计' || !region || !warehouse || availableStock === '' || turnoverDays === '') return;
        found[sku + '\u0000' + region + '\u0000' + warehouse] = {
          sku: sku,
          region: region,
          warehouse: warehouse,
          availableStock: availableStock,
          turnoverDays: turnoverDays,
          dailyOutbound: turnoverDays > 0 ? availableStock / turnoverDays : ''
        };
      });
    });
    return Object.keys(found).map(function(key) { return found[key]; });
  }

  function warehouseRegions(rows, updatedAt) {
    var found = {};
    (rows || []).forEach(function(row) {
      if (row.warehouse && row.region) found[row.warehouse] = { warehouse: row.warehouse, region: row.region, updatedAt: updatedAt };
    });
    return Object.keys(found).map(function(key) { return found[key]; });
  }

  var PROVINCE_REGIONS = {
    '北京': '华北', '天津': '华北', '河北': '华北', '山西': '华北', '内蒙古': '华北',
    '辽宁': '东北', '吉林': '东北', '黑龙江': '东北',
    '上海': '华东', '江苏': '华东', '浙江': '华东', '安徽': '华东',
    '江西': '华中', '河南': '华中', '湖北': '华中', '湖南': '华中',
    '福建': '华南', '广东': '华南', '广西': '华南', '海南': '华南', '香港': '华南', '澳门': '华南', '台湾': '华南', '中国台湾': '华南',
    '山东': '华北',
    '重庆': '西南', '四川': '西南', '贵州': '西南', '云南': '西南', '西藏': '西南',
    '陕西': '西北', '甘肃': '西北', '青海': '西北', '宁夏': '西北', '新疆': '西北'
  };
  var CITY_REGIONS = {};
  [
    ['华北', '北京 天津 石家庄 唐山 秦皇岛 邯郸 邢台 保定 张家口 承德 沧州 廊坊 衡水 雄安 太原 大同 阳泉 长治 晋城 朔州 晋中 运城 忻州 临汾 吕梁 呼和浩特 包头 乌海 赤峰 通辽 鄂尔多斯 呼伦贝尔 巴彦淖尔 乌兰察布 兴安 锡林郭勒 阿拉善 济南 青岛 淄博 枣庄 东营 烟台 潍坊 济宁 泰安 威海 日照 临沂 德州 聊城 滨州 菏泽 海淀 昌平 丰台 顺义 西城 石景山 大兴 房山 朝阳 通州 东城 延庆 怀柔 东丽 武清 宁河 北辰 和平 河东 津南 西青'],
    ['东北', '沈阳 大连 鞍山 抚顺 本溪 丹东 锦州 营口 阜新 辽阳 盘锦 铁岭 朝阳 葫芦岛 长春 吉林 四平 辽源 通化 白山 松原 白城 延边 哈尔滨 齐齐哈尔 鸡西 鹤岗 双鸭山 大庆 伊春 佳木斯 七台河 牡丹江 黑河 绥化 大兴安岭'],
    ['华东', '上海 南京 无锡 徐州 常州 苏州 南通 连云港 淮安 盐城 扬州 镇江 泰州 宿迁 杭州 宁波 温州 嘉兴 湖州 绍兴 金华 衢州 舟山 台州 丽水 合肥 芜湖 蚌埠 淮南 马鞍山 淮北 铜陵 安庆 黄山 滁州 阜阳 宿州 六安 亳州 池州 宣城 闵行 浦东新区 宝山 嘉定 松江 金山 青浦 杨浦 长宁 虹口 徐汇 普陀 奉贤 静安 黄浦'],
    ['华中', '南昌 景德镇 萍乡 九江 新余 鹰潭 赣州 吉安 宜春 抚州 上饶 郑州 开封 洛阳 平顶山 安阳 鹤壁 新乡 焦作 濮阳 许昌 漯河 三门峡 南阳 商丘 信阳 周口 驻马店 济源 武汉 黄石 十堰 宜昌 襄阳 鄂州 荆门 孝感 荆州 黄冈 咸宁 随州 恩施 仙桃 潜江 天门 神农架 长沙 株洲 湘潭 衡阳 邵阳 岳阳 常德 张家界 益阳 郴州 永州 怀化 娄底 湘西'],
    ['华南', '福州 厦门 莆田 三明 泉州 漳州 南平 龙岩 宁德 广州 韶关 深圳 珠海 汕头 佛山 江门 湛江 茂名 肇庆 惠州 梅州 汕尾 河源 阳江 清远 东莞 中山 潮州 揭阳 云浮 南宁 柳州 桂林 梧州 北海 防城港 钦州 贵港 玉林 百色 贺州 河池 来宾 崇左 海口 三亚 三沙 儋州 五指山 琼海 文昌 万宁 东方 定安 屯昌 澄迈 临高 白沙 昌江 乐东 陵水 保亭 琼中 台湾 香港 澳门'],
    ['西南', '重庆 成都 自贡 攀枝花 泸州 德阳 绵阳 广元 遂宁 内江 乐山 南充 眉山 宜宾 广安 达州 雅安 巴中 资阳 阿坝 甘孜 凉山 贵阳 六盘水 遵义 安顺 毕节 铜仁 黔西南 黔东南 黔南 昆明 曲靖 玉溪 保山 昭通 丽江 普洱 临沧 楚雄 红河 文山 西双版纳 大理 德宏 怒江 迪庆 拉萨 日喀则 昌都 林芝 山南 那曲 阿里 渝北 两江新区 沙坪坝 江北 涪陵 渝中 巴南 大足 江津 大渡口 开州 璧山 丰都 九龙坡 万州'],
    ['西北', '西安 铜川 宝鸡 咸阳 渭南 延安 汉中 榆林 安康 商洛 兰州 嘉峪关 金昌 白银 天水 武威 张掖 平凉 酒泉 庆阳 定西 陇南 临夏 甘南 西宁 海东 海北 黄南 海南 果洛 玉树 海西 银川 石嘴山 吴忠 固原 中卫 乌鲁木齐 克拉玛依 吐鲁番 哈密 昌吉 博尔塔拉 巴音郭楞 阿克苏 克孜勒苏 喀什 和田 伊犁 塔城 阿勒泰 石河子 阿拉尔 图木舒克 五家渠 北屯 铁门关 双河 可克达拉 昆玉 胡杨河']
  ].forEach(function(group) {
    group[1].split(' ').forEach(function(city) { CITY_REGIONS[city] = group[0]; });
  });

  function provinceName(value) {
    return String(value || '').trim().replace(/(壮族自治区|回族自治区|维吾尔自治区|特别行政区|自治区|省|市)$/g, '');
  }

  function provinceRegion(province) {
    var original = provinceName(province);
    var exact = { '朝阳区': '华北', '和平区': '华北', '河东区': '华北', '通州区': '华北', '江北区': '西南' };
    var name = original.replace(/(地区|自治州|州|盟|新区|县|区)$/g, '');
    return exact[original] || PROVINCE_REGIONS[original] || PROVINCE_REGIONS[name] || CITY_REGIONS[name] || CITY_REGIONS[original] || '未划分';
  }

  function provinces() {
    return Object.keys(PROVINCE_REGIONS).filter(function(name) { return name !== '中国台湾'; }).map(function(name) {
      return { province: name, region: PROVINCE_REGIONS[name] };
    });
  }

  function parseProvinceSales(sheets, warehouseRegions) {
    var found = {};
    function matchWarehouse(location) {
      var key = provinceName(location).replace(/(配送中心|仓库|仓)$/g, '');
      return (warehouseRegions || []).find(function(item) {
        var warehouseKey = provinceName(item.warehouse).replace(/(配送中心|仓库|仓)$/g, '');
        return key && warehouseKey && (key === warehouseKey || key.indexOf(warehouseKey) !== -1 || warehouseKey.indexOf(key) !== -1);
      });
    }
    (sheets || []).forEach(function(sheet) {
      (sheet.rows || []).forEach(function(row) {
        var province = provinceName(value(row, ['省份', '省', '收货省', '收货省份', '下单省份', '城市', '地域']));
        var quantity = number(value(row, ['销量', '销售数量', '销售件数', '成交商品件数', '成交件数', '下单商品件数']));
        var sku = String(value(row, ['SKU编码', 'SKU', '商品编码', '商品编号']) || '').trim().replace(/\.0$/, '');
        if (!province || quantity === '') return;
        var warehouse = matchWarehouse(province);
        if (!found[province]) found[province] = {
          province: province,
          region: provinceRegion(province) === '未划分' && warehouse ? warehouse.region : provinceRegion(province),
          defaultWarehouse: warehouse ? warehouse.warehouse : '',
          salesQty: 0,
          skus: []
        };
        found[province].salesQty += quantity;
        if (sku && found[province].skus.indexOf(sku) === -1) found[province].skus.push(sku);
      });
    });
    return Object.keys(found).map(function(key) { return found[key]; }).sort(function(a, b) { return b.salesQty - a.salesQty; });
  }

  function parseDistributionAllocations(sheets) {
    var found = {};
    function sku(value) {
      var text = String(value == null ? '' : value).trim().replace(/\.0$/, '');
      return /^\d{6,}$/.test(text) ? text : '';
    }
    function add(skuValue, warehouseValue, quantityValue) {
      var warehouse = String(warehouseValue == null ? '' : warehouseValue).trim();
      var quantity = String(quantityValue == null ? '' : quantityValue).trim() === '' ? 0 : number(quantityValue);
      if (!skuValue || !warehouse || quantity === '' || quantity < 0) return;
      found[skuValue + '\u0000' + warehouse] = { sku: skuValue, warehouse: warehouse, quantity: Math.round(quantity) };
    }
    (sheets || []).forEach(function(sheet) {
      var matrix = sheet.matrix || [];
      for (var rowIndex = 0; rowIndex < Math.min(matrix.length, 12); rowIndex++) {
        var row = matrix[rowIndex] || [];
        var skuColumns = row.map(sku);
        if (skuColumns.filter(Boolean).length) {
          var warehouseColumn = -1;
          var warehouseLabelRow = -1;
          for (var labelRow = rowIndex; labelRow <= Math.min(rowIndex + 4, matrix.length - 1); labelRow++) {
            var labelIndex = (matrix[labelRow] || []).findIndex(function(cell) { return /配送中心|配送仓|分货仓|仓库|仓名/.test(String(cell || '')); });
            if (labelIndex !== -1) { warehouseColumn = labelIndex; warehouseLabelRow = labelRow; break; }
          }
          if (warehouseColumn === -1) continue;
          for (var dataRow = warehouseLabelRow + 1; dataRow < matrix.length; dataRow++) {
            skuColumns.forEach(function(skuValue, columnIndex) {
              if (skuValue) add(skuValue, matrix[dataRow][warehouseColumn], matrix[dataRow][columnIndex]);
            });
          }
          return;
        }
        var skuHeaderColumn = row.findIndex(function(cell) { return /^(sku|sku编码|商品编码|商品编号)$/i.test(String(cell || '').replace(/\s+/g, '')); });
        if (skuHeaderColumn !== -1) {
          for (var skuRow = rowIndex + 1; skuRow < matrix.length; skuRow++) {
            var skuValue = sku(matrix[skuRow][skuHeaderColumn]);
            if (!skuValue) continue;
            row.forEach(function(warehouse, columnIndex) {
              if (columnIndex !== skuHeaderColumn) add(skuValue, warehouse, matrix[skuRow][columnIndex]);
            });
          }
          return;
        }
      }
    });
    return Object.keys(found).map(function(key) { return found[key]; });
  }

  function allocateByShare(rows, total) {
    total = Math.max(0, Math.round(Number(total) || 0));
    var salesTotal = (rows || []).reduce(function(sum, row) { return sum + Math.max(0, Number(row.salesQty) || 0); }, 0);
    var allocations = (rows || []).map(function(row, index) {
      var exact = salesTotal ? total * Math.max(0, Number(row.salesQty) || 0) / salesTotal : 0;
      return { index: index, quantity: Math.floor(exact), remainder: exact - Math.floor(exact) };
    });
    var remaining = total - allocations.reduce(function(sum, item) { return sum + item.quantity; }, 0);
    allocations.slice().sort(function(a, b) { return b.remainder - a.remainder || a.index - b.index; }).slice(0, remaining).forEach(function(item) { item.quantity += 1; });
    return allocations.sort(function(a, b) { return a.index - b.index; }).map(function(item) { return item.quantity; });
  }

  function allocateByGroup(rows, total, groupSize) {
    groupSize = Math.max(1, Math.round(Number(groupSize) || 1));
    return allocateByShare(rows, Math.floor(Math.max(0, Number(total) || 0) / groupSize)).map(function(groups) { return groups * groupSize; });
  }

  function allocateStockByTurnover(rows, total) {
    total = Math.max(0, Math.round(Number(total) || 0));
    var valid = (rows || []).map(function(row, index) {
      return { index: index, stock: Number(row.availableStock) || 0, daily: Math.max(0, Number(row.dailyOutbound) || 0) };
    }).filter(function(row) { return row.daily > 0; });
    var result = (rows || []).map(function() { return 0; });
    if (!valid.length || !total) return result;
    var ratios = valid.map(function(row) { return row.stock / row.daily; });
    var low = Math.min.apply(null, ratios) - 1;
    var high = Math.max.apply(null, ratios) + total / Math.min.apply(null, valid.map(function(row) { return row.daily; })) + 1;
    for (var i = 0; i < 80; i++) {
      var mid = (low + high) / 2;
      var needed = valid.reduce(function(sum, row) { return sum + Math.max(0, mid * row.daily - row.stock); }, 0);
      if (needed > total) high = mid;
      else low = mid;
    }
    var exact = valid.map(function(row) {
      var value = Math.max(0, low * row.daily - row.stock);
      return { index: row.index, quantity: Math.floor(value), remainder: value - Math.floor(value) };
    });
    var remaining = total - exact.reduce(function(sum, row) { return sum + row.quantity; }, 0);
    exact.sort(function(a, b) { return b.remainder - a.remainder || a.index - b.index; });
    for (var j = 0; j < remaining; j++) exact[j % exact.length].quantity += 1;
    exact.forEach(function(row) { result[row.index] = row.quantity; });
    return result;
  }

  function allocateStockByTurnoverPack(rows, total, pack) {
    total = Math.max(0, Math.round(Number(total) || 0));
    pack = Math.max(1, Math.round(Number(pack) || 1));
    if (pack === 1) return allocateStockByTurnover(rows, total);
    var groups = allocateStockByTurnover((rows || []).map(function(row) {
      return { availableStock: (Number(row.availableStock) || 0) / pack, dailyOutbound: (Number(row.dailyOutbound) || 0) / pack };
    }), Math.floor(total / pack));
    var result = groups.map(function(quantity) { return quantity * pack; });
    var remainder = total - result.reduce(function(sum, quantity) { return sum + quantity; }, 0);
    while (remainder > 0) {
      var target = -1;
      var lowest = Infinity;
      (rows || []).forEach(function(row, index) {
        var daily = Number(row.dailyOutbound) || 0;
        if (daily <= 0) return;
        var turnover = ((Number(row.availableStock) || 0) + result[index]) / daily;
        if (turnover < lowest) { lowest = turnover; target = index; }
      });
      if (target === -1) target = 0;
      result[target] += remainder;
      remainder = 0;
    }
    return result;
  }

  function balance(rows) {
    var valid = rows.filter(function(row) { return row.dailyOutbound !== '' && row.dailyOutbound > 0; });
    var totalStock = valid.reduce(function(total, row) { return total + row.availableStock; }, 0);
    var totalDaily = valid.reduce(function(total, row) { return total + row.dailyOutbound; }, 0);
    var target = totalDaily > 0 ? totalStock / totalDaily : '';
    var suggestions = {};
    var allocations = valid.map(function(row, index) {
      var exact = target * row.dailyOutbound - row.availableStock;
      var quantity = Math.floor(exact + 1e-9);
      return { key: row.region + '\u0000' + row.warehouse, index: index, quantity: quantity, remainder: exact - quantity };
    });
    var remaining = -allocations.reduce(function(total, item) { return total + item.quantity; }, 0);
    allocations.slice().sort(function(a, b) {
      return b.remainder - a.remainder || a.index - b.index;
    }).slice(0, remaining).forEach(function(item) {
      item.quantity += 1;
    });
    allocations.forEach(function(item) { suggestions[item.key] = item.quantity; });
    return { target: target, suggestions: suggestions };
  }

  function analyze(rows, actual) {
    actual = actual || {};
    var regionRows = {};
    rows.forEach(function(row) {
      if (!regionRows[row.region]) regionRows[row.region] = [];
      regionRows[row.region].push(row);
    });
    var regionBalances = {};
    Object.keys(regionRows).forEach(function(region) { regionBalances[region] = balance(regionRows[region]); });
    var allBalance = balance(rows);
    return rows.slice().sort(function(a, b) {
      return a.region.localeCompare(b.region, 'zh-CN') || a.warehouse.localeCompare(b.warehouse, 'zh-CN');
    }).map(function(row) {
      var key = row.region + '\u0000' + row.warehouse;
      var actualQuantity = Object.prototype.hasOwnProperty.call(actual, key) ? number(actual[key]) : '';
      var regionQuantity = Number.isFinite(regionBalances[row.region].suggestions[key]) ? regionBalances[row.region].suggestions[key] : 0;
      var allQuantity = Number.isFinite(allBalance.suggestions[key]) ? allBalance.suggestions[key] : 0;
      function turnover(quantity) {
        return row.dailyOutbound > 0 && quantity !== undefined ? (row.availableStock + quantity) / row.dailyOutbound : '';
      }
      return Object.assign({}, row, {
        key: key,
        regionTarget: regionBalances[row.region].target,
        regionQuantity: regionQuantity,
        regionTurnover: turnover(regionQuantity),
        allTarget: allBalance.target,
        allQuantity: allQuantity,
        allTurnover: turnover(allQuantity),
        actualQuantity: actualQuantity,
        actualTurnover: turnover(actualQuantity === '' ? 0 : actualQuantity)
      });
    });
  }

  function summarize(rows) {
    function total(items) {
      var availableStock = items.reduce(function(sum, row) { return sum + row.availableStock; }, 0);
      var dailyOutbound = items.reduce(function(sum, row) { return sum + (row.dailyOutbound === '' ? 0 : row.dailyOutbound); }, 0);
      var allQuantity = items.reduce(function(sum, row) { return sum + (Number.isFinite(row.allQuantity) ? row.allQuantity : 0); }, 0);
      var actualQuantity = items.reduce(function(sum, row) { return sum + (row.actualQuantity === '' ? 0 : row.actualQuantity); }, 0);
      var actualCount = items.filter(function(row) { return row.actualQuantity !== '' && row.actualQuantity !== 0; }).length;
      return {
        warehouses: items.length,
        availableStock: availableStock,
        dailyOutbound: dailyOutbound,
        currentTurnover: dailyOutbound > 0 ? availableStock / dailyOutbound : '',
        allQuantity: allQuantity,
        allTurnover: dailyOutbound > 0 ? (availableStock + allQuantity) / dailyOutbound : '',
        actualQuantity: actualQuantity,
        actualCount: actualCount,
        actualTurnover: dailyOutbound > 0 ? (availableStock + actualQuantity) / dailyOutbound : '',
        over100: items.filter(function(row) { return row.turnoverDays > 100; }).length
      };
    }
    var regions = {};
    rows.forEach(function(row) {
      if (!regions[row.region]) regions[row.region] = [];
      regions[row.region].push(row);
    });
    return {
      overall: total(rows),
      regions: Object.keys(regions).reduce(function(result, region) {
        result[region] = total(regions[region]);
        return result;
      }, {})
    };
  }

  function planTransfers(rows) {
    rows = rows || [];
    var sources = [];
    var destinations = [];
    (rows || []).forEach(function(row) {
      if (row.actualQuantity < 0) sources.push({ row: row, remaining: -row.actualQuantity });
      if (row.actualQuantity > 0) destinations.push({ row: row, remaining: row.actualQuantity });
    });
    var transfers = [];
    function match(outgoing, incoming, scope) {
      outgoing.sort(function(a, b) { return b.remaining - a.remaining || a.row.warehouse.localeCompare(b.row.warehouse, 'zh-CN'); });
      incoming.sort(function(a, b) { return b.remaining - a.remaining || a.row.warehouse.localeCompare(b.row.warehouse, 'zh-CN'); });
      while (outgoing.length && incoming.length) {
        var outIndex = 0;
        var inIndex = 0;
        outgoing.some(function(source, sourceIndex) {
          var destinationIndex = incoming.findIndex(function(destination) { return destination.remaining === source.remaining; });
          if (destinationIndex === -1) return false;
          outIndex = sourceIndex;
          inIndex = destinationIndex;
          return true;
        });
        var from = outgoing[outIndex];
        var to = incoming[inIndex];
        var quantity = Math.min(from.remaining, to.remaining);
        transfers.push({
          sku: from.row.sku,
          fromRegion: from.row.region,
          fromWarehouse: from.row.warehouse,
          toRegion: to.row.region,
          toWarehouse: to.row.warehouse,
          quantity: quantity,
          scope: scope
        });
        from.remaining -= quantity;
        to.remaining -= quantity;
        if (!from.remaining) outgoing.splice(outIndex, 1);
        if (!to.remaining) incoming.splice(inIndex, 1);
        outgoing.sort(function(a, b) { return b.remaining - a.remaining; });
        incoming.sort(function(a, b) { return b.remaining - a.remaining; });
      }
    }
    Array.from(new Set(rows.map(function(row) { return row.region; }))).forEach(function(region) {
      match(sources.filter(function(item) { return item.row.region === region && item.remaining; }),
        destinations.filter(function(item) { return item.row.region === region && item.remaining; }), 'region');
    });
    match(sources.filter(function(item) { return item.remaining; }), destinations.filter(function(item) { return item.remaining; }), 'cross-region');
    return {
      transfers: transfers,
      unmatchedOut: sources.reduce(function(sum, item) { return sum + item.remaining; }, 0),
      unmatchedIn: destinations.reduce(function(sum, item) { return sum + item.remaining; }, 0)
    };
  }

  return { parseRows: parseRows, warehouseRegions: warehouseRegions, provinceRegion: provinceRegion, provinces: provinces, parseProvinceSales: parseProvinceSales, parseDistributionAllocations: parseDistributionAllocations, allocateByShare: allocateByShare, allocateByGroup: allocateByGroup, allocateStockByTurnover: allocateStockByTurnover, allocateStockByTurnoverPack: allocateStockByTurnoverPack, balance: balance, analyze: analyze, summarize: summarize, planTransfers: planTransfers };
});
