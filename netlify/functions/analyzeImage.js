// هذا الملف يعمل على خادم Netlify (ليس في المتصفح)

exports.handler = async (event) => {
  // 1. احصل على مفتاح API السري من متغيرات Netlify
  // (تأكد من تسميته GEMINI_API_KEY في إعدادات Netlify)
  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "API Key is not set on the server." }),
    };
  }

  // 2. هذا هو الرابط الحقيقي لجوجل، نستخدمه هنا فقط في الخادم
  const GOOGLE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${API_KEY}`;

  // 3. احصل على البيانات (الصورة والتعليمات) التي أرسلها التطبيق
  const clientPayload = JSON.parse(event.body);

  try {
    // 4. قم باستدعاء جوجل بأمان من الخادم
    const response = await fetch(GOOGLE_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clientPayload), // أعد إرسال نفس البيانات
    });

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("Google API Error:", errorBody);
      return {
        statusCode: response.status,
        body: JSON.stringify({ error: `Google API Error: ${response.statusText}`, details: errorBody }),
      };
    }

    const data = await response.json();

    // 5. أعد النتيجة إلى التطبيق (index.html)
    return {
      statusCode: 200,
      headers: {
        "Access-Control-Allow-Origin": "*", // للسماح بالاتصال
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    };

  } catch (error) {
    console.error("Function Error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
