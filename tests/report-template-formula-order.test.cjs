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
console.log('report template formula order tests passed');
