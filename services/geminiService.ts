
import { GoogleGenAI, Type } from "@google/genai";
import { CelebrityData } from "../types";

export const getSuggestions = async (partialName: string): Promise<string[]> => {
  if (partialName.length < 1) return [];
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `提供 5 個與 "${partialName}" 相關的知名歌手或影星姓名建議。只需返回姓名列表。`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });
    return JSON.parse(response.text || "[]");
  } catch (e) {
    return [];
  }
};

export const fetchCelebrityData = async (name: string): Promise<CelebrityData> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const response = await ai.models.generateContent({
    model: "gemini-3-pro-preview",
    contents: `深度分析人物 "${name}"，並依據下列【權威數據金字塔】標準進行精準評分。
    
    1. 【姓名細節】必須分別提供「本名 (Original Name)」與「藝名 (Stage Name)」。
    2. 【評分標準與權重】(總分 0.0 - 10.0):
       - 評分分佈必須呈現「金字塔型」，9.0 以上僅限於極少數歷史級人物（全球佔比低於 0.1%）。
       - 【歌手】: 側重於「官方總觀看數 (須達 100 億以上才具備傳奇資格)」、「數位串流效率 (平均每首歌的點擊率)」。
       - 【演員】: 側重於「全球總票房影響力」、「平均單片票房產出」、「影史經典地位 (如奧斯卡或指標性獎項)」。
       - 【產出效率】: 影片/影集數量極多但平均表現平庸者，必須降階處理。
    3. 【等級劃分】:
       - 9.0-10.0 (跨世代傳奇): 人類文明級別的統治力，歷史標竿。
       - 8.0-8.9 (頂流藝人): 當代一線頂峰，極高知名度。
       - 7.0-7.9 (一流藝人): 各自領域的佼佼者。
    4. 【數據收集】收集其生涯總數據。
    5. 【生涯故事】提供極致詳細、宏大的傳記式敘述（至少 800 字）。
    6. 【人物名稱】回傳格式為 "中文名 (English Name)"。`,
    config: {
      tools: [{ googleSearch: {} }],
      systemInstruction: "你是一個極其挑剔且冷酷的數據權威分析師。你對 9.0 以上的分數把關極其嚴格。如果對方的數據效率不高，或僅靠作品數量累積，絕不給予高分。對於演員，你必須優先考慮其票房影響力。回傳內容為繁體中文，格式嚴格遵守 JSON Schema。",
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING },
          originalName: { type: Type.STRING },
          stageName: { type: Type.STRING },
          popularityRating: { type: Type.NUMBER },
          ratingJustification: { type: Type.STRING },
          totalStats: {
            type: Type.OBJECT,
            properties: {
              views: { type: Type.STRING },
              sales: { type: Type.STRING },
              followers: { type: Type.STRING }
            }
          },
          basicInfo: {
            type: Type.OBJECT,
            properties: {
              age: { type: Type.STRING },
              nationality: { type: Type.STRING },
              gender: { type: Type.STRING },
              spouse: { type: Type.STRING },
              birthDate: { type: Type.STRING },
              awards: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["age", "nationality", "gender", "spouse", "birthDate", "awards"]
          },
          socialLinks: {
            type: Type.OBJECT,
            properties: {
              facebook: { type: Type.STRING },
              twitter: { type: Type.STRING },
              instagram: { type: Type.STRING }
            }
          },
          growthBackground: { type: Type.STRING },
          careerStory: { type: Type.STRING },
          works: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                year: { type: Type.STRING },
                role: { type: Type.STRING },
                stats: { type: Type.STRING }
              },
              required: ["title", "year"]
            }
          },
          famousWorks: {
            type: Type.ARRAY,
            items: { 
              type: Type.OBJECT,
              properties: {
                title: { type: Type.STRING },
                youtubeUrl: { type: Type.STRING }
              },
              required: ["title", "youtubeUrl"]
            }
          },
          featuredMedia: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              type: { type: Type.STRING, enum: ["album", "movie"] },
              description: { type: Type.STRING },
              releaseDate: { type: Type.STRING },
              relatedPeople: { type: Type.ARRAY, items: { type: Type.STRING } }
            },
            required: ["title", "type", "description", "releaseDate", "relatedPeople"]
          },
          relatedCelebrities: { 
            type: Type.ARRAY, 
            items: { 
              type: Type.OBJECT,
              properties: {
                name: { type: Type.STRING },
                relationship: { type: Type.STRING }
              },
              required: ["name", "relationship"]
            }
          },
          others: { type: Type.STRING },
          tags: {
            type: Type.ARRAY,
            items: { type: Type.STRING }
          }
        },
        required: ["name", "originalName", "stageName", "popularityRating", "ratingJustification", "totalStats", "basicInfo", "socialLinks", "growthBackground", "careerStory", "works", "famousWorks", "featuredMedia", "relatedCelebrities", "others", "tags"]
      }
    }
  });

  const text = response.text || "";
  try {
    return JSON.parse(text) as CelebrityData;
  } catch (e) {
    throw new Error("StarPulse 數據同步失敗，請再試一次。");
  }
};
