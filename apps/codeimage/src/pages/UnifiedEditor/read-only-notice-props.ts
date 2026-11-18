export interface ReadOnlyNoticeProps {
  title: string;
  cloneLabel: string;
  bannerClass: string;
  titleClass: string;
  buttonClass: string;
  onClone(): Promise<void>;
}
