const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('tools/JD/data-analysis.html', 'utf8');
const context = {};
vm.createContext(context);

function runFunction(name) {
  const start = html.indexOf(`function ${name}(`);
  assert.notEqual(start, -1, `missing ${name}`);
  const body = html.indexOf('{', start);
  let depth = 0;
  for (let i = body; i < html.length; i += 1) {
    if (html[i] === '{') depth += 1;
    if (html[i] === '}' && --depth === 0) {
      vm.runInContext(html.slice(start, i + 1), context);
      return;
    }
  }
  throw new Error(`unterminated ${name}`);
}

runFunction('normalizeDateValue');
runFunction('extractDatesFromText');
runFunction('normalizeImportedDate');
runFunction('canonicalYmd');
runFunction('dateFromYmd');
runFunction('ymd');
runFunction('addDays');
runFunction('daysBetween');
runFunction('searchImportDateRange');
runFunction('searchImportRangeFromImports');
runFunction('rangeText');
runFunction('searchImportHasMultipleDates');
runFunction('searchImportDateRangeText');
runFunction('searchImportDateRangeFromNames');
runFunction('resolveSearchColumn');
runFunction('rowDateBounds');
runFunction('normalizedRange');
runFunction('normalizedQueryRange');
runFunction('searchMetricNumber');
runFunction('searchDimensionGroupKey');
runFunction('searchRangeContains');
runFunction('searchRangesOverlap');
runFunction('selectSearchSegmentRows');
runFunction('sumSearchCustomTerms');
runFunction('buildSearchRangeRow');
runFunction('searchCoverageGroupLabel');
runFunction('summarizeSearchRowsForRange');
runFunction('searchDataCoverageGaps');
runFunction('buildSearchDataAlert');

assert.deepEqual(
  JSON.parse(JSON.stringify(context.searchImportDateRange('关键词分析_20260501~20260531.xlsx'))),
  { start: '2026-05-01', end: '2026-05-31' }
);
assert.deepEqual(
  JSON.parse(JSON.stringify(context.searchImportRangeFromImports([
    { dateRange: { start: '2026-05-01', end: '2026-05-31' } },
    { dateRange: { start: '2026-05-01', end: '2026-05-31' } }
  ]))),
  { start: '2026-05-01', end: '2026-05-31' }
);
assert.equal(context.searchImportRangeFromImports([
  { dateRange: { start: '2026-05-01', end: '2026-05-31' } },
  { dateRange: { start: '2026-06-01', end: '2026-06-30' } }
]), null);
assert.equal(context.searchImportRangeFromImports([
  { dateRange: { start: '2026-05-01', end: '2026-05-31' } },
  { dateRange: null }
]), null);
assert.equal(context.searchImportHasMultipleDates([
  { dateRange: { start: '2026-05-01', end: '2026-05-31' } },
  { dateRange: { start: '2026-06-01', end: '2026-06-30' } }
]), true);
assert.equal(context.searchImportHasMultipleDates([
  { dateRange: { start: '2026-05-01', end: '2026-05-31' } },
  { dateRange: { start: '2026-05-01', end: '2026-05-31' } }
]), false);
assert.equal(context.searchImportDateRangeText(null), '未识别（使用上方日期）');
assert.equal(context.searchImportDateRangeText({ start: '2026-05-01', end: '2026-05-31' }), '2026-05-01 至 2026-05-31');
assert.deepEqual(
  JSON.parse(JSON.stringify(context.searchImportDateRangeFromNames(
    '关键词分析_20260826_153000.zip',
    'exports/关键词分析_20260501~20260531.xlsx'
  ))),
  { start: '2026-05-01', end: '2026-05-31' }
);
assert.equal(context.resolveSearchColumn(['访客占比', '访客数'], ['访客', '访客数']), '访客数');
assert.equal(context.resolveSearchColumn(['成交订单数'], ['子单量', '订单量', '成交订单数']), '成交订单数');

const julySegments = [
  {
    id: 1, sourceType: 'search_analysis', dimensionKey: 'industry', dimensionValue: '女装',
    startDate: '2026-07-01', endDate: '2026-07-07', periodType: 'period',
    visitorCount: 10, orderQty: 1, salesAmount: 100, keywordCount: 2,
    brandVisitorCount: 4, brandOrderQty: 1, brandSalesAmount: 40,
    industryVisitorCount: 6, industryOrderQty: 0, industrySalesAmount: 60,
    searchCustomTerms: [{ id: 'main', title: '核心词', keywordCount: 2, visitorCount: 10, orderQty: 1, salesAmount: 100 }]
  },
  {
    id: 2, sourceType: 'search_analysis', dimensionKey: 'industry', dimensionValue: '女装',
    startDate: '2026-07-08', endDate: '2026-07-14', periodType: 'period',
    visitorCount: 20, orderQty: 2, salesAmount: 200, keywordCount: 3,
    brandVisitorCount: 6, brandOrderQty: 1, brandSalesAmount: 60,
    industryVisitorCount: 14, industryOrderQty: 1, industrySalesAmount: 140,
    searchCustomTerms: [{ id: 'main', title: '核心词', keywordCount: 3, visitorCount: 20, orderQty: 2, salesAmount: 200 }]
  },
  {
    id: 3, sourceType: 'search_analysis', dimensionKey: 'industry', dimensionValue: '女装',
    startDate: '2026-07-15', endDate: '2026-07-31', periodType: 'period',
    visitorCount: 30, orderQty: 3, salesAmount: 300, keywordCount: 4,
    brandVisitorCount: 8, brandOrderQty: 1, brandSalesAmount: 80,
    industryVisitorCount: 22, industryOrderQty: 2, industrySalesAmount: 220,
    searchCustomTerms: [{ id: 'main', title: '核心词', keywordCount: 4, visitorCount: 30, orderQty: 3, salesAmount: 300 }]
  }
];
const completeJuly = context.summarizeSearchRowsForRange(julySegments, { start: '2026-07-01', end: '2026-07-31' });
assert.equal(completeJuly.rows.length, 1);
assert.equal(completeJuly.rows[0].visitorCount, 60);
assert.equal(completeJuly.rows[0].orderQty, 6);
assert.deepEqual(JSON.parse(JSON.stringify(completeJuly.rows[0].sourceIds)), [1, 2, 3]);
assert.equal(completeJuly.segmentedCount, 1);
assert.deepEqual(JSON.parse(JSON.stringify(completeJuly.coverageGaps)), []);
assert.deepEqual(JSON.parse(JSON.stringify(completeJuly.globalCoverageGaps)), []);
assert.deepEqual(JSON.parse(JSON.stringify(context.searchDataCoverageGaps({ start: '2026-07-01', end: '2026-07-31' }, completeJuly.segmentRanges))), []);
assert.equal(completeJuly.rows[0].searchCustomTerms[0].conversionRate, 0.1);
assert.match(context.buildSearchDataAlert(completeJuly, { start: '2026-07-01', end: '2026-07-31' }, []), /由分段数据求和：2026-07-01 至 2026-07-07、2026-07-08 至 2026-07-14/);

const incompleteJuly = context.summarizeSearchRowsForRange([julySegments[0], julySegments[2]], { start: '2026-07-01', end: '2026-07-31' });
const julyGaps = context.searchDataCoverageGaps({ start: '2026-07-01', end: '2026-07-31' }, incompleteJuly.segmentRanges);
assert.deepEqual(JSON.parse(JSON.stringify(incompleteJuly.coverageGaps)), [{ start: '2026-07-08', end: '2026-07-14', groups: ['industry=女装'] }]);
assert.deepEqual(JSON.parse(JSON.stringify(julyGaps)), [{ start: '2026-07-08', end: '2026-07-14' }]);
assert.match(context.buildSearchDataAlert(incompleteJuly, { start: '2026-07-01', end: '2026-07-31' }, incompleteJuly.coverageGaps), /按全部汇总行的分段并集判断，可能缺少数据：2026-07-08 至 2026-07-14/);

const mixedDimensionJuly = context.summarizeSearchRowsForRange(julySegments.concat({
  ...julySegments[0], id: 10, dimensionKey: 'mainSeries', dimensionLabel: '大系列', dimensionValue: '连衣裙'
}), { start: '2026-07-01', end: '2026-07-31' });
assert.deepEqual(JSON.parse(JSON.stringify(mixedDimensionJuly.globalCoverageGaps)), []);
assert.match(context.buildSearchDataAlert(mixedDimensionJuly, { start: '2026-07-01', end: '2026-07-31' }, mixedDimensionJuly.coverageGaps), /整体分段已覆盖所选范围，但部分维度可能缺少数据：2026-07-08 至 2026-07-31（大系列=连衣裙）/);

const exactJuly = context.summarizeSearchRowsForRange(julySegments.concat({
  id: 9, sourceType: 'search_analysis', dimensionKey: 'industry', dimensionValue: '女装',
  startDate: '2026-07-01', endDate: '2026-07-31', periodType: 'period', visitorCount: 999,
  orderQty: 99, salesAmount: 9999
}), { start: '2026-07-01', end: '2026-07-31' });
assert.equal(exactJuly.rows[0].visitorCount, 999);
assert.deepEqual(JSON.parse(JSON.stringify(exactJuly.rows[0].sourceIds)), [9]);
assert.equal(exactJuly.segmentedCount, 0);
assert.equal(exactJuly.hasSegmentAlternative, true);
const segmentedJuly = context.summarizeSearchRowsForRange(julySegments.concat({
  id: 9, sourceType: 'search_analysis', dimensionKey: 'industry', dimensionValue: '女装',
  startDate: '2026-07-01', endDate: '2026-07-31', periodType: 'period', visitorCount: 999,
  orderQty: 99, salesAmount: 9999
}), { start: '2026-07-01', end: '2026-07-31' }, { showSegmented: true });
assert.equal(segmentedJuly.rows[0].visitorCount, 60);
assert.deepEqual(JSON.parse(JSON.stringify(segmentedJuly.rows[0].sourceIds)), [1, 2, 3]);
assert.equal(segmentedJuly.segmentedCount, 1);

assert.match(html, /jszip\/3\.10\.1\/jszip\.min\.js/);
assert.match(html, /accept="\.xlsx,\.xls,\.csv,\.zip"/);
assert.match(html, /JSZip\.loadAsync\(await file\.arrayBuffer\(\)\)/);
assert.match(html, /entry\.async\('blob'\)/);
assert.match(html, /id="searchBrandModalHead"/);
assert.match(html, /showDateColumn \? '<th>时间范围<\/th>'/);
assert.match(html, /id="searchDataSegmentToggle"/);

console.log('search import zip and title date checks passed');
