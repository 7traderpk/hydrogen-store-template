import {visibilityClass} from './visibility';

export function CTAButton({node}) {
  const {props, style, visibility} = node;
  return (
    <a
      href={props.url || '#'}
      target={props.newTab ? '_blank' : undefined}
      rel={props.newTab ? 'noopener noreferrer' : undefined}
      className={`pb-button pb-button-${style.styleVariant || 'filled'} ${style.customClass || ''} ${visibilityClass(visibility)}`.trim()}
    >
      {props.label}
    </a>
  );
}
