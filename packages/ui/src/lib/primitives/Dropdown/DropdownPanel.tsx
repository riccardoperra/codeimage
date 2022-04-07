// type DropdownMenuPanel = PopoverPanelProps<'div'> & {
//   title?: string;
// };
//
// export const DropdownMenu: Component<DropdownMenuPanel> = props => {
//   return (
//     <PopoverPanel
//       as={'div'}
//       unmount={false}
//       class={styles.dropdownPanel}
//       {...props}
//     >
//       <Box display={'flex'} padding={'3'}>
//         <Show when={props.title}>
//           <Text as={'div'} weight="semibold" size={'sm'}>
//             {props.title}
//           </Text>
//         </Show>
//       </Box>
//
//       <Menu>
//         <MenuItem as={'div'}>{props.children}</MenuItem>
//       </Menu>
//     </PopoverPanel>
//   );
// };
