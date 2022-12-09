import type {Properties} from 'csstype';

export const mapToProperty =
  <Property extends keyof Properties<string | number>>(property: Property) =>
  (value: string | number) => {
    const styleRule = {[property]: value};
    return styleRule;
  };
