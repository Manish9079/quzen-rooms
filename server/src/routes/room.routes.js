import { Router } from 'express';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { loadRoom, requireHost } from '../middleware/roomAuth.middleware.js';
import {
  createRoomSchema, updateRoomSchema, joinRoomSchema, publicRoomsQuerySchema,
} from '../validators/room.validator.js';
import { messagesQuerySchema } from '../validators/message.validator.js';
import * as roomController from '../controllers/room.controller.js';
import * as messageController from '../controllers/message.controller.js';

const router = Router();

router.post('/', requireAuth, validate(createRoomSchema), roomController.createRoom);
router.get('/public', validate(publicRoomsQuerySchema, 'query'), roomController.listPublicRooms);
router.get('/:code', roomController.getRoom);
router.post('/:code/join', requireAuth, validate(joinRoomSchema), roomController.joinRoom);
router.post('/:code/leave', requireAuth, loadRoom, roomController.leaveRoom);
router.delete('/:code', requireAuth, loadRoom, requireHost, roomController.deleteRoom);
router.patch('/:code', requireAuth, loadRoom, requireHost, validate(updateRoomSchema), roomController.updateRoom);
router.get('/:code/participants', loadRoom, roomController.listParticipants);
router.get('/:code/messages', requireAuth, loadRoom, validate(messagesQuerySchema, 'query'), messageController.getMessages);

export default router;
