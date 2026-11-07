function minutes(time){
  if(!time)return null;
  const [hour,minute]=String(time).split(':').map(Number);
  return Number.isInteger(hour)&&Number.isInteger(minute)?hour*60+minute:null;
}
function shiftMinutes(start,end){
  const a=minutes(start),b=minutes(end);
  if(a===null||b===null||a===b)return 0;
  return (b-a+1440)%1440;
}
function attendanceDetails(schedule,record){
  if(record?.status==='absent')return {minutes:0,late:false,early:false,recorded:true};
  if(record?.status!=='worked')return {minutes:shiftMinutes(schedule.start_time,schedule.end_time),late:false,early:false,recorded:false};
  const plannedStart=minutes(schedule.start_time),plannedEnd=minutes(schedule.end_time);
  let start=minutes(record.actual_start_time),end=minutes(record.actual_end_time);
  if(start===null||end===null)return {minutes:0,late:false,early:false,recorded:false};
  if(plannedStart!==null&&start<plannedStart-720)start+=1440;
  if(end<=start)end+=1440;
  let expectedEnd=plannedEnd;
  if(plannedStart!==null&&expectedEnd!==null&&expectedEnd<=plannedStart)expectedEnd+=1440;
  return {minutes:end-start,late:plannedStart!==null&&start>plannedStart,
    early:expectedEnd!==null&&end<expectedEnd,recorded:true};
}
module.exports={shiftMinutes,attendanceDetails};