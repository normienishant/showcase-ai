// lib/mockData.ts

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
  { id: 'c1', name: '3 Phase UPS', parentId: null },
  { id: 'c1a', name: 'EPX+ Series', parentId: 'c1' },
  { id: 'c1b', name: 'GTP Series', parentId: 'c1' },
  { id: 'c1c', name: 'UGX Series', parentId: 'c1' },
  { id: 'c1d', name: 'GTP-InfiniteX Series', parentId: 'c1' },
  { id: 'c2', name: 'Modular UPS', parentId: null },
  { id: 'c2a', name: 'PS Series', parentId: 'c2' },
  { id: 'c3', name: 'BESS Solutions', parentId: null },
  { id: 'c3a', name: 'NRGX Series', parentId: 'c3' },
  { id: 'c3b', name: 'Containerized Solutions', parentId: 'c3' },
  { id: 'c4', name: 'Data Center Solutions', parentId: null },
];

export const MOCK_PRODUCTS = [
  { 
    id: 'p1', 
    name: 'EPX+ 3320L32', 
    description: '20kVA UPS with Inbuilt Galvanic Isolation Transformer.', 
    categoryId: 'c1a', 
    images: ['https://placehold.co/600x400/1a56db/white?text=EPX+20kVA'], 
    specs: { 'Capacity': '20kVA/20kW', 'Input Voltage': '380/400/415 VAC', 'Voltage Range': '320~480 VAC', 'Efficiency': 'Up to 96.8%', 'Charging Current': '18A (Adjustable)', 'Dimension': '320x1000x800 mm', 'Weight': '94 kg' } 
  },
  { 
    id: 'p2', 
    name: 'EPX+ 33100L32', 
    description: '100kVA UPS with 10 Inch Colour Touch Screen LCD.', 
    categoryId: 'c1a', 
    images: ['https://placehold.co/600x400/1a56db/white?text=EPX+100kVA'], 
    specs: { 'Capacity': '100kVA/100kW', 'Input Voltage': '380/400/415 VAC', 'Voltage Range': '320~480 VAC', 'Efficiency': 'Up to 96.8%', 'Parallel Capability': '6 Units', 'Dimension': '430x1000x1200 mm', 'Weight': '169 kg' } 
  },
  { 
    id: 'p3', 
    name: 'EPX+ 33200L32', 
    description: '200kVA UPS with Inbuilt Isolation Transformer.', 
    categoryId: 'c1a', 
    images: ['https://placehold.co/600x400/1a56db/white?text=EPX+200kVA'], 
    specs: { 'Capacity': '200kVA/200kW', 'Input Voltage': '380/400/415 VAC', 'Efficiency': 'Up to 96.8%', 'Parallel Capability': '6 Units', 'Dimension': '600x1100x1475 mm', 'Weight': '360 kg' } 
  },
  { 
    id: 'p4', 
    name: 'GTPIX 33100L32', 
    description: '100kVA UPS with DSP Technology & 3-Level IGBT.', 
    categoryId: 'c1d', 
    images: ['https://placehold.co/600x400/1a56db/white?text=GTPIX+100'], 
    specs: { 'Capacity': '100kVA/100kW', 'Efficiency (AC)': 'Up to 96.8%', 'Efficiency (ECO)': 'Up to 99.0%', 'Parallel Capability': '4 Units', 'Input PF': '≥0.99', 'Harmonic Distortion': '≤5%' } 
  },
  { 
    id: 'p5', 
    name: 'GTPIX 33200L32', 
    description: '200kVA UPS. Scalable up to 9.6MW.', 
    categoryId: 'c1d', 
    images: ['https://placehold.co/600x400/1a56db/white?text=GTPIX+200'], 
    specs: { 'Capacity': '200kVA/200kW', 'Efficiency': 'Up to 96.8%', 'Parallel Capability': '4 Units', 'Input PF': '≥0.99', 'Overload': '110% for 1 hour' } 
  },
  { 
    id: 'p6', 
    name: 'GTPIX 33300L32', 
    description: '300kVA UPS for Industrial Applications.', 
    categoryId: 'c1d', 
    images: ['https://placehold.co/600x400/1a56db/white?text=GTPIX+300'], 
    specs: { 'Capacity': '300kVA/300kW', 'Efficiency': 'Up to 96.8%', 'Parallel Capability': '4 Units', 'Battery Nominal': '±240V (12V x 40 Pcs)' } 
  },
  { 
    id: 'p7', 
    name: 'UGX 3310L32', 
    description: '10kVA UPS with Wide Input Voltage Range.', 
    categoryId: 'c1c', 
    images: ['https://placehold.co/600x400/1a56db/white?text=UGX+10'], 
    specs: { 'Capacity': '10kVA/10kW', 'Input PF': '≥0.99', 'Battery Config': '12V x 16/18/20 Nos', 'Display': '7 inch Colour Touch Screen' } 
  },
  { 
    id: 'p8', 
    name: 'UGX 3320L32', 
    description: '20kVA UPS with Phase Sequence Correction.', 
    categoryId: 'c1c', 
    images: ['https://placehold.co/600x400/1a56db/white?text=UGX+20'], 
    specs: { 'Capacity': '20kVA/20kW', 'Input PF': '≥0.99', 'Battery Config': '12V x 30/32/34...50 Nos', 'Charging Current': '30A' } 
  },
  { 
    id: 'p9', 
    name: 'PS12M3304 (4kVA Module)', 
    description: 'Hot Swappable Modular UPS. 4kVA per module.', 
    categoryId: 'c2a', 
    images: ['https://placehold.co/600x400/1a56db/white?text=PS12+4kVA'], 
    specs: { 'Module Rating': '4kVA', 'Battery Config': '12V x 32/34/36/38/40 Nos', 'Charging Current': '8A / Module', 'Efficiency (EHS)': '≥98.6%' } 
  },
  { 
    id: 'p10', 
    name: 'PS12M3310 (10kVA Module)', 
    description: 'Modular UPS with Common Battery Bank compatibility.', 
    categoryId: 'c2a', 
    images: ['https://placehold.co/600x400/1a56db/white?text=PS12+10kVA'], 
    specs: { 'Module Rating': '10kVA', 'Battery Config': '12V x 32-40 Nos', 'Charging Current': '8A / Module' } 
  },
  { 
    id: 'p11', 
    name: 'NRGX 5kVA (Li-ion)', 
    description: 'Smart BESS with Integrated Lithium-Ion Battery. 10-Year Design Life.', 
    categoryId: 'c3a', 
    images: ['https://placehold.co/600x400/1a56db/white?text=NRGX+5kVA'], 
    specs: { 'Capacity': '5kVA', 'Design Life': '10 Years', 'Charging Time': 'Up to 2 hours', 'Mounting': 'Plug & Play', 'Monitoring': 'SNMP/IoT/WiFi/Bluetooth' } 
  },
  { 
    id: 'p12', 
    name: 'NRGX 10kVA (Li-ion)', 
    description: 'Single Phase BESS. Solar input compatible.', 
    categoryId: 'c3a', 
    images: ['https://placehold.co/600x400/1a56db/white?text=NRGX+10kVA'], 
    specs: { 'Capacity': '10kVA', 'Design Life': '10 Years', 'Solar Compatible': 'Yes', 'Priority Selection': 'PV/Grid/Battery' } 
  },
  { 
    id: 'p13', 
    name: 'Containerized BESS 125kW', 
    description: 'Outdoor solution. IP54 Rated. For Micro-grid applications.', 
    categoryId: 'c3b', 
    images: ['https://placehold.co/600x400/1a56db/white?text=BESS+Container'], 
    specs: { 'Power Range': '125kW - 8MW', 'Protection': 'IP54', 'Application': 'Outdoor', 'Features': 'Thermal Management, Fire Safety' } 
  },
  { 
    id: 'p14', 
    name: 'IDU - Integrated Data Unit', 
    description: 'All-in-One Rack Cooling System with Integrated UPS, Battery, PDU.', 
    categoryId: 'c4', 
    images: ['https://placehold.co/600x400/1a56db/white?text=IDU+Rack'], 
    specs: { 'Type': 'Smart Rack Solution', 'Cooling': 'Inverter Technology', 'Configuration': 'Plug and Play', 'Noise': 'Sealed Cabinet for Noise Reduction' } 
  },
];