(function initializeConverter(global) {
  const VOLUME = {
    us: {
      fluidOunceMl: 29.5735295625,
      teaspoonMl: 4.92892159375,
      tablespoonMl: 14.78676478125,
      cupMl: 236.5882365,
      pintL: 0.473176473,
      quartL: 0.946352946,
      gallonL: 3.785411784
    },
    uk: {
      fluidOunceMl: 28.4130625,
      teaspoonMl: 5.919388020833,
      tablespoonMl: 17.7581640625,
      cupMl: 284.130625,
      pintL: 0.56826125,
      quartL: 1.1365225,
      gallonL: 4.54609
    }
  };

  const unit = (id, pattern, symbol, convert, category) => ({ id, pattern, symbol, convert, category });
  const imperialUnits = [
    unit("square-mile", "(?:square\\s+miles?|sq\\.?\\s*mi\\.?|mi(?:les?)?\\s*[²2])", "km²", (v) => v * 2.589988110336, "area"),
    unit("square-yard", "(?:square\\s+yards?|sq\\.?\\s*yds?\\.?|yds?\\.?\\s*[²2])", "m²", (v) => v * 0.83612736, "area"),
    unit("square-foot", "(?:square\\s+(?:feet|foot)|sq\\.?\\s*ft\\.?|ft\\.?\\s*[²2])", "m²", (v) => v * 0.09290304, "area"),
    unit("square-inch", "(?:square\\s+inch(?:es)?|sq\\.?\\s*in\\.?|in\\.?\\s*[²2])", "cm²", (v) => v * 6.4516, "area"),
    unit("acre", "(?:acres?|ac\\.?)", "ha", (v) => v * 0.40468564224, "area"),

    unit("cubic-yard", "(?:cubic\\s+yards?|cu\\.?\\s*yds?\\.?|yds?\\.?\\s*[³3])", "m³", (v) => v * 0.764554857984, "volume"),
    unit("cubic-foot", "(?:cubic\\s+(?:feet|foot)|cu\\.?\\s*ft\\.?|ft\\.?\\s*[³3])", "m³", (v) => v * 0.028316846592, "volume"),
    unit("cubic-inch", "(?:cubic\\s+inch(?:es)?|cu\\.?\\s*in\\.?|in\\.?\\s*[³3])", "cm³", (v) => v * 16.387064, "volume"),
    unit("imperial-gallon", "(?:imperial\\s+gallons?|imp\\.?\\s*gal\\.?)", "L", (v) => v * VOLUME.uk.gallonL, "volume"),
    unit("imperial-pint", "(?:imperial\\s+pints?|imp\\.?\\s*pt\\.?)", "L", (v) => v * VOLUME.uk.pintL, "volume"),
    unit("imperial-fluid-ounce", "(?:imperial\\s+fluid\\s+ounces?|imp\\.?\\s*fl\\.?\\s*oz\\.?)", "mL", (v) => v * VOLUME.uk.fluidOunceMl, "volume"),
    unit("fluid-ounce", "(?:fluid\\s+ounces?|fl\\.?\\s*oz\\.?)", "mL", (v, o) => v * VOLUME[o.standard].fluidOunceMl, "volume"),
    unit("tablespoon", "(?:tablespoons?|tbsps?\\.?|tbsp\\.?)", "mL", (v, o) => v * VOLUME[o.standard].tablespoonMl, "volume"),
    unit("teaspoon", "(?:teaspoons?|tsps?\\.?|tsp\\.?)", "mL", (v, o) => v * VOLUME[o.standard].teaspoonMl, "volume"),
    unit("gallon", "(?:gallons?|gals?\\.?)", "L", (v, o) => v * VOLUME[o.standard].gallonL, "volume"),
    unit("quart", "(?:quarts?|qts?\\.?)", "L", (v, o) => v * VOLUME[o.standard].quartL, "volume"),
    unit("pint", "(?:pints?|pts?\\.?)", "L", (v, o) => v * VOLUME[o.standard].pintL, "volume"),
    unit("cup", "cups?", "mL", (v, o) => v * VOLUME[o.standard].cupMl, "volume"),

    unit("long-ton", "(?:long\\s+tons?|imperial\\s+tons?)", "t", (v) => v * 1.0160469088, "mass"),
    unit("short-ton", "(?:short\\s+tons?|US\\s+tons?)", "t", (v) => v * 0.90718474, "mass"),
    unit("stone", "(?:stones?|st\\.?)", "kg", (v) => v * 6.35029318, "mass"),
    unit("pound", "(?:pounds?|lbs?\\.?)", "kg", (v) => v * 0.45359237, "mass"),
    unit("ounce", "(?:ounces?|oz\\.?)", "g", (v) => v * 28.349523125, "mass"),
    unit("ton", "tons?", "t", (v, o) => v * (o.standard === "uk" ? 1.0160469088 : 0.90718474), "mass"),

    unit("fahrenheit", "(?:degrees?\\s+fahrenheit|fahrenheit|°\\s*F)", "°C", (v) => (v - 32) * (5 / 9), "temperature"),
    unit("miles-per-hour", "(?:miles?\\s+per\\s+hour|mi\\.?\\s*\/\\s*h|mph)", "km/h", (v) => v * 1.609344, "speed"),
    unit("feet-per-second-squared", "(?:ft\\.?\\s*\/\\s*s(?:²|2)|(?:feet|foot)\\s+per\\s+second\\s+squared)", "m/s²", (v) => v * 0.3048, "acceleration"),
    unit("feet-per-second", "(?:(?:feet|foot)\\s+per\\s+second|ft\\.?\\s*\/\\s*s)", "m/s", (v) => v * 0.3048, "speed"),
    unit("knot", "(?:knots?|kts?\\.?)", "km/h", (v) => v * 1.852, "speed"),

    unit("pounds-per-square-inch", "(?:pounds?\\s+per\\s+square\\s+inch|lb\\.?\\s*\/\\s*in(?:²|2)|psi)", "kPa", (v) => v * 6.894757293168, "pressure"),
    unit("inch-mercury", "(?:inches?\\s+of\\s+mercury|inHg)", "kPa", (v) => v * 3.386389, "pressure"),
    unit("btu", "(?:British\\s+thermal\\s+units?|BTUs?)", "kJ", (v) => v * 1.05505585262, "energy"),
    unit("foot-pound-energy", "(?:foot[-\\s]?pounds?|ft\\.?[-·\\s]?lbf)", "J", (v) => v * 1.3558179483314, "energy"),
    unit("horsepower", "(?:horsepower|hp)", "kW", (v) => v * 0.745699871582, "power"),
    unit("pound-force", "(?:pounds?[-\\s]?force|lbf)", "N", (v) => v * 4.4482216152605, "force"),
    unit("pound-foot", "(?:pound[-\\s]?feet|pound[-\\s]?foot|lb\\.?[-·\\s]?ft\\.?)", "N·m", (v) => v * 1.3558179483314, "torque"),
    unit("miles-per-gallon", "(?:miles?\\s+per\\s+(?:imperial\\s+)?gallon|mpg)", "L/100 km", (v, o, raw) => {
      if (v === 0) return Number.NaN;
      const isExplicitImperial = /imperial/i.test(raw);
      return (isExplicitImperial || o.standard === "uk" ? 282.4809363 : 235.214583) / v;
    }, "fuel-economy"),
    unit("gallons-per-minute", "(?:gallons?\\s+per\\s+minute|gpm)", "L/min", (v, o) => v * VOLUME[o.standard].gallonL, "flow"),

    unit("nautical-mile", "(?:nautical\\s+miles?|nmi\\.?)", "km", (v) => v * 1.852, "length"),
    unit("mile", "(?:miles?|mi\\.?)", "km", (v) => v * 1.609344, "length"),
    unit("yard", "(?:yards?|yds?\\.?)", "m", (v) => v * 0.9144, "length"),
    unit("foot", "(?:feet|foot|ft\\.?|[\u0027′’])", "m", (v) => v * 0.3048, "length"),
    unit("inch", "(?:inch(?:es)?|in\\.?|[\u0022″”])", "cm", (v) => v * 2.54, "length"),
    unit("thou", "(?:thou|mils?)", "mm", (v) => v * 0.0254, "length")
  ];

  const metricUnits = [
    unit("metric-square-kilometre", "(?:square\\s+kilomet(?:er|re)s?|sq\\.?\\s*km\\.?|km\\.?\\s*[²2])", "sq mi", (v) => v / 2.589988110336, "area"),
    unit("metric-hectare", "(?:hectares?|ha)", "acres", (v) => v / 0.40468564224, "area"),
    unit("metric-square-metre", "(?:square\\s+met(?:er|re)s?|sq\\.?\\s*m\\.?|m\\.?\\s*[²2])", "sq ft", (v) => v / 0.09290304, "area"),
    unit("metric-square-centimetre", "(?:square\\s+centimet(?:er|re)s?|sq\\.?\\s*cm\\.?|cm\\.?\\s*[²2])", "sq in", (v) => v / 6.4516, "area"),
    unit("metric-square-millimetre", "(?:square\\s+millimet(?:er|re)s?|sq\\.?\\s*mm\\.?|mm\\.?\\s*[²2])", "sq in", (v) => v / 645.16, "area"),

    unit("metric-cubic-metre", "(?:cubic\\s+met(?:er|re)s?|cu\\.?\\s*m\\.?|m\\.?\\s*[³3])", "cu ft", (v) => v / 0.028316846592, "volume"),
    unit("metric-cubic-centimetre", "(?:cubic\\s+centimet(?:er|re)s?|cu\\.?\\s*cm\\.?|cm\\.?\\s*[³3]|cc)", "cu in", (v) => v / 16.387064, "volume"),
    unit("metric-millilitre", "(?:millilit(?:er|re)s?|mL)", "fl oz", (v, o) => v / VOLUME[o.standard].fluidOunceMl, "volume"),
    unit("metric-litre", "(?:lit(?:er|re)s?|L)", "gal", (v, o) => v / VOLUME[o.standard].gallonL, "volume"),

    unit("metric-tonne", "(?:metric\\s+tons?|tonnes?|t)", (o) => o.standard === "uk" ? "long ton" : "US ton", (v, o) => v / (o.standard === "uk" ? 1.0160469088 : 0.90718474), "mass"),
    unit("metric-kilogram", "(?:kilograms?|kgs?\\.?)", "lb", (v) => v / 0.45359237, "mass"),
    unit("metric-milligram", "(?:milligrams?|mg)", "oz", (v) => v / 28349.523125, "mass"),
    unit("metric-gram", "(?:grams?|g)", "oz", (v) => v / 28.349523125, "mass"),

    unit("celsius", "(?:degrees?\\s+celsius|celsius|°\\s*C)", "°F", (v) => v * (9 / 5) + 32, "temperature"),
    unit("kilometres-per-hour", "(?:kilomet(?:er|re)s?\\s+per\\s+hour|km\\.?\\s*\/\\s*h|kph)", "mph", (v) => v / 1.609344, "speed"),
    unit("metres-per-second-squared", "(?:m\\.?\\s*\/\\s*s(?:²|2)|met(?:er|re)s?\\s+per\\s+second\\s+squared)", "ft/s²", (v) => v / 0.3048, "acceleration"),
    unit("metres-per-second", "(?:met(?:er|re)s?\\s+per\\s+second|m\\.?\\s*\/\\s*s)", "ft/s", (v) => v / 0.3048, "speed"),

    unit("kilopascal", "(?:kilopascals?|kPa)", "psi", (v) => v / 6.894757293168, "pressure"),
    unit("pascal", "(?:pascals?|Pa)", "psi", (v) => v * 0.00014503773773, "pressure"),
    unit("bar", "bars?", "psi", (v) => v * 14.503773773, "pressure"),
    unit("kilowatt-hour", "(?:kilowatt[-\\s]?hours?|kW\\s*·?\\s*h)", "BTU", (v) => v * 3412.141633, "energy"),
    unit("watt-hour", "(?:watt[-\\s]?hours?|W\\s*·?\\s*h)", "BTU", (v) => v * 3.412141633, "energy"),
    unit("kilojoule", "(?:kilojoules?|kJ)", "BTU", (v) => v / 1.05505585262, "energy"),
    unit("joule", "(?:joules?|J)", "ft-lb", (v) => v / 1.3558179483314, "energy"),
    unit("kilowatt", "(?:kilowatts?|kW)", "hp", (v) => v / 0.745699871582, "power"),
    unit("watt", "(?:watts?|W)", "hp", (v) => v / 745.699871582, "power"),
    unit("newton-metre", "(?:newton[-\\s]?met(?:er|re)s?|N\\s*[·-]\\s*m)", "lb-ft", (v) => v / 1.3558179483314, "torque"),
    unit("newton", "(?:newtons?|N)", "lbf", (v) => v / 4.4482216152605, "force"),
    unit("litres-per-100-kilometres", "(?:lit(?:er|re)s?\\s+per\\s+100\\s+kilomet(?:er|re)s?|L\\s*\/\\s*100\\s*km)", "mpg", (v, o) => {
      if (v === 0) return Number.NaN;
      return (o.standard === "uk" ? 282.4809363 : 235.214583) / v;
    }, "fuel-economy"),
    unit("kilometres-per-litre", "(?:kilomet(?:er|re)s?\\s+per\\s+lit(?:er|re)|km\\s*\/\\s*L)", "mpg", (v, o) => v * (o.standard === "uk" ? 2.824809363 : 2.352145833), "fuel-economy"),
    unit("litres-per-minute", "(?:lit(?:er|re)s?\\s+per\\s+minute|L\\s*\/\\s*min)", "gpm", (v, o) => v / VOLUME[o.standard].gallonL, "flow"),

    unit("metric-kilometre", "(?:kilomet(?:er|re)s?|km\\.?)", "mi", (v) => v / 1.609344, "length"),
    unit("metric-centimetre", "(?:centimet(?:er|re)s?|cm\\.?)", "in", (v) => v / 2.54, "length"),
    unit("metric-millimetre", "(?:millimet(?:er|re)s?|mm\\.?)", "in", (v) => v / 25.4, "length"),
    unit("metric-metre", "(?:met(?:er|re)s?|m\\.?)", "ft", (v) => v / 0.3048, "length")
  ];

  const unicodeFractions = Object.freeze({
    "¼": 1 / 4,
    "½": 1 / 2,
    "¾": 3 / 4,
    "⅐": 1 / 7,
    "⅑": 1 / 9,
    "⅒": 1 / 10,
    "⅓": 1 / 3,
    "⅔": 2 / 3,
    "⅕": 1 / 5,
    "⅖": 2 / 5,
    "⅗": 3 / 5,
    "⅘": 4 / 5,
    "⅙": 1 / 6,
    "⅚": 5 / 6,
    "⅛": 1 / 8,
    "⅜": 3 / 8,
    "⅝": 5 / 8,
    "⅞": 7 / 8
  });

  const unicodeFractionPattern = Object.keys(unicodeFractions).join("");
  const numberPattern = `[-+]?(?:(?:\\d{1,3}(?:,\\d{3})+|\\d+)(?:\\.\\d+)?(?:[\\s-]+\\d+\\s*\/\\s*\\d+)?|\\d+\\s*\/\\s*\\d+|(?:\\d+(?:\\.\\d+)?)?[${unicodeFractionPattern}])`;
  const imperialMatchingUnits = [...imperialUnits].sort((a, b) => b.pattern.length - a.pattern.length);
  const metricMatchingUnits = [...metricUnits].sort((a, b) => b.pattern.length - a.pattern.length);
  const imperialLengthMatchingUnits = imperialMatchingUnits.filter(({ category }) => category === "length");
  const metricLengthMatchingUnits = metricMatchingUnits.filter(({ category }) => category === "length");
  const imperialUnitPattern = imperialMatchingUnits.map(({ pattern }) => `(?:${pattern})`).join("|");
  const metricUnitPattern = metricMatchingUnits.map(({ pattern }) => `(?:${pattern})`).join("|");
  const imperialLengthUnitPattern = imperialLengthMatchingUnits.map(({ pattern }) => `(?:${pattern})`).join("|");
  const metricLengthUnitPattern = metricLengthMatchingUnits.map(({ pattern }) => `(?:${pattern})`).join("|");
  const imperialMeasurementPattern = new RegExp(`(?<![\\w.])(${numberPattern})\\s*(${imperialUnitPattern})(?![A-Za-z])`, "gi");
  const metricMeasurementPattern = new RegExp(`(?<![\\w.])(${numberPattern})\\s*(${metricUnitPattern})(?![A-Za-z])`, "gi");
  const dimensionSeparatorPattern = "(?:x|×|by)";
  const dimensionSplitPattern = /\s*(?:x|×|by)\s*/i;
  const imperialDimensionPattern = new RegExp(
    `(?<![\\w.])(${numberPattern}(?:\\s*${dimensionSeparatorPattern}\\s*${numberPattern}){1,5})\\s*(${imperialLengthUnitPattern})(?![A-Za-z])`,
    "gi"
  );
  const metricDimensionPattern = new RegExp(
    `(?<![\\w.])(${numberPattern}(?:\\s*${dimensionSeparatorPattern}\\s*${numberPattern}){1,5})\\s*(${metricLengthUnitPattern})(?![A-Za-z])`,
    "gi"
  );
  const compoundPattern = new RegExp(
    `(?<![\\w.])(${numberPattern})\\s*(?:feet|foot|ft\\.?|[\\u0027′’])\\s*(${numberPattern})\\s*(?:inch(?:es)?|in\\.?|[\\u0022″”])(?![A-Za-z])`,
    "gi"
  );
  const metricSuffixPattern = new RegExp(`^\\s*\\(\\s*${numberPattern}\\s*(?:${metricUnitPattern})\\s*\\)`, "i");
  const imperialSuffixPattern = new RegExp(`^\\s*\\(\\s*${numberPattern}\\s*(?:${imperialUnitPattern})\\s*\\)`, "i");

  function parseNumber(raw) {
    const compact = raw.trim().replace(/,/g, "");
    const unicode = compact.match(new RegExp(`^([+-]?)(\\d+(?:\\.\\d+)?)?\\s*([${unicodeFractionPattern}])$`));
    if (unicode) {
      const sign = unicode[1] === "-" ? -1 : 1;
      return sign * (Number(unicode[2] || 0) + unicodeFractions[unicode[3]]);
    }

    const mixed = compact.match(/^([+-]?\d+(?:\.\d+)?)\s*(?:-|\s)\s*(\d+)\s*\/\s*(\d+)$/);
    if (mixed) {
      const whole = Number(mixed[1]);
      const fraction = Number(mixed[2]) / Number(mixed[3]);
      return whole < 0 ? whole - fraction : whole + fraction;
    }

    const fraction = compact.match(/^([+-]?)(\d+)\s*\/\s*(\d+)$/);
    if (fraction) {
      const denominator = Number(fraction[3]);
      if (denominator === 0) return Number.NaN;
      return (fraction[1] === "-" ? -1 : 1) * (Number(fraction[2]) / denominator);
    }

    return Number(compact);
  }

  function findUnit(rawUnit, definitions) {
    return definitions.find(({ pattern }) => new RegExp(`^(?:${pattern})$`, "i").test(rawUnit));
  }

  function formatNumber(value, precision = "smart") {
    if (!Number.isFinite(value)) return null;
    const requested = precision === "smart" ? null : Number(precision);
    let maximumFractionDigits = Number.isInteger(requested) ? requested : 2;
    if (precision === "smart" && Math.abs(value) < 1 && value !== 0) maximumFractionDigits = 3;
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits,
      minimumFractionDigits: 0
    }).format(value);
  }

  function overlaps(candidate, accepted) {
    return accepted.some((item) => candidate.start < item.end && candidate.end > item.start);
  }

  function hasExistingTarget(text, end, direction) {
    return (direction === "imperial" ? imperialSuffixPattern : metricSuffixPattern).test(text.slice(end));
  }

  function makeFormattedResult(text, match, converted, unitId, category, settings) {
    if (hasExistingTarget(text, match.index + match[0].length, settings.direction)) return null;
    return {
      start: match.index,
      end: match.index + match[0].length,
      original: match[0],
      converted,
      annotation: ` (${converted})`,
      unitId,
      category
    };
  }

  function makeResult(text, match, value, symbol, unitId, category, settings) {
    const formatted = formatNumber(value, settings.precision);
    if (formatted === null) return null;
    return makeFormattedResult(text, match, `${formatted} ${symbol}`, unitId, category, settings);
  }

  function findConversions(text, options = {}) {
    if (!text || !/\d/.test(text)) return [];
    const settings = {
      direction: options.direction === "imperial" ? "imperial" : "metric",
      precision: options.precision || "smart",
      standard: options.standard === "uk" ? "uk" : "us"
    };
    const results = [];

    const dimensionDefinitions = settings.direction === "imperial" ? metricLengthMatchingUnits : imperialLengthMatchingUnits;
    const dimensionPattern = settings.direction === "imperial" ? metricDimensionPattern : imperialDimensionPattern;
    dimensionPattern.lastIndex = 0;
    for (const match of text.matchAll(dimensionPattern)) {
      const definition = findUnit(match[2], dimensionDefinitions);
      const values = match[1].split(dimensionSplitPattern).map(parseNumber);
      if (!definition || values.some((value) => !Number.isFinite(value))) continue;
      const formattedValues = values.map((value) => formatNumber(definition.convert(value, settings, match[0]), settings.precision));
      if (formattedValues.some((value) => value === null)) continue;
      const symbol = typeof definition.symbol === "function" ? definition.symbol(settings) : definition.symbol;
      const result = makeFormattedResult(
        text,
        match,
        `${formattedValues.join(" × ")} ${symbol}`,
        `${definition.id}-dimensions`,
        "length",
        settings
      );
      if (result) results.push(result);
    }

    if (settings.direction === "metric") {
      compoundPattern.lastIndex = 0;
      for (const match of text.matchAll(compoundPattern)) {
        const feet = parseNumber(match[1]);
        const inches = parseNumber(match[2]);
        const result = makeResult(text, match, (feet * 12 + inches) * 2.54, "cm", "foot-inch", "length", settings);
        if (result) results.push(result);
      }
    }

    const definitions = settings.direction === "imperial" ? metricMatchingUnits : imperialMatchingUnits;
    const measurementPattern = settings.direction === "imperial" ? metricMeasurementPattern : imperialMeasurementPattern;
    measurementPattern.lastIndex = 0;
    for (const match of text.matchAll(measurementPattern)) {
      const definition = findUnit(match[2], definitions);
      const numericValue = parseNumber(match[1]);
      if (!definition || !Number.isFinite(numericValue)) continue;
      const symbol = typeof definition.symbol === "function" ? definition.symbol(settings) : definition.symbol;
      const candidate = makeResult(
        text,
        match,
        definition.convert(numericValue, settings, match[0]),
        symbol,
        definition.id,
        definition.category,
        settings
      );
      if (candidate && !overlaps(candidate, results)) results.push(candidate);
    }

    return results.sort((a, b) => a.start - b.start);
  }

  function annotateText(text, options = {}) {
    const conversions = findConversions(text, options);
    if (conversions.length === 0) return text;
    let output = "";
    let cursor = 0;
    for (const conversion of conversions) {
      output += text.slice(cursor, conversion.end) + conversion.annotation;
      cursor = conversion.end;
    }
    return output + text.slice(cursor);
  }

  global.MeasuremateConverter = {
    annotateText,
    findConversions,
    formatNumber,
    parseNumber,
    units: [...imperialUnits, ...metricUnits]
  };
})(globalThis);
