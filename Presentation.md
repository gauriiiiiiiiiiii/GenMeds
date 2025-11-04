# 💊 GenMeds: Your Smart Generic Medicine Finder

A presentation on an AI-powered decision-support tool for healthcare in India.

---

## Introduction

### The Problem
- **High Medication Costs:** Expensive branded medicines dominate the market in India.
- **Lack of Transparency:** Patients struggle with illegible prescriptions, unknown pills, and complex drug information.
- **Information Asymmetry:** A significant gap exists between medical information and patient understanding.

### Our Solution: GenMeds
An intelligent web application that empowers patients by providing:
- **Affordable Alternatives:** Finds safe, government-approved generic medicines.
- **Transparent Information:** Digitizes prescriptions, identifies pills, and explains drug interactions.
- **Accessible Services:** Helps locate nearby pharmacies, including government-run stores.

**Disclaimer:** GenMeds is an informational tool, not a substitute for professional medical advice.

---

## Literature Survey

### 1. Existing Digital Health Platforms (e.g., Tata 1mg, PharmEasy)
- **Focus:** Primarily e-commerce and online consultations (transactional).
- **Gap:** Lack advanced, AI-driven decision-support tools for patient empowerment.

### 2. Government Initiatives (e.g., PMBJP)
- **Goal:** Promote affordable generic medicines through **Janaushadhi Kendras (PMBJKs)**.
- **Gap:** Awareness and adoption remain a challenge for the general public.

### 3. AI Advancements (Google Gemini)
- **Capabilities:** Multimodal input (text + image), structured JSON output, and real-time data grounding with Google Search & Maps.
- **Opportunity:** Enables a single, powerful application to solve the identified gaps.

**GenMeds' Unique Position:** Synthesizes these AI capabilities into a non-transactional, informational tool that directly supports national health objectives.

---

## Dataset Used

GenMeds does not use a static, pre-compiled dataset. Its intelligence is dynamic and sourced from:

### 1. Google Gemini's Pre-trained Knowledge
- The `gemini-2.5-flash` model is trained on a vast corpus of public web data, text, and images.
- This provides a foundational understanding of medical terminology, visual drug characteristics, and health concepts.

### 2. Real-Time Grounding via Tools
- **Google Search:** For the **Medicine Search** feature, the AI uses live web search to fetch up-to-the-minute pricing, regulatory status, and availability.
- **Google Maps:** For the **Store Locator**, the AI queries Google Maps in real-time to find accurate and verifiable pharmacy locations.

This hybrid approach ensures the information is both contextually intelligent and factually current.

---

## Methodology

### System Architecture
- **Frontend:** React with TypeScript
- **Styling:** Tailwind CSS
- **API Layer:** A central `geminiService.ts` module handles all communication with the Gemini API, decoupling it from the UI.

### Gemini API Integration Strategy

| Feature                 | Gemini Model        | Input Type(s)          | Key Configuration                                       |
| ----------------------- | ------------------- | ---------------------- | ------------------------------------------------------- |
| **Prescription Analysis** | `gemini-2.5-flash`  | Image + Text           | **JSON Schema** (for OCR & structured extraction)       |
| **Generic Alternatives**| `gemini-2.5-flash`  | Text                   | **Dynamic JSON Schema** (built on-the-fly)              |
| **Medicine Search**     | `gemini-2.5-flash`  | Text                   | **Google Search Grounding** (for real-time web data)    |
| **Interaction Checker** | `gemini-2.5-flash`  | Text                   | **JSON Schema** (for severity & description)            |
| **Pill Identification** | `gemini-2.5-flash`  | Image + Text           | **JSON Schema** (for physical characteristics)          |
| **Symptom Checker**     | `gemini-2.5-flash`  | Text                   | **JSON Schema** (for conditions & recommendations)      |
| **Store Locator**       | `gemini-2.5-flash`  | Text or Coordinates    | **Google Maps Grounding** (for real-world places)       |

---

## Results and Discussion

### Key Results
- **High Accuracy:** The Prescription Analyzer demonstrated strong OCR performance, and the AI consistently returned relevant generic alternatives.
- **Real-Time Data:** The Medicine Search and Store Locator features successfully retrieved and displayed up-to-date, verifiable information using grounding.
- **Structured Output:** The use of JSON schemas resulted in reliable, structured data across all features, enabling a clean and predictable UI.
- **Positive User Experience:** The application is responsive, intuitive, and effectively presents complex information in an easy-to-understand format (cards, charts, map).

### Discussion
- **Implications:** GenMeds serves as a strong proof-of-concept for how AI can empower patients, promote cost-effective healthcare, and increase health literacy.
- **Limitations:**
    - Performance is dependent on the quality of user-uploaded images.
    - AI can have inaccuracies; the tool is for information, not diagnosis.
    - A digital divide may limit access for some users.
- **Ethical Consideration:** The application's role as a **decision-support tool** is consistently reinforced with clear disclaimers to ensure users consult healthcare professionals.

---

## Conclusion

The GenMeds project successfully developed a comprehensive, AI-powered decision-support tool tailored to the Indian healthcare context.

- **Objective Met:** The application effectively empowers patients by providing transparent information on affordable generic medicines, enhancing safety through interaction checks, and improving access via a store locator.
- **Proof-of-Concept:** It serves as a powerful demonstration of how Google's Gemini API can be leveraged to build user-centric health technology.

### Future Scope
- **Vernacular Language Support:** Expand to major regional languages.
- **Voice-Based Interaction:** Improve accessibility for all users.
- **Secure Backend:** Migrate API key management to a server for production-level security.

---

## References

[1] Google. (2024). *Gemini API Documentation*. Retrieved from https://ai.google.dev/docs/gemini_api_overview

[2] Department of Pharmaceuticals, Government of India. (n.d.). *Pradhan Mantri Bhartiya Janaushadhi Pariyojana (PMBJP)*. Retrieved from http://janaushadhi.gov.in/

[3] World Health Organization. (2021). *Global strategy on digital health 2020-2025*.

[4] Esteva, A., et al. (2019). *A guide to deep learning in healthcare*. Nature Medicine, 25(1), 24–29.
