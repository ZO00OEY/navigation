const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const source = fs.readFileSync('tools/JD/data-analysis.html', 'utf8');
const start = source.indexOf('  function sheetCellValue(');
const end = source.indexOf('\n  async function refreshReportTemplatePreviewWorkbook', start);
assert.ok(start !== -1 && end !== -1, 'report formula helpers should exist');

const context = { console };
vm.createContext(context);
vm.runInContext(source.slice(start, end), context);

const template = {
  '!ref': 'G3:W11',
  G3: { f: 'H11', v: 100 },
  W3: { f: 'G3*0.765', v: 76.5 },
  H11: { f: '200', v: 100 }
};
context.applyReportTemplateFormulas({ Sheets: { '模板': template } }, '模板');

assert.equal(template.H11.v, 200);
assert.equal(template.G3.v, 200);
assert.equal(template.W3.v, 153);
assert.equal(template.G3.f, undefined);
console.log('report template formula dependency checks passed');
