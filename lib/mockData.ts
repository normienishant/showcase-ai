// lib/mockData.ts — ALL Products from ALL PDFs (125+ products)

export const MOCK_COMPANY = {
  id: '1',
  name: 'Best Power Equipments India Pvt. Ltd.',
  slug: 'bpe',
  logoUrl: 'https://placehold.co/200x80/1a56db/white?text=BPE',
  primaryColor: '#1a56db',
  secondaryColor: '#1e40af',
  whatsappNumber: '+919311995859',
  websiteUrl: 'https://www.bpe.com',
  template: 'corporate'
};

export const MOCK_CATEGORIES = [
  // Single Phase UPS
  { id: 'c0', name: 'Single Phase UPS', parentId: null },
  { id: 'c0a', name: 'BP Series', parentId: 'c0' },
  { id: 'c0b', name: 'MF Series', parentId: 'c0' },
  { id: 'c0c', name: 'PB Series', parentId: 'c0' },
  { id: 'c0d', name: 'MFP/MFPX Series', parentId: 'c0' },
  { id: 'c0e', name: 'MFII/MFXII Series', parentId: 'c0' },
  { id: 'c0f', name: 'MPP Series', parentId: 'c0' },
  { id: 'c0g', name: 'MP Series', parentId: 'c0' },
  // 3 Phase UPS
  { id: 'c1', name: '3 Phase UPS', parentId: null },
  { id: 'c1a', name: 'EPX+ Series', parentId: 'c1' },
  { id: 'c1b', name: 'GTP Series', parentId: 'c1' },
  { id: 'c1c', name: 'UGX Series', parentId: 'c1' },
  { id: 'c1d', name: 'GTP-InfiniteX Series', parentId: 'c1' },
  { id: 'c1e', name: 'HPX Series', parentId: 'c1' },
  { id: 'c1f', name: 'GTX Series', parentId: 'c1' },
  // Modular UPS
  { id: 'c2', name: 'Modular UPS', parentId: null },
  { id: 'c2a', name: 'PS12 Series', parentId: 'c2' },
  { id: 'c2b', name: 'PS15 Series', parentId: 'c2' },
  { id: 'c2c', name: 'PS32 Series', parentId: 'c2' },
  { id: 'c2d', name: 'PS50 Series', parentId: 'c2' },
  // BESS
  { id: 'c3', name: 'BESS Solutions', parentId: null },
  { id: 'c3a', name: 'NRGX Series', parentId: 'c3' },
  { id: 'c3b', name: 'ESS15 Series', parentId: 'c3' },
  { id: 'c3c', name: 'ESS50 Series', parentId: 'c3' },
  { id: 'c3d', name: 'Containerized Solutions', parentId: 'c3' },
  // Data Center
  { id: 'c4', name: 'Data Center Solutions', parentId: null },
];

// Helper to generate product list
function generateProducts() {
  const products: any[] = [];
  let idCounter = 1;

  const addProduct = (name: string, categoryId: string, description: string, specs: Record<string, string>, badge?: string) => {
    products.push({
      id: `p${idCounter++}`,
      name,
      categoryId,
      description,
      images: [`https://placehold.co/600x400/1a56db/white?text=${encodeURIComponent(name)}`],
      specs,
      badge,
      createdAt: new Date(Date.now() - idCounter * 86400000).toISOString(),
    });
  };

  // ============ SINGLE PHASE UPS ============

  // --- BP Series ---
  addProduct('BP650V', 'c0a', '650VA Line Interactive UPS.', {
    'Capacity': '650VA',
    'Battery': '12V x 1 No',
    'Charging Current': '1A',
    'Type': 'Line Interactive',
  });
  addProduct('BP1000', 'c0a', '1kVA Line Interactive UPS.', {
    'Capacity': '1000VA',
    'Battery': '7Ah, 12V x 2 Nos (Series)',
    'Charging Current': '1A',
    'Type': 'Line Interactive',
  });
  addProduct('BP1200', 'c0a', '1.2kVA Line Interactive UPS.', {
    'Capacity': '1200VA',
    'Battery': '9Ah, 12V x 2 Nos (Parallel)',
    'Charging Current': '1A',
    'Type': 'Line Interactive',
  });
  addProduct('BP1500', 'c0a', '1.5kVA Line Interactive UPS.', {
    'Capacity': '1500VA',
    'Battery': '9Ah, 12V x 2 Nos (Series)',
    'Charging Current': '1A',
    'Type': 'Line Interactive',
  });

  // --- MF Series ---
  addProduct('MF2200', 'c0b', '2.2kVA Online UPS.', {
    'Capacity': '2200VA',
    'Battery': '9Ah, 12V x 4 Nos (Series)',
    'Charging Current': '5A',
    'Type': 'Online',
  });
  const mfModels = [
    ['MF1101B', '1kVA', '37Ah, 12V x 3 Nos'],
    ['MF1102B', '2kVA', '67Ah, 12V x 6 Nos'],
    ['MF1103B', '3kVA', '87Ah, 12V x 8 Nos'],
    ['MF1101L3', '1kVA', '12V x 3 Nos'],
    ['MF1102L4', '2kVA', '12V x 4 Nos'],
    ['MF1103L6', '3kVA', '12V x 6 Nos'],
    ['MF1103L8', '3kVA', '12V x 8 Nos'],
  ];
  mfModels.forEach(([name, capacity, battery]) => {
    addProduct(name, 'c0b', `${capacity} Online UPS.`, {
      'Capacity': capacity,
      'Battery': battery,
      'Charging Current': '5A',
      'Type': 'Online',
    });
  });

  // --- PB Series ---
  const pbModels = [
    ['PB1105L10', '1kVA', '12V x 10 Nos'],
    ['PB1105L16', '1kVA', '12V x 16 Nos'],
    ['PB1105B16', '1kVA', '12V x 16 Nos'],
    ['PB1106L16', '1.5kVA', '12V x 16 Nos'],
    ['PB1106B16', '1.5kVA', '12V x 16 Nos'],
    ['PB1108L16', '2kVA', '12V x 16 Nos'],
    ['PB1109L16', '2.5kVA', '12V x 16 Nos'],
    ['PB1115L16', '3kVA', '12V x 16 Nos'],
  ];
  pbModels.forEach(([name, capacity, battery]) => {
    addProduct(name, 'c0c', `${capacity} Online UPS.`, {
      'Capacity': capacity,
      'Battery': battery,
      'Charging Current': '10A',
      'Type': 'Online',
    });
  });

  // --- MFP/MFPX Series ---
  addProduct('MFP1105L16', 'c0d', '1kVA Online UPS.', {
    'Capacity': '1kVA',
    'Battery': '12V x 16/18/20 Nos',
    'Charging Current': '6A',
    'Type': 'Online',
  });
  addProduct('MFP1106L16', 'c0d', '1.5kVA Online UPS.', {
    'Capacity': '1.5kVA',
    'Battery': '12V x 16 Nos',
    'Charging Current': '6A',
    'Type': 'Online',
  });
  addProduct('MFPX1105L16', 'c0d', '1kVA Online UPS (Extended).', {
    'Capacity': '1kVA',
    'Battery': '12V x 16/18/20 Nos',
    'Charging Current': '6A',
    'Type': 'Online',
  });
  addProduct('MFPX1106L16', 'c0d', '1.5kVA Online UPS (Extended).', {
    'Capacity': '1.5kVA',
    'Battery': '12V x 16 Nos',
    'Charging Current': '6A',
    'Type': 'Online',
  });

  // --- MFII/MFXII Series ---
  addProduct('MFII1110L16', 'c0e', '10kVA Online UPS.', {
    'Capacity': '10kVA',
    'Battery': '12V x 16/18/20 Nos',
    'Type': 'Online',
  });
  addProduct('MFXII1110L16', 'c0e', '10kVA Online UPS (Extended).', {
    'Capacity': '10kVA',
    'Battery': '12V x 16/18/20 Nos',
    'Type': 'Online',
  });

  // --- MPP Series ---
  addProduct('MPP1101B', 'c0f', '1kVA Online UPS.', {
    'Capacity': '1kVA',
    'Battery': '27Ah, 12V x 2 Nos',
    'Charging Current': '1A',
    'Type': 'Online',
  });
  addProduct('MPP1102B', 'c0f', '2kVA Online UPS.', {
    'Capacity': '2kVA',
    'Battery': '67Ah, 12V x 6 Nos',
    'Charging Current': '1A',
    'Type': 'Online',
  });
  addProduct('MPP1103B', 'c0f', '3kVA Online UPS.', {
    'Capacity': '3kVA',
    'Battery': '12V x 3 Nos',
    'Charging Current': '1A',
    'Type': 'Online',
  });
  addProduct('MPP1101L3', 'c0f', '1kVA Online UPS.', {
    'Capacity': '1kVA',
    'Battery': '12V x 3 Nos',
    'Charging Current': '1A',
    'Type': 'Online',
  });
  addProduct('MPP1102L6', 'c0f', '2kVA Online UPS.', {
    'Capacity': '2kVA',
    'Battery': '12V x 6 Nos',
    'Charging Current': '1A',
    'Type': 'Online',
  });

  // --- MP Series ---
  addProduct('MP1106L8', 'c0g', '1.5kVA Online UPS.', {
    'Capacity': '1.5kVA',
    'Battery': '7Ah, 12V x 16 Nos',
    'Charging Current': '5A',
    'Type': 'Online',
  });
  addProduct('MP1110L16', 'c0g', '10kVA Online UPS.', {
    'Capacity': '10kVA',
    'Battery': '12V x 16 Nos',
    'Charging Current': '5A',
    'Type': 'Online',
  });
  addProduct('MP1106L16', 'c0g', '1.5kVA Online UPS.', {
    'Capacity': '1.5kVA',
    'Battery': '12V x 16 Nos',
    'Charging Current': '5A',
    'Type': 'Online',
  });
  addProduct('MP1110L16+BP', 'c0g', '10kVA Online UPS with Battery Pack.', {
    'Capacity': '10kVA',
    'Battery': '9Ah, 12V x 20 Nos',
    'Charging Current': '5A',
    'Type': 'Online',
  });

  // ============ 3 PHASE UPS ============

  // --- EPX+ Series ---
  const epxSpecs = (kva: number) => ({
    'Capacity': `${kva}kVA/${kva}kW`,
    'Input Voltage': '380/400/415 VAC',
    'Voltage Range': '320~480 VAC',
    'Efficiency': 'Up to 96.8%',
    'Parallel Capability': kva >= 100 ? '6 Units' : '4 Units',
    'Dimension': kva <= 60 ? '320x1000x800 mm' : kva <= 200 ? '430x1000x1200 mm' : '600x1100x1475 mm',
    'Weight': kva <= 60 ? '94 kg' : kva <= 200 ? '169 kg' : '360 kg',
  });
  [20, 30, 40, 60, 80, 100, 120, 200, 400].forEach(kva => {
    addProduct(`EPX+ ${kva}kVA`, 'c1a', `${kva}kVA UPS with Inbuilt Galvanic Isolation Transformer.`, epxSpecs(kva));
  });

  // --- GTP Series ---
  const gtpSpecs = (kva: number) => ({
    'Capacity': `${kva}kVA/${kva}kW`,
    'Input Voltage': '380/400/415 VAC',
    'Voltage Range': '320~480 VAC',
    'Efficiency': 'Up to 96.5%',
    'Input PF': '≥0.99',
    'Harmonic Distortion': '≤5%',
    'Dimension': kva <= 120 ? '430x1000x1200 mm' : '600x1100x1475 mm',
    'Weight': kva <= 120 ? '169 kg' : '360 kg',
  });
  [10, 20, 30, 40, 60, 80, 100, 120, 160, 200, 250].forEach(kva => {
    addProduct(`GTP ${kva}kVA`, 'c1b', `${kva}kVA UPS with DSP Technology & 3-Level IGBT.`, gtpSpecs(kva));
  });

  // --- UGX Series ---
  const ugxSpecs = (kva: number) => ({
    'Capacity': `${kva}kVA/${kva}kW`,
    'Input Voltage': '380/400/415 VAC',
    'Voltage Range': '320~480 VAC',
    'Efficiency': 'Up to 96.5%',
    'Input PF': '≥0.99',
    'Display': '7 inch Colour Touch Screen',
    'Charging Current': kva <= 60 ? '20A' : '30A',
    'Weight': kva <= 120 ? '169 kg' : '360 kg',
  });
  [10, 20, 30, 40, 60, 80, 100, 120, 160, 200, 250].forEach(kva => {
    addProduct(`UGX ${kva}kVA`, 'c1c', `${kva}kVA UPS with Wide Input Voltage Range.`, ugxSpecs(kva));
  });

  // --- GTP-InfiniteX Series ---
  const gtpxSpecs = (kva: number) => ({
    'Capacity': `${kva}kVA/${kva}kW`,
    'Efficiency (AC)': 'Up to 96.8%',
    'Efficiency (ECO)': 'Up to 99.0%',
    'Parallel Capability': '4 Units',
    'Input PF': '≥0.99',
    'Harmonic Distortion': '≤5%',
    'Dimension': kva <= 120 ? '430x1000x1200 mm' : '600x1100x1475 mm',
    'Weight': kva <= 120 ? '169 kg' : kva <= 250 ? '360 kg' : '396 kg',
  });
  [60, 80, 100, 120, 160, 200, 250, 300].forEach(kva => {
    addProduct(`GTPIX ${kva}kVA`, 'c1d', `${kva}kVA UPS. Scalable up to 9.6MW.`, gtpxSpecs(kva));
  });

  // --- HPX Series ---
  const hpxSpecs = (kva: number) => ({
    'Capacity': `${kva}kVA/${kva}kW`,
    'Input Voltage': '380/400/415 VAC',
    'Voltage Range': '320~480 VAC',
    'Efficiency': 'Up to 96.0%',
    'Rectifier': '12-Pulse',
    'Protection': 'IP55 Rated',
    'Dimension': '800x1200x1800 mm',
    'Weight': '500+ kg',
  });
  [200, 250, 300, 400, 500, 600].forEach(kva => {
    addProduct(`HPX ${kva}kVA`, 'c1e', `${kva}kVA Industrial UPS with 12-Pulse Rectifier.`, hpxSpecs(kva));
  });

  // --- GTX Series ---
  const gtxSpecs = (kva: number) => ({
    'Capacity': `${kva}kVA`,
    'Battery': '12V x 48/50/52 Nos',
    'Charging Current': kva <= 200 ? '30A' : '40A',
    'Type': '3 Phase UPS',
  });
  [120, 160, 200, 250, 300].forEach(kva => {
    addProduct(`GTX ${kva}kVA`, 'c1f', `${kva}kVA 3 Phase UPS.`, gtxSpecs(kva));
  });

  // ============ MODULAR UPS ============

  // --- PS12 Series ---
  const ps12Specs = (kva: number) => ({
    'Module Rating': `${kva}kVA`,
    'Efficiency (EHS)': '≥98.6%',
    'Battery Config': '12V x 32-40 Nos',
    'Charging Current': '8A / Module',
    'Hot Swappable': 'Yes',
  });
  [4, 6, 10, 12].forEach(kva => {
    addProduct(`PS12 ${kva}kVA Module`, 'c2a', `${kva}kVA Modular UPS. Hot Swappable.`, ps12Specs(kva));
  });

  // --- PS15 Series ---
  const ps15Specs = (kva: number) => ({
    'Module Rating': `${kva}kVA`,
    'Efficiency (EHS)': '≥98.6%',
    'Battery Config': '12V x 16-20 Nos',
    'Charging Current': '16A / Module',
    'Hot Swappable': 'Yes',
  });
  [4, 6, 8, 10, 12, 15].forEach(kva => {
    addProduct(`PS15 ${kva}kVA Module`, 'c2b', `${kva}kVA Modular UPS. High Efficiency.`, ps15Specs(kva));
  });

  // --- PS32 Series ---
  const ps32Specs = (kva: number) => ({
    'Module Rating': `${kva}kVA`,
    'Efficiency (EHS)': '≥98.6%',
    'Battery Config': '12V x 30-50 Nos',
    'Charging Current': '18A / Module',
    'Hot Swappable': 'Yes',
  });
  [16, 25, 30, 32].forEach(kva => {
    addProduct(`PS32 ${kva}kVA Module`, 'c2c', `${kva}kVA Modular UPS. High Density.`, ps32Specs(kva));
  });

  // --- PS50 Series ---
  addProduct('PS50 50kVA Module', 'c2d', '50kVA Modular UPS. High Power.', {
    'Module Rating': '50kVA',
    'Efficiency (EHS)': '≥98.6%',
    'Charging Current': '20A / Module',
    'Hot Swappable': 'Yes',
  });

  // ============ BESS SOLUTIONS ============

  // --- NRGX Series ---
  const nrgxSpecs = (kva: number) => ({
    'Capacity': `${kva}kVA`,
    'Design Life': '10 Years',
    'Battery Type': 'Li-ion',
    'Charging Time': 'Up to 2 hours',
    'Solar Compatible': 'Yes',
    'Mounting': 'Plug & Play',
    'Monitoring': 'SNMP/IoT/WiFi/Bluetooth',
  });
  [1, 2, 3, 5, 7.5, 10].forEach(kva => {
    addProduct(`NRGX ${kva}kVA (Li-ion)`, 'c3a', `${kva}kVA BESS with Integrated Li-ion Battery.`, nrgxSpecs(kva));
  });

  // --- ESS15 Series ---
  const ess15Specs = (kva: number) => ({
    'Capacity': `${kva}kVA`,
    'Design Life': '10 Years',
    'Battery Type': 'Li-ion',
    'Charging Time': 'Up to 2 hours',
    'Display': '7-inch Touch Screen',
    'Solar Compatible': 'Yes',
    'Mode': 'Peak shaving / Load shifting / On-grid / Off-grid',
  });
  [15, 30, 45, 60].forEach(kva => {
    addProduct(`ESS15 ${kva}kVA (3-Phase)`, 'c3b', `${kva}kVA Three Phase BESS.`, ess15Specs(kva));
  });

  // --- ESS50 Series ---
  const ess50Specs = (kva: number) => ({
    'Capacity': `${kva}kVA`,
    'Design Life': '10 Years',
    'Battery Type': 'Li-ion',
    'Charging Time': 'Up to 2 hours',
    'Display': '7-inch Touch Screen',
    'Solar Compatible': 'Yes',
    'Mode': 'Peak shaving / Load shifting / On-grid / Off-grid',
  });
  [50, 100, 150, 200].forEach(kva => {
    addProduct(`ESS50 ${kva}kVA (3-Phase)`, 'c3c', `${kva}kVA Three Phase BESS.`, ess50Specs(kva));
  });

  // --- Containerized BESS ---
  const containerSpecs = (power: string) => ({
    'Power Range': power,
    'Protection': 'IP54',
    'Application': 'Outdoor',
    'Features': 'Thermal Management, Fire Safety',
    'Mounting': 'Containerized',
  });
  ['125kW', '250kW', '500kW', '1MW', '2MW', '5MW', '8MW'].forEach(power => {
    addProduct(`Containerized BESS ${power}`, 'c3d', `${power} Outdoor BESS. IP54 Rated.`, containerSpecs(power));
  });

  // ============ DATA CENTER ============

  addProduct('IDU - Integrated Data Unit', 'c4', 'All-in-One Rack Cooling System with Integrated UPS, Battery, PDU.', {
    'Type': 'Smart Rack Solution',
    'Cooling': 'Inverter Technology',
    'Configuration': 'Plug and Play',
    'Noise': 'Sealed Cabinet for Noise Reduction',
  });

  addProduct('Smart Rack Solutions', 'c4', 'Intelligent Rack with Integrated Cooling and Monitoring.', {
    'Cooling': 'Energy Efficient',
    'Monitoring': 'Real-time',
    'Deployment': 'Easy & Swift',
  });

  return products;
}

export const MOCK_PRODUCTS = generateProducts();

export default { MOCK_COMPANY, MOCK_CATEGORIES, MOCK_PRODUCTS };