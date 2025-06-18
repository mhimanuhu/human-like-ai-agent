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

// Serve audio files
app.use('/audio', express.static(path.join(__dirname, 'audio')));

// Ensure /audio exists
const audioDir = path.join(__dirname, 'audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir);
}

// Gemini AI setup
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

// ElevenLabs setup
const elevenApiKey = process.env.ELEVENLABS_API_KEY;
const voiceId = process.env.ELEVENLABS_VOICE_ID || 'RABOvaPec1ymXz02oDQi';

// Ngrok URL
const Ngrok_host = "https://088e-27-0-216-5.ngrok-free.app";

// In-memory conversation store
const sessionHistory = {};

// Initial entrypoint — only plays welcome once
app.post('/voice', (req, res) => {
  const twiml = `
    <Response>
      <Play>${Ngrok_host}/audio/welcome.mp3</Play>
      <Gather input="speech" speechTimeout="auto" action="/process" method="POST" />
      <Play>${Ngrok_host}/audio/relisten.mp3</Play>
      <Gather input="speech" speechTimeout="auto" action="/process" method="POST" />
      <Play>${Ngrok_host}/audio/sorry.mp3</Play>
    </Response>
  `;
  res.type('text/xml').send(twiml);
});

// Continue conversation without repeating welcome
app.post('/continue', (req, res) => {
  const twiml = `
    <Response>
      <Gather input="speech" speechTimeout="auto" action="/process" method="POST">
      </Gather>
      <Play>${Ngrok_host}/audio/relisten.mp3</Play>
      <Gather input="speech" speechTimeout="auto" action="/process" method="POST" />
      <Play>${Ngrok_host}/audio/sorry.mp3</Play>
    </Response>
  `;
  res.type('text/xml').send(twiml);
});

// AI + TTS processing
app.post('/process', async (req, res) => {
  const userSpeech = req.body.SpeechResult;
  const userNumber = req.body.To || 'Unknown';
  const callSid = req.body.CallSid || 'no-call-id';

  console.log(`📞 Customer Number: ${userNumber} | 🗣️ You said:`, userSpeech);

  if (!userSpeech || userSpeech.trim() === '') {
    return res.type('text/xml').send(`
      <Response>
        <Play>${Ngrok_host}/audio/relisten.mp3</Play>
        <Redirect>/continue</Redirect>
      </Response>
    `);
  }

  try {
    //  conversation history
    if (!sessionHistory[callSid]) sessionHistory[callSid] = [];
    sessionHistory[callSid].push({ role: 'user', content: userSpeech });

    const fullPrompt = sessionHistory[callSid]
      .map(m => `${m.role === 'user' ? 'User' : 'Assistant'}: ${m.content}`)
      .join('\n');

    const finalPrompt = `You are a helpful Hinglish-speaking customer support assistant. Keep replies short, polite, respectful, human-like and relevant and with well punctuations.\n${fullPrompt}\nAssistant:`;

    const result = await model.generateContent(finalPrompt);
    const reply = result.response.text().trim();
    console.log('🤖 Gemini:', reply);

    sessionHistory[callSid].push({ role: 'assistant', content: reply });

    // Convert reply to speech
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

    // Speak response and follow up, then redirect to /continue
    const twiml = `
      <Response>
        <Play>${Ngrok_host}/audio/filler.mp3</Play>
        <Pause length="1"/>
        <Play>${Ngrok_host}/audio/response.mp3</Play>
        <Pause length="1"/>
        <Play>${Ngrok_host}/audio/followup.mp3</Play>
        <Redirect>/continue</Redirect>
      </Response>
    `;
    res.type('text/xml').send(twiml);

  } catch (err) {
    console.error('❌ Error:', err.message || err);
    res.type('text/xml').send(`
      <Response>
        <Play>${Ngrok_host}/audio/sorry.mp3</Play>
      </Response>
    `);
  }
});

// Start server
app.listen(port, () => {
  console.log(`AI Voice Bot running at http://localhost:${port}`);
});
