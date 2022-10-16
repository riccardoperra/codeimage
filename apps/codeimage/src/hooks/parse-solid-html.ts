import {
  DOCUMENT_NODE,
  ELEMENT_NODE,
  html as __html,
  parse,
  TEXT_NODE,
  walkSync,
} from 'ultrahtml';

const camelize = (ident: string) =>
  ident.replace(/-([a-z])/g, (_, char) => char.toUpperCase());
const cssToObject = (str: string) => {
  let cssVar: Record<string, string> = {};
  let obj: Record<string, string> = {};
  let t = 0;
  let pair = ['', ''];
  let flags: Record<string, number> = {};
  for (const c of str) {
    if (!flags['('] && c === ':') {
      t = 1;
    } else if (c === ';') {
      const [decl = '', value = ''] = pair;
      const k = camelize(decl.trim());
      if (k.startsWith('-')) {
        cssVar[decl.trim()] = value.trim();
      } else {
        obj[k] = value.replace('!important', '').trim();
      }
      t = 0;
      pair = ['', ''];
    } else {
      pair[t] += c;
      switch (c) {
        case '(': {
          flags[c]++;
          break;
        }
        case ')': {
          flags['(']--;
          break;
        }
      }
    }
  }
  const [decl = '', value = ''] = pair;
  if (decl.trim() && value.replace('!important', '').trim()) {
    obj[camelize(decl.trim())] = value.trim();
  }

  const regexp = /var\(([a-z-0-9,\s]+)\)/;

  Object.keys(obj).forEach(k => {
    if (k === 'borderRadius' && obj[k] === 'inherit') {
      obj[k] = '0px';
    }
    if (obj[k] === 'absolute' || obj[k] === 'relative') {
      obj[k] = 'relative';
    }
    if (k === 'overflow' && !(obj[k] === 'visible' || obj[k] === 'hidden')) {
      obj[k] = 'visible';
    }
    if (k === 'display' && !(obj[k] === 'flex' || obj[k] === 'none')) {
      obj[k] = 'flex';
    }
    if (
      k === 'flexDirection' &&
      !(
        obj[k] === 'row' ||
        obj[k] === 'column' ||
        obj[k] === 'column-reverse' ||
        obj[k] === 'row-reverse'
      )
    ) {
      obj[k] = 'row';
    }

    if (obj[k].startsWith('var(')) {
      const match = regexp.exec(obj[k])?.[1];

      if (match) {
        let cssVarValue = cssVar[match];
        if (cssVarValue.startsWith('var(')) {
          const variables = (regexp.exec(cssVarValue)?.[1] ?? '').split(',');
          cssVarValue = variables.reduce((acc, variable) => {
            if (acc) return acc;
            return cssVar[variable.trim()];
          }, null);
        }
        obj[k] = cssVarValue;
      } else {
        delete obj[k];
      }
    }

    if (!Object.keys(obj).includes('display')) {
      obj['display'] = 'flex';
    }
  });

  return obj;
};

interface VNode {
  type: string;
  props: {
    style?: Record<string, any>;
    children?: string | VNode | VNode[];
    [prop: string]: any;
  };
}

export function html(
  templates: string | TemplateStringsArray,
  ...expressions: any[]
): VNode {
  const result = __html.call(null, templates, ...expressions);
  const doc = parse(result.value.trim());

  const nodeMap = new WeakMap();
  let root: VNode = {
    type: 'div',
    props: {
      style: {
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        height: '100%',
      },
      children: [],
    },
  };
  walkSync(doc, (node, parent, index) => {
    let newNode: any = {};
    if (node.type === DOCUMENT_NODE) {
      nodeMap.set(node, root);
    } else if (node.type === ELEMENT_NODE) {
      newNode.type = node.name;
      const {style, '': _, ...props} = node.attributes;
      if (typeof style === 'string') {
        props['style'] = cssToObject(style);
      }
      props.children = [];
      Object.assign(newNode, {props});
      nodeMap.set(node, newNode);
      if (parent) {
        const newParent = nodeMap.get(parent);
        newParent.props.children[index] = newNode;
      }
    } else if (node.type === TEXT_NODE) {
      newNode = node.value.trim();
      if (newNode.trim()) {
        if (parent) {
          const newParent = nodeMap.get(parent);
          if (parent.children.length === 1) {
            newParent.props.children = newNode;
          } else {
            newParent.props.children[index] = newNode;
          }
        }
      }
    }
  });

  return root;
}
