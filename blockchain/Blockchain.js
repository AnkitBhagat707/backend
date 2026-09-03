const TrustBlock = require("../models/TrustBlock");

class Blockchain {
  constructor() {
    this.chain = [];
    this.addBlockQueue = Promise.resolve();
  }

  // Initialize blockchain: load from DB or create genesis
  async initialize() {
    const existingBlocks = await TrustBlock.find().sort({
      index: 1,
      _id: 1,
    });

    if (existingBlocks.length === 0) {
      const genesis = new TrustBlock({
        index: 0,
        timestamp: Date.now(),
        data: "Genesis Block",
        previousHash: "0",
      });

      genesis.hash = genesis.calculateHash();

      await genesis.save();

      this.chain = [genesis];

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
    const operation = this.addBlockQueue.then(() =>
      this.createBlock(data)
    );

    this.addBlockQueue = operation.catch(() => {});

    return operation;
  }

  async createBlock(data) {
    const previousBlock = await TrustBlock.findOne().sort({
      index: -1,
      _id: -1,
    });

    if (!previousBlock) {
      throw new Error(
        "❌ No genesis block found. Initialize chain first."
      );
    }

    const newBlock = new TrustBlock({
      index: previousBlock.index + 1,
      timestamp: Date.now(),
      data,
      previousHash: previousBlock.hash,
    });

    newBlock.hash = newBlock.calculateHash();

    await newBlock.save();

    this.chain = await TrustBlock.find().sort({
      index: 1,
      _id: 1,
    });

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