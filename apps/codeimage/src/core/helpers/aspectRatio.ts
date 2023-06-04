const fitHeight = function (width: number, decimal: number) {
  const height = Math.round(width * decimal);
  return {
    width,
    height: height,
  };
};

const fitWidth = function (height: number, decimal: number) {
  const width = Math.round(height * decimal);
  return {
    width: width,
    height,
  };
};

const fitBoth = function (height: number, width: number, decimal: number) {
  const moveWidth = fitWidth(height, decimal);
  if (moveWidth.width > width) {
    return fitHeight(width, decimal);
  }
  return moveWidth;
};

interface Aspect {
  name: string;
  decimal: number;
}

const isValidAspectRatio = (str: string): str is `${number} / ${number}` => {
  const regex = /^\d+( \/ \d+)?$/;
  return regex.test(str);
};

const parseRatio = (name: string | number): Aspect | null => {
  if (typeof name === 'number') {
    return {
      decimal: name,
      name: 'Custom',
    };
  }
  if (!isValidAspectRatio(name)) {
    return null;
  }
  const [w, h] = name
    .split('/')
    .map(str => str.trim())
    .map(parseFloat);

  return {
    decimal: w / h,
    name: 'Custom',
  };
};

interface FitAspectOptions {
  ratio: number | `${number} / ${number}`;
  width?: number;
  height?: number;
}

export const fitAspect = (obj: FitAspectOptions) => {
  const aspect = parseRatio(obj.ratio);
  if (aspect === null) {
    console.error('Could not find a given aspect ratio.');
    return obj;
  }
  if (typeof obj.width === 'number' && typeof obj.height === 'number') {
    return fitBoth(obj.height, obj.width, aspect.decimal);
  }
  if (typeof obj.width === 'number') {
    return fitHeight(obj.width, aspect.decimal);
  }
  if (typeof obj.height === 'number') {
    return fitWidth(obj.height, aspect.decimal);
  }
  console.error('Invalid height, width, or ratio value.');
  return obj;
};
