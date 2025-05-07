export const isUserActive = (user) => {
  return user && user.active && !user.deleted
}
