const {test}=require('node:test'); const assert=require('node:assert/strict'); const vm=require('node:vm'); const fs=require('node:fs'); const swc=require('next/dist/build/swc');
function mount(brand){
 let values=[],idx=0,effects=[],mounted=false,writes=[];
 const fixtures={resort_customers:[{id:'a',name:'MarroN only',phone:'1',uses_marron:true,uses_resort_style:false},{id:'b',name:'Resort only',phone:'2',uses_marron:false,uses_resort_style:true},{id:'c',name:'Both',phone:'3',uses_marron:true,uses_resort_style:true}],resort_bookings:[{id:'r',store_id:1,customer_id:'b',booking_date:'2026-10-24',status:'completed',total_amount:100,therapist_payout:20},{id:'m',store_id:4,customer_id:'a',booking_date:'2026-10-24',status:'completed',total_amount:500,therapist_payout:100}]};
 const supabase={from(table){let ids;return {select(){return this},order(){return this},in(key,v){ids=v;return this},insert(payload){writes.push({table,payload});return this},update(payload){writes.push({table,payload});return this},eq(){return this},then(resolve){return Promise.resolve({data:(fixtures[table]||[]).filter(r=>!ids||ids.includes(r.store_id)),error:null}).then(resolve)}}}};
 const mod={exports:{}};const code=swc.transformSync(fs.readFileSync('app/admin/Operations.js','utf8'),{jsc:{parser:{syntax:'ecmascript',jsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}}).code;
 vm.runInNewContext(code,{exports:mod.exports,module:mod,require(name){if(name==='react')return {useState(v){const i=idx++;if(!(i in values))values[i]=typeof v==='function'?v():v;return [values[i],x=>values[i]=typeof x==='function'?x(values[i]):x]},useMemo:f=>f(),useCallback:f=>f,useEffect(f){if(!mounted)effects.push(f)}};if(name.includes('supabase'))return {supabase};return require(name)},Date,Intl,Set,console});
 const props={brand,stores:[{id:brand==='marron'?4:1,name:brand}],therapists:[],schedules:[],notify:()=>{}};
 function expand(n){if(!n||typeof n!=='object')return n;if(Array.isArray(n))return n.map(expand);if(typeof n.type==='function')return expand(n.type(n.props));return {...n,props:{...n.props,children:expand(n.props.children)}}}
 function render(){idx=0;const t=mod.exports.default(props);mounted=true;return expand(t)}
 render();effects.forEach(f=>f());return {render,writes};
}
function all(tree,predicate){if(!tree||typeof tree!=='object')return [];if(Array.isArray(tree))return tree.flatMap(n=>all(n,predicate));return [...(predicate(tree)?[tree]:[]),...all(tree.props?.children,predicate)]}
const text=n=>typeof n==='string'?n:Array.isArray(n)?n.map(text).join(''):n&&typeof n==='object'?text(n.props?.children):'';
const flush=()=>new Promise(r=>setImmediate(r));
for(const brand of ['marron','resort-style'])test(`${brand}: customer flags and bookings are scoped`,async()=>{
 const m=mount(brand);await flush();let tree=m.render();const buttons=all(tree,n=>n.type==='button');buttons.find(n=>text(n)==='顧客管理').props.onClick();tree=m.render();const shown=text(tree);assert.ok(shown.includes('Both'));assert.ok(shown.includes(brand==='marron'?'MarroN only':'Resort only'));assert.ok(!shown.includes(brand==='marron'?'Resort only':'MarroN only'));
 await all(tree,n=>n.type==='form')[0].props.onSubmit({preventDefault(){}});assert.equal(m.writes[0].payload.uses_marron,brand==='marron');assert.equal(m.writes[0].payload.uses_resort_style,brand==='resort-style');
 const checks=all(tree,n=>n.type==='input'&&n.props.type==='checkbox');assert.equal(checks[1].props.checked,brand==='marron');assert.equal(checks[2].props.checked,brand==='resort-style');
 checks[brand==='marron'?2:1].props.onChange({target:{checked:true}});tree=m.render();assert.equal(all(tree,n=>n.type==='input'&&n.props.type==='checkbox').filter(n=>n.props.checked).length,2);
 all(tree,n=>n.type==='button').find(n=>text(n)==='予約・会計').props.onClick();tree=m.render();const options=all(tree,n=>n.type==='option');assert.ok(options.some(n=>text(n).includes('Both')));assert.ok(!options.some(n=>text(n).includes(brand==='marron'?'Resort only':'MarroN only')));
});
