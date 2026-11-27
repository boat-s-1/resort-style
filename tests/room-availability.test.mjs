import test from 'node:test';
import assert from 'node:assert/strict';
import { addBusinessDays, businessDays, slotLabel, readSafeAvailability } from '../lib/roomAvailability.mjs';

test('10:00 to next 05:00 has 38 half-hour slots, including leap and month boundary', () => {
  assert.equal(slotLabel(0), '10:00');
  assert.equal(slotLabel(28), '00:00');
  assert.equal(slotLabel(38), '05:00');
  assert.deepEqual(businessDays('2028-02-27').slice(0, 4), ['2028-02-27', '2028-02-28', '2028-02-29', '2028-03-01']);
  assert.equal(addBusinessDays('2026-11-30', 1), '2026-12-01');
});

test('room RPC projection accepts only four anonymous states and six approved keys', () => {
  const good = {business_date:'2026-11-27',store_id:1,store_name:'豊橋',brand_code:'resort-style',room_number:1,slots:Array(38).fill('busy')};
  assert.equal(readSafeAvailability([good], good.business_date)[0].slots[0], 'busy');
  for (const extra of [{therapist_id:'other'}, {customer_name:'secret'}, {booking_id:'private'}])
    assert.throws(() => readSafeAvailability([{...good,...extra}], good.business_date));
  assert.throws(() => readSafeAvailability([{...good,slots:['available']}], good.business_date));
  assert.throws(() => readSafeAvailability([good], '2026-11-28'));
});
