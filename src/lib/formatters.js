export const formatters = {
  rainfall: (mm, max) => {
    let avgMessage;
    let maxMessage;

    if (mm < 0.5) avgMessage = "No rain";
    else if (mm < 2) avgMessage = "Light rain";
    else if (mm < 10) avgMessage = "Moderate rain";
    else avgMessage = "Heavy rain";
    if (max < 0.5) maxMessage = "No rain";
    else if (max < 2) maxMessage = "Light rain";
    else if (max < 10) maxMessage = "Moderate rain";
    else maxMessage = "Heavy rain";
    let combinedText;
    console.log(avgMessage, maxMessage);
    if (maxMessage == avgMessage) combinedText = maxMessage;
    else combinedText = avgMessage + " - " + maxMessage;
    return { text: combinedText, color: "#93C5FD", intensity: 3 };
  },
  wind: (ms, max) => {
    let avgMessage;
    let maxMessage;
    if (ms < 2) avgMessage = "Calm";
    else if (ms < 5) avgMessage = "Light breeze";
    else if (ms < 10) avgMessage = "Moderate wind";
    else avgMessage = "Strong wind";
    if (max < 2) maxMessage = "Calm";
    else if (max < 5) maxMessage = "Light breeze";
    else if (max < 10) maxMessage = "Moderate wind";
    else maxMessage = "Strong wind";
    let combinedText;
    console.log(avgMessage, maxMessage);
    if (maxMessage == avgMessage) combinedText = maxMessage;
    else combinedText = avgMessage + " - " + maxMessage;
    return { text: combinedText, color: "#9CA3AF", intensity: 3 };
  },
  cloud: (cloudCover) => {
    if (cloudCover < 10)
      return { text: "Clear sky", color: "#FEF3C7", intensity: 3 }; // 0-1 oktas
    if (cloudCover < 30)
      return { text: "Mostly clear", color: "#FDE68A", intensity: 2 }; // 1-2 oktas
    if (cloudCover < 60)
      return { text: "Partly cloudy", color: "#E5E7EB", intensity: 1 }; // 3-5 oktas
    if (cloudCover < 80)
      return { text: "Mostly cloudy", color: "#D1D5DB", intensity: 0 }; // 6-7 oktas
    return { text: "Overcast", color: "#9CA3AF", intensity: 0 }; // 8 oktas
  },
};
