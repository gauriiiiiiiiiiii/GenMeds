import { GoogleGenAI, Type, GroundingChunk } from "@google/genai";
import type { PrescriptionMedicine, BrandedMedicineAnalysis, Pharmacy, InteractionAnalysisResult, PillIdentificationResult, SymptomAnalysisResult } from '../types';

// FIX: Aligned API key usage with the specified coding guidelines (process.env.API_KEY) to resolve TypeScript error on line 5.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const prescriptionAnalysisSchema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      name: {
        type: Type.STRING,
        description: 'The name of the medicine.',
      },
      dosage: {
        type: Type.STRING,
        description: 'The dosage instruction (e.g., "500mg", "1-0-1"). Can be null if not found.',
      },
      quantity: {
        type: Type.STRING,
        description: 'The quantity prescribed (e.g., "10 tablets"). Can be null if not found.',
      },
    },
    required: ["name"],
  },
};

const priceSchema = {
  type: Type.ARRAY,
  description: "Pricing from major Indian online pharmacies and e-commerce sites.",
  items: {
    type: Type.OBJECT,
    properties: {
      pharmacy: { type: Type.STRING, description: "Name of the vendor (e.g., 'Tata 1mg', 'Apollo Pharmacy', 'NetMeds', 'Amazon.in')." },
      price: { type: Type.STRING, description: "Price in INR (e.g., '₹15.50')." },
      discount: { type: Type.STRING, description: "Optional discount (e.g., '20% OFF')." },
    },
    required: ["pharmacy", "price"],
  }
};

const alternativeSchema = {
  type: Type.OBJECT,
  properties: {
    genericName: { type: Type.STRING, description: 'The common brand name of the generic medicine.' },
    saltComposition: { type: Type.STRING, description: 'The active pharmaceutical ingredient(s).' },
    strength: { type: Type.STRING, description: 'The strength of the medicine (e.g., "500 mg").' },
    form: { type: Type.STRING, description: 'The dosage form (e.g., "Tablet", "Syrup").' },
    prices: priceSchema,
    safetyNote: { type: Type.STRING, description: 'Any general safety note, like if it requires supervision in India. Should be null if no special note.' },
    cdscoStatus: { 
        type: Type.STRING, 
        description: 'The CDSCO approval status in India.',
        enum: ['Approved', 'Banned', 'Under Review', 'N/A'],
    },
    schedule: {
        type: Type.STRING,
        description: 'The drug schedule in India.',
        enum: ['Schedule H', 'OTC', 'Ayurvedic', 'General', 'N/A'],
    },
    recallNotice: { type: Type.STRING, description: 'Any official recall notices or warnings. Must be null if none exist.' },
  },
  required: ["genericName", "saltComposition", "strength", "form", "prices", "cdscoStatus", "schedule", "recallNotice"],
};


const genericAlternativesSchema = {
  type: Type.OBJECT,
  properties: {},
  description: 'An object where each key is a branded medicine name from the input list. The value is an object containing the branded salt composition and an array of generic alternatives.'
};

const interactionCheckerSchema = {
    type: Type.OBJECT,
    properties: {
        summary: {
            type: Type.STRING,
            description: "A brief, easy-to-understand summary of the potential interactions found."
        },
        interactions: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    medicines: {
                        type: Type.ARRAY,
                        description: "The pair of medicines that interact.",
                        items: { type: Type.STRING },
                        minItems: 2,
                        maxItems: 2,
                    },
                    severity: {
                        type: Type.STRING,
                        description: "The severity of the interaction.",
                        enum: ['Major', 'Moderate', 'Minor', 'None']
                    },
                    description: {
                        type: Type.STRING,
                        description: "A detailed explanation of the interaction, its risks, and what to do."
                    }
                },
                required: ["medicines", "severity", "description"]
            }
        }
    },
    required: ["summary", "interactions"]
};

const pillIdentifierSchema = {
    type: Type.OBJECT,
    properties: {
        name: { type: Type.STRING, description: "The most likely name of the medicine." },
        strength: { type: Type.STRING, description: "The dosage strength (e.g., '500 mg'). Null if not identifiable." },
        imprint: { type: Type.STRING, description: "The markings or imprint on the pill. Null if none or unclear." },
        color: { type: Type.STRING, description: "The color of the pill. Null if not identifiable." },
        shape: { type: Type.STRING, description: "The shape of the pill (e.g., 'Round', 'Oval'). Null if not identifiable." },
        manufacturer: { type: Type.STRING, description: "The likely manufacturer. Null if not identifiable." },
        usageDescription: { type: Type.STRING, description: "A brief description of what the medicine is typically used for." },
    },
    required: ["name", "usageDescription"],
};

const symptomCheckerSchema = {
    type: Type.OBJECT,
    properties: {
        possibleConditions: {
            type: Type.ARRAY,
            description: "A list of possible medical conditions based on the symptoms.",
            items: {
                type: Type.OBJECT,
                properties: {
                    condition: { type: Type.STRING, description: "The name of the possible condition." },
                    severity: {
                        type: Type.STRING,
                        description: "The potential severity of the condition.",
                        enum: ['Low', 'Medium', 'High']
                    },
                    description: { type: Type.STRING, description: "A brief, user-friendly description of the condition." }
                },
                required: ["condition", "severity", "description"]
            }
        },
        recommendation: {
            type: Type.STRING,
            description: "Actionable advice for the user, such as home care tips or when to see a doctor."
        },
        nonMedicinalRemedies: {
            type: Type.ARRAY,
            description: "A list of non-medicinal remedies, including home remedies, Ayurvedic suggestions, and physical activities.",
            items: {
                type: Type.OBJECT,
                properties: {
                    category: {
                        type: Type.STRING,
                        description: "The category of the remedy.",
                        enum: ['Home Remedy', 'Ayurvedic', 'Physical Activity', 'Lifestyle']
                    },
                    remedy: {
                        type: Type.STRING,
                        description: "The name of the remedy (e.g., 'Ginger Tea', 'Yoga')."
                    },
                    description: {
                        type: Type.STRING,
                        description: "A brief explanation of how to apply the remedy and its benefits."
                    }
                },
                required: ["category", "remedy", "description"]
            }
        },
        disclaimer: {
            type: Type.STRING,
            description: "A mandatory disclaimer stating this is not a medical diagnosis."
        }
    },
    required: ["possibleConditions", "recommendation", "disclaimer"]
};


export async function analyzePrescriptionImage(base64Image: string, mimeType: string): Promise<PrescriptionMedicine[]> {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Image,
            },
          },
          {
            text: `Analyze this image of a medical prescription from India. Extract the names of the medicines, their dosage, and quantity. Return the result as a JSON array of objects. If a value for dosage or quantity is unclear or not present, return null for that key.`,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: prescriptionAnalysisSchema,
      },
    });

    const jsonString = response.text.trim();
    if (!jsonString) {
      throw new Error("Received an empty response from the AI model.");
    }
    const medicines = JSON.parse(jsonString);
    
    if (!Array.isArray(medicines)) {
      throw new Error("Invalid response format from Gemini API.");
    }
    
    return medicines as PrescriptionMedicine[];
  } catch (error) {
    console.error("Error analyzing prescription image:", error);
    throw new Error("Failed to analyze the prescription. Please ensure the image is clear and that your API key is configured correctly.");
  }
}

export async function findGenericAlternatives(medicineNames: string[]): Promise<Record<string, BrandedMedicineAnalysis>> {
  try {
    
    const dynamicSchema = { ...genericAlternativesSchema };
    const properties: Record<string, any> = {};

    medicineNames.forEach(name => {
      properties[name] = {
        type: Type.OBJECT,
        properties: {
          brandedSaltComposition: {
            type: Type.STRING,
            description: `The salt composition for the branded medicine ${name}.`
          },
          alternatives: {
            type: Type.ARRAY,
            description: `Generic alternatives for ${name}`,
            items: alternativeSchema
          }
        },
        required: ["brandedSaltComposition", "alternatives"]
      };
    });
    dynamicSchema.properties = properties;


    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `For the following list of branded medicines available in India: ${medicineNames.join(', ')}.
      1. For each medicine, first provide its primary salt composition.
      2. Then, find up to 2 affordable and safe generic alternatives. For each alternative, provide its common generic brand name, salt composition, strength, and form.
      3. Provide real-time prices for each alternative from 2-3 major Indian vendors like 'Tata 1mg', 'Apollo Pharmacy', 'NetMeds', and 'Amazon.in'. You MUST provide only the vendor name and the price in INR.
      4. For each alternative, provide its regulatory status in India: its CDSCO approval status ('Approved', 'Banned', 'Under Review', 'N/A') and its drug schedule ('Schedule H', 'OTC', 'Ayurvedic', 'General', 'N/A').
      5. Check for and include any recent recall notices or official warnings. If there are none, this must be null.
      6. Provide a brief general safety note ONLY if the drug requires special supervision in India; otherwise, this must be null.
      Return the result as a JSON object where keys are the original branded medicine names. The value for each key must be an object containing "brandedSaltComposition" (a string) and "alternatives" (an array).`,
      config: {
        responseMimeType: "application/json",
        responseSchema: dynamicSchema,
      },
    });

    const jsonString = response.text.trim();
    if (!jsonString) {
      throw new Error("Received an empty response from the AI model.");
    }
    return JSON.parse(jsonString) as Record<string, BrandedMedicineAnalysis>;

  } catch (error) {
    console.error("Error finding generic alternatives:", error);
    throw new Error("Failed to find generic alternatives. The model may not have information for the medicines, or there may be an issue with your API key.");
  }
}


export async function searchMedicine(query: string): Promise<{ content: string; sources: { uri: string; title: string }[] } | null> {
  try {
    const prompt = `You are an expert on medicines in India. A user is searching for "${query}".
Use Google Search to find the most up-to-date, real-time information.

Your primary goal is to find information for the exact medicine queried.
If you cannot find an exact match for "${query}", search for the most relevant or similarly named medicine available in India.
If you provide a result for a similar medicine, you MUST add a note at the very top of your response, before any markdown headings, like this:
**Note:** An exact match for "${query}" was not found. Showing results for the most similar medicine, [Similar Medicine Name].

Provide a detailed comparison in Markdown format. The structure MUST be as follows, using the exact headings and formatting:

## Branded Medicine: [Medicine Name Found]
* **Salt Composition**: [The salt composition]
* **Strength**: [The strength, e.g., 650 mg]
* **Form**: [The form, e.g., Tablet]
* **Manufacturer**: [The manufacturer]
* **Regulatory Status**: [e.g., "CDSCO Approved (Schedule H)"]
* **Recall/Warning**: [Any recall notice, or "None"]
* **Prices**:
  * **[Vendor Name]**: [Price in INR]
  * **[Vendor Name]**: [Price in INR]
  * ... (list other popular vendors like Tata 1mg, NetMeds, Apollo Pharmacy, Amazon.in, etc. You MUST provide their real-time prices directly in INR format, like '₹123.45'. DO NOT provide URLs.)

## Generic Alternative 1: [Generic Brand Name]
* **Salt Composition**: [The salt composition]
* **Strength**: [The strength]
* **Form**: [The form]
* **Manufacturer**: [The manufacturer]
* **Regulatory Status**: [e.g., "CDSCO Approved (OTC)"]
* **Recall/Warning**: [Any recall notice, or "None"]
* **Prices**:
  * **[Vendor Name]**: [Price in INR]
  * **[Vendor Name]**: [Price in INR]
  * ... (Same pricing rules as above.)

## Generic Alternative 2: [Generic Brand Name]
* **Salt Composition**: [The salt composition]
* **Strength**: [The strength]
* **Form**: [The form]
* **Manufacturer**: [The manufacturer]
* **Regulatory Status**: [e.g., "Ayurvedic"]
* **Recall/Warning**: [Any recall notice, or "None"]
* **Prices**:
  * **[Vendor Name]**: [Price in INR]
  * **[Vendor Name]**: [Price in INR]
  * ... (Same pricing rules as above.)

## Salt Comparison
[A brief section explaining that the generic alternatives are effective because they contain the same active ingredient (salt composition) as the branded medicine.]

If absolutely no relevant or similar medicine can be found, your entire response must be ONLY the text "No results were found.". Do not invent information. Do not add any introductory or concluding text outside of the specified Markdown structure (except for the similarity note when applicable).`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        tools: [{googleSearch: {}}],
      },
    });
    
    const content = response.text.trim();

    if (!content || content.toLowerCase().includes("no results were found")) {
      return null;
    }
    
    // The grounding chunk handling is now explicitly typed and validated.
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
    const sources = groundingChunks
        .map((chunk: GroundingChunk) => chunk.web)
        .filter((web): web is { uri: string; title?: string } => !!web?.uri)
        .map(web => ({ uri: web.uri, title: web.title ?? '' }));

    return { content, sources };

  } catch (error) {
    console.error(`Error searching for medicine "${query}":`, error);
    throw new Error("Failed to complete the search. This could be a network issue, an invalid API key, or the AI model is temporarily unavailable. Please try again.");
  }
}

// A helper function to safely parse the model's JSON output
async function parseGroundedJson(text: string, context: string): Promise<any[]> {
    let jsonString = text.trim();
    if (!jsonString) {
        return [];
    }
    if (jsonString.startsWith('```json')) {
        jsonString = jsonString.substring(7, jsonString.length - 3).trim();
    }
    
    try {
        const data = JSON.parse(jsonString);
        if (!Array.isArray(data)) {
            throw new Error("Parsed data is not an array.");
        }
        return data;
    } catch (parseError) {
        console.error(`Failed to parse JSON response for ${context}:`, jsonString, parseError);
        throw new Error(`The AI model returned data in an unexpected format for ${context}. Please try again.`);
    }
}


export async function findPharmacies(location: { lat: number; lng: number } | { query: string }): Promise<Pharmacy[]> {
    try {
        const locationPrompt = 'lat' in location 
            ? `The user is at latitude ${location.lat} and longitude ${location.lng} in India.`
            : `The user is searching for pharmacies near "${location.query}" in India.`;

        const prompt = `${locationPrompt}
Your task is to act as a reliable pharmacy locator.
Using the Google Maps tool, find a list of up to 15 real, existing, and verifiable nearby pharmacies.
Prioritize well-known chains (like Apollo, MedPlus), established local pharmacies, and also include any "Pradhan Mantri Bhartiya Janaushadhi Kendra" (PMBJK) stores if they are nearby.
**Crucially, you must only return data that is directly sourced from Google Maps. Do not invent, guess, or hallucinate any information.**

For each pharmacy, provide the following details:
- name: The name of the pharmacy.
- address: The full address.
- distance: The distance from the user's location (if available).
- contact: The contact number. If not available, return null.
- latitude and longitude.
- services: A list of notable services as a string array (e.g., ["24-hour service"]). If a store is a PMBJK, YOU MUST include "Jan Aushadhi" in its services list. If no specific services are known, the services array should be empty or null.

Return the result ONLY as a valid JSON array of objects. Do not include any introductory text, markdown formatting, or explanations. If no pharmacies are found, return an empty JSON array [].`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                tools: [{ googleMaps: {} }],
                toolConfig: 'lat' in location ? {
                    retrievalConfig: {
                        latLng: {
                            latitude: location.lat,
                            longitude: location.lng
                        }
                    }
                } : undefined,
            },
        });

        const pharmacies = await parseGroundedJson(response.text, 'pharmacies');
        return pharmacies as Pharmacy[];

    } catch (error) {
        console.error("Error finding pharmacies:", error);
        if (error instanceof Error && error.message.includes("unexpected format")) {
            throw error;
        }
        throw new Error("Could not find pharmacies. Please check your network, refine your query, or verify your API key and billing status.");
    }
}


export async function checkDrugInteractions(medicines: string[]): Promise<InteractionAnalysisResult> {
    if (medicines.length < 2) {
        throw new Error("Please provide at least two medicines to check for interactions.");
    }
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze the potential drug interactions for the following list of medicines: ${medicines.join(', ')}.
            For each pair of interacting drugs, provide the severity ('Major', 'Moderate', or 'Minor') and a clear description of the interaction.
            Also provide an overall summary. If no interactions are found, the interactions array should be empty and the summary should state that.
            This is for informational purposes in an Indian context. Structure the response according to the provided JSON schema.`,
            config: {
                responseMimeType: 'application/json',
                responseSchema: interactionCheckerSchema,
            },
        });

        const jsonString = response.text.trim();
        if (!jsonString) {
          throw new Error("Received an empty response from the AI model.");
        }
        const result = JSON.parse(jsonString);

        return result as InteractionAnalysisResult;
    } catch (error) {
        console.error("Error checking drug interactions:", error);
        throw new Error("Could not check for interactions. The AI model may be busy or there may be an issue with your API key configuration. Please try again in a moment.");
    }
}

export async function identifyPill(base64Image: string, mimeType: string): Promise<PillIdentificationResult> {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: {
                parts: [
                    {
                        inlineData: {
                            mimeType,
                            data: base64Image,
                        },
                    },
                    {
                        text: `Analyze this image of a pill. Identify the medicine based on its appearance (imprint, color, shape). The context is for medicines available in India. Provide the most likely identification. If the pill is not clearly identifiable, make a best guess and state the uncertainty in the usage description. Return a single JSON object.`,
                    },
                ],
            },
            config: {
                responseMimeType: "application/json",
                responseSchema: pillIdentifierSchema,
            },
        });

        const jsonString = response.text.trim();
        if (!jsonString) {
          throw new Error("Received an empty response from the AI model.");
        }
        const result = JSON.parse(jsonString);

        if (!result || !result.name) {
            throw new Error("Could not identify the pill from the image.");
        }

        return result as PillIdentificationResult;
    } catch (error) {
        console.error("Error identifying pill:", error);
        throw new Error("Failed to identify the pill. Please ensure the image is clear, well-lit, and that your API key is configured correctly.");
    }
}

export async function analyzeSymptoms(
    symptoms: string,
    personalInfo?: { age?: string; gender?: string; history?: string }
): Promise<SymptomAnalysisResult> {
    try {
        let userInfo = '';
        if (personalInfo) {
            const { age, gender, history } = personalInfo;
            const parts: string[] = [];
            if (age) parts.push(`age ${age}`);
            if (gender) parts.push(`gender ${gender}`);
            if (history) parts.push(`with a medical history of: "${history}"`);
            
            if (parts.length > 0) {
                userInfo = ` The user is ${parts.join(', ')}.`;
            }
        }

        const prompt = `A user has provided the following symptoms: "${symptoms}".${userInfo}
            Analyze these symptoms, taking the user's personal information into account for a more contextual result. Provide a list of up to 3 possible, common conditions. For each condition, provide its name, a severity level ('Low', 'Medium', 'High'), and a brief description.
            Also, provide a general recommendation for the user (e.g., when to see a doctor).
            
            Additionally, suggest 2-4 non-medicinal remedies relevant to the symptoms. These should be safe, general suggestions. Categorize them as 'Home Remedy', 'Ayurvedic', 'Physical Activity', 'Lifestyle'. For each remedy, provide its name and a brief description.
            
            Crucially, include a disclaimer that this is an AI-generated analysis and not a substitute for professional medical advice.
            The context is for general information in India. Structure the response according to the provided JSON schema.`;

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: symptomCheckerSchema,
            },
        });

        const jsonString = response.text.trim();
        if (!jsonString) {
          throw new Error("Received an empty response from the AI model.");
        }
        const result = JSON.parse(jsonString);

        return result as SymptomAnalysisResult;
    } catch (error) {
        console.error("Error analyzing symptoms:", error);
        throw new Error("Could not analyze symptoms. The AI model may be busy or there may be an issue with your API key configuration. Please try again in a moment.");
    }
}