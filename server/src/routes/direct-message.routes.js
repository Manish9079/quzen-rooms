import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { sendMessageSchema } from '../validators/message.validator.js';
import * as directMessageController from '../controllers/direct-message.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/unread', directMessageController.getTotalUnreadCount);
router.get('/conversations/:friendId/unread', directMessageController.getUnreadCount);
router.get('/conversations/:friendId/messages', directMessageController.getHistory);
router.post('/conversations/:friendId/messages', validate(sendMessageSchema), directMessageController.sendMessage);
router.post('/conversations/:friendId/read', directMessageController.markAsRead);
router.delete('/conversations/:friendId', directMessageController.clearConversation);
router.delete('/messages/:messageId', directMessageController.deleteMessage);

export default router;
