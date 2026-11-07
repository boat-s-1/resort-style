const assert=require('node:assert/strict');
const {test}=require('node:test');
const {attendanceDetails}=require('../lib/attendance.cjs');
test('late arrival and early departure use actual shift minutes',()=>{
 const a=attendanceDetails({start_time:'10:00',end_time:'20:00'},{status:'worked',actual_start_time:'11:00',actual_end_time:'19:00'});
 assert.deepEqual(a,{minutes:480,late:true,early:true,recorded:true});
 assert.equal(Math.round(120/a.minutes*100),25);
});
test('overnight actual times belong to the same shift',()=>{
 const a=attendanceDetails({start_time:'23:00',end_time:'03:00'},{status:'worked',actual_start_time:'00:00',actual_end_time:'02:00'});
 assert.deepEqual(a,{minutes:120,late:true,early:true,recorded:true});
});
test('absence contributes no hours; unrecorded keeps provisional plan',()=>{
 assert.equal(attendanceDetails({start_time:'10:00',end_time:'20:00'},{status:'absent'}).minutes,0);
 const planned=attendanceDetails({start_time:'23:00',end_time:'03:00'});
 assert.equal(planned.minutes,240);
 assert.equal(planned.recorded,false);
});