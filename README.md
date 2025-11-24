# 🌍 Wanderly - AI Trip Planner

**Wanderly** is a next-generation travel planning application that leverages the power of AI to create personalized, day-by-day itineraries for any destination in the world.

![Wanderly Banner](https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?q=80&w=2070&auto=format&fit=crop)

## ✨ Features

*   **🤖 AI-Powered Itineraries**: Generates detailed daily schedules based on your travel style, budget, and preferences using Google's Gemini AI.
*   **☀️ Real-Time Weather**: Fetches current weather conditions for your destination using OpenWeatherMap.
*   **🏨 Smart Recommendations**: Suggests hotels and activities tailored to your specific needs.
*   **💰 Cost Estimation**: Provides a breakdown of estimated costs for accommodation, food, transport, and activities.
*   **💱 Currency Converter**: Instantly convert costs between major global currencies (USD, EUR, GBP, JPY, etc.).
*   **🗺️ Interactive Map**: Visualizes your destination and key points of interest.
*   **📱 Responsive Design**: Beautiful, glassmorphism-inspired UI that works perfectly on desktop and mobile.

## 🛠️ Tech Stack

*   **Frontend**: HTML5, CSS3 (Custom Properties, Glassmorphism), JavaScript (ES6+)
*   **AI Engine**: Google Gemini 2.0 Flash
*   **APIs**:
    *   OpenWeatherMap (Weather & Geocoding)
    *   OpenTripMap (Attractions)
    *   Unsplash (Dynamic Images)
*   **Backend / Serverless**: Netlify Functions (Node.js)

## 🚀 Getting Started

### Prerequisites

*   Node.js installed (for local development with Netlify CLI)
*   API Keys for:
    *   Google Gemini
    *   OpenWeatherMap

### Local Development

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/wanderly-trip-planner.git
    cd wanderly-trip-planner
    ```

2.  **Install Netlify CLI** (Required for serverless functions)
    ```bash
    npm install -g netlify-cli
    ```

3.  **Run the development server**
    ```bash
    netlify dev
    ```
    This will start a local server (usually at `http://localhost:8888`) where the frontend and backend functions work together.

## ☁️ Deployment

This project is optimized for **Netlify**.

1.  Drag and drop the project folder to [Netlify Drop](https://app.netlify.com/drop).
2.  Go to **Site Settings > Environment Variables**.
3.  Add your API keys:
    *   `GOOGLE_API_KEY`: Your Gemini API key
    *   `OPENWEATHER_KEY`: Your OpenWeatherMap API key

## 🔒 Security

This project uses **Netlify Functions** to proxy API requests. This ensures that your sensitive API keys are stored securely on the server side and are never exposed to the client browser.

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
