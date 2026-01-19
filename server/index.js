require('dotenv').config();
const express = require('express');
const session = require('express-session');
const cors = require('cors');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const { db } = require('./config/firebase');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));

// Trust proxy for secure cookies in production (e.g., Heroku, Vercel, Render)
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax', // 'none' required for cross-site cookie
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  }
}));

app.use(passport.initialize());
app.use(passport.session());

// Passport serialization
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((user, done) => {
  done(null, user);
});

// Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
  try {
    const email = profile.emails[0].value;
    const user = {
      id: profile.id,
      email: email,
      name: profile.displayName,
      picture: profile.photos[0]?.value
    };
    return done(null, user);
  } catch (error) {
    return done(error, null);
  }
}));

// Check if email is whitelisted
async function isEmailWhitelisted(email) {
  try {
    const snapshot = await db.collection('whitelist')
      .where('email', '==', email.toLowerCase())
      .limit(1)
      .get();
    return !snapshot.empty;
  } catch (error) {
    console.error('Error checking whitelist:', error);
    return false;
  }
}

// Routes
app.get('/auth/google', passport.authenticate('google', {
  scope: ['profile', 'email']
}));

app.get('/auth/google/callback',
  passport.authenticate('google', { failureRedirect: `${process.env.CLIENT_URL}?error=auth_failed` }),
  async (req, res) => {
    try {
      const isWhitelisted = await isEmailWhitelisted(req.user.email);
      if (isWhitelisted) {
        req.session.isWhitelisted = true;
        res.redirect(`${process.env.CLIENT_URL}?auth=success`);
      } else {
        req.session.isWhitelisted = false;
        res.redirect(`${process.env.CLIENT_URL}?auth=denied`);
      }
    } catch (error) {
      console.error('Callback error:', error);
      res.redirect(`${process.env.CLIENT_URL}?error=server_error`);
    }
  }
);

app.get('/auth/me', (req, res) => {
  if (req.isAuthenticated()) {
    res.json({
      authenticated: true,
      user: req.user,
      isWhitelisted: req.session.isWhitelisted || false
    });
  } else {
    res.json({ authenticated: false });
  }
});

app.post('/auth/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      return res.status(500).json({ error: 'Logout failed' });
    }
    req.session.destroy();
    res.json({ success: true });
  });
});

// Whitelist registration (Bonus feature)
app.post('/api/whitelist', async (req, res) => {
  try {
    const { email } = req.body;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email || !emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    const normalizedEmail = email.toLowerCase();

    // Check if already exists
    const existing = await db.collection('whitelist')
      .where('email', '==', normalizedEmail)
      .limit(1)
      .get();

    if (!existing.empty) {
      return res.status(409).json({ error: 'Email already whitelisted' });
    }

    // Add to whitelist
    await db.collection('whitelist').add({
      email: normalizedEmail,
      createdAt: new Date().toISOString()
    });

    res.status(201).json({ success: true, message: 'Email added to whitelist' });
  } catch (error) {
    console.error('Whitelist error:', error);
    res.status(500).json({ error: 'Failed to add email' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
