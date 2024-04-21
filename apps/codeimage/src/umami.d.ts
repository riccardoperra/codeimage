declare const umami: Umami;

// https://umami.is/docs/tracker-functions
interface Umami {
  track(view_properties?: {website: string; [key: string]: string}): void;
  track(
    event_name: string,
    event_data?: {[key: string]: string | number},
  ): void;
}
