import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import roomRoutes from './room.routes.js';
import { health } from '../controllers/health.controller.js';

const router = Router();

router.get('/health', health);
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/rooms', roomRoutes);

export default router;
