// Gemini AI Service for Weather Assistant
export class GeminiAIService {
  constructor(apiKey) {
    this.apiKey = apiKey;
    this.baseUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent";
  }

  async generateResponse(userMessage, weatherData, location, lang = "en") {
    if (!this.apiKey) {
      throw new Error("Gemini API key is required");
    }

    // Create comprehensive weather context
    const weatherContext = this.formatWeatherContext(
      weatherData,
      location,
      lang
    );

    // Build the system prompt
    const systemPrompt = this.buildSystemPrompt(lang);

    // Prepare the request
    const requestBody = {
      contents: [
        {
          parts: [
            {
              text: `${systemPrompt}\n\n${weatherContext}\n\nUser Question: ${userMessage}`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 1024,
      },
      safetySettings: [
        {
          category: "HARM_CATEGORY_HARASSMENT",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
        {
          category: "HARM_CATEGORY_HATE_SPEECH",
          threshold: "BLOCK_MEDIUM_AND_ABOVE",
        },
      ],
    };

    try {
      const response = await fetch(`${this.baseUrl}?key=${this.apiKey}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          `Gemini API error: ${response.status} - ${
            errorData.error?.message || "Unknown error"
          }`
        );
      }

      const data = await response.json();

      if (data.candidates && data.candidates[0] && data.candidates[0].content) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error("Invalid response format from Gemini API");
      }
    } catch (error) {
      console.error("Gemini AI Error:", error);

      // Fallback response in case of API failure
      return lang === "ar"
        ? "عذراً، حدث خطأ في الاتصال بمساعد الذكاء الاصطناعي. يرجى المحاولة مرة أخرى."
        : "Sorry, there was an error connecting to the AI assistant. Please try again.";
    }
  }

  formatWeatherContext(weatherData, location, lang) {
    if (!weatherData || !location) {
      return lang === "ar"
        ? "لا توجد بيانات طقس متاحة حالياً."
        : "No weather data currently available.";
    }

    const now = new Date();
    const today = now.toISOString().split("T")[0];

    // Extract today's weather data
    const todayIndices =
      weatherData.hourly?.time
        ?.map((time, index) => ({ time, index }))
        ?.filter((item) => item.time.startsWith(today))
        ?.map((item) => item.index) || [];

    if (todayIndices.length === 0) {
      return lang === "ar"
        ? `الموقع: ${location.name}\nلا توجد بيانات طقس لهذا اليوم.`
        : `Location: ${location.name}\nNo weather data available for today.`;
    }

    // Calculate weather statistics
    const temps = todayIndices
      .map((i) => weatherData.hourly.temperature_2m[i])
      .filter((t) => t != null);
    const precip = todayIndices.map(
      (i) => weatherData.hourly.precipitation_probability[i] || 0
    );
    const winds = todayIndices.map(
      (i) => weatherData.hourly.wind_speed_10m[i] || 0
    );
    const uvs = todayIndices.map((i) => weatherData.hourly.uv_index[i] || 0);

    const avgTemp = Math.round(temps.reduce((a, b) => a + b, 0) / temps.length);
    const maxTemp = Math.round(Math.max(...temps));
    const minTemp = Math.round(Math.min(...temps));
    const maxPrecip = Math.max(...precip);
    const avgWind = Math.round(winds.reduce((a, b) => a + b, 0) / winds.length);
    const maxUV = Math.max(...uvs);

    // Get current hour data for immediate conditions
    const currentHour = now.getHours();
    const currentTimeStr = `${today}T${currentHour
      .toString()
      .padStart(2, "0")}:00`;
    const currentIndex = weatherData.hourly.time?.indexOf(currentTimeStr);
    const currentTemp =
      currentIndex >= 0
        ? weatherData.hourly.temperature_2m[currentIndex]
        : avgTemp;
    const currentPrecip =
      currentIndex >= 0
        ? weatherData.hourly.precipitation_probability[currentIndex]
        : 0;

    if (lang === "ar") {
      return `الموقع: ${location.name}
التاريخ: ${today}
الساعة الحالية: ${now.getHours()}:${now
        .getMinutes()
        .toString()
        .padStart(2, "0")}

الطقس اليوم:
- درجة الحرارة الحالية: ${Math.round(currentTemp)}°C
- نطاق درجات الحرارة: ${minTemp}°C إلى ${maxTemp}°C (متوسط: ${avgTemp}°C)
- احتمالية المطر الحالية: ${Math.round(currentPrecip)}%
- أقصى احتمالية مطر اليوم: ${Math.round(maxPrecip)}%
- متوسط سرعة الرياح: ${avgWind} كم/س
- أقصى مؤشر للأشعة فوق البنفسجية: ${Math.round(maxUV)}

بيانات الساعات (أول 8 ساعات):
${todayIndices
  .slice(0, 8)
  .map((i) => {
    const time = weatherData.hourly.time[i]?.slice(11, 16) || "";
    const temp = Math.round(weatherData.hourly.temperature_2m[i] || 0);
    const rain = Math.round(
      weatherData.hourly.precipitation_probability[i] || 0
    );
    return `${time}: ${temp}°C، مطر ${rain}%`;
  })
  .join("\n")}`;
    } else {
      return `Location: ${location.name}
Date: ${today}
Current Time: ${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}

Today's Weather:
- Current Temperature: ${Math.round(currentTemp)}°C
- Temperature Range: ${minTemp}°C to ${maxTemp}°C (Average: ${avgTemp}°C)
- Current Rain Probability: ${Math.round(currentPrecip)}%
- Max Rain Probability Today: ${Math.round(maxPrecip)}%
- Average Wind Speed: ${avgWind} km/h
- Max UV Index: ${Math.round(maxUV)}

Hourly Data (next 8 hours):
${todayIndices
  .slice(0, 8)
  .map((i) => {
    const time = weatherData.hourly.time[i]?.slice(11, 16) || "";
    const temp = Math.round(weatherData.hourly.temperature_2m[i] || 0);
    const rain = Math.round(
      weatherData.hourly.precipitation_probability[i] || 0
    );
    return `${time}: ${temp}°C, ${rain}% rain`;
  })
  .join("\n")}`;
    }
  }

  buildSystemPrompt(lang) {
    if (lang === "ar") {
      return `أنت مساعد ذكي متخصص في الطقس والأحداث الخارجية. مهمتك مساعدة المستخدمين في فهم بيانات الطقس وتقديم نصائح عملية.

خصائصك:
- خبير في الأرصاد الجوية وتأثير الطقس على الأنشطة
- تقدم نصائح عملية ومفيدة
- تتحدث باللغة العربية بطلاقة ووضوح
- تركز على السلامة والراحة
- تقدم معلومات دقيقة بناءً على البيانات المتاحة

إرشادات الإجابة:
- استخدم بيانات الطقس الحقيقية المقدمة لك
- قدم نصائح محددة للأنشطة والأحداث
- اذكر المخاطر المحتملة والاحتياطات
- كن موجزاً ومفيداً
- استخدم الرموز التعبيرية بشكل مناسب

أمثلة النصائح:
- للمطر: "احتمالية المطر عالية، احضر مظلة"
- للحر الشديد: "الطقس حار جداً، تجنب الشمس المباشرة"
- للرياح القوية: "رياح قوية، اهتم بالأشياء الخفيفة"
- للأشعة فوق البنفسجية: "مؤشر UV عالي، استخدم واقي الشمس"`;
    } else {
      return `You are an intelligent weather assistant specialized in meteorology and outdoor events. Your mission is to help users understand weather data and provide practical advice.

Your characteristics:
- Expert in meteorology and weather impact on activities
- Provide practical and useful advice
- Communicate clearly and professionally in English
- Focus on safety and comfort
- Give accurate information based on available data

Response guidelines:
- Use the real weather data provided to you
- Give specific advice for activities and events
- Mention potential risks and precautions
- Be concise and helpful
- Use appropriate emojis when relevant

Example advice types:
- For rain: "High rain probability, bring an umbrella"
- For extreme heat: "Very hot weather, avoid direct sunlight"
- For strong winds: "Strong winds, secure light objects"
- For high UV: "High UV index, use sunscreen"

Always base your responses on the specific weather data provided and give actionable advice.`;
    }
  }

  // Test API connection
  async testConnection() {
    try {
      const testMessage = "Hello, can you hear me?";
      await this.generateResponse(testMessage, null, null, "en");
      return true;
    } catch (error) {
      console.error("Gemini API connection test failed:", error);
      return false;
    }
  }
}

export default GeminiAIService;
