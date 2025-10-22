// Modern ES module syntax for Netlify functions
export async function handler(event) {
    
    // 1. Get the API key from Netlify environment variables
    const apiKey = process.env.GEMINI_API_KEY;
    
    if (!apiKey) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: "GEMINI_API_KEY is not set in Netlify." })
        };
    }

    // 2. Get the payload (contents, etc.) from the client's request
    let clientPayload;
    try {
        clientPayload = JSON.parse(event.body);
    } catch (e) {
        return {
            statusCode: 400,
            body: JSON.stringify({ error: "Invalid request body." })
        };
    }

    // 3. Construct the real Google API URL
    const googleApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`;

    try {
        // 4. Call the Google API securely from the server
        const apiResponse = await fetch(googleApiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(clientPayload)
        });

        const responseBody = await apiResponse.text();

        if (!apiResponse.ok) {
            // Forward the error from Google
            return {
                statusCode: apiResponse.status,
                body: responseBody
            };
        }

        // 5. Send the successful response from Google back to the client
        return {
            statusCode: 200,
            body: responseBody
        };

    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ error: `Serverless function error: ${error.message}` })
        };
    }
}
