import type {
  ComponentProps,
  JSX,
  ValidComponent as ElementType,
} from '@solidjs/web';
import type {ParentProps} from 'solid-js';
import {createComponent, merge, omit} from 'solid-js';
import {Dynamic} from '@solidjs/web';

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
  [Tag in keyof JSX.IntrinsicElements]: CustomComponent<Tag>;
};

const _styled: CustomComponentFactory = <T extends ElementType>(
  component: T,
): CustomComponent<T> => {
  return props => {
    const others = omit(props, 'as');

    const propsWithDefault = merge(
      {
        get component() {
          return props.as ?? component;
        },
      },
      others,
    );

    // oxlint-disable-next-line typescript/no-explicit-any TODO: broken solid/ts type with 5.3
    return createComponent(Dynamic, propsWithDefault as any);
  };
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
