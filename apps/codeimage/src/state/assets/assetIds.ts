export const assetPrefix = `asset:`;
export const assetLinkPrefix = `link:`;
export type AssetId = `${typeof assetPrefix}${string}`;
export type AssetLinkId = `${typeof assetLinkPrefix}${string}`;

export function isAssetUrl(
  value: string | null | undefined,
): value is AssetId | AssetLinkId {
  return (
    !!value &&
    (value.startsWith(assetPrefix) || value?.startsWith(assetLinkPrefix))
  );
}

export function isAssetLinkUrl(
  value: string | null | undefined,
): value is AssetLinkId {
  return !!value && value.startsWith(assetLinkPrefix);
}
