import express from 'express';
import { banUser, deleteUser } from '../../controllers/v1/internal/adminController.js';

const router = express.Router();

router.post('/game-init/ban', banUser);
router.delete('/game-init/users/:id', deleteUser);

export default router;
