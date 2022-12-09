import {For} from 'solid-js';
import {
  Box,
  Button,
  HStack,
  IconButton,
  SvgIcon,
  SvgIconProps,
  Text,
  VStack,
} from '../../src';
import {ButtonSizes} from '../../src/lib/primitives/Button/Button.css';

const sizes = [
  ButtonSizes.xxs,
  ButtonSizes.xs,
  ButtonSizes.sm,
  ButtonSizes.md,
  ButtonSizes.lg,
] as const;
const themes = ['primary', 'primaryAlt', 'secondary', 'danger'] as const;
const variants = ['solid', 'outline', 'link'] as const;

export function ButtonDemo() {
  return (
    <div>
      <Text size={'2xl'} weight={'semibold'}>
        Buttons
      </Text>
      <For each={variants}>
        {variant => (
          <VStack spacing={1}>
            <Text size={'lg'} as={'div'}>
              {variant}
            </Text>
            <HStack spacing={'2'} flexWrap={'wrap'}>
              <Button variant={variant}>Default</Button>
              <For each={themes}>
                {theme => (
                  <For each={sizes}>
                    {size => (
                      <Button variant={variant} size={size} theme={theme}>
                        Button
                      </Button>
                    )}
                  </For>
                )}
              </For>
            </HStack>
          </VStack>
        )}
      </For>

      <Box marginTop={'12'}>
        <For each={variants}>
          {variant => (
            <VStack spacing={1}>
              <Text size={'lg'} as={'div'}>
                {variant}
              </Text>
              <HStack spacing={'2'} flexWrap={'wrap'}>
                <Button leftIcon={<IconExample />} variant={variant}>
                  Default
                </Button>
                <For each={themes}>
                  {theme => (
                    <For each={sizes}>
                      {size => (
                        <Button
                          leftIcon={<IconExample />}
                          variant={variant}
                          size={size}
                          theme={theme}
                        >
                          Button
                        </Button>
                      )}
                    </For>
                  )}
                </For>
              </HStack>
            </VStack>
          )}
        </For>
      </Box>

      <Box marginTop={'12'}>
        <For each={variants}>
          {variant => (
            <VStack spacing={1}>
              <Text size={'lg'} as={'div'}>
                {variant}
              </Text>
              <HStack spacing={'2'} flexWrap={'wrap'}>
                <IconButton variant={variant}>
                  <IconExample />
                </IconButton>
                <For each={themes}>
                  {theme => (
                    <For each={sizes}>
                      {size => (
                        <IconButton variant={variant} size={size} theme={theme}>
                          <IconExample />
                        </IconButton>
                      )}
                    </For>
                  )}
                </For>
              </HStack>
            </VStack>
          )}
        </For>
      </Box>

      <Box marginTop={'12'}>
        <For each={variants}>
          {variant => (
            <VStack spacing={1}>
              <Text size={'lg'} as={'div'}>
                {variant}
              </Text>
              <HStack spacing={'2'} flexWrap={'wrap'}>
                <Button variant={variant}>
                  <Text>Text </Text>
                </Button>
                <For each={themes}>
                  {theme => (
                    <For each={sizes}>
                      {size => (
                        <Button variant={variant} size={size} theme={theme}>
                          <Text>Text</Text>
                        </Button>
                      )}
                    </For>
                  )}
                </For>
              </HStack>
            </VStack>
          )}
        </For>
      </Box>
    </div>
  );
}

function IconExample(props: SvgIconProps) {
  return (
    <SvgIcon
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      {...props}
    >
      <path
        fill-rule="evenodd"
        d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z"
        clip-rule="evenodd"
      />
      <path
        fill-rule="evenodd"
        d="M6 10a.75.75 0 01.75-.75h9.546l-1.048-.943a.75.75 0 111.004-1.114l2.5 2.25a.75.75 0 010 1.114l-2.5 2.25a.75.75 0 11-1.004-1.114l1.048-.943H6.75A.75.75 0 016 10z"
        clip-rule="evenodd"
      />
    </SvgIcon>
  );
}
