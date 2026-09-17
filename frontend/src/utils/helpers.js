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
