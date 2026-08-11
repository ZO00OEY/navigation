const assert = require('assert');
const fs = require('fs');
const path = require('path');

const html = fs.readFileSync(path.join(__dirname, '..', 'tools', 'JD', 'data-analysis.html'), 'utf8');
const start = html.indexOf('window.jdDataAccess = Object.freeze({');
const end = html.indexOf('\n  });', start);

assert(start !== -1 && end !== -1, 'missing jdDataAccess');
const api = html.slice(start, end);
assert(api.includes('status: function()'), 'missing status method');
assert(api.includes('read: function(store)'), 'missing read method');
assert(api.includes('url: location.href'), 'status must identify the database origin');
assert(api.includes('userAgent: navigator.userAgent'), 'status must identify the browser');
assert(api.includes('db.objectStoreNames.contains(store)'), 'store name must be validated');
assert(!/\b(?:put|remove|clearStore)\s*\(/.test(api), 'diagnostic API must stay read-only');

console.log('jd data access checks passed');
