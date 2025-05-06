const User = require('../models/User');

module.exports = {
  getUserById: async (id) => {
    return await User.findById(id);
  }
};
