import express from 'express';

import * as controller from '@/integrations/aspect/aspectController';

const router = express.Router();

router.get ('/aspect/game-init', controller.gameInit);
router.get ('/aspect/balance',   controller.getBalance);
router.post('/aspect/debit',     controller.debit);
router.post('/aspect/credit',    controller.credit);
router.post('/aspect/rollback',  controller.rollback);

export default router;
