// Syntax check: every inline <script> (and every <script src> file) must compile.
// Usage: node test/syntax.js path/to/index.html
const fs = require('fs'), path = require('path'), vm = require('vm');
const entry = process.argv[2] || 'One_Life.html';
const dir = path.dirname(entry);
const html = fs.readFileSync(entry, 'utf8');
let n = 0, bad = 0;
const re = /<script(\s+src="([^"]+)")?\s*>([\s\S]*?)<\/script>/g; let m;
while ((m = re.exec(html))) {
  const name = m[2] || `inline #${n + 1}`;
  const code = m[2] ? fs.readFileSync(path.join(dir, m[2]), 'utf8') : m[3];
  n++;
  try { new vm.Script(code, { filename: name }); }
  catch (e) { bad++; console.log(`FAIL ${name}: ${e.message}`); }
}
// em dash check on game text (working agreement: no em dashes)
const all = [html, ...[...html.matchAll(/<script\s+src="([^"]+)"/g)].map(x => fs.readFileSync(path.join(dir, x[1]), 'utf8'))].join('\n');
const dashes = (all.match(/—/g) || []).length;
console.log(`syntax: ${n} script(s) checked, ${bad} failed. Em dashes found: ${dashes}.`);
process.exit(bad ? 1 : 0);
