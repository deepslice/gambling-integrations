import {getCurrentDatetime} from './get-current-datetime.js'

let id = 1

export async function logger(req, res, next) {
  req._id = (id++).toString().padStart(10, '0')
  req._tm = Date.now()
  console.log(`${
    getCurrentDatetime()
  } [${
    (req.header('cf-connection-ip') || '').padStart(15, ' ')
  }] ${
    (req.method || '').padStart(5, ' ')
  } #${req._id} ${
    req.path
  } ${
    JSON.stringify(req.query)
  } ${
    JSON.stringify(req.body)
  }`)
  next()
}
