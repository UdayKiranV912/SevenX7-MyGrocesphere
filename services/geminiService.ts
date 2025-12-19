
import { GoogleGenAI } from "@google/genai";
import { Product } from "../types";

export const generateProductDetails = async (productName: string): Promise<Partial<Product>> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Provide a short description, common ingredients, and brief nutrition info for ${productName} as a JSON object with keys: description, ingredients, nutrition. IMPORTANT: Values for description, ingredients, and nutrition MUST BE STRINGS, not objects.`,
      config: {
        responseMimeType: "application/json"
      }
    });
    const text = response.text;
    if (text) {
        return JSON.parse(text);
    }
    return {};
  } catch (error) {
    console.error("Gemini service error:", error);
    return {
      description: "A fresh, high-quality local product.",
      ingredients: "Natural ingredients",
      nutrition: "High nutritional value"
    };
  }
};
