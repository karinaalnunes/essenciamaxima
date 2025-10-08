interface DeviceInfo {
  browser: string;
  os: string;
  device: string;
  language: string;
  screenResolution: string;
}

interface LocationInfo {
  city: string | null;
  state: string | null;
  country: string | null;
  timezone: string | null;
}

interface MarketingInfo {
  gclid: string | null;
  fbclid: string | null;
  landingPage: string;
  referrer: string;
}

// Detectar browser e OS via User Agent
export const getDeviceInfo = (): DeviceInfo => {
  const ua = navigator.userAgent;
  
  // Detectar browser
  let browser = 'Unknown';
  if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edg') === -1) browser = 'Chrome';
  else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) browser = 'Safari';
  else if (ua.indexOf('Firefox') > -1) browser = 'Firefox';
  else if (ua.indexOf('Edg') > -1) browser = 'Edge';
  else if (ua.indexOf('Opera') > -1 || ua.indexOf('OPR') > -1) browser = 'Opera';
  
  // Detectar OS
  let os = 'Unknown';
  if (ua.indexOf('Windows') > -1) os = 'Windows';
  else if (ua.indexOf('Mac') > -1) os = 'MacOS';
  else if (ua.indexOf('Linux') > -1) os = 'Linux';
  else if (ua.indexOf('Android') > -1) os = 'Android';
  else if (ua.indexOf('iPhone') > -1 || ua.indexOf('iPad') > -1) os = 'iOS';
  
  // Detectar device
  const device = /Mobile|Android|iPhone|iPad/.test(ua) ? 'Mobile' : 'Desktop';
  
  return {
    browser,
    os,
    device,
    language: navigator.language || 'Unknown',
    screenResolution: `${screen.width}x${screen.height}`,
  };
};

// Buscar localização via IP (API gratuita - não salva o IP)
export const getLocationInfo = async (): Promise<LocationInfo> => {
  try {
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    
    return {
      city: data.city || null,
      state: data.region || null,
      country: data.country_name || null,
      timezone: data.timezone || null,
    };
  } catch (error) {
    console.error('Erro ao capturar localização:', error);
    return {
      city: null,
      state: null,
      country: null,
      timezone: null,
    };
  }
};

// Capturar informações de marketing
export const getMarketingInfo = (): MarketingInfo => {
  const urlParams = new URLSearchParams(window.location.search);
  
  return {
    gclid: urlParams.get('gclid'),
    fbclid: urlParams.get('fbclid'),
    landingPage: window.location.href,
    referrer: document.referrer || 'Direct',
  };
};

// Timer para medir tempo na página
let pageLoadTime = Date.now();

export const getTimeOnPage = (): number => {
  return Math.floor((Date.now() - pageLoadTime) / 1000); // em segundos
};
