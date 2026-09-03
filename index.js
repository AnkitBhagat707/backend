const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Blockchain = require("./blockchain/Blockchain");
const TrustBlock = require("./models/TrustBlock");
const crypto = require("crypto");

require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

mongoose.set("strictQuery", false);

// -----------------------------------------
// 1️⃣ CONNECT TO MONGO ATLAS
// -----------------------------------------

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("✅ MongoDB Connected Successfully");
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err.message);
  });

// -----------------------------------------
// 2️⃣ CREATE BLOCKCHAIN INSTANCE
// -----------------------------------------

const trustChain = new Blockchain();

trustChain.initialize().then(() => {
  console.log("🚀 Blockchain initialized");
});

// -----------------------------------------
// 3️⃣ LOAD CHAIN FROM DB ON SERVER START
// -----------------------------------------

const loadChainFromDB = async () => {
  try {
    const blocks = await TrustBlock.find().sort({ index: 1 });

    if (blocks.length > 0) {
      trustChain.chain = blocks;
      console.log("📚 Trust Chain loaded from MongoDB");
    } else {
      console.log(
        "ℹ️ No existing chain found. Genesis will be created when first block is added."
      );
    }
  } catch (err) {
    console.error("❌ Error loading chain:", err.message);
  }
};

loadChainFromDB();

// -----------------------------------------
// 4️⃣ USER MODEL
// -----------------------------------------

const User = require("./models/User");

// -----------------------------------------
// 5️⃣ REGISTER API
// -----------------------------------------

app.post("/api/register", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        msg: "Email & password required",
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(400).json({
        msg: "User already exists",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({
      email,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).json({
      msg: "✅ User registered successfully",
      user: {
        id: newUser._id,
        email: newUser.email,
      },
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      msg: "Server error",
    });
  }
});

// -----------------------------------------
// 6️⃣ LOGIN API
// -----------------------------------------

app.post("/api/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(400).json({
        msg: "User not found",
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({
        msg: "Invalid password",
      });
    }

    const token = jwt.sign(
      {
        userId: user._id,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "1d",
      }
    );

    res.json({
      msg: "✅ Login successful",
      token,
      user: {
        id: user._id,
        email: user.email,
      },
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      msg: "Server error",
    });
  }
});

// -----------------------------------------
// 7️⃣ VERIFY TOKEN MIDDLEWARE
// -----------------------------------------

const verifyToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];

  if (!authHeader) {
    return res.status(401).json({
      msg: "❌ No token provided",
    });
  }

  const token = authHeader.split(" ")[1];

  jwt.verify(
    token,
    process.env.JWT_SECRET,
    (err, decoded) => {
      if (err) {
        return res.status(403).json({
          msg: "❌ Invalid token",
        });
      }

      req.userId = decoded.userId;

      next();
    }
  );
};

// -----------------------------------------
// 8️⃣ ADD TRUST BLOCK
// -----------------------------------------

app.post("/api/trust/add", verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        msg: "❌ User not found",
      });
    }

    const block = await trustChain.addBlock({
      userId: req.userId,
      from: user.email,
      to: "Network",
      message: req.body.message,
      amount: req.body.amount || 999,
    });

    res.json({
      msg: "✅ Block added successfully",
      block,
    });
  } catch (err) {
    console.error("❌ Error adding block:", err);

    res.status(500).json({
      msg: "Server error while adding block",
    });
  }
});

// -----------------------------------------
// 9️⃣ GET FULL CHAIN
// -----------------------------------------

app.get("/api/trust/chain", async (req, res) => {
  try {
    const blocks = await TrustBlock.find().sort({ index: 1 });

    res.json({
      chain: blocks,
    });
  } catch (err) {
    console.error("❌ Error fetching chain:", err);

    res.status(500).json({
      msg: "Server error while fetching chain",
    });
  }
});

// -----------------------------------------
// 🔟 CALCULATE HASH
// -----------------------------------------

const calculateHashForBlock = (block) => {
  return crypto
    .createHash("sha256")
    .update(
      block.index +
        block.previousHash +
        block.timestamp +
        JSON.stringify(block.data)
    )
    .digest("hex");
};

// -----------------------------------------
// 1️⃣1️⃣ VALIDATE TRUST CHAIN
// -----------------------------------------

app.get("/api/trust/validate", async (req, res) => {
  try {
    const blocks = await TrustBlock.find().sort({ index: 1 });

    if (blocks.length <= 1) {
      return res.json({
        valid: true,
        msg: "Chain valid (only genesis block)",
      });
    }

    for (let i = 1; i < blocks.length; i++) {
      const prev = blocks[i - 1];
      const curr = blocks[i];

      if (curr.previousHash !== prev.hash) {
        return res.json({
          valid: false,
          brokenAt: curr.index,
          reason: "previousHash mismatch",
        });
      }

      const recalculatedHash = calculateHashForBlock(curr);

      if (curr.hash !== recalculatedHash) {
        return res.json({
          valid: false,
          brokenAt: curr.index,
          reason: "hash tampered",
        });
      }
    }

    res.json({
      valid: true,
      msg: "✅ Trust Chain is valid & untampered",
    });
  } catch (err) {
    console.error("❌ Error validating chain:", err);

    res.status(500).json({
      msg: "❌ Error validating chain",
    });
  }
});

// -----------------------------------------
// 1️⃣2️⃣ START SERVER
// -----------------------------------------

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});