import {ApiService} from '#app/services/api.service'

export class ApiController {

  constructor(apiService = new ApiService()) {
    this.apiService = apiService
  }

  gameInit = async (req, res) => {
    console.log('body:', req.body)
    const response = await this.apiService.gameInit(req.body)
    res.status(200).json(response).end()
  }
}

export const apiController = new ApiController()
