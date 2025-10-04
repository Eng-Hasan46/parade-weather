// NASA POWER API Service for annual weather data averages
export class NASAPowerService {
  constructor() {
    this.baseUrl = "https://power.larc.nasa.gov/api/temporal/daily/point";
    this.parameters = [
      "T2M", // Temperature at 2 Meters (°C)
      "T2M_MAX", // Maximum Temperature at 2 Meters (°C)
      "T2M_MIN", // Minimum Temperature at 2 Meters (°C)
      "RH2M", // Relative Humidity at 2 Meters (%)
      "PRECTOTCORR", // Precipitation Corrected (mm/day)
      "WS10M", // Wind Speed at 10 Meters (m/s)
      "WS10M_MAX", // Maximum Wind Speed at 10 Meters (m/s)
      "ALLSKY_SFC_SW_DWN", // Solar Irradiance (kWh/m²/day)
      "WD2M", // Wind Direction at 2 Meters (degrees)
      "PS", // Surface Pressure (kPa)
      "QV2M", // Specific Humidity at 2 Meters (g/kg)
      "CLOUD_AMT", // Cloud Amount (%)
      "SNODP", // snow depth,
      "PRECSNO", // snowfall
    ];
  }

  async getAnnualAverageData(latitude, longitude, date) {
    try {
      // Use historical data from 1981 to current year for comprehensive climate analysis
      const currentYear = new Date().getFullYear();
      const startDate = "19810101"; // January 1, 1981
      const endDate = `20241231`; // December 31 of current year

      // Build the API URL
      const params = new URLSearchParams({
        start: startDate,
        end: endDate,
        latitude: latitude.toFixed(6),
        longitude: longitude.toFixed(6),
        community: "RE",
        parameters: this.parameters.join(","),
        format: "JSON",
        user: "anonymous",
      });

      const url = `${this.baseUrl}?${params.toString()}`;

      console.log("NASA POWER API Request (1981-Present):", url);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `NASA POWER API error: ${response.status} - ${response.statusText}`
        );
      }

      const data = await response.json();

      // Calculate date-specific historical averages
      const averages = this.calculateDateSpecificAverages(data, date);

      return {
        location: {
          latitude,
          longitude,
          startYear: 1981,
          endYear: currentYear,
          yearsOfData: currentYear - 1981 + 1,
          targetDate: date,
        },
        averages,
        dataCount: this.getDataCount(data),
        raw: data, // Keep raw data for detailed analysis
      };
    } catch (error) {
      console.error("NASA POWER API Error:", error);
      throw error;
    }
  }
  async getDailyRawData(latitude, longitude) {
    try {
      // Use historical data from 1981 to current year for comprehensive climate analysis
      const startDate = "19810101"; // January 1, 1981
      const endDate = `20241231`; // December 31 of current year

      // Build the API URL
      const params = new URLSearchParams({
        start: startDate,
        end: endDate,
        latitude: latitude.toFixed(6),
        longitude: longitude.toFixed(6),
        community: "RE",
        parameters: this.parameters.join(","),
        format: "JSON",
        user: "anonymous",
      });

      const url = `${this.baseUrl}?${params.toString()}`;

      console.log("NASA POWER API Request (1981-Present):", url);

      const response = await fetch(url);

      if (!response.ok) {
        throw new Error(
          `NASA POWER API error: ${response.status} - ${response.statusText}`
        );
      }

      const data = await response.json();

      return {
        location: {
          latitude,
          longitude,
          startYear: 1981,
          endYear: 2024,
          yearsOfData: 2024 - 1981 + 1,
        },
        dataCount: this.getDataCount(data),
        raw: data, // Keep raw data for detailed analysis
      };
    } catch (error) {
      console.error("NASA POWER API Error:", error);
      throw error;
    }
  }

  calculateDateSpecificAverages(data, targetDate) {
    const parameters = data.properties?.parameter || {};
    const averages = {};

    // Extract month and day from target date (ignore year)
    const dateObj = new Date(targetDate);
    const targetMonth = String(dateObj.getMonth() + 1).padStart(2, "0");
    const targetDay = String(dateObj.getDate()).padStart(2, "0");
    const targetMonthDay = targetMonth + targetDay; // Format: MMDD

    // Filter data for the same month and day across all years
    const getDateSpecificValues = (paramValues) => {
      const specificValues = [];
      for (const [dateStr, value] of Object.entries(paramValues)) {
        if (
          value !== null &&
          value !== undefined &&
          value !== -999 &&
          !isNaN(value)
        ) {
          // Extract MMDD from YYYYMMDD
          const monthDay = dateStr.substring(4, 8);
          if (monthDay === targetMonthDay) {
            specificValues.push(value);
          }
        }
      }
      return specificValues;
    };

    // Calculate averages for each parameter on this specific date across all years
    for (const [param, values] of Object.entries(parameters)) {
      if (typeof values === "object" && values !== null) {
        const dateSpecificValues = getDateSpecificValues(values);

        if (dateSpecificValues.length > 0) {
          const sum = dateSpecificValues.reduce((acc, val) => acc + val, 0);
          averages[param] = {
            average: sum / dateSpecificValues.length,
            min: Math.min(...dateSpecificValues),
            max: Math.max(...dateSpecificValues),
            count: dateSpecificValues.length,
            unit: this.getParameterUnit(param),
            yearsOfData: dateSpecificValues.length,
          };
        }
      }
    }

    // Calculate date-specific rain probabilities
    if (parameters.PRECTOTCORR) {
      const precipValues = getDateSpecificValues(parameters.PRECTOTCORR);

      if (precipValues.length > 0) {
        // Rain probability for this specific date across all years
        const rainyDays = precipValues.filter((val) => val > 0.1).length;
        const rainProbability = (rainyDays / precipValues.length) * 100;

        // Heavy rain probability for this date
        const heavyRainDays = precipValues.filter((val) => val > 10).length;
        const heavyRainProbability =
          (heavyRainDays / precipValues.length) * 100;

        // Extreme rain probability for this date
        const extremeRainDays = precipValues.filter((val) => val > 25).length;
        const extremeRainProbability =
          (extremeRainDays / precipValues.length) * 100;

        // No rain probability for this date
        const dryDays = precipValues.filter((val) => val <= 0.1).length;
        const dryProbability = (dryDays / precipValues.length) * 100;

        // Add date-specific rain statistics
        averages["RAIN_PROBABILITY_TODAY"] = {
          average: rainProbability,
          min: 0,
          max: 100,
          count: precipValues.length,
          unit: "%",
          yearsOfData: precipValues.length,
        };

        averages["HEAVY_RAIN_PROBABILITY_TODAY"] = {
          average: heavyRainProbability,
          min: 0,
          max: 100,
          count: precipValues.length,
          unit: "%",
          yearsOfData: precipValues.length,
        };

        averages["EXTREME_RAIN_PROBABILITY_TODAY"] = {
          average: extremeRainProbability,
          min: 0,
          max: 100,
          count: precipValues.length,
          unit: "%",
          yearsOfData: precipValues.length,
        };

        averages["DRY_DAY_PROBABILITY_TODAY"] = {
          average: dryProbability,
          min: 0,
          max: 100,
          count: precipValues.length,
          unit: "%",
          yearsOfData: precipValues.length,
        };
      }
    }

    // Calculate weekly average around this date (±3 days)
    const getWeeklyValues = (paramValues) => {
      const weeklyValues = [];
      for (const [dateStr, value] of Object.entries(paramValues)) {
        if (
          value !== null &&
          value !== undefined &&
          value !== -999 &&
          !isNaN(value)
        ) {
          const month = dateStr.substring(4, 6);
          const day = dateStr.substring(6, 8);
          const monthDay = month + day;

          // Check if this date is within ±3 days of target date
          const targetDayNum = parseInt(targetDay);
          const currentDayNum = parseInt(day);
          const targetMonthNum = parseInt(targetMonth);
          const currentMonthNum = parseInt(month);

          if (currentMonthNum === targetMonthNum) {
            const dayDiff = Math.abs(currentDayNum - targetDayNum);
            if (dayDiff <= 3) {
              weeklyValues.push(value);
            }
          }
        }
      }
      return weeklyValues;
    };

    // Add weekly rain probability around this date
    if (parameters.PRECTOTCORR) {
      const weeklyPrecipValues = getWeeklyValues(parameters.PRECTOTCORR);

      if (weeklyPrecipValues.length > 0) {
        const weeklyRainyDays = weeklyPrecipValues.filter(
          (val) => val > 0.1
        ).length;
        const weeklyRainProbability =
          (weeklyRainyDays / weeklyPrecipValues.length) * 100;

        averages["WEEKLY_RAIN_PROBABILITY"] = {
          average: weeklyRainProbability,
          min: 0,
          max: 100,
          count: weeklyPrecipValues.length,
          unit: "%",
          yearsOfData: Math.floor(weeklyPrecipValues.length / 7),
        };
      }
    }

    return averages;
  }

  calculateDroughtProbability(precipData) {
    const dateEntries = Object.entries(precipData).sort(([a], [b]) =>
      a.localeCompare(b)
    );
    let droughtDays = 0;
    let totalDroughtPeriods = 0;
    let currentDroughtLength = 0;

    for (const [dateStr, value] of dateEntries) {
      if (
        value !== null &&
        value !== undefined &&
        value !== -999 &&
        !isNaN(value)
      ) {
        if (value < 1) {
          currentDroughtLength++;
        } else {
          if (currentDroughtLength >= 30) {
            totalDroughtPeriods++;
            droughtDays += currentDroughtLength;
          }
          currentDroughtLength = 0;
        }
      }
    }

    // Calculate probability as percentage of years with significant drought periods
    const totalYears = Math.floor(dateEntries.length / 365);
    return totalYears > 0 ? (totalDroughtPeriods / totalYears) * 100 : 0;
  }

  calculateSeasonalRainPatterns(precipData) {
    const monthlyTotals = {};
    const monthlyDays = {};

    // Initialize months
    for (let i = 1; i <= 12; i++) {
      const month = i.toString().padStart(2, "0");
      monthlyTotals[month] = [];
      monthlyDays[month] = 0;
    }

    for (const [dateStr, value] of Object.entries(precipData)) {
      if (
        value !== null &&
        value !== undefined &&
        value !== -999 &&
        !isNaN(value)
      ) {
        const month = dateStr.substring(4, 6); // Extract month from YYYYMMDD
        monthlyTotals[month].push(value);
        monthlyDays[month]++;
      }
    }

    // Calculate monthly averages
    const monthlyAverages = {};
    for (const [month, values] of Object.entries(monthlyTotals)) {
      if (values.length > 0) {
        const sum = values.reduce((acc, val) => acc + val, 0);
        monthlyAverages[month] = sum / values.length;
      }
    }

    // Find patterns
    const avgValues = Object.values(monthlyAverages);
    const overallAvg =
      avgValues.reduce((acc, val) => acc + val, 0) / avgValues.length;
    const wetMonths = avgValues.filter((val) => val > overallAvg * 1.5).length;
    const wettestMonthAvg = Math.max(...avgValues);
    const driestMonthAvg = Math.min(...avgValues);

    return {
      wetMonths,
      wettestMonthAvg,
      driestMonthAvg,
      monthlyAverages,
    };
  }

  getDataCount(data) {
    const parameters = data.properties?.parameter || {};
    let totalDays = 0;

    for (const values of Object.values(parameters)) {
      if (typeof values === "object" && values !== null) {
        totalDays = Math.max(totalDays, Object.keys(values).length);
        break;
      }
    }

    return totalDays;
  }

  getParameterUnit(param) {
    const units = {
      T2M: "°C",
      T2M_MAX: "°C",
      T2M_MIN: "°C",
      RH2M: "%",
      PRECTOTCORR: "mm/day",
      WS10M: "m/s",
      WS10M_MAX: "m/s",
      ALLSKY_SFC_SW_DWN: "kWh/m²/day",
      WD2M: "°",
      PS: "kPa",
      QV2M: "g/kg",
      CLOUD_AMT: "%",
      RAIN_PROBABILITY_TODAY: "%",
      HEAVY_RAIN_PROBABILITY_TODAY: "%",
      EXTREME_RAIN_PROBABILITY_TODAY: "%",
      DRY_DAY_PROBABILITY_TODAY: "%",
      WEEKLY_RAIN_PROBABILITY: "%",
    };
    return units[param] || "";
  }

  getParameterName(param, lang = "en") {
    const names = {
      en: {
        T2M: "Average Temperature",
        T2M_MAX: "Maximum Temperature",
        T2M_MIN: "Minimum Temperature",
        RH2M: "Relative Humidity",
        PRECTOTCORR: "Precipitation",
        WS10M: "Wind Speed",
        WS10M_MAX: "Maximum Wind Speed",
        ALLSKY_SFC_SW_DWN: "Solar Irradiance",
        WD2M: "Wind Direction",
        PS: "Surface Pressure",
        QV2M: "Specific Humidity",
        CLOUD_AMT: "Cloud Coverage",
        RAIN_PROBABILITY_TODAY: "Rain Probability (This Date)",
        HEAVY_RAIN_PROBABILITY_TODAY: "Heavy Rain Probability (This Date)",
        EXTREME_RAIN_PROBABILITY_TODAY: "Extreme Rain Probability (This Date)",
        DRY_DAY_PROBABILITY_TODAY: "Dry Day Probability (This Date)",
        WEEKLY_RAIN_PROBABILITY: "Weekly Rain Probability (±3 days)",
      },
      ar: {
        T2M: "متوسط درجة الحرارة",
        T2M_MAX: "أقصى درجة حرارة",
        T2M_MIN: "أدنى درجة حرارة",
        RH2M: "الرطوبة النسبية",
        PRECTOTCORR: "التساقط",
        WS10M: "سرعة الرياح",
        WS10M_MAX: "أقصى سرعة رياح",
        ALLSKY_SFC_SW_DWN: "الإشعاع الشمسي",
        WD2M: "اتجاه الرياح",
        PS: "الضغط الجوي",
        QV2M: "الرطوبة النوعية",
        CLOUD_AMT: "الغطاء السحابي",
        RAIN_PROBABILITY_TODAY: "احتمالية المطر (هذا التاريخ)",
        HEAVY_RAIN_PROBABILITY_TODAY: "احتمالية المطر الغزير (هذا التاريخ)",
        EXTREME_RAIN_PROBABILITY_TODAY: "احتمالية المطر الشديد (هذا التاريخ)",
        DRY_DAY_PROBABILITY_TODAY: "احتمالية اليوم الجاف (هذا التاريخ)",
        WEEKLY_RAIN_PROBABILITY: "احتمالية المطر الأسبوعية (±3 أيام)",
      },
    };
    return names[lang]?.[param] || param;
  }

  formatAnnualData(nasaData, lang = "en") {
    if (!nasaData || !nasaData.averages) {
      return lang === "ar"
        ? "لا توجد بيانات سنوية متاحة"
        : "No annual data available";
    }

    const { location, averages } = nasaData;
    const isArabic = lang === "ar";
    const targetDateObj = new Date(location.targetDate);
    const dateStr = targetDateObj.toLocaleDateString(
      isArabic ? "ar-SA" : "en-US",
      {
        month: "long",
        day: "numeric",
      }
    );

    let formatted = isArabic
      ? `البيانات المناخية التاريخية لتاريخ ${dateStr}
الموقع: ${location.latitude.toFixed(2)}°، ${location.longitude.toFixed(2)}°
البيانات التاريخية: ${location.startYear}-${location.endYear}

📊 إحصائيات المطر لهذا التاريخ عبر ${location.yearsOfData} سنة:`
      : `Historical Climate Data for ${dateStr}
Location: ${location.latitude.toFixed(2)}°, ${location.longitude.toFixed(2)}°
Historical Data: ${location.startYear}-${location.endYear}

📊 Rain Statistics for This Date Across ${location.yearsOfData} Years:`;

    // Prioritize date-specific rain parameters
    const rainParams = [
      "RAIN_PROBABILITY_TODAY",
      "DRY_DAY_PROBABILITY_TODAY",
      "HEAVY_RAIN_PROBABILITY_TODAY",
      "EXTREME_RAIN_PROBABILITY_TODAY",
      "WEEKLY_RAIN_PROBABILITY",
      "PRECTOTCORR",
    ];

    // Display rain parameters first
    for (const param of rainParams) {
      if (averages[param]) {
        const data = averages[param];
        const name = this.getParameterName(param, lang);
        const avg = data.average.toFixed(1);
        const unit = data.unit;
        const years = data.yearsOfData || data.count;

        if (isArabic) {
          formatted += `\n🌧️ ${name}: ${avg}${unit} (من ${years} سنة)`;
        } else {
          formatted += `\n🌧️ ${name}: ${avg}${unit} (from ${years} years)`;
        }
      }
    }

    // Add weather interpretation for this specific date
    if (averages["RAIN_PROBABILITY_TODAY"]) {
      const rainProb = averages["RAIN_PROBABILITY_TODAY"].average;
      const dryProb =
        averages["DRY_DAY_PROBABILITY_TODAY"]?.average || 100 - rainProb;
      let interpretation = "";

      if (rainProb < 5) {
        interpretation = isArabic
          ? "يوم جاف تماماً تقريباً"
          : "Almost always a dry day";
      } else if (rainProb < 15) {
        interpretation = isArabic
          ? "عادة ما يكون يوماً جافاً"
          : "Usually a dry day";
      } else if (rainProb < 35) {
        interpretation = isArabic
          ? "احتمالية مطر منخفضة"
          : "Low chance of rain";
      } else if (rainProb < 65) {
        interpretation = isArabic
          ? "احتمالية مطر معتدلة"
          : "Moderate chance of rain";
      } else if (rainProb < 85) {
        interpretation = isArabic
          ? "احتمالية مطر عالية"
          : "High chance of rain";
      } else {
        interpretation = isArabic
          ? "عادة ما يكون يوماً ممطراً"
          : "Usually a rainy day";
      }

      formatted += isArabic
        ? `\n\n💧 التفسير لهذا التاريخ: ${interpretation}`
        : `\n\n💧 Interpretation for This Date: ${interpretation}`;

      // Add comparison note
      formatted += isArabic
        ? `\n\n📈 ملاحظة: النسب محسوبة من نفس التاريخ عبر ${location.yearsOfData} سنة من بيانات ناسا`
        : `\n\n📈 Note: Percentages calculated from the same date across ${location.yearsOfData} years of NASA data`;
    }

    // Add other climate data for this date
    const otherParams = Object.keys(averages).filter(
      (param) => !rainParams.includes(param)
    );
    if (otherParams.length > 0) {
      formatted += isArabic
        ? "\n\n🌡️ بيانات مناخية أخرى لهذا التاريخ:"
        : "\n\n🌡️ Other Climate Data for This Date:";

      for (const param of otherParams.slice(0, 4)) {
        // Show only top 4 to keep it concise
        if (averages[param]) {
          const data = averages[param];
          const name = this.getParameterName(param, lang);
          const avg = data.average.toFixed(1);
          const unit = data.unit;

          if (isArabic) {
            formatted += `\n- ${name}: ${avg}${unit}`;
          } else {
            formatted += `\n- ${name}: ${avg}${unit}`;
          }
        }
      }
    }

    return formatted;
  }
}

export default NASAPowerService;
