import {gameInitApi} from '#app/services/api/game-init.api'

export class ApiController {

  async gameInit(req, res) {
    console.log('req.body:', req.body)
    const response = await gameInitApi.gameInit(req.body)
    res.status(200).json(response).end()
  }
}

export const apiController = new ApiController()
