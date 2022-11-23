import { breakpoints } from '~/core/breakpoints';

export function MainPageImagePreloading() {
    return (
        <>
            <link
                rel="prefetch"
                href={'/landing/codeimage_preview_mobile_ultra.webp'}
                as="image"
                media={`(max-width: ${breakpoints.tablet}px)`}
            />
            <link
                rel="preload"
                href={'/landing/codeimage_preview_mobile.webp'}
                as="image"
                media={`(min-width: ${breakpoints.tablet}px)`}
            />
            <link
                rel="preload"
                href={'/landing/codeimage_preview_desktop.webp'}
                as="image"
                media={`(min-width: ${breakpoints.desktop}px)`}
            />
        </>
    );
}
