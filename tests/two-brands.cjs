const {test}=require('node:test'); const assert=require('node:assert/strict'); const vm=require('node:vm'); const fs=require('node:fs'); const swc=require('next/dist/build/swc');
function loadFields(){const mod={exports:{}};const code=swc.transformSync(fs.readFileSync('app/admin/MarronBookingFields.js','utf8'),{jsc:{parser:{syntax:'ecmascript',jsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}}).code;vm.runInNewContext(code,{module:mod,exports:mod.exports,require:n=>n.includes('marronPricing')?require('../lib/marronPricing.cjs'):require(n),Object});return mod.exports.default;}
function mount(brand){
 let values=[],idx=0,effects=[],mounted=false,writes=[];
 const fixtures={resort_expenses:[{id:'em',store_id:4,expense_month:'2026-10',amount:100},{id:'er',store_id:1,expense_month:'2026-10',amount:30},{id:'old',store_id:4,expense_month:'2026-09',amount:9999}],resort_customers:[{id:'a',name:'MarroN only',phone:'1',uses_marron:true,uses_resort_style:false},{id:'b',name:'Resort only',phone:'2',uses_marron:false,uses_resort_style:true},{id:'c',name:'Both',phone:'3',uses_marron:true,uses_resort_style:true}],resort_bookings:[{id:'r',store_id:1,customer_id:'b',booking_date:'2026-10-24',status:'completed',total_amount:100,therapist_payout:20},{id:'m',store_id:4,customer_id:'a',booking_date:'2026-10-24',status:'completed',total_amount:500,therapist_payout:100}]};
 const supabase={from(table){let ids;return {select(){return this},order(){return this},in(key,v){ids=v;return this},insert(payload){writes.push({table,payload});return this},update(payload){writes.push({table,payload});return this},eq(){return this},then(resolve){return Promise.resolve({data:(fixtures[table]||[]).filter(r=>!ids||ids.includes(r.store_id)),error:null}).then(resolve)}}}};
 const mod={exports:{}};const code=swc.transformSync(fs.readFileSync('app/admin/Operations.js','utf8'),{jsc:{parser:{syntax:'ecmascript',jsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}}).code;
 vm.runInNewContext(code,{exports:mod.exports,module:mod,require(name){if(name.includes('customerSearch'))return require('../lib/customerSearch.cjs');if(name.includes('ExpensesPanel'))return {__esModule:true,default:'expense-panel'};if(name.includes('marronPricing'))return require('../lib/marronPricing.cjs');if(name.includes('MarronBookingFields'))return {__esModule:true,default:loadFields()};if(name==='react')return {useState(v){const i=idx++;if(!(i in values))values[i]=typeof v==='function'?v():v;return [values[i],x=>values[i]=typeof x==='function'?x(values[i]):x]},useMemo:f=>f(),useCallback:f=>f,useEffect(f){if(!mounted)effects.push(f)}};if(name.includes('supabase'))return {supabase};return require(name)},Date,Intl,Set,console});
 const props={brand,stores:[{id:brand==='marron'?4:1,name:brand}],therapists:[{id:'cast',name:'Cast'}],schedules:[],notify:()=>{}};
 function expand(n){if(!n||typeof n!=='object')return n;if(Array.isArray(n))return n.map(expand);if(typeof n.type==='function')return expand(n.type(n.props));return {...n,props:{...n.props,children:expand(n.props.children)}}}
 function render(){idx=0;const t=mod.exports.default(props);mounted=true;return expand(t)}
 render();effects.forEach(f=>f());return {render,writes};
}
function all(tree,predicate){if(!tree||typeof tree!=='object')return [];if(Array.isArray(tree))return tree.flatMap(n=>all(n,predicate));return [...(predicate(tree)?[tree]:[]),...all(tree.props?.children,predicate)]}
const text=n=>typeof n==='string'?n:Array.isArray(n)?n.map(text).join(''):n&&typeof n==='object'?text(n.props?.children):'';
const flush=()=>new Promise(r=>setImmediate(r));
for(const brand of ['marron','resort-style'])test(`${brand}: customer flags and bookings are scoped`,async()=>{
 const m=mount(brand);await flush();let tree=m.render();const buttons=all(tree,n=>n.type==='button');buttons.find(n=>text(n)==='顧客管理').props.onClick();tree=m.render();const shown=text(tree);assert.ok(shown.includes('Both'));assert.ok(shown.includes(brand==='marron'?'MarroN only':'Resort only'));assert.ok(!shown.includes(brand==='marron'?'Resort only':'MarroN only'));
 for(const [label,value]of [['名前','Test'],['電話番号','09900000003']]){const node=all(m.render(),n=>n.type==='label'&&Array.isArray(n.props.children)&&n.props.children[0]===label)[0];all(node,n=>n.type==='input')[0].props.onChange({target:{value}});}
 await all(m.render(),n=>n.type==='form')[0].props.onSubmit({preventDefault(){}});assert.equal(m.writes[0].payload.uses_marron,brand==='marron');assert.equal(m.writes[0].payload.uses_resort_style,brand==='resort-style');
 const checks=all(tree,n=>n.type==='input'&&n.props.type==='checkbox');assert.equal(checks[1].props.checked,brand==='marron');assert.equal(checks[2].props.checked,brand==='resort-style');
 checks[brand==='marron'?2:1].props.onChange({target:{checked:true}});tree=m.render();assert.equal(all(tree,n=>n.type==='input'&&n.props.type==='checkbox').filter(n=>n.props.checked).length,2);
 all(tree,n=>n.type==='button').find(n=>text(n)==='予約・会計').props.onClick();tree=m.render();const options=all(tree,n=>n.type==='option');assert.ok(options.some(n=>text(n).includes('Both')));assert.ok(!options.some(n=>text(n).includes(brand==='marron'?'Resort only':'MarroN only')));
});

test('MarroN field order and saved automatic totals match the requested form',async()=>{
 const m=mount('marron');await flush();all(m.render(),n=>n.type==='button').find(n=>text(n)==='予約・会計').props.onClick();
 const fieldNames=['顧客','店舗','ルーム','女の子','日付','開始時間','コース名','延長','割引・割増','オプション料金','キャストバック調整','指名料','支払い方法','状態'];
 const labels=all(m.render(),n=>n.type==='label').map(n=>Array.isArray(n.props.children)?n.props.children[0]:n.props.children).filter(n=>fieldNames.includes(n));assert.deepEqual(labels,fieldNames);
 function set(label,value){const node=all(m.render(),n=>n.type==='label'&&Array.isArray(n.props.children)&&n.props.children[0]===label)[0];const field=all(node,n=>n.type==='select'||n.type==='input')[0];field.props.onChange({target:{value}});}
 set('顧客','a');set('店舗','4');set('女の子','cast');set('開始時間','10:00');set('コース名','新規90分コース');set('延長','40');set('指名料','R2000');
 const shown=text(m.render());assert.ok(shown.includes('130分'));assert.ok(shown.includes('¥24,000'));assert.ok(shown.includes('¥16,000'));
 await all(m.render(),n=>n.type==='form')[0].props.onSubmit({preventDefault(){}});const payload=m.writes.find(w=>w.table==='resort_bookings').payload;
 assert.equal(payload.duration_minutes,130);assert.equal(payload.total_amount,24000);assert.equal(payload.therapist_payout,16000);assert.equal(payload.pricing_version,1);assert.equal(payload.extension_minutes,40);assert.equal(payload.nomination_code,'R2000');
});

for(const [brand,profit,expenses]of [['marron','¥300','¥100'],['resort-style','¥50','¥30']])test(`${brand}: profit subtracts only the selected month and store expenses`,async()=>{const m=mount(brand);await flush();const month=all(m.render(),n=>n.type==='input'&&n.props.type==='month')[0];month.props.onChange({target:{value:'2026-10'}});const cards=all(m.render(),n=>n.type==='article');assert.equal(text(cards.find(n=>text(n).startsWith('利益'))),`利益${profit}`);assert.equal(text(cards.find(n=>text(n).startsWith('経費合計'))),`経費合計${expenses}`);});

test('customer registration requires name/phone but permits empty LINE name',async()=>{
 const m=mount('marron');await flush();all(m.render(),n=>n.type==='button').find(n=>text(n)==='顧客管理').props.onClick();
 function field(label){const l=all(m.render(),n=>n.type==='label'&&Array.isArray(n.props.children)&&n.props.children[0]===label)[0];return all(l,n=>n.type==='input')[0];}
 assert.equal(field('名前').props.required,true);assert.equal(field('電話番号').props.required,true);assert.equal(field('LINE名（任意）').props.required,false);
 field('名前').props.onChange({target:{value:'Test customer'}});field('電話番号').props.onChange({target:{value:'09900000003'}});
 await all(m.render(),n=>n.type==='form')[0].props.onSubmit({preventDefault(){}});
 const payload=m.writes.find(w=>w.table==='resort_customers').payload;assert.equal(payload.line_name,null);assert.equal(payload.name,'Test customer');assert.equal(payload.uses_marron,true);
});

test('booking customer search keeps current selection and excludes other brand customers',async()=>{
 const m=mount('marron');await flush();all(m.render(),n=>n.type==='button').find(n=>text(n)==='予約・会計').props.onClick();
 const label=all(m.render(),n=>n.type==='label'&&Array.isArray(n.props.children)&&n.props.children[0]==='顧客')[0];all(label,n=>n.type==='select')[0].props.onChange({target:{value:'a'}});
 const search=()=>all(m.render(),n=>n.type==='input'&&n.props.type==='search')[0];search().props.onChange({target:{value:'Both'}});
 let options=all(m.render(),n=>n.type==='option');assert.ok(options.some(n=>text(n).includes('Both')));assert.ok(options.some(n=>n.props.value==='a'));assert.ok(!options.some(n=>n.props.value==='b'));
 search().props.onChange({target:{value:'Resort only'}});assert.ok(text(m.render()).includes('一致する顧客がいません'));assert.ok(all(m.render(),n=>n.type==='option').some(n=>n.props.value==='a'));
 all(m.render(),n=>n.type==='button'&&n.props.children==='検索をクリア')[0].props.onClick();assert.equal(search().props.value,'');
});
