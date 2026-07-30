import {visibilityClass} from './visibility';

// v1 keeps this a plain-text editor (blank line = new paragraph) rather
// than a full WYSIWYG/HTML editor - avoids needing an HTML sanitizer
// (DOMPurify) for a first phase. Upgrading to real rich text is backlog.
export function RichText({node}) {
  const {props, style, visibility} = node;
  const paragraphs = (props.content || '').split(/\n\s*\n/);
  return (
    <div
      className={`pb-richtext ${style.customClass || ''} ${visibilityClass(visibility)}`.trim()}
      style={{textAlign: style.align || 'left'}}
    >
      {paragraphs.map((paragraph, i) => (
        <p key={i}>{paragraph}</p>
      ))}
    </div>
  );
}
