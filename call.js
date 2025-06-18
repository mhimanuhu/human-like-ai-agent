
require('dotenv').config();
const twilio = require('twilio');


const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = new twilio(accountSid, authToken);

const fromNumber = '+16073054981'; 
const toNumber = '+919829114409'; 

client.calls
  .create({
    url: 'https://1cd2-27-0-216-64.ngrok-free.app/voice',
    to: toNumber,
    from: fromNumber,
  })
  .then(call => {
    console.log('Call initiated, SID:', call.sid);
  })
  .catch(err => {
    console.error('Call failed:', err.message);
  });
