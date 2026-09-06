const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const XLSX = require('../tools/JD/supply-chain/vendor/xlsx.full.min.js');

const html = fs.readFileSync('tools/JD/data-analysis.html', 'utf8');
const context = { XLSX };
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

[
  'normalizeDateValue',
  'extractDatesFromText',
  'normalizeHeader',
  'worksheetToMatrix',
  'matrixToObjects',
  'exactRowValue',
  'offsiteCpsFileKind',
  'isAuthoritativeOffsiteCpsKind',
  'offsiteCpsRecordKind',
  'canReplaceOffsiteCpsRecord',
  'offsiteCpsSheetDate',
  'offsiteCpsRowInput',
  'flattenOffsiteCpsSheets'
].forEach(runFunction);

assert.equal(context.offsiteCpsFileKind('账户报表.xlsx'), 'account_report');
assert.equal(context.offsiteCpsFileKind('结算信息_202608.xlsx'), 'settlement');
assert.equal(context.offsiteCpsFileKind('下单订单明细091223.csv'), 'order_detail');
assert.equal(context.offsiteCpsSheetDate('退货返款20260824_3_0'), '2026-08-24');

const rows = context.flattenOffsiteCpsSheets([
  {
    name: '正常扣费_0',
    rows: [{ 商品编号: '1001', 完成日期: '2026-08-24', 总佣金: '100.00', 订单号: 'A1' }]
  },
  {
    name: '退货返款_0',
    rows: [{ 商品编号: '1001', 返款日期: '2026-08-24', 返款金额: '-20.00', 订单号: 'A2' }]
  }
]);
const accountInputs = rows.map((row) => context.offsiteCpsRowInput(row, 'account_report'));
assert.deepEqual(JSON.parse(JSON.stringify(accountInputs.map((item) => item.dateValue))), ['2026-08-24', '2026-08-24']);
assert.equal(accountInputs.reduce((total, item) => total + Number(item.costValue), 0), 80);

const settlementInput = context.offsiteCpsRowInput({
  __sheetName: '退货返款20260825_3_0',
  商品编号: '1001',
  完成日期: '2026-08-16',
  返款日期: '2026-08-25',
  返款金额: '-12.34'
}, 'settlement');
assert.equal(settlementInput.dateValue, '2026-08-25');
assert.equal(settlementInput.costValue, '-12.34');

assert.equal(context.canReplaceOffsiteCpsRecord({ extraMetrics: { cpsSource: 'order_detail' } }, 'account_report'), true);
assert.equal(context.canReplaceOffsiteCpsRecord({ extraMetrics: { cpsSource: 'account_report' } }, 'order_detail'), false);
assert.equal(context.canReplaceOffsiteCpsRecord({ extraMetrics: { cpsSource: 'settlement' } }, 'account_report'), true);

assert.match(html, /下单订单明细 \/ 账户报表 \/ 结算信息/);
assert.match(html, /offsiteSheets \? flattenOffsiteCpsSheets\(offsiteSheets\) : await parseWorkbook\(file\)/);
assert.match(html, /var protectedDates = \{\};[\s\S]*isAuthoritativeOffsiteCpsKind\(offsiteCpsRecordKind\(item\)\)/);
assert.match(html, /return !protectedDates\[row\.startDate\];/);

function cpsTotalsFromWorkbook(filePath, fileKind) {
  const workbook = XLSX.read(fs.readFileSync(filePath), { type: 'buffer' });
  const sheets = workbook.SheetNames.map((name) => ({
    name,
    rows: context.matrixToObjects(context.worksheetToMatrix(workbook.Sheets[name]))
  }));
  return context.flattenOffsiteCpsSheets(sheets).reduce((totals, row) => {
    const input = context.offsiteCpsRowInput(row, fileKind);
    const date = fileKind === 'settlement' ? input.dateValue : String(input.dateValue || '').slice(0, 10);
    if (date && input.skuValue) totals[date] = (totals[date] || 0) + Number(input.costValue || 0);
    return totals;
  }, {});
}

if (process.argv[2] && process.argv[3]) {
  const accountTotals = cpsTotalsFromWorkbook(process.argv[2], 'account_report');
  const settlementTotals = cpsTotalsFromWorkbook(process.argv[3], 'settlement');
  assert.deepEqual(Object.keys(accountTotals), ['2026-08-24']);
  assert.equal(Math.round(accountTotals['2026-08-24'] * 100), 278199);
  assert.deepEqual(Object.keys(settlementTotals).sort(), [
    '2026-08-21', '2026-08-22', '2026-08-23', '2026-08-24', '2026-08-25', '2026-08-26'
  ]);
  assert.equal(Math.round(settlementTotals['2026-08-24'] * 100), 278199);
}

console.log('offsite CPS account report and settlement checks passed');
