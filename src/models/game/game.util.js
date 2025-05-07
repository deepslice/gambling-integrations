export const isGameActive = (game) => {
  return game && game.active && !game.deleted
}
