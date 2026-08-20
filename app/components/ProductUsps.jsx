/**
 * Trust-signal strip below the buy row. Every claim here links to (or
 * matches) an actual policy page rather than asserting specific numbers -
 * the real refund policy is "faulty items replaced/refunded within 24h,
 * 25% fee on other returns," not a blanket "7-day easy returns," so this
 * intentionally doesn't promise that.
 */
export function ProductUsps() {
  return (
    <div className="product-usps">
      <div className="product-usp-item">
        <span aria-hidden="true">🚚</span>
        <span>
          Nationwide delivery ·{' '}
          <a href="/policies/shipping-policy">Shipping policy</a>
        </span>
      </div>
      <div className="product-usp-item">
        <span aria-hidden="true">🔄</span>
        <a href="/policies/refund-policy">Faulty item replacement</a>
      </div>
      <div className="product-usp-item">
        <span aria-hidden="true">🔒</span>
        <span>Secure checkout</span>
      </div>
      <div className="product-usp-item">
        <span aria-hidden="true">📞</span>
        <a href="tel:+923124002221">+92 312 4002221</a>
      </div>
    </div>
  );
}
