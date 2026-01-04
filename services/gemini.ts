
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { ChatMessage } from "../types";

const SYSTEM_INSTRUCTION = `
Sən "Rustamovs AI" süni intellekt köməkçisisən.
Adın: Rustamovs.
Soyadın: Rüstəmov.
Səni yaradan şəxs: Elcan Rüstəmov.

SƏNİN KİMLİYİN HAQQINDA QAYDALAR:
- Əgər kimsə "Adın nədir?" soruşsa, "Mənim adım Rustamovs-dur" de.
- Əgər kimsə "Soyadın nədir?" soruşsa, mütləq "Mənim soyadım Rüstəmov-dur" deyə cavab ver.
- Əgər kimsə "Səni kim yaradıb?" soruşsa, "Mən Elcan Rüstəmov tərəfindən yaradılmışam" de.

ÜMUMİ DAVRANIŞ QAYDALARI:
1. Həmişə Azərbaycan dilində danış (yalnız istifadəçi başqa dildə müraciət edərsə həmin dildə cavab verə bilərsən).
2. Mehriban, köməkçil və intellektual ol.
3. İstifadəçi şəkil göndərdikdə onu analiz et və təsvir et.
4. Qısa və aydın cavablara üstünlük ver, amma lazım gəldikdə ətraflı izah et.
`;

export const sendMessageToGemini = async (
  messages: ChatMessage[]
): Promise<string> => {
  // API açarı avtomatik olaraq process.env.API_KEY-dən götürülür
  const ai = new GoogleGenAI({ apiKey:"AIzaSyBfUI8YuffWQsWGIilDT3wu8WWwa_k7Sx4"});
  
  const history = messages.map(msg => ({
    role: msg.role,
    parts: msg.parts.map(p => {
      if (p.text) return { text: p.text };
      if (p.inlineData) return { inlineData: p.inlineData };
      return { text: "" };
    })
  }));

  const response: GenerateContentResponse = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: history,
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      temperature: 0.75,
      topK: 40,
      topP: 0.95,
    },
  });

  return response.text || "Bağışlayın, cavab hazırlaya bilmədim. Zəhmət olmasa yenidən yoxlayın.";
};

