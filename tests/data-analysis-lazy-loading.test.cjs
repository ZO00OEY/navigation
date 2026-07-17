const assert = require('assert');
const fs = require('fs');

const html = fs.readFileSync('tools/JD/data-analysis.html', 'utf8');
const navigationStart = html.indexOf('async function handlePageNavigation');
const navigation = html.slice(navigationStart, html.indexOf("document.querySelectorAll('.tab-btn')", navigationStart));
const startup = html.slice(html.indexOf('openDb().then'), html.indexOf('}).catch(function(err)', html.indexOf('openDb().then')));

assert.match(startup, /await handlePageNavigation\(currentPage\)/);
assert.doesNotMatch(startup, /loadReportTemplateWorkbookFromDb|loadGrossMarginDashboardTemplateWorkbookFromDb|renderSkus|renderAnalyzedDb/);
assert.match(navigation, /page === 'report'[\s\S]*loadReportTemplateWorkbookFromDb/);
assert.match(navigation, /page === 'finance-data'[\s\S]*loadGrossMarginDashboardTemplateWorkbookFromDb/);
assert.match(navigation, /page === 'db-sku'[\s\S]*normalizeCompetitorSkuDefaults/);

console.log('data-analysis lazy loading checks passed');
