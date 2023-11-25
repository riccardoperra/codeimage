// fleetDarkTheme.editorTheme.forEach(theme => {
//   if (Array.isArray(theme)) {
//     theme.forEach(t => {
//       const hs = (t as any).value as HighlightStyle;
//       if (hs && hs.constructor.name === 'HighlightStyle') {
//         hs.specs.forEach(spec => {
//           if (Array.isArray(spec.tag)) {
//             spec.tag.forEach(tag => {
//               Object.entries(tags).forEach(([k, v]) => {
//                 if (v['id'] === tag['id']) {
//                   provideState(ThemeBuilderStore).set(
//                     'syntax',
//                     k,
//                     spec.color,
//                   );
//                   console.log('found value', k, spec);
//                 }
//               });
//             });
//           } else {
//           }
//         });
//       }
//     });
//   }
// });
