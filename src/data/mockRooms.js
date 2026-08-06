// V1 mock data standing in for a real "public rooms" REST endpoint.
// See services/api.js — swap fetchPublicRooms() there for a live call
// and every consumer (ExploreRooms page) keeps working unchanged.

export const MOCK_ROOMS = [
  {
    id: 'r1', code: 'QZN-7F3KQ', name: 'Deep Work Library', category: 'study',
    host: 'Meera', participants: 14, maxParticipants: 30, isPrivate: false,
    tags: ['Pomodoro', 'Silent room'], createdAgo: '2026-08-04T05:10:00Z',
  },
  {
    id: 'r2', code: 'QZN-A7K92', name: 'Valorant Ranked Grind', category: 'gaming',
    host: 'Dhruv', participants: 5, maxParticipants: 10, isPrivate: false,
    tags: ['Voice on', 'Comp'], createdAgo: '2026-08-04T06:40:00Z',
  },
  {
    id: 'r3', code: 'QZN-M2LXZ', name: 'Shonen Sunday Watchalong', category: 'anime',
    host: 'Aiko', participants: 22, maxParticipants: 50, isPrivate: false,
    tags: ['Screen share', 'Spoiler-safe'], createdAgo: '2026-08-04T03:05:00Z',
  },
  {
    id: 'r4', code: 'QZN-9DPRT', name: 'AI & Future of Work', category: 'technology',
    host: 'Kabir', participants: 9, maxParticipants: 40, isPrivate: false,
    tags: ['Discussion', 'Weekly'], createdAgo: '2026-08-04T02:00:00Z',
  },
  {
    id: 'r5', code: 'QZN-5VXQH', name: 'React + Vite Pair Coding', category: 'coding',
    host: 'Sana', participants: 3, maxParticipants: 8, isPrivate: false,
    tags: ['Screen share', 'Mentoring'], createdAgo: '2026-08-04T07:20:00Z',
  },
  {
    id: 'r6', code: 'QZN-3QJTN', name: 'Lo-fi & Vinyl Digging', category: 'music',
    host: 'Rehan', participants: 18, maxParticipants: 60, isPrivate: false,
    tags: ['Chill', 'DJ set'], createdAgo: '2026-08-04T01:15:00Z',
  },
  {
    id: 'r7', code: 'QZN-K8HWL', name: 'Late Night Chai & Chill', category: 'chill',
    host: 'Priya', participants: 7, maxParticipants: 20, isPrivate: false,
    tags: ['Casual', 'Open mic'], createdAgo: '2026-08-04T04:50:00Z',
  },
  {
    id: 'r8', code: 'QZN-QW1NR', name: 'DSA Interview Prep', category: 'study',
    host: 'Yusuf', participants: 11, maxParticipants: 25, isPrivate: false,
    tags: ['Whiteboard', 'Mock interviews'], createdAgo: '2026-08-04T06:05:00Z',
  },
  {
    id: 'r9', code: 'QZN-7TZLC', name: 'Indie Game Jam Squad', category: 'gaming',
    host: 'Neha', participants: 6, maxParticipants: 12, isPrivate: false,
    tags: ['Build in public'], createdAgo: '2026-08-04T05:35:00Z',
  },
];

export function fetchMockPublicRooms() {
  // Simulated network latency for realistic UX (skeleton states, etc.)
  return new Promise((resolve) => setTimeout(() => resolve(MOCK_ROOMS), 500));
}
