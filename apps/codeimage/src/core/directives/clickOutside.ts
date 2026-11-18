export default function clickOutside(
  element: HTMLElement,
  onOutside: () => void,
) {
  const onClick = (event: MouseEvent) => {
    if (event.target instanceof Node && !element.contains(event.target))
      onOutside();
  };
  document.body.addEventListener('click', onClick);
  return () => document.body.removeEventListener('click', onClick);
}
