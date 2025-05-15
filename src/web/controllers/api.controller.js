import {ApiService} from '#app/services/api.service'

export class ApiController {

  constructor(apiService = new ApiService()) {
    this.apiService = apiService
  }

  async gameInit(req, res) {
    return await this.apiService.gameInit(req.body)
  }
}

export const apiController = new ApiController()
