import express from 'express';
import { createStudio, getStudios } from '../controllers/studioController.js';

const router = express.Router();

router.post('/', createStudio);
router.get('/', getStudios);

export default router;
