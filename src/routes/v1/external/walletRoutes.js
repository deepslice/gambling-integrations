import express from 'express';

import { getUser, createUser } from '@/controllers/v1/external/walletController.js';

const router = express.Router();

router.get('/wallet/:id', getUser);
router.post('/wallet', createUser);

export default router;
