# Mini CRM — MongoDB Edition

A full-stack mini CRM with React frontend and Express backend, backed by **MongoDB** (replaces the original Firebase/Firestore setup).

## Architecture

```
mini-crm/
├── backend/          Express API + MongoDB
│   ├── config/
│   │   └── mongodb.js        MongoDB connection + indexes
│   ├── middleware/
│   │   └── auth.js           JWT token verification
│   ├── routes/
│   │   ├── auth.js           POST /api/auth/register & /login
│   │   ├── leads.js          CRUD for leads + notes + analytics
│   │   └── contact.js        Public contact form endpoint
│   └── server.js
└── frontend/         React + Vite
    └── src/
        ├── context/AuthContext.jsx   JWT-based auth (no Firebase SDK)
        └── services/leads.js        REST API calls (no Firestore SDK)
```

## What changed from Firebase

| Before | After |
|--------|-------|
| Firebase Admin SDK | `mongodb` driver |
| Firestore (leads + notes subcollection) | MongoDB collections: `leads`, `notes` |
| Firebase Auth token verification | `jsonwebtoken` (JWT) |
| Firebase client SDK in frontend | Plain `fetch()` calls to REST API |
| `firebase` npm package (frontend) | Removed — no third-party auth SDK |
| Firestore indexes JSON | MongoDB indexes created in `connectMongo()` |

## MongoDB data model

**leads** collection:
```json
{
  "_id": "ObjectId",
  "name": "string",
  "email": "string",
  "phone": "string",
  "message": "string",
  "source": "website | manual | ...",
  "status": "new | contacted | converted | lost",
  "createdAt": "ISO string",
  "updatedAt": "ISO string"
}
```

**notes** collection (flat — replaces Firestore subcollection):
```json
{
  "_id": "ObjectId",
  "leadId": "string (lead _id as string)",
  "content": "string",
  "author": "email",
  "createdAt": "ISO string"
}
```

**users** collection:
```json
{
  "_id": "ObjectId",
  "email": "string",
  "passwordHash": "bcrypt hash",
  "createdAt": "ISO string"
}
```

## Setup

### Backend

```bash
cd backend
npm install
cp .env.example .env
# Edit .env with your MongoDB URI and a JWT secret
npm run dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env
# Edit .env: VITE_API_URL=http://localhost:3001
npm run dev
```

### First user

Register via the API (or build a registration page):

```bash
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"yourpassword"}'
```

This returns a JWT token. The frontend login page calls the same endpoint automatically.

## Environment variables

### Backend `.env`
```
PORT=3001
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=mini-crm
JWT_SECRET=replace-with-a-long-random-secret
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

### Frontend `.env`
```
VITE_API_URL=http://localhost:3001
```
