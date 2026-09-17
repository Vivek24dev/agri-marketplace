/**
 * Generates direct WhatsApp chat URL with pre-filled message
 */
export function generateWhatsAppLink(phone, message) {
  if (!phone) return '#';
  // Remove non-digits
  let cleanNumber = phone.toString().replace(/\D/g, '');
  // Default to India country code 91 if 10 digits
  if (cleanNumber.length === 10) {
    cleanNumber = '91' + cleanNumber;
  }
  const encodedText = encodeURIComponent(message || 'Hello, I am contacting you regarding your listing on Agro-Market.');
  return `https://wa.me/${cleanNumber}?text=${encodedText}`;
}

export function formatCurrency(value) {
  const num = Number(value || 0);
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 2
  }).format(num);
}

export function formatKg(value) {
  const num = Number(value || 0);
  return `${num.toLocaleString('en-IN')} kg`;
}

export function formatDate(dateString) {
  if (!dateString) return 'Just now';
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'Recently';
  return date.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

export const KARNATAKA_DISTRICTS = [
  'Bengaluru',
  'Belagavi',
  'Kolar',
  'Tumkur',
  'Raichur',
  'Ballari',
  'Mysuru',
  'Mandya',
  'Hassan',
  'Kodagu',
  'Chikmagalur',
  'Shimoga',
  'Udupi',
  'Mangalore'
];

export const COMMON_CROPS = [
  'Tomato',
  'Potato',
  'Onion',
  'Carrot',
  'Cabbage',
  'Cucumber',
  'Brinjal',
  'Rice',
  'Wheat',
  'Chilli',
  'Garlic',
  'Pepper',
  'Sugarcane',
  'Coconut',
  'Banana',
  'Mango',
  'Orange',
  'Milk',
  'Eggs'
];

export const KARNATAKA_CITIES_AND_VILLAGES = [
  // Bengaluru Urban & Rural
  { name: 'Devanahalli Village Hub', district: 'Bengaluru', type: 'village', lat: 13.2483, lng: 77.7126 },
  { name: 'Hoskote Farmer Village', district: 'Bengaluru', type: 'village', lat: 13.0712, lng: 77.7981 },
  { name: 'Doddaballapura Town', district: 'Bengaluru', type: 'city', lat: 13.2924, lng: 77.5412 },
  { name: 'Nelamangala Taluk', district: 'Bengaluru', type: 'city', lat: 13.0973, lng: 77.3918 },
  { name: 'Yeshwantpur Mandi City', district: 'Bengaluru', type: 'city', lat: 13.0234, lng: 77.5456 },
  { name: 'K.R. Market Central', district: 'Bengaluru', type: 'city', lat: 12.9698, lng: 77.5684 },

  // Kolar
  { name: 'Kolar APMC City', district: 'Kolar', type: 'city', lat: 13.1362, lng: 78.1291 },
  { name: 'Malur Farm Village', district: 'Kolar', type: 'village', lat: 13.0048, lng: 77.9405 },
  { name: 'Srinivaspur Mango Cluster', district: 'Kolar', type: 'village', lat: 13.3364, lng: 78.2144 },
  { name: 'Bangarpet Taluk', district: 'Kolar', type: 'city', lat: 12.9818, lng: 78.1963 },
  { name: 'Mulbagal Tomato Village', district: 'Kolar', type: 'village', lat: 13.1633, lng: 78.3975 },

  // Mandya
  { name: 'Mandya City APMC', district: 'Mandya', type: 'city', lat: 12.5218, lng: 76.8951 },
  { name: 'Maddur Jaggery Village', district: 'Mandya', type: 'village', lat: 12.5844, lng: 77.0456 },
  { name: 'Srirangapatna Farm Belt', district: 'Mandya', type: 'village', lat: 12.4238, lng: 76.6947 },
  { name: 'Pandavapura Sugarcane Village', district: 'Mandya', type: 'village', lat: 12.5025, lng: 76.6711 },
  { name: 'Nagamangala Rural Village', district: 'Mandya', type: 'village', lat: 12.8206, lng: 76.7583 },

  // Mysuru
  { name: 'Mysuru City Bandipalya', district: 'Mysuru', type: 'city', lat: 12.2958, lng: 76.6394 },
  { name: 'Nanjangud Banana Village', district: 'Mysuru', type: 'village', lat: 12.1197, lng: 76.6806 },
  { name: 'Hunsur Tobacco & Grain Village', district: 'Mysuru', type: 'village', lat: 12.3086, lng: 76.2917 },
  { name: 'T. Narasipura River Basin', district: 'Mysuru', type: 'village', lat: 12.2128, lng: 76.9039 },

  // Tumkur
  { name: 'Tumkur City APMC', district: 'Tumkur', type: 'city', lat: 13.3409, lng: 77.1010 },
  { name: 'Tiptur Coconut Village', district: 'Tumkur', type: 'village', lat: 13.2625, lng: 76.4789 },
  { name: 'Kunigal Horse & Farm Basin', district: 'Tumkur', type: 'village', lat: 13.0239, lng: 77.0306 },
  { name: 'Sira Groundnut Village', district: 'Tumkur', type: 'village', lat: 13.7436, lng: 76.9083 },

  // Belagavi
  { name: 'Belagavi Central City', district: 'Belagavi', type: 'city', lat: 15.8497, lng: 74.4977 },
  { name: 'Gokak Falls Village Cluster', district: 'Belagavi', type: 'village', lat: 16.1689, lng: 74.8256 },
  { name: 'Chikodi Grape & Sugarcane Village', district: 'Belagavi', type: 'village', lat: 16.4317, lng: 74.5989 },
  { name: 'Bailhongal Cotton Village', district: 'Belagavi', type: 'village', lat: 15.8167, lng: 74.8667 },

  // Ballari & Raichur
  { name: 'Ballari City Yard', district: 'Ballari', type: 'city', lat: 15.1394, lng: 76.9214 },
  { name: 'Hospet Agro Gateway', district: 'Ballari', type: 'city', lat: 15.2689, lng: 76.3909 },
  { name: 'Raichur Cotton City', district: 'Raichur', type: 'city', lat: 16.2076, lng: 77.3463 },
  { name: 'Sindhanur Sona Masoori Village', district: 'Raichur', type: 'village', lat: 15.7667, lng: 76.7667 },

  // Haveri & Hassan
  { name: 'Byadgi Red Chilli Village', district: 'Haveri', type: 'village', lat: 14.6811, lng: 75.4917 },
  { name: 'Hassan City Potato Hub', district: 'Hassan', type: 'city', lat: 13.0033, lng: 76.1004 },
  { name: 'Arasikere Coconut Village', district: 'Hassan', type: 'village', lat: 13.3142, lng: 76.2575 },
  { name: 'Sakleshpur Coffee Village', district: 'Hassan', type: 'village', lat: 12.9737, lng: 75.7871 },

  // Chikkamagaluru & Shivamogga
  { name: 'Chikkamagaluru Coffee Town', district: 'Chikmagalur', type: 'city', lat: 13.3161, lng: 75.7720 },
  { name: 'Kadur Grain Basin Village', district: 'Chikmagalur', type: 'village', lat: 13.5542, lng: 76.0125 },
  { name: 'Shivamogga City APMC', district: 'Shimoga', type: 'city', lat: 13.9299, lng: 75.5681 },
  { name: 'Bhadravati Arecanut Village', district: 'Shimoga', type: 'village', lat: 13.8406, lng: 75.7028 }
];

