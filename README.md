# 🤖 Human-Like AI Agent for Customer Support Calls

> A voice-based AI-powered customer support agent that listens, thinks, and replies like a human in Hinglish—over phone calls.

![Node.js](https://img.shields.io/badge/Built%20with-Node.js-brightgreen)
![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Status](https://img.shields.io/badge/AI-Gemini%20%2B%20ElevenLabs-orange)
![Twilio](https://img.shields.io/badge/Voice-Twilio-red)

---

## 🧠 About the Project

This project simulates a **realistic AI customer support agent** that works over phone calls. It:

- Answers calls using **Twilio**
- Welcomes users with a human-like **Hinglish** voice
- Understands user queries via **speech-to-text**
- Uses **Google Gemini AI** to generate smart responses
- Converts the response into speech using **ElevenLabs TTS**

This creates a near-human experience and can be extended for customer care, receptionist bots, or IVR automation.

---

## 🛠️ Tech Stack

| Layer         | Tool/Tech               |
|---------------|-------------------------|
| 🧠 AI Brain    | Google Gemini 1.5 Flash |
| 🔊 Voice TTS   | ElevenLabs API          |
| 📞 Telephony   | Twilio Voice            |
| 🌐 Backend     | Node.js, Express        |
| 🔒 Secrets     | dotenv                  |
| 🚇 Tunnel      | ngrok (for testing)     |

---

## 📁 Project Structure

```text
human-like-ai-agent/
├── audio/               # Audio files used during calls
├── call.js              # Script to initiate a call via Twilio
├── server.js            # Express server for handling voice and AI logic
├── static-audio.js      # Script to pre-generate common audio messages
├── .env                 # Environment variables (not included)
├── package.json         # Project dependencies
```
---

## 🚀 Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/mhimanuhu/human-like-ai-agent
cd human-like-ai-agent

```

### 2. Install dependencies

```bash

npm install
```

### 3. Set up .env file

Create a .env file in the root directory and fill in the following:

```
TWILIO_ACCOUNT_SID=your_twilio_account_sid
TWILIO_AUTH_TOKEN=your_twilio_auth_token
GEMINI_API_KEY=your_google_gemini_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=RABOvaPec1ymXz02oDQi

```
⚠️ Never commit .env files or expose your keys publicly.

### 4. Generate Audio Files
This will create welcome.mp3, filler.mp3, followup.mp3, etc using ElevenLabs:
``` bash
node static-audio.js
```

### 5. Run the Voice Server

```bash
node server.js
```

### 6. Make sure your server is accessible via ngrok or similar:

```bash
ngrok http 3000
```

Update the ngrok URL inside server.js and call.js accordingly.

### 7. Make a Test Call

Edit call.js to set your Twilio-verified number:

```bash

const toNumber = "+91XXXXXXXX";
```
Then run

```bash

node call.js
```