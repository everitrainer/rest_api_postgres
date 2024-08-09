import express from 'express';
import studioRoutes from './studioRoutes.js';
import gameRoutes from './gameRoutes.js';

const router = express.Router();

router.use('/studios', studioRoutes);
router.use('/games', gameRoutes);

export default router;
