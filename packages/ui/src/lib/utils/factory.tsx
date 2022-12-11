import {DOMElements, ElementType} from '@solid-aria/types';
import {
  ComponentProps,
  createComponent,
  JSX,
  mergeProps,
  ParentProps,
  splitProps,
} from 'solid-js';
import {Dynamic} from 'solid-js/web';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
type LibraryManagedAttributes<Component, Props> = Props;

export type CustomComponentFactory = <T extends ElementType>(
  component: T,
) => CustomComponent<T>;

export type PropsOf<C extends ElementType> = LibraryManagedAttributes<
  C,
  ComponentProps<C>
>;

export type BaseComponentProps<
  C extends ElementType,
  Additional = Record<string, unknown>,
> = ParentProps<
  {
    as?: C;
    class?: string;
  } & Additional
>;

export type CustomComponentProps<
  C extends ElementType,
  Additional = Record<string, unknown>,
> = ParentProps<PropsOf<C>> & Additional & {as?: C; class?: string};

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
  const componentFactory: CustomComponent<T> = props => {
    const [local, others] = splitProps(props, ['as']);

    const propsWithDefault = mergeProps(
      {
        get component() {
          return local.as ?? component;
        },
      },
      others,
    );
    return createComponent(Dynamic, propsWithDefault);
  };

  return componentFactory;
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
