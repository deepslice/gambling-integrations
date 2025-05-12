export const isUserActive = (user) => {
  return user && user.active && !user.deleted
}

export const isGameActive = (game) => {
  return game && game.active && !game.deleted
}
