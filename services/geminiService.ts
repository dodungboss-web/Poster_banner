
import { GoogleGenAI } from "@google/genai";
import { IllustrationStyle, FontStyle, TextEffect, FrameStyle } from "../types";

// Helper to initialize the GenAI client using the environment variable.
const getAIClient = () => new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateIllustration = async (
    prompt: string, 
    style: IllustrationStyle, 
    aspectRatio: "1:1" | "3:4" | "4:3" | "16:9" | "9:16" = "1:1",
    referenceImages: string[] = [] 
): Promise<string | null> => {
  const ai = getAIClient();

  try {
    // Enhanced prompt for high quality output.
    const fullPrompt = `Professional ${style} artwork. ${prompt}. High resolution, cinematic lighting, artistic composition. Center area should be relatively clean or have negative space to allow for text overlay. Masterpiece, trending on ArtStation.`;

    const parts: any[] = [];

    if (referenceImages && referenceImages.length > 0) {
        for (const refImg of referenceImages) {
            const matches = refImg.match(/^data:(.+);base64,(.+)$/);
            if (matches) {
                parts.push({
                    inlineData: {
                        mimeType: matches[1], 
                        data: matches[2]
                    }
                });
            }
        }
        parts.push({ 
            text: `Create a new image inspired by the attached reference images, blending their composition or style while applying this specific art style: ${style}. Description: ${prompt}.` 
        });
    } else {
        parts.push({ text: fullPrompt });
    }

    // Using gemini-2.5-flash-image for general image generation tasks.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: parts
      },
      config: {
        imageConfig: {
            aspectRatio: aspectRatio, 
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        const base64EncodeString = part.inlineData.data;
        return `data:image/png;base64,${base64EncodeString}`;
      }
    }
    
    return null;
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};

/**
 * Perform AI Background Removal using Gemini 2.5 Flash Image.
 * Since the model is optimized for editing, we provide a text instruction to isolate the subject.
 */
export const removeBackgroundImage = async (base64Image: string): Promise<string | null> => {
    const ai = getAIClient();
    try {
        const matches = base64Image.match(/^data:(.+);base64,(.+)$/);
        if (!matches) return null;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { inlineData: { data: matches[2], mimeType: matches[1] } },
                    { text: "Tách nền (remove background) của ảnh này. Chỉ giữ lại chủ thể chính. Xoá toàn bộ phông nền xung quanh và trả về ảnh kết quả với phông nền màu trắng tinh khiết (pure white background) để phục vụ tách lớp chuyên nghiệp." }
                ]
            }
        });
        
        for (const part of response.candidates?.[0]?.content?.parts || []) {
            if (part.inlineData) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
        return null;
    } catch (e) {
        console.error("AI Background Removal failed:", e);
        return null;
    }
}

export const generateTextSuggestion = async (topic: string): Promise<{title: string, subtitle: string}> => {
    const ai = getAIClient();

    try {
        // Using gemini-3-flash-preview for basic text suggestions.
        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Generate a catchy Vietnamese title and subtitle for a poster about: "${topic}". Return JSON only with keys "title" and "subtitle".`,
            config: {
                responseMimeType: "application/json"
            }
        });
        
        const text = response.text || "{}";
        return JSON.parse(text);
    } catch (e) {
        console.error("Error generating text", e);
        return { title: topic.toUpperCase(), subtitle: "Sự kiện đặc biệt" };
    }
}

interface DesignConcept {
  illustrationPrompt: string;
  illustrationStyle: IllustrationStyle;
  titleFont: FontStyle;
  titleColor: string;
  titleEffect: TextEffect;
  subtitleFont: FontStyle;
  subtitleColor: string;
  metaColor: string;
  overlayColor: string;
  overlayOpacity: number;
  frameStyle: FrameStyle;
  frameColor: string;
  moodDescription: string;
}

export const generateDesignConcept = async (
    mode: string, 
    title: string, 
    subtitle: string
): Promise<DesignConcept | null> => {
    const ai = getAIClient();

    const validFonts = ['Roboto', 'Oswald', 'Pacifico', 'Montserrat', 'Dancing Script', 'Bangers', 'Playfair Display', 'Anton', 'Patrick Hand'];
    const validStyles = ['2D', '3D Render', 'Flat Design', 'Cartoon', 'Realistic', 'Watercolor', 'Sketch'];
    const validEffects = ['none', 'shadow', 'outline', 'outline-fill', 'neon', '3d', 'glow'];
    const validFrames = ['none', 'solid', 'double', 'dashed', 'vintage-corner', 'art-deco', 'ornamental', 'floral', 'bamboo', 'stars', 'neon-border', 'tribal'];

    const prompt = `
      You are a world-class Art Director and Graphic Designer.
      
      Your task: Create a cohesive, high-artistic quality design concept for a ${mode} (Poster/Banner) based on this content:
      Title: "${title}"
      Subtitle: "${subtitle}"

      1. ANALYZE THE MOOD:
         - Is it solemn/serious? (Use Serif fonts, dark/gold colors, realistic style)
         - Is it fun/childish? (Use Cartoon/Hand fonts, bright colors, 2D style)
         - Is it modern/tech? (Use Sans-serif, neon colors, 3D style)
         - Is it traditional Vietnamese? (Use Bamboo/Floral frames, red/yellow/brown colors, Watercolor style)

      2. COLOR HARMONY:
         - Ensure 'titleColor' stands out vividly against the 'overlayColor'.
         - If 'illustrationPrompt' implies a busy background, increase 'overlayOpacity'.

      3. COMPOSITION:
         - The 'illustrationPrompt' MUST explicitly ask for "negative space" or "clean area" in the center or top to ensure text readability.

      Return a JSON object with these fields:
      - illustrationPrompt: A highly detailed, artistic description for an AI image generator. Include lighting (e.g., golden hour, cinematic), texture, and "leave empty space in center for text".
      - illustrationStyle: One of [${validStyles.join(', ')}].
      - titleFont: One of [${validFonts.join(', ')}].
      - titleColor: Hex code.
      - titleEffect: One of [${validEffects.join(', ')}].
      - subtitleFont: One of [${validFonts.join(', ')}].
      - subtitleColor: Hex code.
      - metaColor: Hex code.
      - overlayColor: Hex code (usually Black or White).
      - overlayOpacity: Number between 0.3 and 0.8.
      - frameStyle: One of [${validFrames.join(', ')}].
      - frameColor: Hex code matching the palette.
      - moodDescription: A short string explaining the artistic direction (e.g., "Cyberpunk Neon", "Vintage Paper", "Modern Minimalist").
    `;

    try {
        // Using gemini-3-pro-preview for complex reasoning tasks like design art direction.
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-preview',
            contents: prompt,
            config: {
                responseMimeType: "application/json"
            }
        });
        
        const text = response.text || "{}";
        return JSON.parse(text);
    } catch (e) {
        console.error("Error generating design concept", e);
        return null;
    }
};
