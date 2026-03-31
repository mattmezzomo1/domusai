/**
 * Tracking Service
 * Handles integration with Facebook Pixel and Google Tag Manager.
 *
 * Meta Conversions API (CAPI) calls are made exclusively server-side.
 * The CAPI token is NEVER exposed to the browser.
 * Deduplication between browser Pixel and CAPI is achieved via a shared
 * `eventID` / `event_id` generated on the server and returned to the
 * browser after reservation creation.
 */

class TrackingService {
  constructor() {
    this.config = {
      facebookPixelId: null,
      // Note: metaConversionApiToken is intentionally NOT stored here.
      // It lives only on the server.
      gtmContainerId: null,
    };
    this.initialized = false;
  }

  /**
   * Initialize tracking with public restaurant configuration.
   * `restaurant` must be the PUBLIC response (no meta_conversion_api_token).
   */
  initialize(restaurant) {
    if (!restaurant) return;

    this.config = {
      facebookPixelId: restaurant.facebook_pixel_id || null,
      gtmContainerId: restaurant.gtm_container_id || null,
    };

    if (this.config.facebookPixelId) {
      this.initializeFacebookPixel();
    }

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
   * Track a standard event on all configured platforms.
   * Does NOT accept an eventID — use trackLeadEvent for Lead deduplication.
   */
  trackEvent(eventName, eventData = {}) {
    if (!this.initialized) return;

    if (this.config.facebookPixelId && window.fbq) {
      window.fbq('track', eventName, eventData);
    }

    if (this.config.gtmContainerId && window.dataLayer) {
      this.trackGTMEvent(eventName, eventData);
    }
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
   * Track the Lead event on the browser Pixel with the server-generated eventID.
   *
   * This is the KEY deduplication step: the same `eventID` is sent by the
   * server to Meta CAPI. Meta uses this to deduplicate both events and count
   * only one conversion.
   *
   * @param {string} eventId  - UUID returned by the backend after reservation creation
   * @param {object} userData - Raw (unhashed) user data for Pixel Advanced Matching
   */
  trackLeadEvent(eventId, userData = {}) {
    if (!this.initialized || !this.config.facebookPixelId) return;

    if (!window.fbq) {
      console.warn('[Tracking] fbq not available — Lead event skipped');
      return;
    }

    const pixelUserData = {};
    if (userData.email) pixelUserData.em = userData.email;
    if (userData.phone) pixelUserData.ph = userData.phone;
    if (userData.firstName) pixelUserData.fn = userData.firstName;
    if (userData.lastName) pixelUserData.ln = userData.lastName;

    // fbq('track', eventName, customData, eventData)
    // eventData.eventID must match the server-side event_id for deduplication
    window.fbq('track', 'Lead', pixelUserData, { eventID: eventId });

    console.log(`[Tracking] Lead Pixel event fired. eventID=${eventId}`);

    if (this.config.gtmContainerId && window.dataLayer) {
      this.trackGTMEvent('Lead', { event_id: eventId, ...pixelUserData });
    }
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
   * @deprecated Use trackLeadEvent() instead for proper deduplication.
   * Kept for backwards compatibility with non-Lead events.
   */
  trackReservationComplete(reservationData) {
    this.trackEvent('Purchase', {
      content_name: 'Reservation Completed',
      content_category: 'Booking',
      value: 0,
      currency: 'BRL',
      reservation_code: reservationData.reservation_code,
      party_size: reservationData.party_size,
      date: reservationData.date,
      slot_time: reservationData.slot_time,
    });
  }

  /**
   * Read a cookie value by name from document.cookie.
   * Used to capture _fbp and _fbc for CAPI enrichment.
   */
  getCookie(name) {
    const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
    return match ? decodeURIComponent(match[1]) : null;
  }

  /**
   * Build the tracking context object to include in the reservation creation request.
   * This data is forwarded to the backend which sends it to Meta CAPI.
   */
  buildTrackingContext({ email, phone, fullName } = {}) {
    return {
      fbp: this.getCookie('_fbp'),
      fbc: this.getCookie('_fbc'),
      event_source_url: window.location.href,
      email: email || null,
      phone: phone || null,
      full_name: fullName || null,
    };
  }

  /**
   * Set user data for Pixel Advanced Matching (called on init or after login).
   */
  setUserData(userData) {
    if (!this.initialized || !this.config.facebookPixelId || !window.fbq) return;

    window.fbq('init', this.config.facebookPixelId, {
      em: userData.email || undefined,
      ph: userData.phone_whatsapp || undefined,
      fn: userData.full_name?.split(' ')[0] || undefined,
      ln: userData.full_name?.split(' ').slice(1).join(' ') || undefined,
    });

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
      gtmContainerId: null,
    };
    this.initialized = false;
  }
}

// Export singleton instance
export const trackingService = new TrackingService();
export default trackingService;

