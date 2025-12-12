const Block = require("./Block");
const TrustBlock = require("../models/TrustBlock");

class Blockchain {
  constructor() {
    this.chain = [];
  }

  // Initialize blockchain: load from DB or create genesis
  async initialize() {
    const existingBlocks = await TrustBlock.find().sort({ index: 1 });

    if (existingBlocks.length === 0) {
      // Create Genesis Block
      const genesis = new TrustBlock({
        index: 0,
        timestamp: Date.now(),
        data: "Genesis Block",
        previousHash: "0"
      });

      genesis.hash = genesis.calculateHash();
      await genesis.save();

      this.chain = [genesis];   // <-- Important fix
      console.log("🌱 Genesis block created.");
    } else {
      this.chain = existingBlocks;
      console.log("📚 Blockchain loaded from DB.");
    }
  }

  getLatestBlock() {
    return this.chain[this.chain.length - 1];
  }

  async addBlock(data) {
    const previousBlock = this.getLatestBlock();

    if (!previousBlock) {
      throw new Error("❌ No genesis block found. Initialize chain first.");
    }

    const newBlock = new TrustBlock({
      index: this.chain.length,
      timestamp: Date.now(),
      data,
      previousHash: previousBlock.hash
    });

    newBlock.hash = newBlock.calculateHash();

    await newBlock.save();
    this.chain.push(newBlock);

    return newBlock;
  }

  isChainValid() {
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }

      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }

    return true;
  }
}

module.exports = Blockchain;
