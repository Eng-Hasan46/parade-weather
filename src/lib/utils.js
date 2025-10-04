export function heatIndexC(T, RH = 60) {
  const Tf = (T * 9) / 5 + 32;
  const HI =
    -42.379 +
    2.04901523 * Tf +
    10.14333127 * RH -
    0.22475541 * Tf * RH -
    0.00683783 * Tf * Tf -
    0.05481717 * RH * RH +
    0.00122874 * Tf * Tf * RH +
    0.00085282 * Tf * RH * RH -
    0.00000199 * Tf * Tf * RH * RH;
  return ((HI - 32) * 5) / 9;
}
export function verdict({ pop, apparentC, wind }) {
  // Analyze precipitation probability (most critical for parades)
  if (pop >= 80)
    return {
      icon: "CloudDrizzle",
      en: "Heavy rain very likely — postpone outdoor events.",
      ar: "أمطار غزيرة محتملة جداً — يُنصح بتأجيل الفعاليات الخارجية.",
    };
  if (pop >= 60)
    return {
      icon: "CloudRain",
      en: "Rain probable — prepare covered areas and contingency plans.",
      ar: "احتمالية هطول أمطار عالية — يُرجى توفير مناطق مغطاة وخطط بديلة.",
    };
  if (pop >= 40)
    return {
      icon: "Cloud",
      en: "Rain possible — monitor forecast and have backup options ready.",
      ar: "احتمالية هطول أمطار متوسطة — يُنصح بمراقبة التوقعات وتجهيز خيارات بديلة.",
    };

  // Analyze temperature (apparent temperature includes humidity effects)
  if (apparentC >= 40)
    return {
      icon: "Thermometer",
      en: "Extreme heat warning — provide shade, cooling stations, and medical support.",
      ar: "تحذير من الحرارة الشديدة — يُرجى توفير الظل ومحطات التبريد والدعم الطبي.",
    };
  if (apparentC >= 35)
    return {
      icon: "Sun",
      en: "Very hot conditions — ensure adequate hydration and frequent breaks.",
      ar: "ظروف حارة جداً — يُنصح بضمان الترطيب الكافي والاستراحات المتكررة.",
    };
  if (apparentC <= 0)
    return {
      icon: "Snowflake",
      en: "Freezing conditions — provide heating areas and warm beverages.",
      ar: "ظروف متجمدة — يُرجى توفير مناطق دافئة ومشروبات ساخنة.",
    };
  if (apparentC <= 5)
    return {
      icon: "Thermometer",
      en: "Very cold — participants should dress warmly and limit exposure.",
      ar: "برد شديد — يُنصح المشاركين بارتداء ملابس دافئة وتقليل التعرض.",
    };

  // Analyze wind speed (in m/s, convert to km/h: multiply by 3.6)
  if (wind >= 15)
    return {
      icon: "Wind",
      en: "Very strong winds — secure all equipment, banners may not be safe.",
      ar: "رياح قوية جداً — يُرجى تأمين جميع المعدات، اللافتات قد تكون غير آمنة.",
    };
  if (wind >= 10)
    return {
      icon: "Wind",
      en: "Strong winds — anchor decorations and monitor lightweight items.",
      ar: "رياح قوية — يُنصح بتثبيت الزينة ومراقبة الأغراض الخفيفة.",
    };
  if (wind >= 7)
    return {
      icon: "Wind",
      en: "Moderate winds — secure loose items and outdoor displays.",
      ar: "رياح معتدلة — يُنصح بتأمين الأغراض المفكوكة والعروض الخارجية.",
    };

  // Ideal conditions check
  if (pop <= 20 && apparentC >= 15 && apparentC <= 28 && wind <= 5)
    return {
      icon: "CheckCircle",
      en: "Excellent parade conditions — perfect weather for outdoor celebrations.",
      ar: "ظروف ممتازة للاستعراض — طقس مثالي للاحتفالات الخارجية.",
    };
  if (pop <= 30 && apparentC >= 10 && apparentC <= 32 && wind <= 8)
    return {
      icon: "ThumbsUp",
      en: "Good conditions — suitable for parades with standard preparations.",
      ar: "ظروف جيدة — مناسبة للاستعراضات مع التحضيرات العادية.",
    };

  // Default case
  return {
    icon: "AlertTriangle",
    en: "Fair conditions — proceed with caution and monitor weather updates.",
    ar: "ظروف مقبولة — يُنصح بالمتابعة بحذر ومراقبة التحديثات الجوية.",
  };
}
export function fmt(v, u) {
  return `${Math.round(v)}${u}`;
}
export const labels = {
  en: {
    title: "Will It Rain On My Parade?",
    subtitle:
      "Accurate, human-friendly guidance powered by Earth observation & forecasts.",
    location: "Event Location",
    date: "Event Date",
    time: "Event Time",
    check: "Check My Parade Weather",
    hourly: "Hourly Conditions",
    temp: "Temp °C",
    precip: "Precip %",
    uv: "UV Index",
    wind: "Wind",
  },
  ar: {
    title: "هل ستمطر في حفلي؟",
    subtitle: "إرشادات واضحة تعتمد على رصد الأرض والتنبؤات.",
    location: "موقع الحدث",
    date: "تاريخ الحدث",
    time: "وقت الحدث",
    check: "تحقّق من طقس الحدث",
    hourly: "الظروف بالساعة",
    temp: "الحرارة °م",
    precip: "احتمال المطر %",
    uv: "مؤشر UV",
    wind: "الرياح",
  },
};
