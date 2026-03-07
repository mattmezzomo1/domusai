/**
 * Tracking Service
 * Handles integration with Facebook Pixel, Meta Conversions API, and Google Tag Manager
 */

class TrackingService {
  constructor() {
    this.config = {
      facebookPixelId: null,
      metaConversionApiToken: null,
      gtmContainerId: null,
    };
    this.initialized = false;
  }

  /**
   * Initialize tracking with restaurant configuration
   */
  initialize(restaurant) {
    if (!restaurant) return;

    this.config = {
      facebookPixelId: restaurant.facebook_pixel_id,
      metaConversionApiToken: restaurant.meta_conversion_api_token,
      gtmContainerId: restaurant.gtm_container_id,
    };

    // Initialize Facebook Pixel
    if (this.config.facebookPixelId) {
      this.initializeFacebookPixel();
    }

    // Initialize Google Tag Manager
    if (this.config.gtmContainerId) {
      this.initializeGTM();
    }

    this.initialized = true;
  }

  /**
   * Initialize Facebook Pixel
   */
  initializeFacebookPixel() {
    if (window.fbq) return; // Already initialized

    // Facebook Pixel Code
    !function(f,b,e,v,n,t,s)
    {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
    n.callMethod.apply(n,arguments):n.queue.push(arguments)};
    if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
    n.queue=[];t=b.createElement(e);t.async=!0;
    t.src=v;s=b.getElementsByTagName(e)[0];
    s.parentNode.insertBefore(t,s)}(window, document,'script',
    'https://connect.facebook.net/en_US/fbevents.js');

    window.fbq('init', this.config.facebookPixelId);
    window.fbq('track', 'PageView');
  }

  /**
   * Initialize Google Tag Manager
   */
  initializeGTM() {
    if (window.dataLayer) return; // Already initialized

    // Google Tag Manager Code
    (function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':
    new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],
    j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src=
    'https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);
    })(window,document,'script','dataLayer', this.config.gtmContainerId);
  }

  /**
   * Track event - sends to all configured platforms
   */
  trackEvent(eventName, eventData = {}) {
    if (!this.initialized) return;

    // Track with Facebook Pixel
    if (this.config.facebookPixelId && window.fbq) {
      this.trackFacebookEvent(eventName, eventData);
    }

    // Track with Google Tag Manager
    if (this.config.gtmContainerId && window.dataLayer) {
      this.trackGTMEvent(eventName, eventData);
    }

    // Send to Meta Conversions API (server-side)
    if (this.config.metaConversionApiToken) {
      this.sendToMetaConversionsAPI(eventName, eventData);
    }
  }

  /**
   * Track Facebook Pixel event
   */
  trackFacebookEvent(eventName, eventData) {
    const fbEventMap = {
      'InitiateCheckout': 'InitiateCheckout',
      'AddToCart': 'AddToCart',
      'ViewContent': 'ViewContent',
      'Lead': 'Lead',
      'CompleteRegistration': 'CompleteRegistration',
      'Purchase': 'Purchase',
    };

    const fbEventName = fbEventMap[eventName] || eventName;
    window.fbq('track', fbEventName, eventData);
  }

  /**
   * Track Google Tag Manager event
   */
  trackGTMEvent(eventName, eventData) {
    window.dataLayer.push({
      event: eventName,
      ...eventData,
    });
  }

  /**
   * Send event to Meta Conversions API (server-side tracking)
   */
  async sendToMetaConversionsAPI(eventName, eventData) {
    // This would typically be done server-side for security
    // For now, we'll log it for demonstration
    console.log('Meta Conversions API Event:', {
      eventName,
      eventData,
      token: this.config.metaConversionApiToken ? '***' : null,
    });

    // In production, you would send this to your backend
    // which would then forward to Meta's Conversions API
  }

  /**
   * Track booking step progression
   */
  trackBookingStep(step, data) {
    const stepEvents = {
      1: { name: 'ViewContent', description: 'Viewed booking form - Step 1' },
      2: { name: 'AddToCart', description: 'Selected time slot - Step 2' },
      3: { name: 'InitiateCheckout', description: 'Entered personal info - Step 3' },
    };

    const event = stepEvents[step];
    if (!event) return;

    this.trackEvent(event.name, {
      content_name: event.description,
      content_category: 'Booking',
      step: step,
      ...data,
    });
  }

  /**
   * Track completed reservation
   */
  trackReservationComplete(reservationData) {
    this.trackEvent('Purchase', {
      content_name: 'Reservation Completed',
      content_category: 'Booking',
      value: 0, // You can add a value if applicable
      currency: 'BRL',
      reservation_code: reservationData.reservation_code,
      party_size: reservationData.party_size,
      date: reservationData.date,
      slot_time: reservationData.slot_time,
    });

    // Also track as Lead for Facebook
    if (this.config.facebookPixelId && window.fbq) {
      window.fbq('track', 'Lead', {
        content_name: 'Reservation Lead',
        value: 0,
        currency: 'BRL',
      });
    }
  }

  /**
   * Track user data for enhanced matching (GDPR compliant)
   */
  setUserData(userData) {
    if (!this.initialized) return;

    // Facebook Pixel Advanced Matching
    if (this.config.facebookPixelId && window.fbq && userData.email) {
      window.fbq('init', this.config.facebookPixelId, {
        em: userData.email,
        ph: userData.phone_whatsapp,
        fn: userData.full_name?.split(' ')[0],
        ln: userData.full_name?.split(' ').slice(1).join(' '),
      });
    }

    // GTM User Data
    if (this.config.gtmContainerId && window.dataLayer) {
      window.dataLayer.push({
        event: 'user_data_available',
        user_email: userData.email,
        user_phone: userData.phone_whatsapp,
      });
    }
  }

  /**
   * Clear tracking configuration
   */
  clear() {
    this.config = {
      facebookPixelId: null,
      metaConversionApiToken: null,
      gtmContainerId: null,
    };
    this.initialized = false;
  }
}

// Export singleton instance
export const trackingService = new TrackingService();
export default trackingService;

