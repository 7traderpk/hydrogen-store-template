import {visibilityClass} from './visibility';

const WIDTH_TO_PERCENT = {
  '1/1': '100%',
  '1/2': '50%',
  '1/3': '33.333%',
  '1/4': '25%',
  '2/3': '66.666%',
  '3/4': '75%',
};

export function Column({node, children}) {
  const {props, style, visibility} = node;
  return (
    <div
      className={`pb-column ${style.customClass || ''} ${visibilityClass(visibility)}`.trim()}
      style={{
        '--pb-col-width-desktop': WIDTH_TO_PERCENT[props.widthDesktop] || '100%',
        background: style.background || undefined,
        padding: style.padding || undefined,
      }}
    >
      {children}
    </div>
  );
}
