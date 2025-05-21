import {Router} from 'express'
import {apiController} from 'integrations/aspect/controllers/api.controller.js'

const router = new Router()

/**
 * API Routes
 */

router.post('/game-init', apiController.gameInit)

export default router
