import { Router } from 'express';
import { validate } from '../middleware/validate.middleware.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { authLimiter } from '../middleware/rateLimit.middleware.js';
import {
  registerSchema, loginSchema, changePasswordSchema,
  forgotPasswordSchema, resetPasswordSchema,
} from '../validators/auth.validator.js';
import * as authController from '../controllers/auth.controller.js';

const router = Router();

router.post('/register', authLimiter, validate(registerSchema), authController.register);
router.post('/login', authLimiter, validate(loginSchema), authController.login);
router.post('/refresh', authLimiter, authController.refresh);
router.post('/logout', requireAuth, authController.logout);
router.get('/me', requireAuth, authController.me);
router.patch('/me/password', requireAuth, validate(changePasswordSchema), authController.changePassword);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), authController.resetPassword);

export default router;
