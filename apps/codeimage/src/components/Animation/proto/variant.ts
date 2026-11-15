import {createSignal} from 'solid-js';

export const VARIANTS = [
  {id: 'strip', key: '1', label: 'Strip', note: 'A / D · today'},
  {id: 'list', key: '2', label: 'Step list', note: 'B · rows + sheet'},
  {id: 'preview', key: '3', label: 'Preview only', note: 'C · phone plays'},
  {id: 'fit', key: '4', label: 'Fit + zoom', note: 'E · strip fits'},
  {id: 'hybrid', key: '5', label: 'Overview + list', note: 'F · hybrid'},
  {id: 'combo', key: '6', label: 'Combo', note: 'E desktop · F phone'},
] as const;
export type Variant = (typeof VARIANTS)[number]['id'];

const KEY = 'codeimage:proto-animate-variant';
const read = (): Variant => {
  try {
    const value = localStorage.getItem(KEY);
    return VARIANTS.some(v => v.id === value) ? (value as Variant) : 'strip';
  } catch {
    return 'strip';
  }
};
const [variant, setVariantSignal] = createSignal<Variant>(read());
export {variant};
export const setVariant = (value: Variant) => {
  setVariantSignal(value);
  try {
    localStorage.setItem(KEY, value);
  } catch {
    /* empty */
  }
};

const query = window.matchMedia('(max-width: 768px)');
const [phone, setPhone] = createSignal(query.matches);
query.addEventListener('change', event => setPhone(event.matches));
export {phone};

/** The surface each variant resolves to at the current width. */
export const surface = () => {
  const value = variant();
  if (value === 'preview') return phone() ? 'preview' : 'strip';
  if (value === 'combo') return phone() ? 'hybrid' : 'fit';
  return value;
};
