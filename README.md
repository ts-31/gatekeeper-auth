# Gatekeeper Auth

A production-ready authentication system using Google OAuth with Firestore email whitelisting.

## Features

- **Google OAuth** - Sign in with Google authentication
- **Email Whitelisting** - Access restricted to pre-approved emails stored in Firestore
- **Email Registration** - Bonus feature to add new emails to the whitelist
- **Clean UI** - Modern, responsive single-page application

## Tech Stack

- **Frontend**: Vanilla JS + Vite
- **Backend**: Node.js + Express + Passport.js
- **Database**: Firebase Firestore
- **Auth**: Google OAuth 2.0

## Project Structure

```
gatekeeper-auth/
├── client/          # Frontend (Vite)
│   ├── index.html
│   ├── style.css
│   └── app.js
├── server/          # Backend (Express)
│   ├── index.js
│   └── config/
│       └── firebase.js
├── .env             # Environment variables
└── package.json
```

## Setup

### Prerequisites

1. Firebase project with Firestore enabled
2. Google OAuth credentials from Google Cloud Console
3. Firebase service account key

### Environment Variables

Create `.env` file in root:

```env
# Firebase
VITE_FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY=your-private-key
FIREBASE_CLIENT_EMAIL=your-client-email

# Google OAuth
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Session
SESSION_SECRET=your-secret-key

# URLs
CLIENT_URL=http://localhost:5173
SERVER_URL=http://localhost:3000
```

### Firestore Setup

Create a `whitelist` collection with documents containing:
```json
{
  "email": "authorized@example.com"
}
```

### Installation

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client && npm install && cd ..

# Run development servers
npm run dev
```

### Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `http://localhost:3000/auth/google/callback`
4. For production, add your deployed backend URL

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/auth/google` | Initiate Google OAuth |
| GET | `/auth/google/callback` | OAuth callback |
| GET | `/auth/me` | Get current session |
| POST | `/auth/logout` | Logout user |
| POST | `/api/whitelist` | Add email to whitelist |

## Deployment

### Backend (Render)
1. Create new Web Service
2. Connect repository
3. Set environment variables
4. Deploy

### Frontend (Vercel)
1. Import project
2. Set root directory to `client`
3. Add `VITE_API_URL` env variable pointing to backend
4. Deploy

## License

MIT
