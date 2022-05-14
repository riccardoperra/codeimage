import {
  Component,
  ComponentProps,
  JSX,
  mergeProps,
  PropsWithChildren,
} from 'solid-js';
import {Dynamic} from 'solid-js/web';
import {omitProps} from 'solid-use';

export type DOMElements = keyof JSX.IntrinsicElements;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ElementType<Props = any> = DOMElements | Component<Props>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type LibraryManagedAttributes<Component, Props> = Props;

export type CustomComponentFactory = <T extends ElementType>(
  component: T,
) => CustomComponent<T>;

export type PropsOf<C extends ElementType> = LibraryManagedAttributes<
  C,
  ComponentProps<C>
>;

export type CustomComponentProps<
  C extends ElementType,
  Additional = Record<string, unknown>,
> = PropsWithChildren<PropsOf<C>> & Additional & {as?: C};

export type CustomComponent<
  T extends ElementType,
  P = Record<string, unknown>,
> = <C extends ElementType = T>(
  props: CustomComponentProps<C, P>,
) => JSX.Element;

export type HTMLCustomComponents = {
  [Tag in DOMElements]: CustomComponent<Tag>;
};

const _styled: CustomComponentFactory = <T extends ElementType>(
  component: T,
) => {
  const customComponent: CustomComponent<T> = props => {
    const propsWithDefault = mergeProps({as: component}, props);

    return (
      <Dynamic
        component={propsWithDefault.as ?? 'div'}
        {...omitProps(propsWithDefault, ['as'])}
      />
    );
  };

  return customComponent;
};

function factory() {
  const cache = new Map<
    keyof JSX.IntrinsicElements,
    CustomComponent<keyof JSX.IntrinsicElements>
  >();

  return new Proxy(_styled, {
    apply(target, thisArg, argArray: [ElementType]) {
      return _styled(...argArray);
    },
    get(_, element: keyof JSX.IntrinsicElements) {
      if (!cache.has(element)) {
        cache.set(element, _styled(element));
      }
      return cache.get(element);
    },
  }) as CustomComponentFactory & HTMLCustomComponents;
}

export const styled = factory();
