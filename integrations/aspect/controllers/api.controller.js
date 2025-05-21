import {ApiService} from '#app/services/api/api.service'

export class ApiController {

  constructor(apiService = new ApiService()) {
    this.apiService = apiService
  }

  async gameInit(req, res) {
    const response = await this.apiService.gameInit(req.body)
    res.status(200).json(response).end()
  }
}

export const apiController = new ApiController()
