// One entry per element type. `fields.content` / `fields.style` drive the
// generic Settings Panel form (see SettingsPanel.jsx) - adding a new element
// later means adding an entry here + a renderer in the Hydrogen component
// registry, no editor/canvas code changes required.

export const LAYOUT_TYPES = ['Section', 'Column'];
export const CONTENT_TYPES = [
  'Heading',
  'RichText',
  'CTAButton',
  'ImageBlock',
  'ProductGrid',
  'FaqBlock',
  'ComparisonTable',
];

export const ELEMENT_DEFS = {
  Section: {
    label: 'Section',
    defaultProps: {},
    defaultStyle: {background: '#ffffff', paddingDesktop: '48px 0', paddingMobile: '24px 0'},
    fields: {
      content: [],
      style: [
        {key: 'background', label: 'Background color', type: 'color'},
        {key: 'paddingDesktop', label: 'Padding (desktop)', type: 'text', placeholder: '48px 0'},
        {key: 'paddingMobile', label: 'Padding (mobile)', type: 'text', placeholder: '24px 0'},
      ],
    },
  },
  Column: {
    label: 'Column',
    defaultProps: {widthDesktop: '1/1'},
    defaultStyle: {background: 'transparent', padding: '0 16px'},
    fields: {
      content: [
        {
          key: 'widthDesktop',
          label: 'Width (desktop)',
          type: 'select',
          options: ['1/1', '1/2', '1/3', '1/4', '2/3', '3/4'],
        },
      ],
      style: [
        {key: 'background', label: 'Background color', type: 'color'},
        {key: 'padding', label: 'Padding', type: 'text', placeholder: '0 16px'},
      ],
    },
  },
  Heading: {
    label: 'Heading',
    defaultProps: {text: 'New Heading', tag: 'h2'},
    defaultStyle: {align: 'left', color: ''},
    fields: {
      content: [
        {key: 'text', label: 'Text', type: 'text'},
        {key: 'tag', label: 'Tag', type: 'select', options: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']},
      ],
      style: [
        {key: 'align', label: 'Alignment', type: 'select', options: ['left', 'center', 'right']},
        {key: 'color', label: 'Color', type: 'color'},
      ],
    },
  },
  RichText: {
    label: 'Text',
    defaultProps: {content: 'Add your text here. Use a blank line to start a new paragraph.'},
    defaultStyle: {align: 'left'},
    fields: {
      content: [{key: 'content', label: 'Text', type: 'textarea'}],
      style: [{key: 'align', label: 'Alignment', type: 'select', options: ['left', 'center', 'right']}],
    },
  },
  CTAButton: {
    label: 'Button',
    defaultProps: {label: 'Click Me', url: '#', newTab: false},
    defaultStyle: {styleVariant: 'filled'},
    fields: {
      content: [
        {key: 'label', label: 'Button text', type: 'text'},
        {key: 'url', label: 'Link URL', type: 'text'},
        {key: 'newTab', label: 'Open in new tab', type: 'checkbox'},
      ],
      style: [
        {key: 'styleVariant', label: 'Style', type: 'select', options: ['filled', 'outline', 'text']},
      ],
    },
  },
  ImageBlock: {
    label: 'Image',
    defaultProps: {src: '', alt: '', link: ''},
    defaultStyle: {borderRadius: '0px'},
    fields: {
      content: [
        {key: 'src', label: 'Image URL (Shopify CDN)', type: 'text'},
        {key: 'alt', label: 'Alt text', type: 'text'},
        {key: 'link', label: 'Link (optional)', type: 'text'},
      ],
      style: [{key: 'borderRadius', label: 'Border radius', type: 'text', placeholder: '4px'}],
    },
  },
  ProductGrid: {
    label: 'Product Grid',
    defaultProps: {collectionHandle: '', limit: 8},
    defaultStyle: {columnsDesktop: 4, columnsMobile: 2},
    fields: {
      content: [
        {key: 'collectionHandle', label: 'Collection handle', type: 'text'},
        {key: 'limit', label: 'Number of products', type: 'number'},
      ],
      style: [
        {key: 'columnsDesktop', label: 'Columns (desktop)', type: 'number'},
        {key: 'columnsMobile', label: 'Columns (mobile)', type: 'number'},
      ],
    },
  },
  FaqBlock: {
    label: 'FAQ',
    defaultProps: {
      heading: 'Frequently Asked Questions',
      items: [{question: '', answer: ''}],
    },
    defaultStyle: {},
    fields: {
      content: [
        {key: 'heading', label: 'Heading', type: 'text'},
        {key: 'items', label: 'Questions', type: 'faqItems'},
      ],
      style: [],
    },
  },
  ComparisonTable: {
    label: 'Comparison Table',
    defaultProps: {
      heading: '',
      columnALabel: 'Product A',
      columnBLabel: 'Product B',
      rows: [{label: '', valueA: '', valueB: ''}],
    },
    defaultStyle: {},
    fields: {
      content: [
        {key: 'heading', label: 'Heading (optional)', type: 'text'},
        {key: 'columnALabel', label: 'Column A label', type: 'text'},
        {key: 'columnBLabel', label: 'Column B label', type: 'text'},
        {key: 'rows', label: 'Comparison rows', type: 'comparisonRows'},
      ],
      style: [],
    },
  },
};

export function createNode(type) {
  const def = ELEMENT_DEFS[type];
  return {
    id: crypto.randomUUID(),
    type,
    props: {...(def?.defaultProps || {})},
    style: {...(def?.defaultStyle || {}), customClass: ''},
    visibility: {desktop: true, tablet: true, mobile: true},
    children: [],
  };
}
