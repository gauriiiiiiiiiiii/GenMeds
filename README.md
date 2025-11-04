# 💊 GenMeds: Your Smart Generic Medicine Finder 🇮🇳

## 🌟 Overview

Welcome to **GenMeds**! 🚀 An intelligent decision-support tool designed to empower patients and consumers in India with transparent, accessible, and reliable information about medicines. By leveraging the power of **Google's Gemini AI**, GenMeds helps you find safe and affordable generic alternatives, understand your prescriptions, identify unknown pills, check for drug interactions, and locate nearby pharmacies with ease.

**🚨 Disclaimer:** GenMeds is an informational tool, not a pharmacy or a substitute for professional medical advice. Always consult a qualified healthcare professional before making any decisions regarding your health or medication.

---

## ✨ Core Features

GenMeds is organized into two main sections: **🤖 AI Analysis** for intelligent, context-aware tasks, and **🛠️ Medicine Tools** for specific lookups and utilities.

### 🤖 AI Analysis Tools

This suite of features uses generative AI to analyze user-provided inputs like images and text to deliver insightful health-related information.

#### 📄 Prescription Analyzer
- **What it does:** Upload a photo of a medical prescription, and the AI will scan it, identify the listed medicines, and extract their names, dosages, and quantities.
- **Generic Alternatives:** For each branded medicine, the app automatically finds and displays up to two government-approved, affordable generic alternatives.
- **💰 Price Comparison:** See real-time price comparisons for each generic alternative from major Indian online pharmacies and e-commerce platforms (e.g., 1mg, NetMeds, Amazon.in), presented in a clear bar chart.
- **⚠️ Safety First:** The analysis includes crucial regulatory details like CDSCO approval status, drug schedule, and any official recall notices.

#### 📸 Pill Identifier
- **What it does:** Have an unknown pill? Just snap a photo and upload it.
- **Visual AI Identification:** The AI analyzes the pill's physical characteristics—imprint markings, color, and shape—to identify the most likely medication.
- **📋 Detailed Info:** The result includes the medicine's name, strength, manufacturer, and a description of its common usage.

#### 🩺 Symptom Checker
- **What it does:** Describe your health symptoms in natural language (e.g., "headache and fever for two days").
- **Personalized Analysis:** You can optionally add your **age, gender, and medical history** for a more contextual and personalized analysis.
- **🧠 Condition Analysis:** The AI provides a list of possible, common conditions that may be associated with the symptoms, along with their potential severity level (Low, Medium, High).
- **💡 Actionable Advice:** Get a general recommendation, such as home care tips or when it might be advisable to consult a doctor.
- **🌿 Holistic Remedies:** The tool also suggests relevant non-medicinal remedies, categorized into Home Remedies, Ayurvedic, Physical Activity, and Lifestyle changes.

---

### 🛠️ Medicine Tools

These are practical utilities for everyday medication management and information retrieval.

#### 🔍 Medicine Search
- **What it does:** A powerful search engine to look up any branded medicine available in India.
- **🌐 Grounded in Reality:** The search is powered by **Google Search** grounding to ensure the information is up-to-date and accurate.
- **📊 Comprehensive Details:** Get a detailed breakdown of the branded medicine and two generic alternatives, including their salt composition, strength, form, manufacturer, and real-time prices from various vendors.
- **🔗 Source Transparency:** All information is accompanied by a list of source URLs from the web, so you can verify the data yourself.

#### 🛡️ Interaction Checker
- **What it does:** A vital safety tool that allows you to check for potential interactions between two or more drugs.
- **📈 Severity Rating:** Interactions are classified by severity: **Major, Moderate, or Minor**.
- **💬 Clear Explanations:** The tool provides a simple summary and detailed descriptions for each potential interaction, explaining the risks and what actions to take.

#### 🏪 Store Locator
- **What it does:** Helps you find nearby pharmacies and medical stores.
- **✌️ Dual Search Mode:** Use your device's current GPS location for an instant search, or manually enter a city or pincode.
- **🗺️ Interactive Map:** Results are displayed on an interactive **Google Map**, showing your location and pins for each pharmacy. Selecting a store on the map or list highlights its counterpart.
- **🔬 Advanced Filtering:** Filter results by the pharmacy's name or the services it offers (e.g., "24-hour service").
- **🇮🇳 Dedicated PMBJK Filter:** A special toggle lets you instantly filter for **"Pradhan Mantri Bhartiya Janaushadhi Kendra" (PMBJK)** stores, promoting access to affordable government-supported medicines.
- **⭐ Favorites:** Save your preferred pharmacies to local storage for quick access later.

---

## 🏛️ Technical Architecture & Data Flow

GenMeds is built with a modern frontend stack designed for robustness, maintainability, and a great user experience. The architecture emphasizes a clear separation of concerns.

### 💻 Technology
- **Frontend:** Built with **React** and **TypeScript** for a robust, type-safe user interface.
- **Styling:** Styled using **Tailwind CSS** for a modern, responsive, and utility-first design.
- **Development & Build:** Uses **Vite** for a fast, modern local development server and optimized production builds.
- **AI Backend:** Powered exclusively by the **Google Gemini API** for all intelligent features.
- **Mapping:** Utilizes the **Google Maps JavaScript API** for the interactive store locator.

### 📈 Data Flow
The application's data flow is unidirectional and straightforward:

1.  **User Interaction:** The user interacts with a React component (e.g., uploads an image to `PrescriptionUploader`).
2.  **State Update:** The component updates its state to reflect a "loading" status and displays a spinner to the user.
3.  **Service Layer Call:** The component calls an asynchronous function from the dedicated `services/geminiService.ts`. This service is the **only part of the app that communicates with the Gemini API**.
4.  **API Request:** The `geminiService` constructs the appropriate request for the Gemini API. This includes:
    *   The correct model name (`gemini-2.5-flash`).
    *   A carefully crafted **prompt** that instructs the AI.
    *   The user's data (text or base64-encoded image).
    *   A **JSON schema** to enforce a structured response, or a **tool configuration** (like Google Search or Google Maps) to ground the response in real-time data.
5.  **AI Processing:** The Gemini API processes the request and returns a structured response (usually JSON or Markdown).
6.  **Response Handling:** The `geminiService` receives the response, performs any necessary parsing or error checking, and returns the clean data to the calling component.
7.  **UI Re-render:** The component receives the data, updates its state with the results, and re-renders to display the information to the user in a formatted, user-friendly way (e.g., in cards, charts, or on a map).

This architecture makes the components "dumb" about the API. They only know what data they need and where to get it from, while the `geminiService` handles all the complex AI communication logic.

---

## 🧠 The AI Brain: Gemini API Usage

GenMeds uses different configurations of the Gemini API to power its features, ensuring the right tool is used for each job.

| Feature                 | Gemini Model        | Input Type(s)          | Key Configuration                                                                      |
| ----------------------- | ------------------- | ---------------------- | -------------------------------------------------------------------------------------- |
| **Prescription Analysis** | `gemini-2.5-flash`  | Image + Text           | **JSON Schema:** Strict schema for `name`, `dosage`, `quantity`.                           |
| **Generic Alternatives**| `gemini-2.5-flash`  | Text (Medicine Names)  | **Dynamic JSON Schema:** Schema is built on-the-fly to match the input medicine names. |
| **Medicine Search**     | `gemini-2.5-flash`  | Text (Search Query)    | **Google Search Grounding:** Uses `tools: [{googleSearch: {}}]` for real-time web data.      |
| **Interaction Checker** | `gemini-2.5-flash`  | Text (Medicine List)   | **JSON Schema:** For `summary` and a list of `interactions` with severity.             |
| **Pill Identification** | `gemini-2.5-flash`  | Image + Text           | **JSON Schema:** Defines expected output like `name`, `strength`, `color`, `shape`.        |
| **Symptom Checker**     | `gemini-2.5-flash`  | Text (Symptoms + Info) | **JSON Schema:** For `possibleConditions`, `recommendation`, and `remedies`.               |
| **Store Locator**       | `gemini-2.5-flash`  | Text (Location Query)  | **Google Maps Grounding:** Uses `tools: [{googleMaps: {}}]` to find real-world places.   |

---

## 🚀 Running the Project Locally

To run GenMeds on your local machine, you'll need a modern development environment. This project uses Vite for a fast and efficient development experience.

### Prerequisites
- [Node.js](https://nodejs.org/) (version 18 or higher recommended)
- A package manager like `npm` or `yarn`
- A code editor like [Visual Studio Code](https://code.visualstudio.com/)

### 🔑 API Key Setup

GenMeds requires a **Google API Key** that is enabled for both the **Gemini API** and the **Maps JavaScript API**.

1.  **Get your API Key:**
    *   Go to the [Google Cloud Console](https://console.cloud.google.com/).
    *   Create a new project.
    *   **Enable Billing:** You MUST enable billing for your Google Cloud project by linking a valid billing account. The Google Maps Platform requires this for all usage, and it's the most common reason for map errors.
    *   Enable the **"Generative Language API"** (for Gemini) and the **"Maps JavaScript API"**.
    *   Create an API Key under "Credentials".
    *   **Important:** For security, restrict your API key to only allow these two APIs and, for production, the domain where you will host your app.

2.  **Configure Environment Variables:**
    *   In the root of the project, create a new file named `.env`.
    *   Open the `.env` file and add the following line, replacing `your_api_key_here` with the key you created from the Google Cloud Console.
    ```
    GEMINI_API_KEY="your_api_key_here"
    ```
    *   **Important:** The variable name must be exactly `GEMINI_API_KEY`.

### Installation & Startup

1.  **Clone the Repository:**
    ```bash
    git clone <repository_url>
    cd <project_directory>
    ```

2.  **Install Dependencies:**
    ```bash
    npm install
    ```

3.  **Run the Development Server:**
    ```bash
    npm run dev
    ```

4.  **Open in Browser:**
    Vite will start a development server and provide a local URL (usually `http://localhost:5173`). Open this URL in your web browser to see the application running live. Changes you make to the code will be reflected instantly.

### 🚨 Troubleshooting: "The Map is Not Working!"

If the store locator map shows an error or doesn't load, the issue is almost always with the Google Cloud configuration for your API key. The application code is designed to show a detailed error message. Please follow this checklist carefully:

1.  **Is Billing Enabled? (Most Common Issue)**
    *   Go to your [Google Cloud Console](https://console.cloud.google.com/).
    *   Select your project.
    *   Navigate to the "Billing" section.
    *   **Confirm that your project is linked to an active billing account.** The Google Maps JavaScript API has a generous free tier, but it **will not work at all** without a valid billing account linked to the project.

2.  **Is the "Maps JavaScript API" Enabled?**
    *   In your project's dashboard, go to "APIs & Services" > "Library".
    *   Search for "Maps JavaScript API".
    *   Make sure it is **ENABLED**.

3.  **Is Your API Key Correct in the `.env` file?**
    *   Double-check that you have a file named `.env` in the root of your project.
    *   Ensure the line in the file looks exactly like this, with your key: `GEMINI_API_KEY="ai..."`. There should be no extra spaces or characters.

4.  **Have You Removed API Key Restrictions?**
    *   For local testing, go to "APIs & Services" > "Credentials" and select your API key.
    *   Under "Application restrictions", select "None" to temporarily remove any restrictions that might be blocking the request from `localhost`. (Remember to add restrictions for production!)

Solving these four points will resolve over 99% of map-related issues.

---

## ☁️ Deployment

Deploying GenMeds is straightforward with modern hosting platforms like Vercel or Netlify, which connect directly to your GitHub repository.

### Recommended Method: Vercel / Netlify

These platforms offer a seamless deployment experience with Continuous Integration and Continuous Deployment (CI/CD) built-in.

1.  **Push to GitHub:**
    Make sure your project is pushed to a GitHub repository.

2.  **Create a Project on Your Hosting Provider:**
    *   Sign up for an account on [Vercel](https://vercel.com/) or [Netlify](https://www.netlify.com/).
    *   Create a new project and import your GitHub repository.

3.  **Configure Build Settings:**
    The platform should automatically detect that you're using Vite. The default settings are usually correct:
    *   **Build Command:** `npm run build` or `vite build`
    *   **Output Directory:** `dist`

4.  **Add Environment Variable:**
    *   In your project's settings on Vercel or Netlify, navigate to the "Environment Variables" section.
    *   Add a new variable:
        *   **Name:** `GEMINI_API_KEY`
        *   **Value:** Paste your Google API Key here.

5.  **Deploy!**
    Trigger a deployment. Your site will be built and deployed to a public URL. Future pushes to your main branch on GitHub will automatically trigger new deployments.

### ⚠️ Security Warning: Client-Side API Keys

This project places the Google API key directly into the client-side JavaScript code. **This is not secure for a production application.** Anyone visiting the site can find your API key and potentially use it, which could lead to unexpected charges on your Google Cloud bill.

**For a real-world application, you should proxy all API calls through a backend server (e.g., a Node.js/Express server or a serverless function).** The backend server would securely store the API key and make requests to the Gemini API on behalf of the client, preventing the key from ever being exposed in the browser.

This project uses a client-side approach for simplicity and demonstration purposes. **Always protect your API keys!**

---

## 📂 Project Structure Explained

The project is organized logically to separate concerns, making it easy to navigate and maintain.

```
/
├── components/         # All reusable React components
├── services/
│   └── geminiService.ts    # Central hub for all Gemini API calls
├── styles.css          # Global CSS styles and utility classes
├── App.tsx               # Main application component, manages tabs and layout
├── index.html                # The main HTML file, entry point for Vite
├── index.tsx             # React entry point
├── metadata.json             # Project metadata and permissions
├── package.json              # Project dependencies and scripts
├── README.md                 # You are here!
├── types.ts              # All TypeScript type definitions and interfaces
├── vite.config.ts            # Vite configuration file
└── ... (other config files)
```