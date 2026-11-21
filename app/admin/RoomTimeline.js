'use client';

import { useState } from 'react';
import { bookingBusinessDate, businessDate, japanBusinessDate } from '../../lib/businessDay.mjs';

const DAY_MINUTES = 19 * 60;
const dayShift = (date, offset) => new Date(Date.parse(date + 'T00:00:00Z') + offset * 86400000).toISOString().slice(0, 10);
const clockMinutes = time => {
  if (!time) return null;
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};
const fromOpening = time => {
  const minutes = clockMinutes(time);
  return minutes === null ? null : minutes < 600 ? minutes + 840 : minutes - 600;
};
const labelTime = minutes => {
  const hour = Math.floor((minutes + 600) / 60) % 24;
  return String(hour).padStart(2, '0') + ':' + String((minutes + 600) % 60).padStart(2, '0');
};
function segment(start, duration) {
  if (start === null || !Number.isFinite(duration) || duration <= 0) return null;
  const left = Math.max(0, start), right = Math.min(DAY_MINUTES, start + duration);
  return right > left ? { left, right } : null;
}
function bookingSegment(row) {
  if (!row.start_time || !Number.isFinite(Number(row.duration_minutes))) return null;
  return segment(fromOpening(row.start_time), Number(row.duration_minutes));
}
function shiftSegment(row) {
  if (!row.start_time || !row.end_time) return null;
  const start = clockMinutes(row.start_time), end = clockMinutes(row.end_time);
  return segment(fromOpening(row.start_time), (end <= start ? end + 1440 : end) - start);
}
function placeBookings(rows) {
  const ends = [];
  return rows.sort((a, b) => a.left - b.left).map(row => {
    let level = ends.findIndex(end => end <= row.left);
    if (level < 0) level = ends.length;
    ends[level] = row.right;
    return { ...row, level };
  });
}

export default function RoomTimeline({ stores, bookings, schedules }) {
  const [date, setDate] = useState(japanBusinessDate);
  const hours = Array.from({ length: 20 }, (_, i) => (10 + i) % 24);
  const rooms = stores.flatMap(store => [1, 2].map(room => {
    const shifts = schedules.filter(row =>
      row.store_id === store.id && Number(row.room_number) === room &&
      businessDate(row.work_date, row.start_time) === date
    ).map(row => ({ ...row, span: shiftSegment(row) })).filter(row => row.span);
    const items = placeBookings(bookings.filter(row =>
      row.store_id === store.id && Number(row.room_number) === room &&
      !['cancelled', 'no_show'].includes(row.status) &&
      bookingBusinessDate(row) === date
    ).map(row => ({ ...row, ...bookingSegment(row) })).filter(row => Number.isFinite(row.left)));
    return { store, room, shifts, items, levels: Math.max(1, ...items.map(row => row.level + 1)) };
  }));
  const unassigned = schedules.filter(row =>
    stores.some(store => store.id === row.store_id) && !row.room_number &&
    businessDate(row.work_date, row.start_time) === date
  );
  return <section className="admin-panel room-timeline-panel">
    <div className="admin-panel-title"><h2>ルーム使用状況</h2><span>10:00〜翌5:00</span></div>
    <div className="room-timeline-controls">
      <button type="button" onClick={() => setDate(dayShift(date, -1))}>前日</button>
      <label>営業日 <input type="date" value={date} onChange={event => event.target.value && setDate(event.target.value)} /></label>
      <button type="button" onClick={() => setDate(dayShift(date, 1))}>翌日</button>
      <button type="button" onClick={() => setDate(japanBusinessDate())}>今日</button>
    </div>
    <p className="room-timeline-legend"><span className="reserved">予約</span><span className="completed">会計済み</span><span className="shift">出勤予定</span>　表示範囲は選択日の10:00〜翌5:00です。</p>
    <div className="room-timeline-scroll" role="region" aria-label={date + 'のルーム使用状況'} tabIndex={0}>
      <div className="room-timeline-grid">
        <div className="room-timeline-name room-timeline-heading">店舗・ルーム</div>
        <div className="room-timeline-hours">{hours.map((hour, index) => <span key={index} style={{ left: (index / 19 * 100) + '%' }}>{String(hour).padStart(2, '0')}:00</span>)}</div>
        {rooms.map(({ store, room, shifts, items, levels }) => <div className="room-timeline-row" key={store.id + '-' + room}>
          <div className="room-timeline-name">{store.name} ルーム{room}</div>
          <div className="room-timeline-track" style={{ height: 42 + levels * 43 }}>
            {shifts.map(row => <div key={row.id} className="room-timeline-shift" style={{ left: (row.span.left / DAY_MINUTES * 100) + '%', width: ((row.span.right - row.span.left) / DAY_MINUTES * 100) + '%' }} title={'出勤予定 ' + (row.resort_therapists?.name || '') + ' ' + row.start_time?.slice(0,5) + '〜' + row.end_time?.slice(0,5)}>{row.resort_therapists?.name || '出勤'}</div>)}
            {items.map(row => <div key={row.id} className={'room-timeline-booking ' + (row.status === 'completed' ? 'completed' : 'reserved')} style={{ left: (row.left / DAY_MINUTES * 100) + '%', width: ((row.right - row.left) / DAY_MINUTES * 100) + '%', top: 38 + row.level * 43 }} title={labelTime(row.left) + '〜' + labelTime(row.right) + ' ' + (row.resort_therapists?.name || '') + ' ' + (row.resort_customers?.name || '')}>{labelTime(row.left)} {row.resort_therapists?.name || '予約'}</div>)}
          </div>
        </div>)}
      </div>
    </div>
    {unassigned.length > 0 && <p className="room-timeline-unassigned">ルーム未指定の出勤：{unassigned.map(row => (row.resort_stores?.name || stores.find(s => s.id === row.store_id)?.name || '') + ' ' + (row.resort_therapists?.name || '') + ' ' + row.start_time?.slice(0,5) + '〜' + row.end_time?.slice(0,5)).join('／')}</p>}
  </section>;
}
