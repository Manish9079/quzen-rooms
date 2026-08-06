import { GraduationCap, Gamepad2, Sparkles, Cpu, Code2, Music2, Coffee, Grid2x2, MoreHorizontal } from 'lucide-react';

// Ids match the backend's RoomCategory enum (prisma/schema.prisma) exactly
// so values round-trip without translation.
export const CATEGORIES = [
  { id: 'ALL', label: 'All Rooms', icon: Grid2x2 },
  { id: 'STUDY', label: 'Study', icon: GraduationCap },
  { id: 'GAMING', label: 'Gaming', icon: Gamepad2 },
  { id: 'ANIME', label: 'Anime', icon: Sparkles },
  { id: 'TECHNOLOGY', label: 'Technology', icon: Cpu },
  { id: 'CODING', label: 'Coding', icon: Code2 },
  { id: 'MUSIC', label: 'Music', icon: Music2 },
  { id: 'CHILL', label: 'Chill', icon: Coffee },
  { id: 'OTHER', label: 'Other', icon: MoreHorizontal },
];
