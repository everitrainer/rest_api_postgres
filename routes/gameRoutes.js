import express from 'express';
import { createGame, getGames } from '../controllers/gameController.js';

const router = express.Router();

router.post('/', createGame);
router.get('/', getGames);

export default router;
