export interface ProductItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  price: number;
  stock: number;
  leadTime: string;
  specs: {
    resolutionOrFocal: string;
    toleranceOrAccuracy: string;
    interfaceOrMount: string;
    operatingTemp: string;
    powerOrPayload: string;
  };
  summary: string;
  compatibilities: string[];
}

export const INITIAL_CATALOG: ProductItem[] = [
  {
    id: "prod-1",
    sku: "SPEC-8820-X",
    name: "Chronos Quartz-Locked Precision Goniometer",
    category: "Angular Optics & Metrology",
    price: 1840,
    stock: 14,
    leadTime: "Same-day dispatch (orders before 14:00 UTC)",
    specs: {
      resolutionOrFocal: "0.001 mrad",
      toleranceOrAccuracy: "±0.002° across 360°",
      interfaceOrMount: "RS-485 / Optical Encoders",
      operatingTemp: "-20°C to +65°C",
      powerOrPayload: "12.5 kg payload / 24V DC 1.2A",
    },
    summary:
      "Dual-axis motorized goniometric cradle engineered for laser alignment, synchrotron beamlines, and high-vacuum metrology.",
    compatibilities: ["Mount Base MB-300", "Stage ST-440", "Controller CTRL-9"],
  },
  {
    id: "prod-2",
    sku: "OPT-400",
    name: "Apochromatic Telecentric Collimator 400mm",
    category: "Optical Assemblies",
    price: 2190,
    stock: 8,
    leadTime: "2 business days",
    specs: {
      resolutionOrFocal: "400mm ±0.05%",
      toleranceOrAccuracy: "< λ/10 @ 632.8nm wavefront",
      interfaceOrMount: "Standard C-mount / 48mm Bayonet",
      operatingTemp: "-10°C to +50°C",
      powerOrPayload: "Aperture f/2.8 / 1.85 kg",
    },
    summary:
      "Zero-parallax telecentric beam expander with multi-layer broad-band anti-reflective coating covering 400nm to 1100nm.",
    compatibilities: ["Sensor Array SA-12", "C-Mount Camera Adapters"],
  },
  {
    id: "prod-3",
    sku: "OPT-450",
    name: "Super-Apochromatic Telecentric Collimator 450mm PRO",
    category: "Optical Assemblies",
    price: 2850,
    stock: 22,
    leadTime: "Same-day dispatch",
    specs: {
      resolutionOrFocal: "450mm ±0.02%",
      toleranceOrAccuracy: "< λ/14 @ 632.8nm wavefront",
      interfaceOrMount: "Universal C/F-mount & Metric Bayonet",
      operatingTemp: "-15°C to +60°C",
      powerOrPayload: "Aperture f/2.4 / 2.10 kg",
    },
    summary:
      "Enterprise-grade fluorite doublet collimator offering 38% higher optical transmission and zero chromatic dispersion.",
    compatibilities: ["Sensor Array SA-12", "Industrial GigE Vision Cameras"],
  },
  {
    id: "prod-4",
    sku: "SEN-104-B",
    name: "Differential Capacitive Displacement Transducer",
    category: "Sensors & Metrology",
    price: 940,
    stock: 31,
    leadTime: "1 business day",
    specs: {
      resolutionOrFocal: "Sub-nanometer (0.05 nm)",
      toleranceOrAccuracy: "0.05% Full Scale Linearity",
      interfaceOrMount: "Differential Analog 0-10V / BNC",
      operatingTemp: "0°C to +75°C",
      powerOrPayload: "±15V DC / 65mA",
    },
    summary:
      "Non-contact capacitive position probe calibrated for active spindle runout, thermal drift, and piezo stage calibration.",
    compatibilities: ["Demodulator DEM-02", "Oscilloscope Rack OR-4"],
  },
  {
    id: "prod-5",
    sku: "MOD-770",
    name: "Sub-Nanometer Piezo Actuator Module",
    category: "Nanopositioning",
    price: 3420,
    stock: 5,
    leadTime: "4 business days (restocking batch 2026-11-04)",
    specs: {
      resolutionOrFocal: "0.1 nm closed-loop",
      toleranceOrAccuracy: "100 µm stroke range ±0.1%",
      interfaceOrMount: "LEMO 4-pin Subsea Coaxial",
      operatingTemp: "-40°C to +80°C",
      powerOrPayload: "800 N blocking force / 3.2 µF",
    },
    summary:
      "Monolithic flexure-guided piezo stage with integrated capacitive strain sensors for high-bandwidth nanometer positioning.",
    compatibilities: ["Controller E-610", "Digital Servo Module DSM-8"],
  },
  {
    id: "prod-6",
    sku: "ISO-900",
    name: "Pneumatic Vibration Isolation Breadboard",
    category: "Damping Systems",
    price: 1280,
    stock: 0,
    leadTime: "12 business days (Backorder, batch in transit)",
    specs: {
      resolutionOrFocal: "6 Hz natural resonant freq",
      toleranceOrAccuracy: "Surface Flatness: ±0.1mm / m²",
      interfaceOrMount: "M6 tapped holes on 25mm grid",
      operatingTemp: "-20°C to +80°C",
      powerOrPayload: "Max Load: 180 kg / Unit Weight: 44 kg",
    },
    summary:
      "Ferromagnetic stainless steel honeycomb core optical breadboard with pneumatic internal damping isolators.",
    compatibilities: ["Standard metric lab tables", "Rigid Support Frames RF-1"],
  },
];

export interface CatalogAnswer {
  status: "verified" | "out_of_catalog" | "guardrail_rejected";
  headline: string;
  text: string;
  referencedSkus: string[];
  latencyMs: number;
  confidence: number;
  metrics?: {
    exactPrice?: string;
    stockLevel?: string;
    leadTime?: string;
  };
}

export function queryCatalogDeterministic(
  prompt: string,
  catalog: ProductItem[] = INITIAL_CATALOG
): CatalogAnswer {
  const cleanPrompt = prompt.trim().toLowerCase();

  // Guardrail check: reject prompt injections or completely unrelated non-catalog prompts
  const nonCatalogKeywords = [
    "poem",
    "story",
    "weather",
    "who are you",
    "recipe",
    "joke",
    "ignore previous instructions",
    "jailbreak",
    "system prompt",
  ];
  if (nonCatalogKeywords.some((kw) => cleanPrompt.includes(kw))) {
    return {
      status: "guardrail_rejected",
      headline: "GUARDRAIL INTERVENTION: OUT OF SCOPE",
      text: "Query was rejected by the Input Guardrail (Layer 01). INDEX only responds to product specifications, SKU lookups, verified prices, availability, and hardware comparisons strictly present within the indexed corporate catalog.",
      referencedSkus: [],
      latencyMs: 14,
      confidence: 0.0,
    };
  }

  // Comparison detection
  if (
    cleanPrompt.includes("compare") ||
    cleanPrompt.includes("versus") ||
    cleanPrompt.includes("vs") ||
    cleanPrompt.includes("difference")
  ) {
    if (
      (cleanPrompt.includes("400") && cleanPrompt.includes("450")) ||
      (cleanPrompt.includes("opt-400") && cleanPrompt.includes("opt-450"))
    ) {
      const p1 = catalog.find((p) => p.sku === "OPT-400") || INITIAL_CATALOG[1];
      const p2 = catalog.find((p) => p.sku === "OPT-450") || INITIAL_CATALOG[2];
      return {
        status: "verified",
        headline: `COMPARATIVE ANALYSIS: [${p1.sku}] vs [${p2.sku}]`,
        text: `Optical comparison between ${p1.name} and ${p2.name}:
• Optical Transmission & Wavefront: ${p1.sku} delivers < λ/10 @ 632.8nm wavefront with f/2.8 aperture; ${p2.sku} improves this to < λ/14 wavefront with a faster f/2.4 aperture and 38% higher fluorite transmission.
• Price Differential: ${p1.sku} is $${p1.price.toLocaleString()} vs ${p2.sku} at $${p2.price.toLocaleString()} (+$${(p2.price - p1.price).toLocaleString()} delta).
• Availability: ${p1.sku} has ${p1.stock} units remaining (${p1.leadTime}); ${p2.sku} has ${p2.stock} units in stock (${p2.leadTime}).
• Mounts: ${p1.sku} uses standard C-mount / 48mm bayonet; ${p2.sku} includes universal C/F-mount and metric bayonets.`,
        referencedSkus: [p1.sku, p2.sku],
        latencyMs: 19,
        confidence: 0.9998,
        metrics: {
          exactPrice: `$${p1.price} vs $${p2.price}`,
          stockLevel: `${p1.stock} vs ${p2.stock} units`,
          leadTime: `${p1.leadTime} / ${p2.leadTime}`,
        },
      };
    }
  }

  // SKU specific matching
  const matchedProduct = catalog.find((prod) => {
    const skuClean = prod.sku.toLowerCase();
    const nameClean = prod.name.toLowerCase();
    return (
      cleanPrompt.includes(skuClean) ||
      skuClean.split("-").some((part) => part.length >= 3 && cleanPrompt.includes(part)) ||
      nameClean.split(" ").some((w) => w.length >= 4 && cleanPrompt.includes(w))
    );
  });

  if (matchedProduct) {
    const priceFormatted = `$${matchedProduct.price.toLocaleString("en-US", {
      minimumFractionDigits: 2,
    })}`;

    // Price query
    if (cleanPrompt.includes("price") || cleanPrompt.includes("cost") || cleanPrompt.includes("how much")) {
      return {
        status: "verified",
        headline: `VERIFIED PRICE: ${matchedProduct.sku}`,
        text: `Official unit price for ${matchedProduct.name} [${matchedProduct.sku}] is ${priceFormatted}. Stock status: ${matchedProduct.stock > 0 ? `${matchedProduct.stock} units ready for dispatch` : "Currently on backorder"}. Lead time: ${matchedProduct.leadTime}.`,
        referencedSkus: [matchedProduct.sku],
        latencyMs: 16,
        confidence: 0.9999,
        metrics: {
          exactPrice: priceFormatted,
          stockLevel: `${matchedProduct.stock} units`,
          leadTime: matchedProduct.leadTime,
        },
      };
    }

    // Stock & lead time
    if (
      cleanPrompt.includes("lead time") ||
      cleanPrompt.includes("stock") ||
      cleanPrompt.includes("availability") ||
      cleanPrompt.includes("shipping")
    ) {
      return {
        status: "verified",
        headline: `INVENTORY DISPATCH STATUS: ${matchedProduct.sku}`,
        text: `Current real-time ERP inventory for [${matchedProduct.sku}]: ${matchedProduct.stock} units available at Central Distribution. Lead time: ${matchedProduct.leadTime}. Unit price: ${priceFormatted}.`,
        referencedSkus: [matchedProduct.sku],
        latencyMs: 15,
        confidence: 0.9997,
        metrics: {
          exactPrice: priceFormatted,
          stockLevel: `${matchedProduct.stock} units`,
          leadTime: matchedProduct.leadTime,
        },
      };
    }

    // Specs & general
    return {
      status: "verified",
      headline: `TECHNICAL SPECIFICATION: ${matchedProduct.sku}`,
      text: `${matchedProduct.name} [${matchedProduct.sku}] (${matchedProduct.category}):
• Resolution / Bandwidth: ${matchedProduct.specs.resolutionOrFocal}
• Accuracy & Tolerance: ${matchedProduct.specs.toleranceOrAccuracy}
• Interface / Port: ${matchedProduct.specs.interfaceOrMount}
• Operating Range: ${matchedProduct.specs.operatingTemp}
• Load / Power: ${matchedProduct.specs.powerOrPayload}
• Compatible Hardware: ${matchedProduct.compatibilities.join(", ")}
Unit Price: ${priceFormatted} | Real-Time Stock: ${matchedProduct.stock} units.`,
      referencedSkus: [matchedProduct.sku],
      latencyMs: 18,
      confidence: 0.9998,
      metrics: {
        exactPrice: priceFormatted,
        stockLevel: `${matchedProduct.stock} units`,
        leadTime: matchedProduct.leadTime,
      },
    };
  }

  // Fallback for general catalog questions
  if (
    cleanPrompt.includes("catalog") ||
    cleanPrompt.includes("products") ||
    cleanPrompt.includes("sku") ||
    cleanPrompt.includes("inventory") ||
    cleanPrompt.includes("optical") ||
    cleanPrompt.includes("goniometer")
  ) {
    const skuList = catalog.map((p) => p.sku).join(", ");
    return {
      status: "verified",
      headline: "ACTIVE CATALOG ENTITY INDEX",
      text: `Currently indexed hardware entities: ${skuList}. You may query exact tolerances, inventory levels, lead times, or ask for cross-SKU comparisons (e.g. "Compare OPT-400 vs OPT-450" or "Check lead time on SPEC-8820-X").`,
      referencedSkus: catalog.map((p) => p.sku),
      latencyMs: 17,
      confidence: 0.9995,
    };
  }

  // Strict Out of Catalog Fallback
  return {
    status: "out_of_catalog",
    headline: "CATALOG BOUNDARY: ITEM NOT FOUND",
    text: `I don't have that information in the active product catalog. INDEX enforces a strict zero-hallucination constraint: only verified SKUs and validated attributes from your PIM/ERP systems are ever transmitted to customers.`,
    referencedSkus: [],
    latencyMs: 18,
    confidence: 0.0,
  };
}
