export function stripAnimateAids(host: HTMLElement) {
  for (const element of host.querySelectorAll<HTMLElement>(
    '[data-animate-aid]',
  )) {
    if (element.dataset.animateAid === 'line') {
      for (const name of (element.dataset.animateAidClasses ?? '')
        .split(' ')
        .filter(Boolean))
        element.classList.remove(name);
      element.removeAttribute('data-animate-aid');
      element.removeAttribute('data-animate-aid-classes');
    } else element.remove();
  }
}
