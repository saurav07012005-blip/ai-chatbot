import dotenv from 'dotenv';
dotenv.config();

async function runLiveTests() {
  const apiKey = (process.env.GEMINI_API_KEY || '').trim();
  console.log("=========================================");
  console.log("RUNNING END-TO-END GEMINI CHATBOT TESTS");
  console.log("API Key configured in .env:", Boolean(apiKey && apiKey !== 'your_gemini_api_key_here'));
  console.log("=========================================\n");

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    console.log("ℹ️ No GEMINI_API_KEY set in server/.env file.");
    console.log("Verified API error handling for missing key:");
    const res = await fetch('http://localhost:5000/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: "2+3" })
    });
    console.log(await res.json());
    return;
  }

  // 1. Math Test
  console.log("TEST 1: '2+3'");
  let res = await fetch('http://localhost:5000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: "2+3" })
  });
  let data = await res.json();
  console.log("Model Used:", data.data?.model);
  console.log("Response:", data.message || data);

  // 2. Java Test
  console.log("\nTEST 2: 'What is Java?'");
  res = await fetch('http://localhost:5000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: "What is Java?" })
  });
  data = await res.json();
  console.log("Model Used:", data.data?.model);
  console.log("Response Preview:\n", (data.message || '').substring(0, 200) + "...");

  // 3. Binary Search C++ Test
  console.log("\nTEST 3: 'Write a C++ program for binary search.'");
  res = await fetch('http://localhost:5000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: "Write a C++ program for binary search." })
  });
  data = await res.json();
  console.log("Model Used:", data.data?.model);
  console.log("Response Preview:\n", (data.message || '').substring(0, 250) + "...");

  // 4. DBMS Normalization Test
  console.log("\nTEST 4: 'Explain DBMS normalization.'");
  res = await fetch('http://localhost:5000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: "Explain DBMS normalization." })
  });
  data = await res.json();
  console.log("Model Used:", data.data?.model);
  console.log("Response Preview:\n", (data.message || '').substring(0, 250) + "...");

  // 5. Follow-up Context Test
  console.log("\nTEST 5: Follow-up question with history context");
  const conversation = [
    { role: 'user', content: 'What is polymorphism in Java?' },
    { role: 'model', content: 'Polymorphism in Java is the ability of an object to take on many forms. The most common use of polymorphism in OOP occurs when a parent class reference is used to refer to a child class object.' }
  ];
  res = await fetch('http://localhost:5000/api/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message: "Give me a code example of that.",
      conversation
    })
  });
  data = await res.json();
  console.log("Model Used:", data.data?.model);
  console.log("Response Preview:\n", (data.message || '').substring(0, 250) + "...");
}

runLiveTests();
