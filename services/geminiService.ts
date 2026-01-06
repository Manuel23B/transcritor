import { GoogleGenAI } from "@google/genai";
import { Language } from "../types";

// Initialize the client
// API Key is injected via process.env.API_KEY
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Converts a File object to a Base64 string suitable for the Gemini API.
 */
const fileToPart = async (file: File): Promise<{ inlineData: { data: string; mimeType: string } }> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      if (typeof reader.result === 'string') {
        // Remove the data URL prefix (e.g., "data:video/mp4;base64,")
        const base64Data = reader.result.split(',')[1];
        resolve({
          inlineData: {
            data: base64Data,
            mimeType: file.type,
          },
        });
      } else {
        reject(new Error("Falha ao ler o arquivo."));
      }
    };
    reader.onerror = () => {
      reject(new Error("Erro ao ler o arquivo."));
    };
    reader.readAsDataURL(file);
  });
};

export const transcribeMedia = async (
  file: File,
  language: Language
): Promise<string> => {
  try {
    const mediaPart = await fileToPart(file);

    let prompt = "Você é um especialista em transcrição de áudio e vídeo.";
    
    if (language !== Language.AUTO) {
      prompt += ` O idioma principal do áudio é ${language}.`;
    } else {
      prompt += " Detecte o idioma automaticamente.";
    }

    prompt += `
      Sua tarefa é transcrever o conteúdo do arquivo fornecido com alta precisão.
      
      Diretrizes:
      1. Formatação: Use parágrafos claros e legíveis.
      2. Falantes: Se houver múltiplos falantes, identifique-os (ex: Falante 1, Falante 2) ou use travessões para diálogos.
      3. Timestamps: Adicione marcações de tempo [MM:SS] no início de cada mudança de assunto ou falante principal, se possível.
      4. Fidelidade: Mantenha o texto fiel ao áudio. Não resuma, transcreva.
      5. Idioma: A transcrição deve estar no mesmo idioma do áudio falado.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: {
        parts: [
          mediaPart,
          { text: prompt }
        ]
      },
      config: {
        temperature: 0.2, // Low temperature for higher accuracy
      }
    });

    if (response.text) {
      return response.text;
    } else {
      throw new Error("O modelo não retornou texto.");
    }

  } catch (error: any) {
    console.error("Erro na transcrição:", error);
    if (error.message?.includes("413") || error.toString().includes("413")) {
      throw new Error("O arquivo é muito grande. O limite para envio direto é de aproximadamente 20MB.");
    }
    throw new Error(error.message || "Ocorreu um erro desconhecido durante a transcrição.");
  }
};