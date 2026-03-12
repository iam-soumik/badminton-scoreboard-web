export default function confirmAction(message) {
  return window.confirm(message)
}

export function getMatchLabels(round) {
  const map = {
    SUPER32: 16,
    PREQF: 8,
    QF: 4,
    SF: 2,
    F: 1
  };
  const count = map[round] || 1;
  return Array.from({ length: count }, (_, i) => `${round}${i + 1}`);
}

export function formatDuration(sec){
  if(!sec) return "-";
  const m = Math.floor(sec/60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2,'0')}`;
}