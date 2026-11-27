import { japanBusinessDate } from './businessDay.mjs';

export const ROOM_STATES = Object.freeze(['available', 'busy', 'mine', 'blocked']);
export const SLOT_COUNT = 38;

export function addBusinessDays(day, amount) {
  const date = new Date(`${day}T12:00:00+09:00`);
  if (!Number.isFinite(date.valueOf())) throw Error('営業日を確認してください');
  date.setUTCDate(date.getUTCDate() + amount);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Tokyo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date);
}

export function businessDays(today = japanBusinessDate()) {
  return Array.from({ length: 7 }, (_, index) => addBusinessDays(today, index));
}

export function slotLabel(slot) {
  if (!Number.isInteger(slot) || slot < 0 || slot > SLOT_COUNT) throw Error('枠を確認してください');
  const minutes = 10 * 60 + slot * 30;
  return `${String(Math.floor(minutes / 60) % 24).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

// This validates only the intentionally small RPC projection. It never accepts
// booking IDs, therapist IDs, customer fields or unrecognized keys.
export function readSafeAvailability(payload, requestedDay) {
  if (!Array.isArray(payload)) throw Error('空き状況を確認できません');
  const keys = new Set(['business_date', 'store_id', 'store_name', 'brand_code', 'room_number', 'slots']);
  return payload.map(room => {
    if (!room || Object.keys(room).some(key => !keys.has(key)) || room.business_date !== requestedDay ||
      !Number.isInteger(room.store_id) || !Number.isInteger(room.room_number) ||
      typeof room.store_name !== 'string' || !['marron', 'resort-style'].includes(room.brand_code) ||
      !Array.isArray(room.slots) || room.slots.length !== SLOT_COUNT ||
      room.slots.some(state => !ROOM_STATES.includes(state))) throw Error('空き状況の形式を確認してください');
    return room;
  });
}
