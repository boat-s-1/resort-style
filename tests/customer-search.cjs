const {test}=require('node:test');const assert=require('node:assert/strict');const {filterCustomers,customerOptions}=require('../lib/customerSearch.cjs');
const rows=[{id:'a',name:'山田 太郎',phone:'090-1234-5678',line_name:'Taro'},{id:'b',name:'佐藤',phone:'08099998888',line_name:'Hanako'}];
test('name, LINE, partial phone and full-width/hyphenated phone searches',()=>{for(const query of ['山田','TARO','1234','０９０１２３４','090-1234','山田 taro'])assert.deepEqual(filterCustomers(rows,query).map(c=>c.id),['a']);});
test('empty query returns all; no match and punctuation-only queries return none',()=>{assert.equal(filterCustomers(rows,' ').length,2);assert.equal(filterCustomers(rows,'missing').length,0);assert.equal(filterCustomers(rows,'---').length,0);});
test('selected customer is preserved only when in the current brand list',()=>{assert.deepEqual(customerOptions(rows,[rows[1]],'a').map(c=>c.id),['a','b']);assert.deepEqual(customerOptions(rows,[rows[1]],'other').map(c=>c.id),['b']);});
