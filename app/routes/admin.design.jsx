import {redirect, Form, useLoaderData, useActionData} from 'react-router';
import {getDesignConfig, DEFAULT_DESIGN_CONFIG} from '~/lib/designConfig';
import {saveDesignConfig} from '~/lib/adminApi.server';

export const meta = () => [{title: 'Design Dashboard'}];

const SECTION_LABELS = {
  hero: 'Hero banner',
  featuredCollectionGrid: 'Featured products grid',
  imageWithText: 'Feature highlights (why shop with us)',
  recommendedProducts: 'Recommended products',
};

/**
 * @param {Route.LoaderArgs}
 */
export async function loader({context}) {
  if (!context.session.get('isAdmin')) {
    throw redirect('/admin/login');
  }
  const config = await getDesignConfig(context.storefront);
  return {config, saved: false};
}

/**
 * @param {Route.ActionArgs}
 */
export async function action({request, context}) {
  if (!context.session.get('isAdmin')) {
    throw redirect('/admin/login');
  }

  const formData = await request.formData();
  const get = (name) => String(formData.get(name) || '');

  const homepageSections = Object.keys(SECTION_LABELS)
    .map((key) => ({
      key,
      enabled: formData.get(`section_enabled_${key}`) === 'on',
      position: Number(get(`section_position_${key}`)) || 999,
    }))
    .sort((a, b) => a.position - b.position)
    .map(({key, enabled}) => ({key, enabled}));

  const featureHighlights = [0, 1, 2, 3].map((i) => ({
    title: get(`feature_${i}_title`),
    text: get(`feature_${i}_text`),
    imageUrl: get(`feature_${i}_image`) || null,
  }));

  const config = {
    brandName: get('brandName') || DEFAULT_DESIGN_CONFIG.brandName,
    colors: {
      primary: get('color_primary') || DEFAULT_DESIGN_CONFIG.colors.primary,
      primaryDark:
        get('color_primary_dark') || DEFAULT_DESIGN_CONFIG.colors.primaryDark,
      accent: get('color_accent') || DEFAULT_DESIGN_CONFIG.colors.accent,
    },
    fontGoogleUrl: get('fontGoogleUrl') || DEFAULT_DESIGN_CONFIG.fontGoogleUrl,
    logoUrl: get('logoUrl') || null,
    socialLinks: {
      facebook: get('social_facebook') || null,
      instagram: get('social_instagram') || null,
      youtube: get('social_youtube') || null,
      tiktok: get('social_tiktok') || null,
      linkedin: get('social_linkedin') || null,
    },
    hero: {
      heading: get('hero_heading'),
      subheading: get('hero_subheading'),
      buttonText: get('hero_buttonText'),
      buttonLink: get('hero_buttonLink'),
    },
    featuredProductsHeading: get('featuredProductsHeading'),
    featureHighlightsHeading: get('featureHighlightsHeading'),
    featureHighlights,
    homepageSections,
  };

  try {
    await saveDesignConfig({
      storeDomain: context.env.PUBLIC_STORE_DOMAIN,
      adminApiToken: context.env.SHOPIFY_ADMIN_API_TOKEN,
      shopGid: context.env.SHOPIFY_SHOP_GID,
      config,
    });
  } catch (error) {
    return {config, saved: false, error: error.message};
  }

  return {config, saved: true};
}

export default function AdminDesign() {
  /** @type {{config: typeof DEFAULT_DESIGN_CONFIG, saved: boolean, error?: string}} */
  const {config} = useLoaderData();
  const actionData = useActionData();
  const current = actionData?.config || config;
  const sectionsByKey = Object.fromEntries(
    current.homepageSections.map((s, i) => [s.key, {...s, position: i + 1}]),
  );

  return (
    <div className="admin-design-page">
      <div className="admin-design-header">
        <h1>Design Dashboard</h1>
        <Form method="post" action="/admin/logout">
          <button type="submit" className="admin-logout-btn">
            Log out
          </button>
        </Form>
      </div>

      {actionData?.saved && (
        <p className="admin-save-success">
          Saved — changes are live on the storefront now, no rebuild needed.
        </p>
      )}
      {actionData?.error && (
        <p className="admin-save-error">Failed to save: {actionData.error}</p>
      )}

      <Form method="post" className="admin-design-form">
        <section className="admin-design-section">
          <h2>Brand</h2>
          <label>
            Brand name
            <input type="text" name="brandName" defaultValue={current.brandName} />
          </label>
          <label>
            Logo URL
            <input
              type="url"
              name="logoUrl"
              placeholder="https://... (leave blank to use the default logo)"
              defaultValue={current.logoUrl || ''}
            />
          </label>
          <label>
            Google Font stylesheet URL
            <input
              type="text"
              name="fontGoogleUrl"
              defaultValue={current.fontGoogleUrl}
            />
          </label>
        </section>

        <section className="admin-design-section">
          <h2>Social links</h2>
          <p className="admin-section-hint">
            Used for the sitewide Organization schema's `sameAs` field (SEO/AEO) - leave
            any blank to omit it entirely rather than link a placeholder.
          </p>
          <label>
            Facebook
            <input
              type="url"
              name="social_facebook"
              placeholder="https://facebook.com/..."
              defaultValue={current.socialLinks?.facebook || ''}
            />
          </label>
          <label>
            Instagram
            <input
              type="url"
              name="social_instagram"
              placeholder="https://instagram.com/..."
              defaultValue={current.socialLinks?.instagram || ''}
            />
          </label>
          <label>
            YouTube
            <input
              type="url"
              name="social_youtube"
              placeholder="https://youtube.com/..."
              defaultValue={current.socialLinks?.youtube || ''}
            />
          </label>
          <label>
            TikTok
            <input
              type="url"
              name="social_tiktok"
              placeholder="https://tiktok.com/@..."
              defaultValue={current.socialLinks?.tiktok || ''}
            />
          </label>
          <label>
            LinkedIn
            <input
              type="url"
              name="social_linkedin"
              placeholder="https://linkedin.com/company/..."
              defaultValue={current.socialLinks?.linkedin || ''}
            />
          </label>
        </section>

        <section className="admin-design-section">
          <h2>Colors</h2>
          <div className="admin-color-row">
            <label>
              Primary
              <input
                type="color"
                name="color_primary"
                defaultValue={current.colors.primary}
              />
            </label>
            <label>
              Primary (dark / hover)
              <input
                type="color"
                name="color_primary_dark"
                defaultValue={current.colors.primaryDark}
              />
            </label>
            <label>
              Accent
              <input
                type="color"
                name="color_accent"
                defaultValue={current.colors.accent}
              />
            </label>
          </div>
        </section>

        <section className="admin-design-section">
          <h2>Hero banner</h2>
          <label>
            Heading
            <input type="text" name="hero_heading" defaultValue={current.hero.heading} />
          </label>
          <label>
            Subheading
            <input
              type="text"
              name="hero_subheading"
              defaultValue={current.hero.subheading}
            />
          </label>
          <label>
            Button text
            <input
              type="text"
              name="hero_buttonText"
              defaultValue={current.hero.buttonText}
            />
          </label>
          <label>
            Button link
            <input
              type="text"
              name="hero_buttonLink"
              defaultValue={current.hero.buttonLink}
            />
          </label>
        </section>

        <section className="admin-design-section">
          <h2>Featured products</h2>
          <label>
            Section heading
            <input
              type="text"
              name="featuredProductsHeading"
              defaultValue={current.featuredProductsHeading}
            />
          </label>
        </section>

        <section className="admin-design-section">
          <h2>Feature highlights</h2>
          <label>
            Section heading
            <input
              type="text"
              name="featureHighlightsHeading"
              defaultValue={current.featureHighlightsHeading}
            />
          </label>
          <div className="admin-feature-grid">
            {[0, 1, 2, 3].map((i) => {
              const feature = current.featureHighlights[i] || {};
              return (
                <fieldset key={i} className="admin-feature-block">
                  <legend>Block {i + 1}</legend>
                  <label>
                    Title
                    <input
                      type="text"
                      name={`feature_${i}_title`}
                      defaultValue={feature.title}
                    />
                  </label>
                  <label>
                    Text
                    <input
                      type="text"
                      name={`feature_${i}_text`}
                      defaultValue={feature.text}
                    />
                  </label>
                  <label>
                    Image URL (optional)
                    <input
                      type="url"
                      name={`feature_${i}_image`}
                      placeholder="Leave blank for the default icon"
                      defaultValue={feature.imageUrl || ''}
                    />
                  </label>
                </fieldset>
              );
            })}
          </div>
        </section>

        <section className="admin-design-section">
          <h2>Homepage sections</h2>
          <p className="admin-section-hint">
            Toggle sections on/off and set their order (1 = top of page).
          </p>
          <table className="admin-sections-table">
            <thead>
              <tr>
                <th>Enabled</th>
                <th>Section</th>
                <th>Position</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(SECTION_LABELS).map((key) => {
                const section = sectionsByKey[key] || {enabled: true, position: 1};
                return (
                  <tr key={key}>
                    <td>
                      <input
                        type="checkbox"
                        name={`section_enabled_${key}`}
                        defaultChecked={section.enabled}
                      />
                    </td>
                    <td>{SECTION_LABELS[key]}</td>
                    <td>
                      <input
                        type="number"
                        min="1"
                        max="4"
                        name={`section_position_${key}`}
                        defaultValue={section.position}
                        className="admin-position-input"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>

        <button type="submit" className="btn admin-save-btn">
          Save changes
        </button>
      </Form>
    </div>
  );
}

/** @typedef {import('./+types/admin.design').Route} Route */
