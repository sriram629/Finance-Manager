const mongoose = require('mongoose');
// Only hashes are persisted; findOneAndDelete makes redemption single-use.
const schema = new mongoose.Schema({
  digest: { type: String, required: true, unique: true },
  challenge: String,
  purpose: { type: String, required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  expiresAt: { type: Date, required: true, expires: 0 },
});
module.exports = mongoose.model('AuthTicket', schema);
