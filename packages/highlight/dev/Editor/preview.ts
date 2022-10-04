import prettier from 'prettier';
import tsParser from 'prettier/parser-typescript';

export const PREVIEW_CODE = prettier.format(
  `
  @decorator({
    property: 'test'
  })
  class Test {
    private readonly property: string = '';
    readonly property2: number[] = [1, 2, 3];

    constructor(
      private readonly property3: symbol
    ) {
      super();
    }

    get getter() {
      return this.property;
    }

    method(): void {
      return this.property2.map(el => el * 2);
    }
  }

  function Counter() {
    const [count, setCount] = createSignal(0);

    const increment = () => setCount(count => count + 1);

    return (
      <button type='button' onClick={increment}>
        {count()}
      </button>
    );
  }

	enum Enum {
	  0,
	  1,
	  3,
	  4 = '4',
	  5 = '5'
	}

	interface User {
	  username: string;
	  firstName?: string;
	  lastName: string;
  }

	type BaseUser = Pick<User, 'firstName' | 'lastName'>;
`,
  {
    parser: 'typescript',
    plugins: [tsParser],
  },
);
