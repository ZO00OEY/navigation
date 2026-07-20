const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');

const html = fs.readFileSync('tools/JD/data-analysis.html', 'utf8');
const context = {
  searchAnalysisManualAssignments: { 'mainSeries\n北通盘古': '盘古+配件' },
  normalizeSearchText: text => String(text == null ? '' : text).toLowerCase()
};
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

['compactSearchText', 'searchManualAssignmentKey', 'searchManualAssignmentValue'].forEach(runFunction);

assert.equal(context.searchManualAssignmentValue('mainSeries', '北通 盘古', ['鲲鹏70', '盘古+配件']), '盘古+配件');
assert.equal(context.searchManualAssignmentValue('subSeries', '北通盘古', ['鲲鹏70', '盘古+配件']), '');
assert.equal(context.searchManualAssignmentValue('mainSeries', '北通盘古', ['鲲鹏70']), '');
assert.match(html, /searchManualAssignmentValue\(dim, keyword, values\) \|\| guessSearchBrandValue\(keyword, values\)/);
assert.match(html, /if \(e\.target\.matches\('\[data-search-brand-value\]'\)\) \{\s*row\.dataset\.searchBrandManual = 'true';\s*return;/);
console.log('search brand manual assignment: ok');
