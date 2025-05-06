import express from 'express';

import * as handlers from '@/integrations/aspect/aspectController';
import { withBetLimitChecks } from '@/decorators/withBetLimitChecks';

const router = express.Router();

router.get ('/aspect/game-init', handlers.gameInit);
router.get ('/aspect/balance',   handlers.getBalance);
router.post('/aspect/debit',     withBetLimitChecks(handlers.debit));
router.post('/aspect/credit',    withBetLimitChecks(handlers.credit));
router.post('/aspect/rollback',  handlers.rollBack);

export default router;
