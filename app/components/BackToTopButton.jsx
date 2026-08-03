import {useEffect, useState} from 'react';

/**
 * A floating corner button that scrolls the page back to top, shown only
 * once the shopper has scrolled past the fold.
 */
export function BackToTopButton() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function handleScroll() {
      setVisible(window.scrollY > 400);
    }
    handleScroll();
    window.addEventListener('scroll', handleScroll, {passive: true});
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!visible) return null;

  return (
    <button
      type="button"
      className="back-to-top reset"
      onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}
      aria-label="Back to top"
    >
      ↑
    </button>
  );
}
