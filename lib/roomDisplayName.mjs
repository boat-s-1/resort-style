// Keep the stored store and room numbers unchanged; only rename this room in the UI.
export function roomDisplayName(storeId, roomNumber, fallback) {
  return Number(storeId) === 1 && Number(roomNumber) === 1
    ? '豊橋（MK603）'
    : fallback;
}
