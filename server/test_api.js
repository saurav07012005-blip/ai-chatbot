import dotenv from 'dotenv';
dotenv.config();

async function testApi() {
  const apiKey = process.env.GEMINI_API_KEY;
  console.log("Env key present:", Boolean(apiKey && apiKey !== 'your_gemini_api_key_here'));

  const testPrompts = [
    "2+3 equals to?",
    "What is the capital of India?",
    "Write a C++ program for binary search.",
    "Explain DBMS normalization.",
    "What is 25% of 800?"
  ];

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.log("No API key configured in .env yet. Test endpoint response for missing key:");
    const res = await fetch('http://localhost:5000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: "2+3 equals to?" })
    });
    console.log("Response:", await res.json());
    return;
  }

  for (const prompt of testPrompts) {
    console.log(`\n-----------------------------------`);
    console.log(`PROMPT: "${prompt}"`);
    const res = await fetch('http://localhost:5000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: prompt })
    });
    const data = await res.json();
    console.log("Status:", res.status);
    console.log("Model:", data.data?.model);
    console.log("Response Text:\n", data.message || data);
  }
}

testApi();
