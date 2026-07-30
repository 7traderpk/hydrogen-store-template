/**
 * Specification sheet rendered as a definition list - the semantic <dl>
 * structure lets answer engines reliably pair each spec name with its
 * value. Sourced from the `custom.specs` product metafield
 * (`[{"name": "...", "value": "..."}]`); renders nothing when unset.
 *
 * @param {{specs: Array<{name: string, value: string}> | null | undefined; heading?: string}}
 */
export function SpecList({specs, heading = 'Specifications'}) {
  if (!Array.isArray(specs) || !specs.length) return null;
  return (
    <section className="spec-list">
      <h2>{heading}</h2>
      <dl>
        {specs.map((spec) => (
          <div key={spec.name}>
            <dt>{spec.name}</dt>
            <dd>{spec.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
