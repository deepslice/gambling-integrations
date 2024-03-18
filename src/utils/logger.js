import {getCurrentDatetime} from './get-current-datetime.js'

export const logger = async (req, res, next) => {
  console.log(`${
    getCurrentDatetime()
  } [${
    (req.header('x-forwarded-for') || '').padStart(15, ' ')
  }] ${
    (req.method || '').padStart(5, ' ')
  } ${
    (req.header('host') || '').padStart(25, ' ')
  } ${
    req.path
  } ${
    JSON.stringify(req.query)
  } ${
    JSON.stringify(req.body)
  }`)

  if (req.method === 'OPTIONS') {
    res.status(200).end()
  } else {
    next()
  }
}
