// netlify/functions/analyzeimage.js

const { GoogleGenerativeAI } = require("@google/genai");
const busboy = require('busboy');

// دالة مساعدة لتحليل البيانات متعددة الأجزاء (صورة + حقول نصية)
function parseMultipartForm(event) {
  return new Promise((resolve, reject) => {
    const fields = {};
    const files = {};

    const bb = busboy({ headers: event.headers });

    bb.on('file', (name, file, info) => {
      const { filename, mimeType } = info;
      const chunks =;
      file.on('data', (chunk) => chunks.push(chunk));
      file.on('end', () => {
        files[name] = {
          filename,
          mimeType,
          content: Buffer.concat(chunks),
        };
      });
    });

    bb.on('field', (name, val) => {
      fields[name] = val;
    });

    bb.on('close', () => {
      resolve({ fields, files });
    });

    bb.on('error', err => {
      reject(new Error(`Error parsing form: ${err.message}`));
    });

    bb.end(Buffer.from(event.body, 'base64'));
  });
}

exports.handler = async (event) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set.");
    }

    const { files } = await parseMultipartForm(event);
    const imageFile = files.image;

    if (!imageFile) {
      return { statusCode: 400, body: JSON.stringify({ error: "No image file uploaded." }) };
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-pro-vision" });

    const imagePart = {
      inlineData: {
        data: imageFile.content.toString("base64"),
        mimeType: imageFile.mimeType,
      },
    };

    // الأمر النصي يطلب من الذكاء الاصطناعي الإجابة بتنسيق JSON فقط
    const prompt = `Analyze this image. Is the person wearing all required safety equipment for a pharmaceutical production line, specifically a charlotte, a bavette, and a full industry suit? Respond ONLY with a simple JSON object indicating the presence of each item, for example: {"charlotte": true, "bavette": true, "suit": false}. Do not add any other text or explanations.`;

    const result = await model.generateContent([prompt, imagePart]);
    const response = await result.response;
    let analysisText = response.text();
    
    // تنظيف الاستجابة للتأكد من أنها JSON صالح
    analysisText = analysisText.replace(/```json/g, '').replace(/```/g, '').trim();

    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: analysisText,
    };

  } catch (error) {
    console.error("Error processing request:", error);
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ error: error.message }),
    };
  }
};
