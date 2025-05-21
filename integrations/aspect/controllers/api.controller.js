import {GameInitApi} from '#app/services/api/game-init.api'

export class ApiController {

  constructor(apiService = new GameInitApi()) {
    this.apiService = apiService
  }

  async gameInit(req, res) {
    const response = await this.apiService.gameInit(req.body)
    res.status(200).json(response).end()
  }
}

export const apiController = new ApiController()
