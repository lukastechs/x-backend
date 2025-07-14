const express = require('express');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3000;

// X age checker endpoint
app.post('/api/x/:username', async (req, res) => {
  try {
    // Verify reCAPTCHA (assuming same setup as TikTok checker)
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

    const response = await axios.get(`https://api.x.com/2/users/by/username/${req.params.username}`, {
      headers: {
        Authorization: `Bearer ${process.env.X_BEARER_TOKEN}`,
      },
    });
    const user = response.data.data;
    if (!user) throw new Error('User not found');
    res.json({
      username: user.username,
      created_at: user.created_at,
      followers: user.public_metrics.followers_count,
      bio: user.description || 'N/A',
    });
  } catch (error) {
    res.status(error.response?.status || 500).json({
      error: error.message || 'Failed to fetch X data',
    });
  }
});

app.listen(PORT, () => {
  console.log(`X Server running on port ${PORT}`);
});
