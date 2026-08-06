import { Router } from 'express';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { updateProfileSchema, changePasswordSchema } from '../validators/auth.validator.js';
import * as userController from '../controllers/user.controller.js';
import { changePassword } from '../controllers/auth.controller.js';

const router = Router();

router.get('/:username', userController.getByUsername);
router.patch('/me', requireAuth, validate(updateProfileSchema), userController.updateMe);
router.patch('/me/password', requireAuth, validate(changePasswordSchema), changePassword);

export default router;
