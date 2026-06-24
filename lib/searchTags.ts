// lib/searchTags.ts — Intent-based product tagging (MVP AI Search)

export const INTENT_MAP: Record<string, string[]> = {
  // Office / IT / Computers
  'office': ['EPX+', 'GTP', 'UGX', 'PS', 'NRGX'],
  'computers': ['EPX+', 'PS', 'UGX', 'GTP'],
  'it': ['EPX+', 'PS', 'UGX', 'GTP'],
  'desktop': ['EPX+', 'PS', 'UGX'],
  'server': ['HPX', 'GTPIX', 'PS', 'EPX+'],
  'data center': ['HPX', 'GTPIX', 'PS', 'IDU', 'Smart Rack'],
  'datacenter': ['HPX', 'GTPIX', 'PS', 'IDU', 'Smart Rack'],
  'rack': ['Smart Rack', 'IDU', 'PS', 'EPX+'],
  'cloud': ['GTPIX', 'HPX', 'PS'],

  // Industrial / Heavy Duty
  'industrial': ['HPX', 'GTPIX', 'GTX', 'Containerized'],
  'heavy duty': ['HPX', 'GTPIX', 'GTX'],
  'factory': ['HPX', 'GTPIX', 'GTX', 'Containerized'],
  'plant': ['HPX', 'GTPIX', 'GTX', 'Containerized'],
  'oil': ['HPX', 'Containerized'],
  'gas': ['HPX', 'Containerized'],
  'marine': ['HPX', 'Containerized'],

  // Home / Small Business
  'home': ['BP', 'MF', 'PB', 'NRGX', 'MPP'],
  'small business': ['BP', 'MF', 'PB', 'MPP', 'NRGX'],
  'shop': ['BP', 'MF', 'PB', 'MPP'],
  'store': ['BP', 'MF', 'PB', 'MPP'],

  // Solar / Renewable
  'solar': ['NRGX', 'ESS15', 'ESS50', 'Containerized'],
  'renewable': ['NRGX', 'ESS15', 'ESS50'],
  'energy storage': ['NRGX', 'ESS15', 'ESS50', 'Containerized'],
  'bess': ['NRGX', 'ESS15', 'ESS50', 'Containerized'],
  'battery': ['NRGX', 'ESS15', 'ESS50', 'Containerized'],
  'battery backup': ['NRGX', 'ESS15', 'ESS50', 'BP', 'MF'],

  // UPS Specific
  'ups': ['EPX+', 'GTP', 'UGX', 'GTPIX', 'HPX', 'PS', 'BP', 'MF', 'PB'],
  'online ups': ['EPX+', 'GTP', 'UGX', 'GTPIX', 'HPX', 'PS', 'MF'],
  'line interactive': ['BP', 'PB', 'MPP'],
  'modular ups': ['PS', 'GTPIX'],
  '3 phase ups': ['EPX+', 'GTP', 'UGX', 'GTPIX', 'HPX', 'GTX'],
  'single phase ups': ['BP', 'MF', 'PB', 'MPP', 'NRGX'],

  // Load / Power
  'high power': ['HPX', 'GTPIX', 'Containerized', 'EPX+'],
  'low power': ['BP', 'MF', 'PB', 'NRGX'],
  'medium power': ['EPX+', 'GTP', 'UGX', 'PS'],

  // Specific kVA ranges (will be matched with specs)
  '1 kva': ['BP1000', 'MF1101', 'NRGX 1kVA'],
  '2 kva': ['BP1200', 'MF1102', 'NRGX 2kVA'],
  '3 kva': ['BP1500', 'MF1103', 'NRGX 3kVA'],
  '5 kva': ['NRGX 5kVA'],
  '10 kva': ['UGX 10kVA', 'GTP 10kVA', 'EPX+ 10kVA', 'PS12 10kVA'],
  '20 kva': ['EPX+ 20kVA', 'GTP 20kVA', 'UGX 20kVA'],
  '30 kva': ['EPX+ 30kVA', 'GTP 30kVA', 'UGX 30kVA'],
  '40 kva': ['EPX+ 40kVA', 'GTP 40kVA', 'UGX 40kVA'],
  '50 kva': ['ESS50 50kVA', 'PS50'],
  '60 kva': ['EPX+ 60kVA', 'GTP 60kVA', 'UGX 60kVA', 'ESS15 60kVA'],
  '80 kva': ['EPX+ 80kVA', 'GTP 80kVA', 'UGX 80kVA'],
  '100 kva': ['EPX+ 100kVA', 'GTP 100kVA', 'UGX 100kVA', 'GTPIX 100kVA'],
  '120 kva': ['EPX+ 120kVA', 'GTP 120kVA', 'UGX 120kVA', 'GTPIX 120kVA'],
  '200 kva': ['EPX+ 200kVA', 'GTP 200kVA', 'UGX 200kVA', 'GTPIX 200kVA', 'ESS50 200kVA'],
  '250 kva': ['GTP 250kVA', 'UGX 250kVA', 'GTPIX 250kVA'],
  '300 kva': ['GTPIX 300kVA'],
};

/**
 * Analyze search query and extract intent keywords
 */
export function extractIntent(query: string): string[] {
  const lower = query.toLowerCase();
  const matched: string[] = [];

  // Check each intent keyword
  for (const [keyword, series] of Object.entries(INTENT_MAP)) {
    // Match if keyword is a whole word or part of a phrase
    if (lower.includes(keyword) || lower.split(' ').some(word => word === keyword)) {
      matched.push(keyword);
    }
  }

  return matched;
}

/**
 * Get product series that match the intent
 */
export function getMatchingSeries(intents: string[]): Set<string> {
  const result = new Set<string>();
  for (const intent of intents) {
    const series = INTENT_MAP[intent] || [];
    for (const s of series) {
      result.add(s);
    }
  }
  return result;
}