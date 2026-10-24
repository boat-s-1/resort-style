const {test}=require('node:test');const assert=require('node:assert/strict');
const {COURSES,NOMINATIONS,calculateMarron}=require('../lib/marronPricing.cjs');
const base={course_name:'新規70分コース',nomination_code:'なし',extension_minutes:0,option_fee:0,price_adjustment:0,payout_adjustment:0};
test('all eight course prices, durations and payouts match supplied tariff',()=>{
 const expected=[[70,11500,6000],[90,14000,8000],[60,12000,6000],[80,14500,8000],[100,17000,10000],[120,19500,12000],[150,24500,15000],[180,29500,18000]];
 COURSES.forEach((course,i)=>{const c=calculateMarron({...base,course_name:course[0]});assert.deepEqual([c.duration_minutes,c.total_amount,c.therapist_payout],expected[i]);});
});
test('extensions add time, price and payout for every course',()=>{for(const course of COURSES)for(const [minutes,price,payout]of [[0,0,0],[20,4000,3000],[40,8000,6000],[60,12000,9000]]){const c=calculateMarron({...base,course_name:course[0],extension_minutes:minutes});assert.equal(c.duration_minutes,course[1]+minutes);assert.equal(c.total_amount,course[2]+price);assert.equal(c.therapist_payout,course[3]+payout);}});
test('P fees stay with store; R fees are paid to cast',()=>{for(const[n,price,payout]of NOMINATIONS){const c=calculateMarron({...base,nomination_code:n});assert.equal(c.total_amount,11500+price);assert.equal(c.therapist_payout,6000+payout);}});
test('combined example: new90 + 40min + R2000 + options/discount/back adjustment',()=>{const c=calculateMarron({...base,course_name:'新規90分コース',extension_minutes:40,nomination_code:'R2000',option_fee:1500,price_adjustment:-500,payout_adjustment:1000});assert.equal(c.duration_minutes,130);assert.equal(c.total_amount,25000);assert.equal(c.therapist_payout,17000);assert.equal(c.store_amount,8000);assert.equal(c.discount,500);});
test('surcharge and negative payout adjustment have the requested signs',()=>{const c=calculateMarron({...base,price_adjustment:500,payout_adjustment:-500});assert.equal(c.total_amount,12000);assert.equal(c.therapist_payout,5500);});
test('invalid course, fractions, negative options and negative resulting totals are rejected',()=>{for(const patch of [{course_name:''},{nomination_code:'bad'},{extension_minutes:30},{option_fee:-1},{option_fee:1.5},{price_adjustment:-999999},{payout_adjustment:-999999}])assert.throws(()=>calculateMarron({...base,...patch}));});
