// Gemini AI Service for Weather Assistant
export class GeminiAIService {
  constructor(apiKey) {
    // Use environment variable first, then user-provided key
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || apiKey;
    this.baseUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
  }

  async generateResponse(
    userMessage,
    weatherData,
    location,
    lang = "en",
    retryCount = 0
  ) {
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

        // Handle 503 (overloaded) with retry logic
        if (response.status === 503 && retryCount < 3) {
          const delay = Math.pow(2, retryCount) * 1000; // Exponential backoff: 1s, 2s, 4s
          console.log(
            `API overloaded, retrying in ${delay}ms... (attempt ${
              retryCount + 1
            }/3)`
          );

          await new Promise((resolve) => setTimeout(resolve, delay));
          return this.generateResponse(
            userMessage,
            weatherData,
            location,
            lang,
            retryCount + 1
          );
        }

        // Handle other errors
        const errorMessage =
          response.status === 503
            ? "The AI service is currently overloaded. Please try again in a few moments."
            : errorData.error?.message || `HTTP ${response.status} error`;

        throw new Error(
          `Gemini API error: ${response.status} - ${errorMessage}`
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

      // If it's a 503 error after retries, provide a helpful fallback
      if (
        error.message.includes("503") ||
        error.message.includes("overloaded")
      ) {
        return this.getFallbackResponse(
          userMessage,
          weatherData,
          location,
          lang
        );
      }

      // For other errors, provide generic fallback
      return lang === "ar"
        ? `عذراً، حدث خطأ في الاتصال بمساعد الذكاء الاصطناعي: ${error.message}\n\nيرجى المحاولة مرة أخرى خلال دقيقة.`
        : `Sorry, there was an error connecting to the AI assistant: ${error.message}\n\nPlease try again in a minute.`;
    }
  }

  // Fallback response when AI is overloaded
  getFallbackResponse(userMessage, weatherData, location, lang) {
    const isArabic = lang === "ar";

    if (!weatherData || !location) {
      return isArabic
        ? "⚠️ الخدمة مزدحمة حالياً. يرجى المحاولة مرة أخرى خلال دقائق قليلة."
        : "⚠️ Service is currently busy. Please try again in a few minutes.";
    }

    // Provide basic weather summary when AI is unavailable
    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const todayIndices =
      weatherData.hourly?.time
        ?.map((time, index) => ({ time, index }))
        ?.filter((item) => item.time.startsWith(today))
        ?.map((item) => item.index) || [];

    if (todayIndices.length > 0) {
      const currentIndex = todayIndices[Math.floor(todayIndices.length / 2)];
      const temp = Math.round(
        weatherData.hourly.temperature_2m[currentIndex] || 0
      );
      const precip = Math.round(
        weatherData.hourly.precipitation_probability[currentIndex] || 0
      );
      const wind = Math.round(
        weatherData.hourly.wind_speed_10m[currentIndex] || 0
      );

      if (isArabic) {
        return `⚠️ المساعد الذكي مزدحم حالياً، إليك ملخص سريع للطقس:

🌍 ${location.name}
🌡️ درجة الحرارة: ${temp}°م
🌧️ احتمالية المطر: ${precip}%
💨 الرياح: ${wind} كم/س

${
  precip > 60
    ? "☔ احتمال مطر عالي - خذ مظلة"
    : temp > 30
    ? "☀️ طقس حار - تجنب الشمس المباشرة"
    : temp < 10
    ? "🧥 طقس بارد - ارتد ملابس دافئة"
    : "🌤️ طقس مناسب للأنشطة الخارجية"
}

يرجى المحاولة مرة أخرى للحصول على تحليل مفصل.`;
      } else {
        return `⚠️ AI assistant is busy, here's a quick weather summary:

🌍 ${location.name}
🌡️ Temperature: ${temp}°C  
🌧️ Rain chance: ${precip}%
💨 Wind: ${wind} km/h

${
  precip > 60
    ? "☔ High rain probability - bring umbrella"
    : temp > 30
    ? "☀️ Hot weather - avoid direct sunlight"
    : temp < 10
    ? "🧥 Cold weather - dress warmly"
    : "🌤️ Good conditions for outdoor activities"
}

Please try again in a moment for detailed analysis.`;
      }
    }

    return isArabic
      ? "⚠️ الخدمة مزدحمة حالياً. يرجى المحاولة مرة أخرى."
      : "⚠️ Service is currently busy. Please try again shortly.";
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

    // Calculate weather statistics and trends
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
    const apparentTemps = todayIndices.map(
      (i) =>
        weatherData.hourly.apparent_temperature[i] ||
        weatherData.hourly.temperature_2m[i] ||
        0
    );

    const avgTemp = Math.round(temps.reduce((a, b) => a + b, 0) / temps.length);
    const maxTemp = Math.round(Math.max(...temps));
    const minTemp = Math.round(Math.min(...temps));
    const maxPrecip = Math.max(...precip);
    const avgPrecip = Math.round(
      precip.reduce((a, b) => a + b, 0) / precip.length
    );
    const avgWind = Math.round(winds.reduce((a, b) => a + b, 0) / winds.length);
    const maxWind = Math.round(Math.max(...winds));
    const maxUV = Math.max(...uvs);
    const avgApparent = Math.round(
      apparentTemps.reduce((a, b) => a + b, 0) / apparentTemps.length
    );

    // Calculate weather quality indicators
    const comfortTemp = temps.filter((t) => t >= 18 && t <= 26).length;
    const lowRainHours = precip.filter((p) => p < 30).length;
    const moderateWindHours = winds.filter((w) => w >= 5 && w <= 20).length;
    const weatherQuality = Math.round(
      ((comfortTemp + lowRainHours + moderateWindHours) /
        (todayIndices.length * 3)) *
        100
    );

    // Determine weather pattern trends
    const tempTrend =
      temps.length > 1
        ? temps[temps.length - 1] - temps[0] > 2
          ? "Rising"
          : temps[temps.length - 1] - temps[0] < -2
          ? "Falling"
          : "Stable"
        : "Unknown";
    const precipTrend =
      precip.length > 1
        ? precip[precip.length - 1] - precip[0] > 10
          ? "Increasing"
          : precip[precip.length - 1] - precip[0] < -10
          ? "Decreasing"
          : "Stable"
        : "Unknown";

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
الوقت الحالي: ${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}

تحليل الطقس التفصيلي:
درجة الحرارة:
  - الحالية: ${Math.round(currentTemp)}°C (تشعر بـ ${Math.round(currentTemp)}°C)
  - النطاق اليومي: ${minTemp}°C → ${maxTemp}°C
  - المتوسط: ${avgTemp}°C | الاتجاه: ${
        tempTrend === "Rising"
          ? "ارتفاع"
          : tempTrend === "Falling"
          ? "انخفاض"
          : "مستقر"
      }

الأمطار والرطوبة:
  - الاحتمالية الحالية: ${Math.round(currentPrecip)}%
  - المتوسط اليومي: ${avgPrecip}% | الأقصى: ${Math.round(maxPrecip)}%
  - الاتجاه: ${
    precipTrend === "Increasing"
      ? "متزايد"
      : precipTrend === "Decreasing"
      ? "متناقص"
      : "مستقر"
  }

الرياح: متوسط ${avgWind} كم/س | أقصى ${maxWind} كم/س
الأشعة فوق البنفسجية: مؤشر ${Math.round(maxUV)}
جودة الطقس العامة: ${weatherQuality}% (مثالي للأنشطة الخارجية)

توقعات الساعات القادمة (8 ساعات):
${todayIndices
  .slice(0, 8)
  .map((i) => {
    const time = weatherData.hourly.time[i]?.slice(11, 16) || "";
    const temp = Math.round(weatherData.hourly.temperature_2m[i] || 0);
    const rain = Math.round(
      weatherData.hourly.precipitation_probability[i] || 0
    );
    const wind = Math.round(weatherData.hourly.wind_speed_10m[i] || 0);
    const condition =
      rain > 60 ? "مطر" : rain > 30 ? "غائم" : temp > 30 ? "مشمس" : "جيد";
    return `${time}: ${condition} ${temp}°C، مطر ${rain}%، رياح ${wind} كم/س`;
  })
  .join("\n")}

تحليل للأنشطة والسفر:
- ساعات مناسبة للخروج: ${comfortTemp}/${todayIndices.length}
- ساعات أمطار قليلة: ${lowRainHours}/${todayIndices.length}
- ظروف رياح مقبولة: ${moderateWindHours}/${todayIndices.length}`;
    } else {
      return `Location: ${location.name}
Date: ${today}
Current Time: ${now.getHours()}:${now.getMinutes().toString().padStart(2, "0")}

DETAILED WEATHER ANALYSIS:
Temperature Analysis:
  - Current: ${Math.round(currentTemp)}°C (Feels like ${Math.round(
        currentTemp
      )}°C)
  - Daily Range: ${minTemp}°C → ${maxTemp}°C
  - Average: ${avgTemp}°C | Trend: ${tempTrend}

Precipitation & Humidity:
  - Current Probability: ${Math.round(currentPrecip)}%
  - Daily Average: ${avgPrecip}% | Peak: ${Math.round(maxPrecip)}%
  - Trend: ${precipTrend}

Wind Conditions: Avg ${avgWind} km/h | Max ${maxWind} km/h
UV Index: ${Math.round(maxUV)} (${
        maxUV > 8
          ? "Very High"
          : maxUV > 5
          ? "High"
          : maxUV > 2
          ? "Moderate"
          : "Low"
      })
Overall Weather Quality: ${weatherQuality}% (for outdoor activities)

Hourly Forecast (Next 8 hours):
${todayIndices
  .slice(0, 8)
  .map((i) => {
    const time = weatherData.hourly.time[i]?.slice(11, 16) || "";
    const temp = Math.round(weatherData.hourly.temperature_2m[i] || 0);
    const rain = Math.round(
      weatherData.hourly.precipitation_probability[i] || 0
    );
    const wind = Math.round(weatherData.hourly.wind_speed_10m[i] || 0);
    const condition =
      rain > 60 ? "Rain" : rain > 30 ? "Cloudy" : temp > 30 ? "Sunny" : "Clear";
    return `${time}: ${condition} ${temp}°C, ${rain}% rain, ${wind} km/h wind`;
  })
  .join("\n")}

ACTIVITY & TRAVEL INSIGHTS:
- Comfortable hours: ${comfortTemp}/${todayIndices.length}
- Low rain hours: ${lowRainHours}/${todayIndices.length}  
- Moderate wind conditions: ${moderateWindHours}/${todayIndices.length}

OPTIMAL CONDITIONS FOR:
${
  weatherQuality > 80
    ? "Beach activities, Cycling, Outdoor sports"
    : weatherQuality > 60
    ? "Walking, Photography, Outdoor dining"
    : weatherQuality > 40
    ? "Museums, Shopping, Indoor cafes"
    : "Indoor activities recommended"
}`;
    }
  }

  buildSystemPrompt(lang) {
    if (lang === "ar") {
      return `أنت مساعد ذكي متخصص في تحليل الطقس والسفر. مهمتك مساعدة المستخدمين في:

المهام الرئيسية:
1. تحليل بيانات الطقس بدقة وتفصيل
2. اقتراح أماكن للزيارة بناءً على تفضيلات الطقس
3. تقديم نصائح للأنشطة المناسبة للطقس الحالي
4. تحليل الاتجاهات والأنماط في البيانات الجوية

خبراتك:
- خبير في الأرصاد الجوية وتحليل البيانات المناخية
- متخصص في السياحة المناخية وأفضل أوقات السفر
- قادر على ربط أنواع الطقس بالأنشطة والوجهات المثالية
- محلل بيانات ذكي يكتشف الأنماط والتوقعات

تحليل البيانات:
- فسر البيانات الرقمية (درجات الحرارة، الرطوبة، الأمطار، الرياح)
- اكتشف الاتجاهات والتغيرات في الطقس
- قدم تفسيرات علمية مبسطة
- اربط البيانات بالتجربة العملية

اقتراحات السفر:
- اقترح وجهات مناسبة للطقس المطلوب
- اذكر أفضل الأنشطة لكل نوع طقس
- قدم نصائح للتوقيت المثالي للزيارة
- اقترح بدائل إذا كان الطقس غير مناسب

أسلوب الرد:
- استخدم القليل من الرموز التعبيرية فقط عند الضرورة
- قدم معلومات منظمة وواضحة
- اربط التحليل بنصائح عملية
- كن مهنياً ومفيداً
- لا تستخدم تنسيق Markdown (مثل ** أو * أو #)
- استخدم نص عادي فقط

مثال على ردودك:
"تحليل الطقس: درجة حرارة مثالية 24°م مع رياح خفيفة
أماكن مقترحة: الشواطئ، المتنزهات، الأماكن المفتوحة
أنشطة مثالية: المشي، التصوير، الرياضات الخارجية"`;
    } else {
      return `You are an intelligent weather analysis and travel assistant. Your mission is to help users with:

PRIMARY FUNCTIONS:
1. Analyze weather data in detail with scientific accuracy
2. Suggest places to visit based on weather preferences
3. Recommend weather-appropriate activities and destinations
4. Identify patterns and trends in meteorological data

EXPERTISE AREAS:
- Advanced meteorology and climate data analysis
- Climate-based tourism and optimal travel timing
- Matching weather conditions to ideal activities and destinations
- Smart data analysis that reveals patterns and forecasts

DATA ANALYSIS APPROACH:
- Interpret numerical data (temperature, humidity, precipitation, wind)
- Identify trends and changes in weather patterns
- Provide simplified scientific explanations
- Connect data to real-world practical experience

TRAVEL SUGGESTIONS:
- Recommend destinations suitable for desired weather conditions
- Suggest best activities for each weather type
- Provide optimal timing advice for visits
- Offer alternatives when weather isn't suitable

RESPONSE STYLE:
- Use minimal emojis only when necessary for clarity
- Provide organized, structured information
- Connect analysis to actionable advice
- Be professional, helpful, and engaging
- Do NOT use markdown formatting (such as **, *, #, or backticks)
- Use plain text only for better readability

EXAMPLE RESPONSE FORMAT:
"Weather Analysis: Perfect 24°C with light breeze
Recommended Places: Beaches, parks, outdoor venues
Ideal Activities: Walking, photography, outdoor sports
Trend: Stable conditions for next 6 hours"

SPECIAL FOCUS: When users ask about weather preferences, actively suggest specific types of destinations and activities that match those conditions, not just the current location.`;
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
