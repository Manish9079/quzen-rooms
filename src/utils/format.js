export function initialsFromName(name = '') {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function timeAgo(iso) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function clampNumber(n, min, max) {
  return Math.min(max, Math.max(min, n));
}

const AVATAR_HUES = ['#16A374', '#34A99B', '#3FBE8B', '#0E8862', '#2FBE8F', '#7DD6AC', '#5FBFB3', '#0A6B4E'];

/** Deterministic color per id, so the same user always renders the same avatar hue. */
export function colorFromId(id = '') {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) >>> 0;
  return AVATAR_HUES[hash % AVATAR_HUES.length];
}
