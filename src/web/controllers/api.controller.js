import {ApiService} from '#app/services/api.service'

export class ApiController {

  constructor(apiService = new ApiService()) {
    this.apiService = apiService
  }

  gameInit = async (req, res) => {
    console.log('body:', req.body)
    return await this.apiService.gameInit(req.body)
  }
}

export const apiController = new ApiController()
