# AI Conversational Chatbot Assistant

A production-quality, ChatGPT-style AI Chatbot built with Node.js, Express, React, and official Google Gemini API.

## 🚀 Features

- **Real Google Gemini LLM Integration**: Pure dynamic AI responses using official `@google/generative-ai` SDK. Zero fake or template responses.
- **Dynamic Model Discovery**: Automatically queries Gemini API model-listing endpoint to discover models (`gemini-1.5-flash`, `gemini-2.0-flash`, `gemini-1.5-pro`) accessible to your API key.
- **Conversational Memory**: Maintains turn-by-turn conversation context with automatic history sanitization.
- **Rich Markdown & Code Rendering**: Renders code snippets with syntax headers and individual **Copy Code** buttons, headers, bold, italics, bullet points, and numbered lists.
- **Secure API Key Management**: Supports configuration via server `.env` or client-side UI Settings modal (never exposed or logged).
- **Comprehensive Error Handling**: Differentiates missing keys (401), invalid keys (401), rate limits (429), model 404s, and server errors with user-friendly error banners.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite, Lucide Icons, Custom Modern CSS Glassmorphism
- **Backend**: Node.js, Express, CORS, Express-Rate-Limit, Dotenv
- **AI SDK**: `@google/generative-ai` (v0.24.0+)
- **Models**: `gemini-1.5-flash` (Primary), `gemini-2.0-flash`, `gemini-1.5-pro`

---

## 📦 Installation & Setup

### 1. Prerequisites
- Node.js (v18 or higher)
- Google Gemini API Key (Obtain from [Google AI Studio](https://aistudio.google.com/))

### 2. Clone / Open Project
```bash
cd d:/chatbot
```

### 3. Backend Setup
```bash
cd server
npm install
```

Create or configure `.env` inside `server/`:
```env
PORT=5000
GEMINI_API_KEY=your_actual_gemini_api_key_here
AI_MODEL=gemini-1.5-flash
NODE_ENV=development
```

### 4. Frontend Setup
```bash
cd ../client
npm install
```

---

## 🏃 How to Start the Project

### Option A: Run Both (Terminal 1 & Terminal 2)

**Terminal 1 (Backend):**
```bash
cd server
npm run dev
```
*(Runs backend server on http://localhost:5000)*

**Terminal 2 (Frontend):**
```bash
cd client
npm run dev
```
*(Runs Vite frontend app on http://localhost:3000)*

---

## 🔑 Gemini API Key Setup

You can provide your Gemini API Key in two ways:
1. **Server `.env`**: Set `GEMINI_API_KEY=your_key` in `server/.env`.
2. **UI Settings Modal**: Click the **Settings icon (⚙️)** in the top right header of the web application, enter your key, and click **Save Key**.

---

## 🧪 How to Test the Chatbot

1. Open `http://localhost:3000` in your browser.
2. Ensure status badge displays **API Connected** or **Gemini Live**.
3. Ask test questions:
   - **Math**: `2+3` -> Expected: `2 + 3 = 5.`
   - **Programming**: `Write a C++ program for binary search.` -> Expected: Complete code block with Copy button.
   - **General Knowledge**: `What is the capital of India?` -> Expected: `New Delhi`.
   - **Follow-up Context**: `What is inheritance in Java?` followed by `Give me an example.` -> Expected: Code example for Java inheritance.

---

## 🔍 Troubleshooting Common Gemini Errors

- **`API_KEY_MISSING` (401)**: No key was provided in `server/.env` or UI settings. Enter your Gemini API key in the UI settings (⚙️).
- **`INVALID_API_KEY` (401)**: The key provided is invalid or expired. Check key string from Google AI Studio.
- **`RATE_LIMIT_EXHAUSTED` (429)**: Quota limit exceeded for free tier. Wait a minute before retrying.
- **`MODEL_NOT_FOUND` (404)**: The configured model is not available for your project/region. The backend automatically switches to an available model using dynamic model discovery.
