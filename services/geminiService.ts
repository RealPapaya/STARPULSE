
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";
import { CelebrityData } from "../types";

export const getSuggestions = async (partialName: string): Promise<string[]> => {
  if (partialName.length < 1) return [];
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey.includes("GEMINI_API_KEY")) {
    console.error("API Key is missing or invalid. Please check your configuration.");
    return ["Error: API Key Failed"];
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.ARRAY,
        items: { type: SchemaType.STRING }
      }
    }
  });

  try {
    const result = await model.generateContent(`提供 5 個與 "${partialName}" 相關的知名歌手或影星姓名建議。只需返回姓名列表。`);
    return JSON.parse(result.response.text());
  } catch (e) {
    console.error("Suggestion Error:", e);
    return [];
  }
};

export const fetchCelebrityData = async (name: string): Promise<CelebrityData> => {
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
  if (!apiKey || apiKey.includes("GEMINI_API_KEY")) {
    throw new Error("系統配置錯誤：API Key 未設定或無效。請聯繫管理員。");
  }

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({
    model: "gemini-1.5-flash",
    systemInstruction: "你是一個冷酷、極度嚴苛、排除區域濾鏡的全球數據分析師。你對知名度的定義是『全球跨語系的絕對滲透率』。你視區域性知名度為地方性數據，不計入全球權威指數。對於作品效率低的藝人，你給分極其刻薄。回傳格式必須為 JSON。",
    generationConfig: {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          name: { type: SchemaType.STRING },
          originalName: { type: SchemaType.STRING },
          stageName: { type: SchemaType.STRING },
          popularityRating: { type: SchemaType.NUMBER },
          ratingJustification: { type: SchemaType.STRING },
          totalStats: {
            type: SchemaType.OBJECT,
            properties: {
              views: { type: SchemaType.STRING, description: "核心正式作品之平均效率數據 (Average efficiency)" },
              sales: { type: SchemaType.STRING, description: "領銜主演全球總票房或正式專輯實銷" },
              followers: { type: SchemaType.STRING, description: "全球跨語系認知度規模" },
              awards: { type: SchemaType.STRING, description: "簡短的全球權威獎項統計摘要 (如: 3 Oscar, 12 Grammy)" }
            }
          },
          basicInfo: {
            type: SchemaType.OBJECT,
            properties: {
              age: { type: SchemaType.STRING },
              nationality: { type: SchemaType.STRING },
              gender: { type: SchemaType.STRING },
              spouse: { type: SchemaType.STRING },
              birthDate: { type: SchemaType.STRING },
              awards: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
            },
            required: ["age", "nationality", "gender", "spouse", "birthDate", "awards"]
          },
          socialLinks: {
            type: SchemaType.OBJECT,
            properties: {
              facebook: { type: SchemaType.STRING },
              twitter: { type: SchemaType.STRING },
              instagram: { type: SchemaType.STRING }
            }
          },
          growthBackground: { type: SchemaType.STRING },
          careerStory: { type: SchemaType.STRING },
          works: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                title: { type: SchemaType.STRING },
                year: { type: SchemaType.STRING },
                role: { type: SchemaType.STRING },
                stats: { type: SchemaType.STRING }
              },
              required: ["title", "year"]
            }
          },
          famousWorks: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                title: { type: SchemaType.STRING },
                youtubeUrl: { type: SchemaType.STRING }
              },
              required: ["title", "youtubeUrl"]
            }
          },
          featuredMedia: {
            type: SchemaType.OBJECT,
            properties: {
              title: { type: SchemaType.STRING },
              type: { type: SchemaType.STRING, enum: ["album", "movie"], format: "enum" },
              description: { type: SchemaType.STRING },
              releaseDate: { type: SchemaType.STRING },
              relatedPeople: { type: SchemaType.ARRAY, items: { type: SchemaType.STRING } }
            },
            required: ["title", "type", "description", "releaseDate", "relatedPeople"]
          },
          relatedCelebrities: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                name: { type: SchemaType.STRING },
                relationship: { type: SchemaType.STRING }
              },
              required: ["name", "relationship"]
            }
          },
          others: { type: SchemaType.STRING },
          tags: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING }
          }
        },
        required: ["name", "originalName", "stageName", "popularityRating", "ratingJustification", "totalStats", "basicInfo", "socialLinks", "growthBackground", "careerStory", "works", "famousWorks", "featuredMedia", "relatedCelebrities", "others", "tags"]
      }
    }
  });

  try {
    const result = await model.generateContent(`對人物 "${name}" 進行極度嚴苛的數據檢索與【全球權威指數 / TIER INDEX】評分。
    
    【評分量尺定義 - 絕對全球化標準】:
    1. 【6.0 分：全球知名起點】: 
       - 該人物必須在多個不同文化/語系區域（如歐美、亞洲、拉美）具備基本辨識度。
       - 若影響力僅限於單一區域（如僅限台灣、僅限華語圈），即便在該區域是頂流，評分也絕對不可超過 6.0。
    
    2. 【8.0 分：全球極度有名】: 
       - 這是極高的門檻。代表在全世界任何主流國家隨機詢問，多數人都能立刻反應其作品或形象。
       - 必須具備跨世代或統治級的全球商業數據（全球巡演、全球票房）。
    
    3. 【9.0+ 分：傳奇與時代象徵】: 
       - 僅保留給歷史級人物（如：Michael Jackson, The Beatles, Tom Cruise）。
       - 必須在藝術價值、全球數據、時代定義上達成「全人類級別」的共識。
    
    【核心審核機制】:
    - 【數據門檻上調 30%】：所有業界公認的「成功指標」在此必須打 7 折計算其價值。
    - 【主角票房唯一論】：影星僅採計領銜主演作品，客串數據一律歸零。
    - 【歌手效率值】：總播放量必須除以作品數，產出大量低效作品將嚴重拖累評分。
    - 【區域泡沫擠壓】：對於「區域型藝人」，請無情地將其分數壓制在 6.0 以下。
    
    請以繁體中文提供詳細分析，並嚴格遵守 JSON Schema。`);

    return JSON.parse(result.response.text()) as CelebrityData;
  } catch (e) {
    console.error("Detail Error:", e);
    // Debug: List available models to help identify the issue
    try {
      // Note: This requires the GoogleGenerativeAI instance (genAI)
      // Since fetchCelebrityData creates a new instance, we reuse it here? 
      // Actually, listModels is not on the client instance in this SDK, 
      // it might not be directly available or requires a different manager.
      // Let's print a helpful message instead since verify model is internal.
      console.log("Suggestion: Verify that your API key is valid and the model is enabled in Google AI Studio.");
    } catch (listErr) {
      console.error("Failed to list models", listErr);
    }

    throw new Error("數據中心判定該人物全球影響力未達最低檢索標準，或系統暫時無法連線 (404)。");
  }
};
