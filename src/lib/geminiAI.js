// Gemini AI Service for Weather Assistant
import { NASAPowerService } from "./nasaPowerAPI.js";

export class GeminiAIService {
  constructor(apiKey) {
    // Use environment variable first, then user-provided key
    this.apiKey = import.meta.env.VITE_GEMINI_API_KEY || apiKey;
    this.baseUrl =
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";
    this.nasaPowerService = new NASAPowerService();
  }

  async generateResponse(
    userMessage,
    weatherData,
    location,
    lang = "en",
    retryCount = 0,
    includeNASAData = false,
    nasaData = null
  ) {
    if (!this.apiKey) {
      throw new Error("Gemini API key is required");
    }

    // Check if question is weather-related and redirect if needed
    const weatherRedirect = this.checkWeatherRelevance(userMessage, lang);
    if (weatherRedirect) {
      return weatherRedirect;
    }

    // Create comprehensive weather context
    let weatherContext = this.formatWeatherContext(
      weatherData,
      location,
      lang,
      nasaData
    );

    // Add complete raw weather data for AI analysis
    const rawWeatherData = this.formatRawWeatherData(weatherData, lang);
    weatherContext += rawWeatherData;

    // Add NASA POWER annual data if available
    if (includeNASAData && nasaData) {
      try {
        const nasaContext = this.nasaPowerService.formatAnnualData(
          nasaData,
          lang
        );
        weatherContext +=
          lang === "ar"
            ? `\n\nبيانات ناسا للمناخ السنوي:\n${nasaContext}`
            : `\n\nNASA Annual Climate Data:\n${nasaContext}`;
      } catch (error) {
        console.error("Failed to format NASA POWER data:", error);
        weatherContext +=
          lang === "ar"
            ? "\n\nبيانات المناخ السنوي غير متاحة"
            : "\n\nAnnual climate data unavailable";
      }
    } else if (includeNASAData && location?.latitude && location?.longitude) {
      // Fallback: fetch NASA data if not provided but requested
      try {
        const currentDate = new Date();
        const fetchedNasaData =
          await this.nasaPowerService.getAnnualAverageData(
            location.latitude,
            location.longitude,
            currentDate
          );

        const nasaContext = this.nasaPowerService.formatAnnualData(
          fetchedNasaData,
          lang
        );
        weatherContext +=
          lang === "ar"
            ? `\n\nبيانات ناسا للمناخ السنوي:\n${nasaContext}`
            : `\n\nNASA Annual Climate Data:\n${nasaContext}`;
      } catch (error) {
        console.error("Failed to fetch NASA POWER data:", error);
        weatherContext +=
          lang === "ar"
            ? "\n\nتعذر الحصول على البيانات المناخية السنوية"
            : "\n\nAnnual climate data unavailable";
      }
    }

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
            retryCount + 1,
            includeNASAData,
            nasaData
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

  formatWeatherContext(weatherData, location, lang, nasaData = null) {
    if (!weatherData || !location) {
      return lang === "ar"
        ? "لا توجد بيانات طقس متاحة حالياً."
        : "No weather data currently available.";
    }

    const now = new Date();
    const today = now.toISOString().split("T")[0];

    // Calculate tomorrow's date
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split("T")[0];

    // Extract today's weather data
    const todayIndices =
      weatherData.hourly?.time
        ?.map((time, index) => ({ time, index }))
        ?.filter((item) => item.time.startsWith(today))
        ?.map((item) => item.index) || [];

    // Extract tomorrow's weather data
    const tomorrowIndices =
      weatherData.hourly?.time
        ?.map((time, index) => ({ time, index }))
        ?.filter((item) => item.time.startsWith(tomorrowStr))
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
- ظروف رياح مقبولة: ${moderateWindHours}/${todayIndices.length}${
        nasaData && nasaData.averages
          ? `

مقارنة مع البيانات التاريخية (ناسا ${nasaData.location?.startYear}-${
              nasaData.location?.endYear
            }):
- درجة الحرارة مقابل التاريخية: ${
              avgTemp - (nasaData.averages.T2M?.average || avgTemp) > 2
                ? "أدفأ من المعتاد"
                : avgTemp - (nasaData.averages.T2M?.average || avgTemp) < -2
                ? "أبرد من المعتاد"
                : "ضمن النطاق الطبيعي"
            } (المتوسط التاريخي: ${
              nasaData.averages.T2M?.average?.toFixed(1) || "غ/م"
            }°م)
- احتمالية المطر مقابل التاريخية: ${
              avgPrecip -
                (nasaData.averages.RAIN_PROBABILITY_TODAY?.average ||
                  avgPrecip) >
              10
                ? "أعلى من المعتاد"
                : avgPrecip -
                    (nasaData.averages.RAIN_PROBABILITY_TODAY?.average ||
                      avgPrecip) <
                  -10
                ? "أقل من المعتاد"
                : "ضمن النطاق الطبيعي"
            } (المتوسط التاريخي: ${
              nasaData.averages.RAIN_PROBABILITY_TODAY?.average?.toFixed(1) ||
              "غ/م"
            }%)
- نمط المناخ: بناء على ${
              nasaData.location?.yearsOfData || "التاريخية"
            } سنة من البيانات`
          : ""
      }`;
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
}${
        nasaData && nasaData.averages
          ? `

HISTORICAL CLIMATE COMPARISON (NASA Data ${nasaData.location?.startYear}-${
              nasaData.location?.endYear
            }):
- Temperature vs Historical: ${
              avgTemp - (nasaData.averages.T2M?.average || avgTemp) > 2
                ? "Warmer than usual"
                : avgTemp - (nasaData.averages.T2M?.average || avgTemp) < -2
                ? "Cooler than usual"
                : "Normal range"
            } (Historical avg: ${
              nasaData.averages.T2M?.average?.toFixed(1) || "N/A"
            }°C)
- Rain Probability vs Historical: ${
              avgPrecip -
                (nasaData.averages.RAIN_PROBABILITY_TODAY?.average ||
                  avgPrecip) >
              10
                ? "Higher than usual"
                : avgPrecip -
                    (nasaData.averages.RAIN_PROBABILITY_TODAY?.average ||
                      avgPrecip) <
                  -10
                ? "Lower than usual"
                : "Normal range"
            } (Historical avg: ${
              nasaData.averages.RAIN_PROBABILITY_TODAY?.average?.toFixed(1) ||
              "N/A"
            }%)
- Climate Pattern: Based on ${
              nasaData.location?.yearsOfData || "historical"
            } years of data
- Best Historical Months: ${
              Object.entries(nasaData.averages || {})
                .filter(([key, value]) => key.includes("T2M") && value.average)
                .sort(
                  (a, b) =>
                    Math.abs(a[1].average - 22) - Math.abs(b[1].average - 22)
                )
                .slice(0, 2)
                .map(([key]) => key.split("_")[0])
                .join(", ") || "Data processing"
            }`
          : ""
      }

TOMORROW'S DETAILED FORECAST (${tomorrowStr}):
${
  tomorrowIndices.length > 0
    ? this.formatTomorrowForecast(weatherData, tomorrowIndices, lang)
    : lang === "ar"
    ? "لا تتوفر بيانات طقس للغد حالياً"
    : "Tomorrow's weather data not available"
}`;
    }
  }

  formatTomorrowForecast(weatherData, tomorrowIndices, lang) {
    // Calculate tomorrow's weather statistics
    const temps = tomorrowIndices
      .map((i) => weatherData.hourly.temperature_2m[i])
      .filter((t) => t != null);
    const precip = tomorrowIndices.map(
      (i) => weatherData.hourly.precipitation_probability[i] || 0
    );
    const winds = tomorrowIndices.map(
      (i) => weatherData.hourly.wind_speed_10m[i] || 0
    );
    const uvs = tomorrowIndices.map((i) => weatherData.hourly.uv_index[i] || 0);

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

    // Get key time periods for tomorrow
    const morningIndices = tomorrowIndices.slice(6, 12); // 6 AM - 12 PM
    const afternoonIndices = tomorrowIndices.slice(12, 18); // 12 PM - 6 PM
    const eveningIndices = tomorrowIndices.slice(18, 24); // 6 PM - 12 AM

    const getMorningWeather = () => {
      if (morningIndices.length === 0) return "N/A";
      const morningTemp = Math.round(
        morningIndices.reduce(
          (sum, i) => sum + (weatherData.hourly.temperature_2m[i] || 0),
          0
        ) / morningIndices.length
      );
      const morningRain = Math.round(
        morningIndices.reduce(
          (sum, i) =>
            sum + (weatherData.hourly.precipitation_probability[i] || 0),
          0
        ) / morningIndices.length
      );
      return `${morningTemp}°C, ${morningRain}% rain`;
    };

    const getAfternoonWeather = () => {
      if (afternoonIndices.length === 0) return "N/A";
      const afternoonTemp = Math.round(
        afternoonIndices.reduce(
          (sum, i) => sum + (weatherData.hourly.temperature_2m[i] || 0),
          0
        ) / afternoonIndices.length
      );
      const afternoonRain = Math.round(
        afternoonIndices.reduce(
          (sum, i) =>
            sum + (weatherData.hourly.precipitation_probability[i] || 0),
          0
        ) / afternoonIndices.length
      );
      return `${afternoonTemp}°C, ${afternoonRain}% rain`;
    };

    const getEveningWeather = () => {
      if (eveningIndices.length === 0) return "N/A";
      const eveningTemp = Math.round(
        eveningIndices.reduce(
          (sum, i) => sum + (weatherData.hourly.temperature_2m[i] || 0),
          0
        ) / eveningIndices.length
      );
      const eveningRain = Math.round(
        eveningIndices.reduce(
          (sum, i) =>
            sum + (weatherData.hourly.precipitation_probability[i] || 0),
          0
        ) / eveningIndices.length
      );
      return `${eveningTemp}°C, ${eveningRain}% rain`;
    };

    if (lang === "ar") {
      return `توقعات تفصيلية للغد:
درجة الحرارة: ${minTemp}°C → ${maxTemp}°C (متوسط ${avgTemp}°C)
احتمالية المطر: متوسط ${avgPrecip}% | أقصى ${Math.round(maxPrecip)}%
الرياح: متوسط ${avgWind} كم/س | أقصى ${maxWind} كم/س
مؤشر الأشعة فوق البنفسجية: ${Math.round(maxUV)}

فترات اليوم:
- الصباح (6 ص - 12 ظ): ${getMorningWeather()}
- بعد الظهر (12 ظ - 6 م): ${getAfternoonWeather()}
- المساء (6 م - 12 ص): ${getEveningWeather()}

أفضل الأوقات للأنشطة الخارجية: ${
        maxPrecip < 30 && maxTemp < 35 && avgWind < 25
          ? "جميع ساعات اليوم مناسبة"
          : maxPrecip < 50 && maxTemp < 40
          ? "معظم ساعات اليوم مناسبة"
          : "ننصح بالأنشطة الداخلية"
      }`;
    } else {
      return `Detailed Tomorrow's Forecast:
Temperature: ${minTemp}°C → ${maxTemp}°C (Average ${avgTemp}°C)
Rain Probability: Average ${avgPrecip}% | Peak ${Math.round(maxPrecip)}%
Wind: Average ${avgWind} km/h | Peak ${maxWind} km/h
UV Index: ${Math.round(maxUV)} (${
        maxUV > 8
          ? "Very High"
          : maxUV > 5
          ? "High"
          : maxUV > 2
          ? "Moderate"
          : "Low"
      })

Time Periods:
- Morning (6 AM - 12 PM): ${getMorningWeather()}
- Afternoon (12 PM - 6 PM): ${getAfternoonWeather()}
- Evening (6 PM - 12 AM): ${getEveningWeather()}

Best Times for Outdoor Activities: ${
        maxPrecip < 30 && maxTemp < 35 && avgWind < 25
          ? "All day suitable"
          : maxPrecip < 50 && maxTemp < 40
          ? "Most of the day suitable"
          : "Indoor activities recommended"
      }

Overall Tomorrow's Outlook: ${
        avgPrecip < 20 && avgTemp >= 18 && avgTemp <= 28
          ? "Excellent weather conditions"
          : avgPrecip < 40 && avgTemp >= 15 && avgTemp <= 32
          ? "Good weather conditions"
          : "Variable weather conditions"
      }`;
    }
  }

  formatRawWeatherData(weatherData, lang) {
    if (!weatherData) {
      return lang === "ar"
        ? "\n\nبيانات الطقس الخام: غير متاحة"
        : "\n\nRaw Weather Data: Not available";
    }

    const now = new Date();
    const currentTime = now.toISOString();

    // Get next 7 days of data (168 hours for full week forecast)
    const next7DaysData = {
      hourly: {},
      daily: weatherData.daily || {},
    };

    // Extract next 168 hours (7 days) of hourly data
    if (weatherData.hourly && weatherData.hourly.time) {
      const currentIndex = weatherData.hourly.time.findIndex(
        (time) => new Date(time) >= now
      );

      if (currentIndex >= 0) {
        const endIndex = Math.min(
          currentIndex + 168,
          weatherData.hourly.time.length
        );

        Object.keys(weatherData.hourly).forEach((key) => {
          if (Array.isArray(weatherData.hourly[key])) {
            next7DaysData.hourly[key] = weatherData.hourly[key].slice(
              currentIndex,
              endIndex
            );
          }
        });
      }
    }

    if (lang === "ar") {
      return `

========== بيانات الطقس الكاملة للتحليل المتقدم ==========

البيانات اليومية (7 أيام قادمة):
${JSON.stringify(next7DaysData.daily, null, 2)}

البيانات بالساعة (168 ساعة قادمة):
الأوقات: ${JSON.stringify(next7DaysData.hourly.time || [], null, 2)}
درجات الحرارة: ${JSON.stringify(
        next7DaysData.hourly.temperature_2m || [],
        null,
        2
      )}
احتمالية المطر: ${JSON.stringify(
        next7DaysData.hourly.precipitation_probability || [],
        null,
        2
      )}
هطول الأمطار: ${JSON.stringify(
        next7DaysData.hourly.precipitation || [],
        null,
        2
      )}
سرعة الرياح: ${JSON.stringify(
        next7DaysData.hourly.wind_speed_10m || [],
        null,
        2
      )}
اتجاه الرياح: ${JSON.stringify(
        next7DaysData.hourly.wind_direction_10m || [],
        null,
        2
      )}
الرطوبة النسبية: ${JSON.stringify(
        next7DaysData.hourly.relative_humidity_2m || [],
        null,
        2
      )}
الضغط الجوي: ${JSON.stringify(
        next7DaysData.hourly.surface_pressure || [],
        null,
        2
      )}
الغطاء السحابي: ${JSON.stringify(
        next7DaysData.hourly.cloud_cover || [],
        null,
        2
      )}
الرؤية: ${JSON.stringify(next7DaysData.hourly.visibility || [], null, 2)}
مؤشر الأشعة فوق البنفسجية: ${JSON.stringify(
        next7DaysData.hourly.uv_index || [],
        null,
        2
      )}
درجة الحرارة المحسوسة: ${JSON.stringify(
        next7DaysData.hourly.apparent_temperature || [],
        null,
        2
      )}
نقطة الندى: ${JSON.stringify(next7DaysData.hourly.dew_point_2m || [], null, 2)}

تعليمات خاصة للذكاء الاصطناعي:
- استخدم هذه البيانات الكاملة لتقديم تنبؤات دقيقة ومفصلة
- يمكنك تحليل الاتجاهات والأنماط عبر الأيام السبعة القادمة
- قدم تحليلاً متعمقاً بناءً على جميع المعايير المتاحة
- اربط البيانات الساعية باليومية لإعطاء صورة شاملة

========================================================`;
    } else {
      return `

========== COMPLETE WEATHER DATA FOR ADVANCED AI ANALYSIS ==========

DAILY DATA (Next 7 days):
${JSON.stringify(next7DaysData.daily, null, 2)}

HOURLY DATA (Next 168 hours):
Times: ${JSON.stringify(next7DaysData.hourly.time || [], null, 2)}
Temperatures: ${JSON.stringify(
        next7DaysData.hourly.temperature_2m || [],
        null,
        2
      )}
Rain Probability: ${JSON.stringify(
        next7DaysData.hourly.precipitation_probability || [],
        null,
        2
      )}
Precipitation: ${JSON.stringify(
        next7DaysData.hourly.precipitation || [],
        null,
        2
      )}
Wind Speed: ${JSON.stringify(
        next7DaysData.hourly.wind_speed_10m || [],
        null,
        2
      )}
Wind Direction: ${JSON.stringify(
        next7DaysData.hourly.wind_direction_10m || [],
        null,
        2
      )}
Relative Humidity: ${JSON.stringify(
        next7DaysData.hourly.relative_humidity_2m || [],
        null,
        2
      )}
Surface Pressure: ${JSON.stringify(
        next7DaysData.hourly.surface_pressure || [],
        null,
        2
      )}
Cloud Cover: ${JSON.stringify(next7DaysData.hourly.cloud_cover || [], null, 2)}
Visibility: ${JSON.stringify(next7DaysData.hourly.visibility || [], null, 2)}
UV Index: ${JSON.stringify(next7DaysData.hourly.uv_index || [], null, 2)}
Apparent Temperature: ${JSON.stringify(
        next7DaysData.hourly.apparent_temperature || [],
        null,
        2
      )}
Dew Point: ${JSON.stringify(next7DaysData.hourly.dew_point_2m || [], null, 2)}

SPECIAL AI INSTRUCTIONS:
- Use this complete dataset to provide precise, detailed forecasts
- Analyze trends and patterns across the full 7-day period
- Provide in-depth analysis based on all available parameters
- Cross-reference hourly with daily data for comprehensive insights
- Generate specific predictions for any requested time period
- Consider all weather parameters when making recommendations

========================================================`;
    }
  }

  checkWeatherRelevance(userMessage, lang) {
    const message = userMessage.toLowerCase();

    // Define clearly non-weather keywords that should be redirected
    const nonWeatherKeywords = [
      "politics",
      "political",
      "government",
      "election",
      "president",
      "minister",
      "economy",
      "stock",
      "market",
      "finance",
      "money",
      "bitcoin",
      "cryptocurrency",
      "sports",
      "football",
      "soccer",
      "basketball",
      "game",
      "match",
      "player",
      "programming",
      "computer",
      "software",
      "code",
      "website",
      "app",
      "medicine",
      "doctor",
      "hospital",
      "disease",
      "health",
      "recipe",
      "cooking",
      "restaurant",
      "meal",
      "food",
      "movie",
      "film",
      "music",
      "song",
      "actor",
      "celebrity",
      "school",
      "university",
      "homework",
      "exam",
      "religion",
      "philosophy",
      "history",
    ];

    const arabicNonWeatherKeywords = [
      "سياسة",
      "سياسي",
      "حكومة",
      "انتخابات",
      "رئيس",
      "وزير",
      "اقتصاد",
      "بورصة",
      "سوق",
      "مالية",
      "مال",
      "بيتكوين",
      "رياضة",
      "كرة",
      "مباراة",
      "لعبة",
      "فريق",
      "لاعب",
      "برمجة",
      "كمبيوتر",
      "برنامج",
      "كود",
      "موقع",
      "تطبيق",
      "طب",
      "طبيب",
      "مستشفى",
      "مرض",
      "صحة",
      "وصفة",
      "طبخ",
      "مطعم",
      "وجبة",
      "طعام",
      "فيلم",
      "موسيقى",
      "أغنية",
      "ممثل",
      "مشهور",
      "مدرسة",
      "جامعة",
      "واجب",
      "امتحان",
      "دين",
      "فلسفة",
      "تاريخ",
    ];

    // Enhanced weather-related keywords including activity-related terms
    const weatherKeywords = [
      "weather",
      "temperature",
      "rain",
      "snow",
      "wind",
      "cloud",
      "sun",
      "storm",
      "forecast",
      "climate",
      "humidity",
      "pressure",
      "hot",
      "cold",
      "warm",
      "cool",
      "sunny",
      "cloudy",
      "rainy",
      "snowy",
      "windy",
      "umbrella",
      "coat",
      "jacket",
      "outdoor",
      "activity",
      "activities",
      "trip",
      "travel",
      "vacation",
      "picnic",
      "beach",
      "hiking",
      "walking",
      "running",
      "cycling",
      "swimming",
      "camping",
      "fishing",
      "best time",
      "when",
      "where",
      "should i go",
      "visit",
      "destination",
      "درجة",
      "حرارة",
      "طقس",
      "مطر",
      "ثلج",
      "رياح",
      "غيوم",
      "شمس",
      "عاصفة",
      "توقعات",
      "مناخ",
      "رطوبة",
      "ضغط",
      "حار",
      "بارد",
      "دافئ",
      "مشمس",
      "غائم",
      "ممطر",
      "مثلج",
      "عاصف",
      "مظلة",
      "معطف",
      "جاكيت",
      "خارجي",
      "نشاط",
      "أنشطة",
      "رحلة",
      "سفر",
      "إجازة",
      "نزهة",
      "شاطئ",
      "مشي",
      "جري",
      "سباحة",
      "تخييم",
      "صيد",
      "أفضل وقت",
      "متى",
      "أين",
    ];

    // Activity context keywords that are weather-related
    const weatherActivityKeywords = [
      "time for",
      "time to",
      "when to",
      "when should",
      "best time",
      "go outside",
      "go out",
      "outdoor",
      "outside activities",
      "وقت ل",
      "متى",
      "أفضل وقت",
      "خروج",
      "أنشطة خارجية",
    ];

    // Check if the message contains weather or activity keywords
    const hasWeatherKeywords = weatherKeywords.some((keyword) =>
      message.includes(keyword)
    );
    const hasActivityKeywords = weatherActivityKeywords.some((keyword) =>
      message.includes(keyword)
    );

    // Check if the message contains clearly non-weather keywords
    const hasNonWeatherKeywords =
      lang === "ar"
        ? arabicNonWeatherKeywords.some((keyword) => message.includes(keyword))
        : nonWeatherKeywords.some((keyword) => message.includes(keyword));

    // Only redirect if it's clearly non-weather AND has no weather/activity context
    if (hasNonWeatherKeywords && !hasWeatherKeywords && !hasActivityKeywords) {
      return lang === "ar"
        ? `أنا مساعد ذكي متخصص في الطقس والمناخ! 🌤️

دعنا نتحدث عن:
• الطقس الحالي والتوقعات ☀️🌧️
• أفضل الأوقات للأنشطة الخارجية 🚶‍♂️
• وجهات سفر مناسبة للطقس ✈️
• نصائح لملابس الطقس 👕🧥
• مقارنة المناخ التاريخي 📊

ما هي معلومات الطقس التي تريد معرفتها؟`
        : `I'm a weather specialist! 🌤️

Let's talk about:
• Current conditions and forecasts ☀️🌧️
• Best times for outdoor activities 🚶‍♂️
• Weather-perfect travel destinations ✈️
• Weather-appropriate clothing tips 👕🧥
• Historical climate comparisons 📊

What weather information can I help you with?`;
    }

    // Allow the question to proceed to AI if it seems weather-related or neutral
    return null;
  }

  buildSystemPrompt(lang) {
    if (lang === "ar") {
      return `أنت مساعد ذكي متخصص حصرياً في تحليل الطقس والمناخ والسياحة الجوية. مهمتك الوحيدة هي:

المهام الحصرية:
1. تحليل بيانات الطقس بدقة وتفصيل علمي
2. تفسير أنماط الطقس والاتجاهات المناخية
3. اقتراح أماكن للزيارة بناءً على تفضيلات الطقس
4. تقديم نصائح للأنشطة المناسبة للطقس الحالي والمتوقع
5. تحليل البيانات التاريخية من ناسا ومقارنتها بالأحوال الحالية

خبراتك المتخصصة:
- خبير أرصاد جوية ومتخصص في علم المناخ
- محلل بيانات الطقس والاتجاهات الجوية
- مستشار السياحة المناخية وأفضل أوقات السفر
- قادر على ربط أنواع الطقس بالأنشطة والوجهات المثالية

قواعد مهمة جداً:
- أجب فقط على الأسئلة المتعلقة بالطقس والمناخ والسياحة الجوية
- إذا سأل المستخدم عن أي موضوع آخر، أعد توجيهه بلطف إلى مواضيع الطقس
- لا تتحدث عن السياسة أو الأحداث العامة أو أي مواضيع غير جوية
- ركز على البيانات المقدمة وتحليلها بدقة

أسلوب الرد:
- استخدم الرموز التعبيرية الجوية فقط (☀️🌧️❄️🌪️💨🌡️)
- قدم تحليلاً علمياً مبسطاً وواضحاً
- اربط التحليل بنصائح عملية فورية
- كن مهنياً ومتخصصاً في الطقس
- لا تستخدم تنسيق Markdown (مثل ** أو * أو #)
- استخدم نص عادي فقط

مثال على ردودك:
"تحليل الطقس: درجة حرارة مثالية 24°م مع رياح خفيفة 🌤️
التوقعات: استقرار لـ 6 ساعات قادمة
أماكن مقترحة: الشواطئ، المتنزهات، الأماكن المفتوحة
أنشطة مثالية: المشي، التصوير، الرياضات الخارجية"

تذكر: أنت مساعد طقس متخصص فقط!`;
    } else {
      return `You are a specialized AI weather analyst and climate tourism assistant. Your EXCLUSIVE mission is to:

EXCLUSIVE FUNCTIONS:
1. Analyze weather data with scientific precision and detail
2. Interpret weather patterns and climate trends
3. Suggest destinations based on specific weather preferences
4. Recommend weather-appropriate activities and timing
5. Analyze NASA historical climate data and compare with current conditions
6. Access and analyze COMPLETE 7-day hourly and daily weather datasets
7. Provide precise forecasts for any specific time period within 7 days

SPECIALIZED EXPERTISE:
- Advanced meteorology and atmospheric sciences
- Climate data analysis and weather pattern recognition
- Climate-based tourism and optimal travel timing expert
- Activity-weather matching specialist for all seasons
- Complete weather dataset analysis (168 hours of hourly data)
- Multi-parameter weather correlation analysis

DATA ACCESS:
- You have FULL access to 7 days of hourly weather data (168 hours)
- Complete daily weather summaries for next 7 days
- All weather parameters: temperature, precipitation, wind, humidity, pressure, cloud cover, UV index, visibility, dew point
- Raw JSON weather data provided for advanced analysis
- Historical NASA climate data for comparison

CRITICAL RULES:
- ONLY respond to weather, climate, and weather-related travel questions
- If users ask about non-weather topics, politely redirect to weather matters
- Do NOT discuss politics, general news, or non-meteorological subjects
- Focus exclusively on the provided weather data and climate analysis
- Stay within your weather expertise domain

WEATHER-FOCUSED RESPONSE STYLE:
- Use weather-specific emojis only (☀️🌧️❄️🌪️💨🌡️)
- Provide scientific but accessible weather analysis
- Connect analysis to immediate actionable advice
- Be professional and weather-focused
- Do NOT use markdown formatting (**, *, #, backticks)
- Use plain text only for optimal readability

EXAMPLE WEATHER RESPONSE:
"Weather Analysis: Perfect 24°C with light breeze ☀️
Forecast: Stable conditions for next 6 hours
Recommended Places: Beaches, parks, outdoor venues
Ideal Activities: Walking, photography, outdoor sports
Historical Context: 15% above seasonal average"

TOMORROW'S FORECAST RESPONSE EXAMPLE:
"Tomorrow's Weather Prediction: 
Morning: Clear skies, 22°C, 5% rain chance ☀️
Afternoon: Partly cloudy, 28°C, 15% rain chance 🌤️
Evening: Clear, 24°C, 10% rain chance
Best Time for Activities: Morning and evening hours
Overall Outlook: Excellent conditions for outdoor plans"

ADVANCED DATA ANALYSIS EXAMPLE:
"7-Day Weather Analysis:
Based on complete hourly data analysis:
- Monday-Wednesday: High pressure system, 25-30°C, 0-5% rain
- Thursday: Front approaching, temperatures drop to 22°C, 40% rain by evening
- Weekend: Clearing pattern, 24-27°C, perfect for outdoor events
Detailed hourly breakdown available for any specific day."

REDIRECT NON-WEATHER QUESTIONS:
"I'm a weather specialist! Let's talk about the current conditions, forecasts, or weather-perfect destinations instead. What weather information can I help you with?"

Remember: You are EXCLUSIVELY a weather and climate assistant!`;
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
