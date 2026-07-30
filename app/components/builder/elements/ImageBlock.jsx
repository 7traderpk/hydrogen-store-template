import {visibilityClass} from './visibility';

export function ImageBlock({node}) {
  const {props, style, visibility} = node;
  if (!props.src) return null;

  const img = (
    <img
      src={props.src}
      alt={props.alt || ''}
      loading="lazy"
      style={{borderRadius: style.borderRadius || undefined, maxWidth: '100%', display: 'block'}}
    />
  );

  return (
    <div className={`pb-image ${style.customClass || ''} ${visibilityClass(visibility)}`.trim()}>
      {props.link ? <a href={props.link}>{img}</a> : img}
    </div>
  );
}
