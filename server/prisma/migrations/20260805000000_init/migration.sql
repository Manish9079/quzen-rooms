-- CreateEnum
CREATE TYPE "RoomCategory" AS ENUM ('STUDY', 'GAMING', 'ANIME', 'TECHNOLOGY', 'CODING', 'MUSIC', 'CHILL', 'OTHER');
CREATE TYPE "ParticipantRole" AS ENUM ('HOST', 'CO_HOST', 'MEMBER');
CREATE TYPE "FriendshipStatus" AS ENUM ('PENDING', 'ACCEPTED', 'DECLINED');

-- CreateTable: users
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "avatar" TEXT,
    "bio" TEXT,
    "onlineStatus" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateTable: rooms
CREATE TABLE "rooms" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "RoomCategory" NOT NULL DEFAULT 'OTHER',
    "isPrivate" BOOLEAN NOT NULL DEFAULT false,
    "passwordHash" TEXT,
    "maxParticipants" INTEGER NOT NULL DEFAULT 20,
    "chatEnabled" BOOLEAN NOT NULL DEFAULT true,
    "videoEnabled" BOOLEAN NOT NULL DEFAULT true,
    "screenShareEnabled" BOOLEAN NOT NULL DEFAULT true,
    "isLocked" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "closedAt" TIMESTAMP(3),
    "hostId" TEXT NOT NULL,
    CONSTRAINT "rooms_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "rooms_code_key" ON "rooms"("code");
CREATE INDEX "rooms_category_idx" ON "rooms"("category");
CREATE INDEX "rooms_isPrivate_idx" ON "rooms"("isPrivate");
CREATE INDEX "rooms_hostId_idx" ON "rooms"("hostId");
ALTER TABLE "rooms" ADD CONSTRAINT "rooms_hostId_fkey" FOREIGN KEY ("hostId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: room_participants
CREATE TABLE "room_participants" (
    "id" TEXT NOT NULL,
    "role" "ParticipantRole" NOT NULL DEFAULT 'MEMBER',
    "joinedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "leftAt" TIMESTAMP(3),
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "room_participants_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "room_participants_roomId_userId_key" ON "room_participants"("roomId", "userId");
CREATE INDEX "room_participants_roomId_idx" ON "room_participants"("roomId");
CREATE INDEX "room_participants_userId_idx" ON "room_participants"("userId");
ALTER TABLE "room_participants" ADD CONSTRAINT "room_participants_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "room_participants" ADD CONSTRAINT "room_participants_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: messages
CREATE TABLE "messages" (
    "id" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deletedAt" TIMESTAMP(3),
    "roomId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    CONSTRAINT "messages_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "messages_roomId_createdAt_idx" ON "messages"("roomId", "createdAt");
ALTER TABLE "messages" ADD CONSTRAINT "messages_roomId_fkey" FOREIGN KEY ("roomId") REFERENCES "rooms"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "messages" ADD CONSTRAINT "messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: refresh_tokens
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "revokedAt" TIMESTAMP(3),
    "replacedByToken" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "refresh_tokens_tokenHash_key" ON "refresh_tokens"("tokenHash");
CREATE INDEX "refresh_tokens_userId_idx" ON "refresh_tokens"("userId");
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: friendships
CREATE TABLE "friendships" (
    "id" TEXT NOT NULL,
    "status" "FriendshipStatus" NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "requesterId" TEXT NOT NULL,
    "addresseeId" TEXT NOT NULL,
    CONSTRAINT "friendships_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "friendships_requesterId_addresseeId_key" ON "friendships"("requesterId", "addresseeId");
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "friendships" ADD CONSTRAINT "friendships_addresseeId_fkey" FOREIGN KEY ("addresseeId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateTable: blocked_users
CREATE TABLE "blocked_users" (
    "id" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "blockerId" TEXT NOT NULL,
    "blockedId" TEXT NOT NULL,
    CONSTRAINT "blocked_users_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "blocked_users_blockerId_blockedId_key" ON "blocked_users"("blockerId", "blockedId");
ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_blockerId_fkey" FOREIGN KEY ("blockerId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "blocked_users" ADD CONSTRAINT "blocked_users_blockedId_fkey" FOREIGN KEY ("blockedId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
