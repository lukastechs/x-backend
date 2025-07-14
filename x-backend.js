const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Calculate account age in human-readable format
function calculateAccountAge(createdAt) {
  const now = new Date();
  const created = new Date(createdAt);
  const diffMs = now - created;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const years = Math.floor(diffDays / 365);
  const months = Math.floor((diffDays % 365) / 30);
  return years > 0 ? `${years} years, ${months} months` : `${months} months`;
}

// Calculate age in days
function calculateAgeDays(createdAt) {
  const now = new Date();
  const created = new Date(createdAt);
  const diffMs = now - created;
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

// Root endpoint
app.get('/', (req, res) => {
  res.send('X Account Age Checker API is running');
});

// X age checker endpoint (POST for frontend with reCAPTCHA)
app.post('/api/x/:username', async (req, res) => {
  try {
    // Verify reCAPTCHA
    const recaptchaResponse = req.body.recaptcha;
    if (!recaptchaResponse) {
      return res.status(400).json({ error: 'reCAPTCHA required' });
    }
    const recaptchaVerify = await axios.post(
      `https://www.google.com/recaptcha/api/siteverify`,
      new URLSearchParams({
        secret: process.env.RECAPTCHA_SECRET_KEY,
        response: recaptchaResponse,
      })
    );
    if (!recaptchaVerify.data.success) {
      return res.status(400).json({ error: 'reCAPTCHA verification failed' });
    }

    const response = await axios.get(
      `https://api.x.com/2/users/by/username/${req.params.username}?user.fields=public_metrics,created_at,profile_image_url,location,description,verified,verified_type`,
      {
        headers: {
          Authorization: `Bearer ${process.env.X_BEARER_TOKEN}`,
        },
      }
    );
    const user = response.data.data;
    if (!user) throw new Error('User not found');

    console.log('X API Response:', JSON.stringify(response.data, null, 2)); // Log raw response for debugging

    res.json({
      username: user.username || req.params.username,
      nickname: user.name || 'N/A',
      estimated_creation_date: user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A',
      account_age: user.created_at ? calculateAccountAge(user.created_at) : 'N/A',
      age_days: user.created_at ? calculateAgeDays(user.created_at) : 0,
      followers: user.public_metrics?.followers_count || 0,
      total_likes: user.public_metrics?.like_count || 0,
      verified: user.verified ? 'Yes' : 'No',
      verified_type: user.verified_type || 'N/A',
      description: user.description || 'N/A',
      region: user.location || 'N/A',
      user_id: user.id || 'N/A',
      avatar: user.profile_image_url || 'https://via.placeholder.com/50',
    });
  } catch (error) {
    console.error('X API Error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.message || 'Failed to fetch X data',
      details: error.response?.data || 'No additional details',
    });
  }
});

// X age checker endpoint (GET for testing, no reCAPTCHA)
app.get('/api/x/:username', async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.x.com/2/users/by/username/${req.params.username}?user.fields=public_metrics,created_at,profile_image_url,location,description,verified,verified_type`,
      {
        headers: {
          Authorization: `Bearer ${process.env.X_BEARER_TOKEN}`,
        },
      }
    );
    const user = response.data.data;
    if (!user) throw new Error('User not found');

    console.log('X API Response:', JSON.stringify(response.data, null, 2)); // Log raw response for debugging

    res.json({
      username: user.username || req.params.username,
      nickname: user.name || 'N/A',
      estimated_creation_date: user.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A',
      account_age: user.created_at ? calculateAccountAge(user.created_at) : 'N/A',
      age_days: user.created_at ? calculateAgeDays(user.created_at) : 0,
      followers: user.public_metrics?.followers_count || 0,
      total_likes: user.public_metrics?.like_count || 0,
      verified: user.verified ? 'Yes' : 'No',
      verified_type: user.verified_type || 'N/A',
      description: user.description || 'N/A',
      region: user.location || 'N/A',
      user_id: user.id || 'N/A',
      avatar: user.profile_image_url || 'https://via.placeholder.com/50',
    });
  } catch (error) {
    console.error('X API Error:', error.response?.data || error.message);
    res.status(error.response?.status || 500).json({
      error: error.message || 'Failed to fetch X data',
      details: error.response?.data || 'No additional details',
    });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`X Server running on port ${PORT}`);
});
