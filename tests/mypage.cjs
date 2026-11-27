const {createRequire}=require('node:module');const {resolve}=require('node:path');
const sourceRequire=createRequire(resolve('app/mypage/page.js'));
const {test}=require('node:test');const assert=require('node:assert/strict');const vm=require('node:vm');const fs=require('node:fs');const swc=require('next/dist/build/swc');
const flush=()=>new Promise(r=>setImmediate(r));
function all(n,p){if(!n||typeof n!=='object')return [];if(Array.isArray(n))return n.flatMap(x=>all(x,p));return [...(p(n)?[n]:[]),...all(n.props?.children,p)]}
const text=n=>typeof n==='string'?n:Array.isArray(n)?n.map(text).join(''):n&&typeof n==='object'?text(n.props?.children):'';
function mount({next=[],bookings=[],rpcOverride}={}){
 let states=[],idx=0,effects=[],mounted=false,timers=[],listeners={},calls=[];
 const fixture={therapist:{name:'Synthetic'},today_salary:{confirmed:6000,expected:3000},month_stats:{payout:6000},today_bookings:bookings,next_schedules:next,request_stores:[{id:1,name:'豊橋店'}],requests:[],issued_accounts:[{id:'account-a',platform:'x',brand_code:'resort-style',login_id:'test-id'}]};
 const supabase={async rpc(name,args){calls.push({name,args});if(rpcOverride){const value=await rpcOverride(name,args);if(value)return value;}return {data:name==='resort_work_state'?{}:args.p_action==='overview'?fixture:args.p_action==='reveal_account'?{password:'synthetic-secret'}:{ok:true},error:null}}};
 const doc={hidden:false,addEventListener:(n,f)=>listeners[n]=f,removeEventListener:n=>delete listeners[n]};const mod={exports:{}};
 const code=swc.transformSync(fs.readFileSync('app/mypage/page.js','utf8'),{jsc:{parser:{syntax:'ecmascript',jsx:true},transform:{react:{runtime:'automatic'}}},module:{type:'commonjs'}}).code;
 vm.runInNewContext(code,{module:mod,exports:mod.exports,require:n=>n==='react'?{useState(v){const i=idx++;if(!(i in states))states[i]=typeof v==='function'?v():v;return [states[i],x=>states[i]=typeof x==='function'?x(states[i]):x]},useRef(v){const i=idx++;if(!(i in states))states[i]={current:v};return states[i]},useEffect(f){if(!mounted)effects.push(f)}}:n.includes('supabase')?{supabase,therapistImageUrl:()=>''}:sourceRequire(n),localStorage:{getItem:()=> 'synthetic-token',setItem(){},removeItem(){}},document:doc,setTimeout:f=>{timers.push(f);return timers.length},clearTimeout(){},Date,Intl,console});
 function render(){idx=0;const n=mod.exports.default();mounted=true;return n}render();effects.forEach(f=>f());return {render,calls,doc,listeners,timers,fixture};
}
test('today salary and next shift prompt lead to request form; submits no therapist identity',async()=>{
 const m=mount();await flush();assert.ok(text(m.render()).includes('本営業日の給料（会計済み）¥6,000'));assert.ok(text(m.render()).includes('予約分の見込み：¥3,000'));
 all(m.render(),n=>n.type==='button'&&text(n)==='今すぐ出勤申請')[0].props.onClick();
 const fields=[['select','1'],['date','2026-12-01'],['time','10:00'],['time','18:00']];
 for(const [i,[type,value]]of fields.entries()){let n=type==='select'?all(m.render(),n=>n.type==='select')[0]:all(m.render(),n=>n.type==='input'&&n.props.type===type)[i===3?1:0];n.props.onChange({target:{value}})}
 await all(m.render(),n=>n.type==='form')[0].props.onSubmit({preventDefault(){}});
 const call=m.calls.find(c=>c.args.p_action==='request_shift');assert.equal(call.args.p_data.store_id,'1');assert.equal(call.args.p_data.therapist_id,undefined);assert.ok(text(m.render()).includes('店舗の承認後に出勤が確定します'));
});
test('confirmed next shift shows regardless of selected report month',async()=>{const m=mount({next:[{id:'shift',work_date:'2027-01-05',start_time:'10:00',end_time:'18:00',store_name:'豊橋店'}]});await flush();assert.ok(text(m.render()).includes('2027-01-05'));assert.equal(all(m.render(),n=>n.type==='button'&&text(n)==='今すぐ出勤申請').length,0)});
test('password requires explicit reveal and hides on visibility change, timeout and navigation',async()=>{
 const m=mount();await flush();all(m.render(),n=>n.type==='button'&&text(n)==='マイアカウント')[0].props.onClick();assert.ok(!text(m.render()).includes('synthetic-secret'));assert.equal(m.calls.filter(c=>c.args.p_action==='reveal_account').length,0);
 const reveal=()=>all(m.render(),n=>n.type==='button'&&text(n)==='パスワードを確認する')[0].props.onClick();await reveal();assert.ok(text(m.render()).includes('synthetic-secret'));
 m.doc.hidden=true;m.listeners.visibilitychange();assert.ok(!text(m.render()).includes('synthetic-secret'));m.doc.hidden=false;await reveal();m.timers.at(-1)();assert.ok(!text(m.render()).includes('synthetic-secret'));
 await reveal();all(m.render(),n=>n.type==='button'&&text(n)==='ホーム')[0].props.onClick();all(m.render(),n=>n.type==='button'&&text(n)==='マイアカウント')[0].props.onClick();assert.ok(!text(m.render()).includes('synthetic-secret'));
});
test('late password response after navigation is ignored',async()=>{
 let resolve;const m=mount({rpcOverride:(_n,a)=>a.p_action==='reveal_account'?new Promise(r=>resolve=r):null});await flush();all(m.render(),n=>n.type==='button'&&text(n)==='マイアカウント')[0].props.onClick();const pending=all(m.render(),n=>n.type==='button'&&text(n)==='パスワードを確認する')[0].props.onClick();all(m.render(),n=>n.type==='button'&&text(n)==='ホーム')[0].props.onClick();resolve({data:{password:'synthetic-secret'}});await pending;all(m.render(),n=>n.type==='button'&&text(n)==='マイアカウント')[0].props.onClick();assert.ok(!text(m.render()).includes('synthetic-secret'));
});

test('rapid work start presses send one RPC and update state only after success',async()=>{
 let finish;const id='synthetic-booking';const m=mount({bookings:[{id,booking_date:'2026-11-27',start_time:'14:00',duration_minutes:60,course_name:'匿名コース',status:'reserved',therapist_payout:1000}],rpcOverride:(name)=>name==='resort_work_action'?new Promise(r=>finish=r):null});
 await flush();const start=()=>all(m.render(),n=>n.type==='button'&&text(n)==='お仕事開始')[0];const first=start().props.onClick();start().props.onClick();assert.equal(m.calls.filter(c=>c.name==='resort_work_action').length,1);assert.equal(start().props.disabled,true);finish({data:{started_at:'2026-11-27T05:00:00Z',ended_at:null},error:null});await first;assert.ok(text(m.render()).includes('接客中'));assert.equal(m.calls.filter(c=>c.name==='resort_admin_save_booking').length,0);
});
test('late room response cannot restore private state after logout',async()=>{
 let finish;const m=mount({rpcOverride:name=>name==='resort_room_availability'?new Promise(r=>finish=r):null});await flush();const room=all(m.render(),n=>n.type==='button'&&text(n)==='ルーム空き')[0];room.props.onClick();assert.equal(m.calls.filter(c=>c.name==='resort_room_availability').length,1);const logout=all(m.render(),n=>n.type==='button'&&text(n)==='ログアウト')[0].props.onClick();finish({data:[],error:null});await logout;assert.ok(text(m.render()).includes('ログインID'));assert.ok(!text(m.render()).includes('ルーム空き状況'));
});
test('older room result cannot replace the later selected business day',async()=>{
 const pending=[];const m=mount({rpcOverride:name=>name==='resort_room_availability'?new Promise(resolve=>pending.push(resolve)):null});await flush();
 all(m.render(),n=>n.type==='button'&&text(n)==='ルーム空き')[0].props.onClick();
 const dayButtons=()=>all(m.render(),n=>n.type==='button'&&n.props['aria-pressed']!==undefined);
 const later=dayButtons()[1];later.props.onClick();
 const calls=m.calls.filter(c=>c.name==='resort_room_availability');assert.equal(calls.length,2);
 pending[1]({data:[],error:null});await flush();
 assert.equal(dayButtons()[1].props['aria-pressed'],true);
 pending[0]({data:[],error:null});await flush();
 assert.equal(dayButtons()[1].props['aria-pressed'],true);
});
