import { asyncHandler } from '../utils/asyncHandler.js';
import { ok } from '../utils/ApiResponse.js';
import * as messageService from '../services/message.service.js';

export const getMessages = asyncHandler(async (req, res) => {
  const messages = await messageService.getRecentMessages(req.room.id, req.query);
  ok(res, { messages });
});
