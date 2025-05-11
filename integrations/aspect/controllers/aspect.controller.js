export const gameInit = async (req, res) => {


  const url = await axios.get(`https://eu.agp.xyz/agp-launcher/${gameId}/?token=${token}&operatorId=${operatorId}&language=en-US`).then(resp => {
    return resp.config.url || null
  }).catch((error) => {
    console.error('error ', error)
    return null
  })
}

export const getBalance = async (req, res) => {

}

export const debit = async (req, res) => {

}

export const credit = async (req, res) => {

}

export const rollBack = async (req, res) => {

}
