// services/emailService.js
const API_BASE_URL = 'https://zivvy.app/.netlify/functions';

export const sendWelcomeEmail = async (email, name) => {
  try {
    const response = await fetch(`${API_BASE_URL}/send-welcome-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        name,
        source: 'mobile_app'
      }),
    });
    
    if (!response.ok) {
      throw new Error('Email send failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Welcome email error:', error);
    return { success: false };
  }
};