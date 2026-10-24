const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const swc = require('next/dist/build/swc');
function mount(path, auth) {
  let values = [], index = 0, effect, mounted = false;
  const hooks = { useState(initial) { const i = index++; if (!(i in values)) values[i] = initial; return [values[i], v => { values[i] = v; }]; }, useEffect(fn) { if (!mounted) effect = fn; } };
  const module = { exports: {} };
  const code = swc.transformSync(fs.readFileSync(path, 'utf8'), { jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } }, module: { type: 'commonjs' } }).code;
  const history = [];
  vm.runInNewContext(code, { module, exports: module.exports, window: { location: { origin: 'https://www.resort-style.net' }, history: { replaceState(...args) { history.push(args); } } }, require(name) { if (name === 'react') return hooks; if (name.includes('supabase')) return { supabase: { auth } }; if (name.includes('AuthPanel')) return 'panel'; return require(name); } });
  const render = () => { index = 0; const tree = module.exports.default(); mounted = true; return tree; };
  render();
  return { render, effect: () => effect(), history };
}
function find(tree, type) {
  if (!tree || typeof tree !== 'object') return;
  if (tree.type === type) return tree;
  for (const child of [tree.props?.children].flat(Infinity)) { const found = find(child, type); if (found) return found; }
}
function inputs(tree) {
  const out = [];
  function visit(n) { if (!n || typeof n !== 'object') return; if (n.type === 'input') out.push(n); [n.props?.children].flat(Infinity).forEach(visit); }
  visit(tree); return out;
}
const flush = () => new Promise(resolve => setImmediate(resolve));
const event = { preventDefault() {} };
test('no session or invalid server user cannot change password', async () => {
  for (const session of [null, {}]) {
    const m = mount('app/reset-password/page.js', { getSession: async () => ({ data: { session } }), getUser: async () => ({ data: {}, error: {} }) });
    m.effect(); await flush(); assert.equal(find(m.render(), 'form'), undefined); assert.equal(m.history[0][2], '/reset-password');
  }
});
test('verified session: mismatch blocked, valid update succeeds and signs out', async () => {
  let updates = 0, signedOut = 0;
  const m = mount('app/reset-password/page.js', { getSession: async () => ({ data: { session: {} } }), getUser: async () => ({ data: { user: { id: 'test' } } }), updateUser: async () => { updates++; return {}; }, signOut: async () => { signedOut++; return {}; } });
  m.effect(); await flush();
  let tree = m.render(); inputs(tree)[0].props.onChange({ target: { value: 'example-test-password' } }); inputs(tree)[1].props.onChange({ target: { value: 'different-password' } });
  await find(m.render(), 'form').props.onSubmit(event); assert.equal(updates, 0);
  inputs(m.render())[1].props.onChange({ target: { value: 'example-test-password' } });
  await find(m.render(), 'form').props.onSubmit(event); assert.equal(updates, 1); assert.equal(signedOut, 1); assert.equal(find(m.render(), 'form'), undefined);
});
test('Auth rejection keeps form available with an error', async () => {
  const m = mount('app/reset-password/page.js', { getSession: async () => ({ data: { session: {} } }), getUser: async () => ({ data: { user: {} } }), updateUser: async () => ({ error: {} }) });
  m.effect(); await flush(); inputs(m.render()).forEach(i => i.props.onChange({ target: { value: 'example-test-password' } }));
  await find(m.render(), 'form').props.onSubmit(event); assert.ok(find(m.render(), 'form')); assert.match(JSON.stringify(m.render()), /変更できませんでした/);
});
test('recovery email uses canonical path and prevents repeated sends', async () => {
  let sends = 0;
  const m = mount('app/forgot-password/page.js', { resetPasswordForEmail: async (email, options) => { sends++; assert.equal(email, 'uuu1946@gmail.com'); assert.equal(options.redirectTo, 'https://www.resort-style.net/reset-password'); return {}; } });
  await find(m.render(), 'form').props.onSubmit(event); await find(m.render(), 'form').props.onSubmit(event); assert.equal(sends, 1);
});
