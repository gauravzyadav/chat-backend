const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ 
    model: "gemini-2.0-flash", 
    generationConfig: {
        temperature: 0.7,
     },
    systemInstruction: "You are a helpful AI assistant. Answer concisely and clearly."
});

async function askGemini(prompt) {
  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (err) {
    
    console.error('❌ Gemini API Error:', err.message);
    return "Sorry, I couldn't process that.";
  }
}

module.exports = askGemini;
