const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('tools/JD/data-analysis.html', 'utf8');
const start = html.indexOf('  function roundReportTemplateValue(');
const end = html.indexOf('\n  async function refreshReportTemplatePreviewWorkbook()', start);
assert.ok(start >= 0 && end > start, '日报模板公式处理函数应存在');

const context = {};
vm.createContext(context);
vm.runInContext(`
  function evaluateReportFormula(formula, workbook, sheetName) {
    const sheet = workbook.Sheets[sheetName];
    if (formula === '6300') return 6300;
    if (formula === '7') return 7;
    if (formula === 'H19+H23') return sheet.H19.v + sheet.H23.v;
    if (formula === 'H11') return sheet.H11.v;
    return null;
  }
${html.slice(start, end)}`, context);

const workbook = { Sheets: { 模板: {
  G3: { f: 'H11', v: 5030.33 },
  H11: { f: 'H19+H23', v: 5030.33 },
  H19: { f: '6300', v: 4000 },
  H23: { f: '7', v: 1030.33 }
} } };

context.applyReportTemplateFormulas(workbook, '模板');

assert.equal(workbook.Sheets.模板.G3.v, 6307, '上层公式应在下游公式更新后重新计算');
assert.equal(workbook.Sheets.模板.G3.f, undefined, '预览单元格最终不应残留公式');

const formatStart = html.indexOf('  function formatReportDataSheet(');
const formatEnd = html.indexOf('\n  async function buildReportDataWorkbook(', formatStart);
assert.ok(formatStart >= 0 && formatEnd > formatStart, '报表数据页格式函数应存在');
const formatContext = { XLSX: { utils: { encode_cell: ({ r, c }) => String.fromCharCode(65 + c) + (r + 1) } } };
vm.createContext(formatContext);
vm.runInContext(html.slice(formatStart, formatEnd), formatContext);
const reportSheet = { A1: { v: '日期' }, B1: { v: '金额' }, A2: { v: '2026-08-07' }, B2: { v: 100 } };
formatContext.formatReportDataSheet(reportSheet, [['日期', '金额'], ['2026-08-07', 100]], [18, 14]);
assert.deepEqual(Array.from(reportSheet['!cols'], column => column.wch), [18, 14], '应写入列宽');
assert.deepEqual(Array.from(reportSheet['!rows'], row => row.hpt), [15, 15], '应写入行高');
assert.equal(reportSheet.A1.s.font.sz, 9, '应写入字号');
assert.equal(reportSheet.A1.s.font.bold, true, '表头应加粗');

const layoutStart = html.indexOf('  function formatTemplateSheetLayout(');
const layoutEnd = html.indexOf('\n  function formatReportDataSheet(', layoutStart);
assert.ok(layoutStart >= 0 && layoutEnd > layoutStart, '模板页格式函数应存在');
const layoutContext = { XLSX: { utils: { decode_range: () => ({ s: { r: 0, c: 0 }, e: { r: 1, c: 1 } }) } } };
vm.createContext(layoutContext);
vm.runInContext(html.slice(layoutStart, layoutEnd), layoutContext);
const templateSheet = {
  '!ref': 'A1:B2', '!rows': [{ hpt: 24 }], '!cols': [{ wch: 20 }],
  A1: { v: '标题', s: { font: { color: { rgb: 'FFFF0000' } }, fill: { fgColor: { rgb: 'FF92D050' } } } },
  B2: { v: 100 }
};
layoutContext.formatTemplateSheetLayout(templateSheet);
assert.equal(templateSheet['!rows'][0].hpt, 15, '应统一已设置的行高');
assert.equal(templateSheet['!rows'][1].hpt, 15, '应补齐缺省行高');
assert.equal(templateSheet['!cols'][0].wch, 20, '应保留已设置的列宽');
assert.equal(templateSheet['!cols'][1].wch, 14, '应补齐缺省列宽');
assert.equal(templateSheet.A1.s.font.name, '微软雅黑');
assert.equal(templateSheet.A1.s.font.sz, 9);
assert.equal(templateSheet.A1.s.font.color.rgb, 'FFFF0000', '应保留字体颜色');
assert.equal(templateSheet.A1.s.fill.fgColor.rgb, 'FF92D050', '应保留填充颜色');
console.log('report template formula order tests passed');
