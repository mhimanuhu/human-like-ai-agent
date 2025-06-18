require('dotenv').config();
const axios = require('axios');
const fs = require('fs');
const path = require('path');

// ElevenLabs Setup
const elevenApiKey = process.env.ELEVENLABS_API_KEY;
const voiceId = process.env.ELEVENLABS_VOICE_ID || 'RABOvaPec1ymXz02oDQi'; // Your default voice ID

// Audio folder
const audioDir = path.join(__dirname, 'audio');
if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir);
}

// Texts to generate
const audioTexts = {
  welcome: 'Namaskar ji! Customer care m aapka swagat hai, Main aapki aaj kya sahayta kr skta hu? .',
  filler: 'Ji bilkul, nischint rahiye. Aapki poori sahayta ki jaayegi.',
  followup: 'Aap kuch or jaan na chahte hai?',
  relisten: 'Maaf kijiye, main aapki baat nahi samaj paya, kripya dubara samjhane ki kripa kare',
  sorry: 'Maaf kijiye, main aapki sahayta krne m asmarth hu',
};

// TTS function
async function generateAudio(text, filename) {
  const outputPath = path.join(audioDir, `${filename}.mp3`);

  const response = await axios({
    method: 'POST',
    url: `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    data: {
      text,
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

  const writer = fs.createWriteStream(outputPath);
  return new Promise((resolve, reject) => {
    response.data.pipe(writer);
    writer.on('finish', () => {
      console.log(`✅ Saved: ${filename}.mp3`);
      resolve();
    });
    writer.on('error', reject);
  });
}

// Main runner
(async () => {
  for (const [filename, text] of Object.entries(audioTexts)) {
    await generateAudio(text, filename);
  }
  console.log('🎉 All audio files generated successfully.');
})();
