import {NoHydration} from 'solid-js/web';

export function UmamiScript() {
  const websiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID;
  const scriptSrc = import.meta.env.VITE_UMAMI_SCRIPT_SRC;

  if (!websiteId || !scriptSrc) return null;

  return (
    <NoHydration>
      <script async defer data-website-id={websiteId} src={scriptSrc} />
    </NoHydration>
  );
}
