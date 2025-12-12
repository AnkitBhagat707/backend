const mongoose = require("mongoose");
const crypto = require("crypto");

const TrustBlockSchema = new mongoose.Schema({
  index: Number,
  timestamp: Number,
  data: Object,
  previousHash: String,   // ✔️ VERY IMPORTANT
  hash: String
});

// Calculate hash function (same as Block.js)
TrustBlockSchema.methods.calculateHash = function () {
  return crypto
    .createHash("sha256")
    .update(
      this.index +
      this.previousHash +
      this.timestamp +
      JSON.stringify(this.data)
    )
    .digest("hex");
};

module.exports = mongoose.model("TrustBlock", TrustBlockSchema);
