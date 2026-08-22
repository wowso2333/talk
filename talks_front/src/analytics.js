const measurementId = process.env.REACT_APP_GA_MEASUREMENT_ID;

let initialized = false;
let lastTrackedPath;

const hasValidMeasurementId = () => /^G-[A-Z0-9]+$/i.test(measurementId || '');

export function initializeAnalytics() {
  if (initialized || !hasValidMeasurementId() || typeof window === 'undefined') {
    return;
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    window.dataLayer.push(arguments);
  };

  window.gtag('js', new Date());
  window.gtag('config', measurementId, { send_page_view: false });

  const script = document.createElement('script');
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
  script.id = 'google-analytics';
  document.head.appendChild(script);

  initialized = true;
}

export function trackPageView(path) {
  initializeAnalytics();

  if (!initialized || path === lastTrackedPath) {
    return;
  }

  window.gtag('event', 'page_view', {
    page_path: path,
    page_location: `${window.location.origin}${path}`,
    page_title: document.title,
  });

  lastTrackedPath = path;
}
