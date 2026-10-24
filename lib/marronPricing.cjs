const COURSES = [
  ['新規70分コース',70,11500,6000],['新規90分コース',90,14000,8000],
  ['60分コース',60,12000,6000],['80分コース',80,14500,8000],
  ['100分コース',100,17000,10000],['120分コース',120,19500,12000],
  ['150分コース',150,24500,15000],['180分コース',180,29500,18000],
];
const NOMINATIONS = [['なし',0,0],['P500',500,0],['P1000',1000,0],['R1000',1000,1000],['R2000',2000,2000]];
function calculateMarron(booking) {
  const course=COURSES.find(c=>c[0]===booking.course_name);
  const nomination=NOMINATIONS.find(n=>n[0]===booking.nomination_code);
  const extension=Number(booking.extension_minutes||0);
  const option=Number(booking.option_fee||0), adjustment=Number(booking.price_adjustment||0), payoutAdjustment=Number(booking.payout_adjustment||0);
  if(!course||!nomination||![0,20,40,60].includes(extension)) throw new Error('コース・延長・指名料を選択してください。');
  if(![option,adjustment,payoutAdjustment].every(n=>Number.isSafeInteger(n)&&Math.abs(n)<=2147483647)||option<0) throw new Error('料金と調整額は整数で入力してください。');
  const total=course[2]+extension/20*4000+nomination[1]+option+adjustment;
  const payout=course[3]+extension/20*3000+nomination[2]+payoutAdjustment;
  if(total<0||payout<0||Math.max(total,payout)>2147483647) throw new Error('支払い額とキャストバックは0円以上で入力してください。');
  return {duration_minutes:course[1]+extension,base_price:course[2],nomination_fee:nomination[1],extension_fee:extension/20*4000,discount:Math.max(0,-adjustment),therapist_payout:payout,total_amount:total,store_amount:total-payout};
}
module.exports={COURSES,NOMINATIONS,calculateMarron};
