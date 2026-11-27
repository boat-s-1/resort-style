const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const swc = require('next/dist/build/swc');
const flush = () => new Promise(resolve => setImmediate(resolve));
function all(node, predicate) {
  if (!node || typeof node !== 'object') return [];
  if (Array.isArray(node)) return node.flatMap(item => all(item, predicate));
  return [...(predicate(node) ? [node] : []), ...all(node.props?.children, predicate)];
}
function mount(rpc) {
  let states = [], index = 0, effects = [], mounted = false;
  const listeners = {}, timers = [];
  class SilentAudioContext { async resume() {} close() {} }
  const module = { exports: {} };
  const supabase = { rpc };
  const source = swc.transformSync(fs.readFileSync('app/admin/WorkNotices.js', 'utf8'), {
    jsc: { parser: { syntax: 'ecmascript', jsx: true }, transform: { react: { runtime: 'automatic' } } },
    module: { type: 'commonjs' },
  }).code;
  vm.runInNewContext(source, {
    module, exports: module.exports,
    require(name) {
      if (name.includes('supabase')) return { supabase };
      if (name === 'react') return {
        useState(value) { const i = index++; if (!(i in states)) states[i] = value; return [states[i], next => states[i] = typeof next === 'function' ? next(states[i]) : next]; },
        useRef(value) { const i = index++; if (!(i in states)) states[i] = { current: value }; return states[i]; },
        useCallback(fn) { index++; return fn; },
        useEffect(fn) { if (!mounted) effects.push(fn); },
      };
      return require(name);
    },
    document: { hidden: false, addEventListener(name, fn) { listeners[name] = fn; }, removeEventListener(name) { delete listeners[name]; } },
    window: { AudioContext: SilentAudioContext },
    setInterval(fn) { timers.push(fn); return timers.length; }, clearInterval() {}, Date, console,
  });
  function render() { index = 0; const tree = module.exports.default(); mounted = true; return tree; }
  render(); effects.forEach(effect => effect());
  return { render, timers, listeners };
}
test('staff notice polling never overlaps, and mark-read uses the notice RPC', async () => {
  let complete, calls = [];
  const notice = { id: 12, kind: 'start', store_name: '匿名店', created_at: '2026-11-27T05:00:00Z', read_at: null };
  const m = mount((name, args) => {
    calls.push({ name, args });
    if (args?.p_mark_read) return Promise.resolve({ data: [{ ...notice, read_at: '2026-11-27T05:01:00Z' }], error: null });
    return new Promise(resolve => { complete = resolve; });
  });
  m.timers[0]();
  assert.equal(calls.length, 1);
  complete({ data: [notice], error: null }); await flush();
  const buttons = all(m.render(), node => node.type === 'button');
  assert.ok(buttons.some(button => button.props.children === '既読にする'));
  buttons.find(button => button.props.children === '既読にする').props.onClick();
  await flush();
  assert.equal(calls.filter(call => call.args?.p_mark_read === 12).length, 1);
  assert.ok(calls.every(call => call.name === 'resort_admin_work_notices'));
});
test('staff notification sound is off until explicitly enabled, and can be disabled', async () => {
  const m = mount(async () => ({ data: [], error: null }));
  await flush();
  const soundButton = () => all(m.render(), node => node.type === 'button')
    .find(button => String(button.props.children).includes('通知音'));
  assert.equal(soundButton().props.children[1], 'OFF');
  await soundButton().props.onClick();
  assert.equal(soundButton().props.children[1], 'ON');
  await soundButton().props.onClick();
  assert.equal(soundButton().props.children[1], 'OFF');
});
