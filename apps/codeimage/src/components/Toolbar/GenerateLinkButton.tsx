// TODO: to fix
// import {useI18n} from '@codeimage/locale';
// import {editor$} from '@codeimage/store/editor/craeteActiveEditor';
// import {frame$} from '@codeimage/store/frame';
// import {terminal$} from '@codeimage/store/terminal';
// import {Box, Button, HStack, useSnackbarStore} from '@codeimage/ui';
// import {useSearchParams} from 'solid-app-router';
// import {Component} from 'solid-js';
// import {useAsyncAction} from '../../core/hooks/async-action';
// import {fromObservableObject} from '../../core/hooks/from-observable-object';
// import {AppLocaleEntries} from '../../i18n';
// import {InvertedThemeWrapper} from '../../ui/InvertedThemeWrapper/InvertedThemeWrapper';
// import {CheckCircle} from '../Icons/CheckCircle';
// import {LinkIcon} from '../Icons/LinkIcon';
//
// export const GenerateLinkButton: Component = () => {
//   const [t] = useI18n<AppLocaleEntries>();
//   const [, setSearchParams] = useSearchParams();
//   const editor = fromObservableObject(editor$);
//   const frame = fromObservableObject(frame$);
//   const terminal = fromObservableObject(terminal$);
//   const [data, {notify}] = useAsyncAction(async () => {
//     await onGenerateLink();
//     await new Promise(r => setTimeout(r, 200));
//     return 1;
//   });
//
//   function openSnackbar(): void {
//     const snackbarStore = useSnackbarStore();
//     const snackbar = snackbarStore.create({
//       closeable: true,
//       wrapper: InvertedThemeWrapper,
//       message: () => {
//         const [t] = useI18n<AppLocaleEntries>();
//         return (
//           <HStack alignItems={'center'} spacing={'2'}>
//             <Box color={'primary'} display={'flex'} alignItems={'center'}>
//               <CheckCircle />
//             </Box>
//             {t('canvas.linkGeneratedToClipboard')}
//           </HStack>
//         );
//       },
//     });
//     setTimeout(() => snackbarStore.remove(snackbar), 2500);
//   }
//
//   const onGenerateLink = async () => {
//     const params = {
//       p: window.btoa(JSON.stringify({terminal, frame, editor})),
//     };
//     setSearchParams(params);
//     await new Promise(r => setTimeout(r, 100));
//     await navigator.clipboard.writeText(window.location.href);
//     openSnackbar();
//   };
//
//   return (
//     <Button
//       aria-label={t('toolbar.share')}
//       variant={'solid'}
//       theme={'secondary'}
//       disabled={data.loading}
//       onClick={() => notify(true)}
//     >
//       <LinkIcon />
//       <Box marginLeft={2}>{t('toolbar.generateLink')}</Box>
//     </Button>
//   );
// };
