import {Router} from 'express'

import {apiController} from '#integrations/aspect/controllers/api.controller'

const router = new Router()

/**
 * API Routes
 */

router.post('/game-init', apiController.gameInit)

export default router
