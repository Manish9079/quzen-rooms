// Optional local dev seed: `npm run prisma:seed`. Creates one demo host
// and one public room so a fresh database isn't empty in Explore.
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('password123', 12);

  const host = await prisma.user.upsert({
    where: { email: 'demo@quzen.online' },
    update: {},
    create: {
      username: 'demo',
      displayName: 'Demo Host',
      email: 'demo@quzen.online',
      passwordHash,
      bio: 'Just here to test Quzen Rooms.',
    },
  });

  const room = await prisma.room.upsert({
    where: { code: 'QZN-DEMO1' },
    update: {},
    create: {
      code: 'QZN-DEMO1',
      name: 'Welcome to Quzen Rooms',
      description: 'A demo room to try chat, video, and screen share.',
      category: 'CHILL',
      isPrivate: false,
      maxParticipants: 20,
      hostId: host.id,
    },
  });

  await prisma.roomParticipant.upsert({
    where: { roomId_userId: { roomId: room.id, userId: host.id } },
    update: {},
    create: { roomId: room.id, userId: host.id, role: 'HOST' },
  });

  console.log(`Seeded demo user (demo@quzen.online / password123) and room ${room.code}`);
}

main()
  .catch((err) => { console.error(err); process.exit(1); })
  .finally(() => prisma.$disconnect());
