import { asyncHandler } from '../utils/asyncHandler.js';
import { ok, created } from '../utils/ApiResponse.js';
import * as roomService from '../services/room.service.js';

export const createRoom = asyncHandler(async (req, res) => {
  const room = await roomService.createRoom(req.user.id, req.body);
  created(res, { room });
});

export const listPublicRooms = asyncHandler(async (req, res) => {
  const result = await roomService.listPublicRooms(req.query);
  ok(res, result);
});

export const getRoom = asyncHandler(async (req, res) => {
  const room = await roomService.getRoomByCode(req.params.code, { includeParticipants: true });
  ok(res, { room });
});

export const joinRoom = asyncHandler(async (req, res) => {
  const result = await roomService.joinRoomByCode(req.params.code, req.user.id, req.body.password);
  ok(res, result);
});

export const leaveRoom = asyncHandler(async (req, res) => {
  await roomService.leaveRoom(req.room.id, req.user.id);
  ok(res, { left: true });
});

export const deleteRoom = asyncHandler(async (req, res) => {
  await roomService.deleteRoom(req.room.id);
  ok(res, { deleted: true });
});

export const updateRoom = asyncHandler(async (req, res) => {
  const room = await roomService.updateRoom(req.room, req.body);
  ok(res, { room });
});

export const listParticipants = asyncHandler(async (req, res) => {
  const participants = await roomService.listParticipants(req.room.id);
  ok(res, { participants });
});
