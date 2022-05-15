declare const umami: Umami;

// https://umami.is/docs/tracker-functions
interface Umami {
  (event_value: string): void;

  trackEvent(
    event_value: string,
    event_type: string,
    url?: string,
    website_id?: string,
  ): void;

  trackView(url: string, referrer?: string, website_id?: string): void;
}
