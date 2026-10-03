import { Router } from 'express';
import { requireAuth } from '../middleware/auth.middleware.js';
import * as friendController from '../controllers/friend.controller.js';

const router = Router();

router.use(requireAuth);
router.get('/users', friendController.searchUsers);
router.get('/requests', friendController.getIncomingRequests);
router.post('/requests', friendController.sendRequest);
router.post('/requests/:requestId/accept', friendController.acceptRequest);
router.post('/requests/:requestId/reject', friendController.rejectRequest);
router.get('/', friendController.getFriends);
router.delete('/:friendshipId', friendController.removeFriend);

export default router;