export const CLEAR_MAP_EVENT = 'CLEAR_MAP_EVENT';

export const triggerClearMap = () => {
  // ตะโกนบอก Window ว่า "เคลียร์แมพเดี๋ยวนี้!"
  window.dispatchEvent(new Event(CLEAR_MAP_EVENT));
};