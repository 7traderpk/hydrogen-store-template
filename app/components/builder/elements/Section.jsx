import {visibilityClass} from './visibility';

export function Section({node, children}) {
  const {style, visibility} = node;
  return (
    <section
      className={`pb-section ${style.customClass || ''} ${visibilityClass(visibility)}`.trim()}
      style={{
        background: style.background || undefined,
        '--pb-padding-desktop': style.paddingDesktop || '48px 0',
        '--pb-padding-mobile': style.paddingMobile || '24px 0',
      }}
    >
      <div className="pb-section-columns">{children}</div>
    </section>
  );
}
