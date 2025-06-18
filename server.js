require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Serve audio files from /audio directory
app.use('/audio', express.static(path.join(__dirname, 'audio')));

// checks /audio folder exists
const audioDir = path.join(__dirname, 'audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir);
}

// Gemini setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// ElevenLabs config
const elevenApiKey = process.env.ELEVENLABS_API_KEY;
const voiceId = process.env.ELEVENLABS_VOICE_ID || 'RABOvaPec1ymXz02oDQi'; // default voice

// Initial voice entry
app.post('/voice', (req, res) => {
  const twiml = `
    <Response>
      <Play>https://1cd2-27-0-216-64.ngrok-free.app/audio/welcome.mp3</Play>
      <Gather input="speech" speechTimeout="auto" action="/process" method="POST">

      </Gather> 
      <Say language="en-IN" voice="Polly.Raveena">Maaf kijiye, main sun nahi paya. Dhanyavaad!</Say>
    </Response>
  `;
  res.type('text/xml').send(twiml);
});

// AI + TTS processing
app.post('/process', async (req, res) => {
  const userSpeech = req.body.SpeechResult;
  console.log('🗣️ You said:', userSpeech);

  if (!userSpeech || userSpeech.trim() === '') {
    return res.type('text/xml').send(`
      <Response>
        <Say>Sorry, I didn't hear anything. Please try again.</Say>
        <Redirect>/voice</Redirect>
      </Response>
    `);
  }

  try {
    // Generate response
    const prompt = `You are a helpful Hindi-English speaking customer support assistant. Answer this query clearly in Hinglish. Be straight to the point, keep your reply minimal:"${userSpeech}"`;
    const result = await model.generateContent(prompt);
    const reply = result.response.text().trim();
    console.log('🤖 Gemini:', reply);

    // TTS audio using ElevenLabs
    const audioPath = path.join(__dirname, 'audio', 'response.mp3');

    const ttsResponse = await axios({
      method: 'POST',
      url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      data: {
        text: reply,
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      },
      responseType: 'stream',
      headers: {
        'xi-api-key': elevenApiKey,
        'Content-Type': 'application/json'
      }
    });

    const writer = fs.createWriteStream(audioPath);
    await new Promise((resolve, reject) => {
      ttsResponse.data.pipe(writer);
      writer.on('finish', resolve);
      writer.on('error', reject);
    });

    // Send TwiML with <Play> tag
    const twiml = `
      <Response>
    <Play>https://1cd2-27-0-216-64.ngrok-free.app/audio/filler.mp3</Play>
    <Pause length="1"/>
    <Play> https://1cd2-27-0-216-64.ngrok-free.app/audio/response.mp3</Play>
    <Redirect>/voice</Redirect>
    </Response>
    `;
    res.type('text/xml').send(twiml);

  } catch (err) {
    console.error('❌ Error:', err.message || err);
    res.type('text/xml').send(`
      <Response>
        <Say>Sorry, I encountered an error while processing. Please try again later.</Say>
      </Response>
    `);
  }
});

// Start server
app.listen(port, () => {
  console.log(`AI Voice Bot running at http://localhost:${port}`);
});
