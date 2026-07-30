import {visibilityClass} from './visibility';

export function Heading({node}) {
  const {props, style, visibility} = node;
  const Tag = props.tag || 'h2';
  return (
    <Tag
      className={`pb-heading ${style.customClass || ''} ${visibilityClass(visibility)}`.trim()}
      style={{textAlign: style.align || 'left', color: style.color || undefined}}
    >
      {props.text}
    </Tag>
  );
}
