# TrustChain Backend

Backend API for TrustChain, a blockchain-based trust verification application.

The backend handles user authentication, authorization, trust record creation, blockchain-style hash chaining, MongoDB persistence, and chain validation.

## Live Backend

https://backend-p8yt.onrender.com

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcryptjs
- crypto (SHA-256)
- CORS
- dotenv

## Features

- User registration
- Secure password hashing with bcrypt
- User login with JWT authentication
- Protected trust record creation
- Blockchain-style linked blocks
- SHA-256 hash generation
- Previous hash verification
- MongoDB persistence
- Blockchain validation
- Tamper detection
- REST APIs
- Render deployment

## Project Structure

```text
backend/
│
├── blockchain/
│   ├── Block.js
│   └── Blockchain.js
│
├── models/
│   ├── TrustBlock.js
│   └── User.js
│
├── index.js
├── package.json
├── package-lock.json
└── README.md
```

## How the Backend Works

TrustChain stores trust records as linked blocks.

Each block contains:

- Block index
- Timestamp
- Data
- Previous block hash
- Current block hash

The current block's hash is generated using its own data and the previous block's hash.

Conceptually:

```text
Block #0
   ↓
Block #1
   ↓
Block #2
   ↓
Block #3
```

Each block keeps a reference to the hash of the previous block.

If the data of an existing block is changed, its calculated hash will no longer match the stored hash.

The validation API detects this inconsistency and reports that the chain has been tampered with.

## Authentication

TrustChain uses JWT-based authentication.

### Registration

A user registers using an email and password.

The password is hashed using bcrypt before it is stored in MongoDB.

### Login

After successful login, the backend generates a JWT token.

The frontend stores this token and sends it with protected requests.

Example:

```text
Authorization: Bearer <JWT_TOKEN>
```

### Protected Route

Creating a new trust block requires a valid JWT.

```text
POST /api/trust/add
```

The authentication middleware verifies the token before allowing the request to continue.

## API Endpoints

### Register

```http
POST /api/register
```

Request:

```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

Response:

```json
{
  "msg": "User registered successfully"
}
```

---

### Login

```http
POST /api/login
```

Request:

```json
{
  "email": "user@example.com",
  "password": "your-password"
}
```

The response contains a JWT token that is required for protected APIs.

---

### Add Trust Block

```http
POST /api/trust/add
```

Authentication:

```text
Bearer JWT Token
```

Request:

```json
{
  "message": "Trust record created"
}
```

The backend creates a new block and stores it in MongoDB.

The block contains information such as:

```text
userId
from
to
message
amount
```

---

### Get Blockchain

```http
GET /api/trust/chain
```

Returns the complete blockchain stored in MongoDB.

---

### Validate Blockchain

```http
GET /api/trust/validate
```

Checks:

1. Previous hash relationship
2. Current block hash
3. Hash consistency
4. Chain integrity

Example valid response:

```json
{
  "valid": true,
  "msg": "Trust Chain is valid & untampered"
}
```

If a block has been modified, the API returns information about the broken block and the reason for the failure.

## MongoDB

MongoDB is used as the persistent database.

The application uses two main collections:

```text
users
trustblocks
```

### users

Stores registered user information.

Passwords are stored as bcrypt hashes rather than plain text.

### trustblocks

Stores blockchain blocks.

A trust block contains:

```text
index
timestamp
data
previousHash
hash
```

## Blockchain Implementation

The blockchain logic is implemented in:

```text
blockchain/Blockchain.js
```

The backend:

1. Loads existing blocks from MongoDB.
2. Creates the genesis block when required.
3. Finds the latest block.
4. Creates the next block using the latest block's hash.
5. Calculates the new block hash.
6. Saves the block to MongoDB.
7. Reloads the chain.
8. Validates the chain when requested.

The block hash is generated using SHA-256.

The implementation also uses a queue for block creation so that simultaneous block requests do not create duplicate block indexes.

## Important Backend Files

### `index.js`

Main Express server.

Responsible for:

- Express configuration
- CORS
- MongoDB connection
- Authentication APIs
- JWT middleware
- Trust block API
- Chain API
- Validation API
- Starting the server

### `blockchain/Blockchain.js`

Contains blockchain management logic.

Responsible for:

- Genesis initialization
- Adding blocks
- Maintaining block order
- Preventing concurrent block index conflicts

### `blockchain/Block.js`

Contains the basic block structure and SHA-256 hash calculation logic.

### `models/User.js`

Mongoose model for users.

### `models/TrustBlock.js`

Mongoose model for blockchain blocks.

## Environment Variables

Create a `.env` file locally:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=4000
```

Never commit the real `.env` file.

For deployment, these values should be configured using the hosting platform's environment variable settings.

## Local Setup

### 1. Clone the repository

```bash
git clone https://github.com/AnkitBhagat707/backend.git
```

### 2. Enter the backend directory

```bash
cd backend
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure environment variables

Create:

```text
.env
```

and add the required environment variables.

### 5. Start the server

```bash
node index.js
```

The backend runs on:

```text
http://localhost:4000
```

The port can also be provided by the deployment environment.

## Deployment

The backend is deployed on Render.

Live backend:

https://backend-p8yt.onrender.com

The backend connects to MongoDB Atlas for persistent storage.

Environment variables are configured in the deployment environment rather than committed to GitHub.

## Security Considerations

- Passwords are hashed using bcrypt.
- JWT is used for authenticated requests.
- Protected APIs require a valid token.
- Database credentials are kept outside the source code.
- `.env` files containing secrets should never be committed.
- MongoDB credentials should not be exposed publicly.

## Tamper Detection

The validation mechanism checks whether the blockchain structure is still consistent.

For every block after the genesis block:

```text
current.previousHash === previous.hash
```

The backend also recalculates the current block's hash.

If:

```text
stored hash !== recalculated hash
```

the block is considered modified.

This allows TrustChain to detect unauthorized changes to stored trust records.

## Limitations

TrustChain is a blockchain-style application designed to demonstrate the core concepts of linked blocks, hashing, persistence, authentication, and tamper detection.

It is not intended to replace a production decentralized blockchain network.

The current implementation uses MongoDB as centralized storage and does not implement:

- Proof of Work
- Mining
- Peer-to-peer networking
- Consensus mechanisms
- Smart contracts
- Distributed nodes

## Future Improvements

Possible future improvements include:

- Role-based access control
- User-specific trust record views
- Advanced audit history
- Better blockchain explorer UI
- Automated tests
- Rate limiting
- Input validation
- API documentation
- Distributed blockchain nodes
- More detailed transaction metadata

## Author

**Ankit Bhagat**

GitHub:

https://github.com/AnkitBhagat707