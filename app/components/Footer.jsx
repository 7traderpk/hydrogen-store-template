import {NavLink} from 'react-router';
import '~/components/Footer.css';

// Newsletter signup posts straight to the shop's own myshopify.com domain
// (Shopify's native customer-tagging contact form) rather than a relative
// /contact path, since this storefront is headless - the request needs to
// reach Shopify directly, not this app's own server.
const STORE_DOMAIN = 'digilogpk.myshopify.com';

const CATEGORY_LINKS = [
  {label: 'Arduino Boards & Kits', to: '/collections/arduino'},
  {label: 'ESP32 & IoT Modules', to: '/collections/esp32'},
  {label: 'Sensors & Modules', to: '/collections/sensor'},
  {label: 'Microcontrollers', to: '/collections/microcontrollers'},
  {label: 'Robotics & Motors', to: '/collections/robotics'},
  {label: '3D Printing Supplies', to: '/collections/3d-printing'},
  {label: 'STEM & Starter Kits', to: '/collections/stem-kits'},
  {label: 'Soldering & Tools', to: '/collections/soldering-tools'},
];

const INFORMATION_LINKS = [
  {label: 'My Account', to: '/account/login'},
  {label: 'Track Your Order', to: '/account/orders'},
  {label: 'FAQ', to: '/pages/faq'},
  {label: 'Shipping Policy', to: '/policies/shipping-policy'},
  {label: 'Return Policy', to: '/policies/refund-policy'},
  {label: 'Warranty Claim Policy', to: '/pages/warranty-claim-policy'},
  {label: 'About Us', to: '/pages/about-us'},
  {label: 'Contact Us', to: '/pages/contact'},
  {label: 'Terms & Conditions', to: '/policies/terms-of-service'},
  {label: 'Payment Details', to: '/pages/payment-options'},
];

const USEFUL_LINKS = [
  {label: 'All Products', to: '/collections/all'},
  {label: 'Tutorials & Guides', to: '/blogs/news'},
  {label: 'Our Story', to: '/pages/about-us'},
  {label: 'Electronic Components', to: '/collections/electronic-components'},
  {label: 'Power Electronics', to: '/collections/power-electronics'},
  {label: 'Solar & Inverter', to: '/collections/solar-inverter'},
  {label: 'Battery & Charging', to: '/collections/battery-charging'},
  {label: 'Sitemap', to: '/sitemap.xml'},
];

const DIRECTORY_COLUMNS = [
  {
    heading: 'Power Electronics',
    links: [
      {label: 'Rectifier Bridges', to: '/collections/power-electronics'},
      {label: 'IGBT Modules', to: '/collections/power-electronics'},
      {label: 'MOSFET Modules', to: '/collections/power-electronics'},
      {label: 'High Current Diodes', to: '/collections/power-electronics'},
      {label: 'Thyristor Modules', to: '/collections/power-electronics'},
      {label: 'Power Control Boards', to: '/collections/power-electronics'},
    ],
  },
  {
    heading: 'Solar & Inverter Components',
    links: [
      {label: 'Solar Charge Controllers', to: '/collections/solar-inverter'},
      {label: 'Inverter Control Boards', to: '/collections/solar-inverter'},
      {label: 'WiFi Monitoring Dongles', to: '/collections/solar-inverter'},
      {label: 'Battery Management Systems', to: '/collections/solar-inverter'},
      {label: 'DC-DC Converters', to: '/collections/solar-inverter'},
      {label: 'Solar MPPT Modules', to: '/collections/solar-inverter'},
    ],
  },
  {
    heading: 'Batteries & Charging',
    links: [
      {label: 'Lithium Battery Packs', to: '/collections/battery-charging'},
      {label: 'Battery Charger Modules', to: '/collections/battery-charging'},
      {label: 'BMS Protection Boards', to: '/collections/battery-charging'},
      {label: 'Lead Acid Batteries', to: '/collections/battery-charging'},
      {label: 'Battery Holders', to: '/collections/battery-charging'},
      {label: 'Charging Controllers', to: '/collections/battery-charging'},
    ],
  },
  {
    heading: 'Control & Monitoring',
    links: [
      {label: 'Microcontroller Boards', to: '/collections/microcontrollers'},
      {label: 'IoT Modules', to: '/collections/microcontrollers'},
      {label: 'Display Panels', to: '/collections/modules'},
      {label: 'Relay Modules', to: '/collections/modules'},
      {label: 'Sensor Systems', to: '/collections/sensor'},
      {label: 'Communication Modules', to: '/collections/modules'},
    ],
  },
];

const POPULAR_COLUMNS = [
  {
    heading: 'Popular Microcontrollers & Boards',
    links: [
      {label: 'Arduino Uno R3', to: '/products/arduino-uno-r3', highlight: true},
      {label: 'Arduino Mega 2560', to: '/search?q=arduino+mega+2560', highlight: true},
      {
        label: 'ESP32 DevKit',
        to: '/products/38-nodemcu-esp32s-microcontroller-wifi-bluetooth-wroom-32-development-board',
        highlight: true,
      },
      {label: 'ESP8266 NodeMCU', to: '/search?q=esp8266+nodemcu', highlight: true},
      {label: 'Raspberry Pi 4', to: '/search?q=raspberry+pi+4'},
      {
        label: 'STM32 Blue Pill',
        to: '/products/original-stm32f103c8t6-stm32f103-arm-cortex-m3-minimum-system-development-board-in-pakistan-clone',
        highlight: true,
      },
      {label: 'ATmega328P', to: '/search?q=atmega328p'},
      {label: 'PIC Microcontrollers', to: '/search?q=pic+microcontroller'},
      {label: 'ATtiny85', to: '/search?q=attiny85'},
      {label: 'Arduino Nano', to: '/search?q=arduino+nano', highlight: true},
      {label: 'Teensy Boards', to: '/products/teensy-4-1-usb-arm-cortex-m7-at-600mhz-teensy41-dev-16771'},
    ],
  },
  {
    heading: 'Sensors & Modules',
    links: [
      {label: 'Ultrasonic Sensor HC-SR04', to: '/products/hc-sr04-hc-sr04-arduino-ultrasonic-sensor', highlight: true},
      {
        label: 'DHT11 Temperature Sensor',
        to: '/products/dht11-temperature-and-humidity-sensor-module-ky-015',
        highlight: true,
      },
      {label: 'DHT22 Humidity Sensor', to: '/products/am2301-temperature-and-humidity-sensor', highlight: true},
      {
        label: 'MQ2 Gas Sensor',
        to: '/products/mq2-mq-2-mq-2-smoke-lpg-butane-hydrogen-gas-sensor-in-pakistan',
        highlight: true,
      },
      {label: 'MQ135 Air Quality Sensor', to: '/search?q=mq135+air+quality', highlight: true},
      {label: 'PIR Motion Sensor', to: '/products/wall-mount-pir-motion-sensor-switch-in-pakistan', highlight: true},
      {
        label: 'IR Obstacle Sensor',
        to: '/products/ir-infrared-obstacle-avoidance-sensor-module',
        highlight: true,
      },
      {label: 'Load Cell Sensor', to: '/search?q=load+cell+sensor'},
      {label: 'Current Sensor ACS712', to: '/products/20a-range-current-sensor-module-acs712', highlight: true},
      {
        label: 'Gyroscope MPU6050',
        to: '/products/gy521-mpu6050-3-axis-digital-gyroscope-accelerometer-sensor-module',
        highlight: true,
      },
      {
        label: 'GPS Module NEO-6M',
        to: '/products/satellite-positioning-gps-module-neo6m-in-pakistan',
        highlight: true,
      },
      {
        label: 'RFID RC522 Module',
        to: '/products/mfrc522-rc522-rfid-card-reader-writer-module-in-pakistan',
        highlight: true,
      },
    ],
  },
  {
    heading: 'Power & Battery Solutions',
    links: [
      {label: 'Battery & Cells', to: '/collections/battery-charging', highlight: true},
      {label: 'Battery Charger & Supply', to: '/collections/battery-charging', highlight: true},
      {
        label: '18650 Lithium Cells',
        to: '/products/3-7v-icr-18650-1000mah-lithium-ion-rechargeable-cell',
        highlight: true,
      },
      {
        label: 'TP4056 Charger Module',
        to: '/products/tp4056-lithium-battery-18650-charger-module-1a-3-7v',
        highlight: true,
      },
      {label: 'LM7805 Voltage Regulator', to: '/search?q=lm7805+voltage+regulator', highlight: true},
      {
        label: 'Buck Converter Module',
        to: '/products/kc24-quick-charging-board-module-buck-converter-pakistan',
        highlight: true,
      },
      {label: 'Boost Converter Module', to: '/search?q=boost+converter+module', highlight: true},
      {label: 'Solar Charge Controller', to: '/collections/solar-inverter'},
      {label: 'LiPo Battery 3.7V', to: '/search?q=lipo+battery+3.7v'},
      {label: 'Lead Acid Battery', to: '/search?q=lead+acid+battery'},
      {label: 'Battery Management System', to: '/search?q=battery+management+system'},
      {label: 'Power Supply Module', to: '/search?q=power+supply+module'},
    ],
  },
  {
    heading: 'Tools & Equipment',
    links: [
      {label: 'Digital Multimeter', to: '/products/mastech-ms8217-autorange-digital-multimeter', highlight: true},
      {label: 'Soldering Equipment', to: '/collections/soldering-tools', highlight: true},
      {label: 'Soldering Iron Station', to: '/collections/kada-soldering-tools', highlight: true},
      {label: 'Digital Oscilloscope', to: '/search?q=digital+oscilloscope'},
      {label: 'Logic Analyzer', to: '/search?q=logic+analyzer'},
      {label: 'Breadboard', to: '/search?q=breadboard'},
      {label: 'Jumper Wires', to: '/search?q=jumper+wire', highlight: true},
      {label: 'Heat Gun', to: '/collections/kada-soldering-tools'},
      {
        label: 'Wire Stripper',
        to: '/products/tni-u-tu-2021-precise-wire-stripper-cutter-tool-clamp-steel-wire-cable',
      },
      {
        label: 'Desoldering Pump',
        to: '/products/dkt365-220v-electric-vacuum-solder-sucker-welding-desoldering-pump-soldering',
      },
      {label: 'Helping Hands', to: '/search?q=helping+hands'},
      {label: 'Precision Screwdriver Set', to: '/search?q=precision+screwdriver+set'},
    ],
  },
];

export function Footer() {
  return (
    <footer id="stem-footer">
      <div className="sf-main">
        <div className="sf-col-brand">
          <div className="sf-logo">
            <span className="green">DIGILOG</span>
            <span className="white">.PK</span>
          </div>
          <div className="sf-tagline">Electronics & Robotics Store</div>

          <div className="sf-contact">
            <p>
              <LocationIcon />
              Digilog Electronics, 13th the Regal Street,
              <br />
              Back side of KFC, Near Abubakar Masjid, Mall Road,
              <br />
              Lahore, Pakistan
            </p>
            <p>
              <PhoneIcon />
              <a href="tel:+923124002221">+92 312 4002221</a>
            </p>
            <p>
              <MailIcon />
              <a href="mailto:info@digilog.pk">info@digilog.pk</a>
            </p>
            <p>
              <ClockIcon />
              Mon–Sat: 11:00 AM – 7:00 PM
            </p>
          </div>

          <div className="sf-socials">
            <a
              href="https://www.facebook.com/profile.php?id=61589853617578"
              aria-label="Facebook"
              target="_blank"
              rel="noopener noreferrer"
            >
              <FacebookIcon />
            </a>
            <a
              href="https://www.instagram.com/stem_pk/"
              aria-label="Instagram"
              target="_blank"
              rel="noopener noreferrer"
            >
              <InstagramIcon />
            </a>
            <a
              href="https://wa.me/923124002221"
              aria-label="WhatsApp"
              target="_blank"
              rel="noopener noreferrer"
            >
              <WhatsAppIcon />
            </a>
          </div>
        </div>

        <FooterLinkColumn heading="Categories" links={CATEGORY_LINKS} />
        <FooterLinkColumn heading="Information" links={INFORMATION_LINKS} />
        <FooterLinkColumn heading="Useful Links" links={USEFUL_LINKS} />

        <div>
          <h3 className="sf-heading">Newsletter Signup</h3>
          <p className="sf-newsletter-text">
            Get new arrivals, restock alerts, and project ideas for Arduino,
            ESP32, and robotics delivered to your inbox.
          </p>
          <form
            method="post"
            action={`https://${STORE_DOMAIN}/contact#stem-footer-newsletter`}
            acceptCharset="UTF-8"
            className="contact-form"
          >
            <input type="hidden" name="form_type" value="customer" />
            <input type="hidden" name="utf8" value="✓" />
            <input type="hidden" name="contact[tags]" value="newsletter" />
            <div className="sf-newsletter-form">
              <input
                type="email"
                name="contact[email]"
                placeholder="Enter email address..."
                required
                autoComplete="email"
              />
              <button type="submit">Subscribe</button>
            </div>
          </form>
          <div className="sf-app">
            <p>Download Our App</p>
            <a
              href="https://play.google.com/store"
              className="sf-app-btn"
              target="_blank"
              rel="noopener noreferrer"
            >
              <PlayStoreIcon />
              <span>
                <small>GET IT ON</small>
                Google Play
              </span>
            </a>
          </div>
        </div>
      </div>

      <hr className="sf-divider" />

      <div className="sf-directory">
        <div className="sf-directory-inner">
          {DIRECTORY_COLUMNS.map((column) => (
            <div className="sf-dir-col" key={column.heading}>
              <h4>{column.heading}</h4>
              <ul>
                {column.links.map((link, index) => (
                  <li key={`${column.heading}-${index}`}>
                    <FooterLink to={link.to}>{link.label}</FooterLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="sf-popular">
        <div className="sf-popular-inner">
          {POPULAR_COLUMNS.map((column) => (
            <div className="sf-pop-col" key={column.heading}>
              <h4>{column.heading}</h4>
              <ul>
                {column.links.map((link, index) => (
                  <li key={`${column.heading}-${index}`}>
                    <FooterLink
                      to={link.to}
                      className={link.highlight ? 'sf-highlight' : undefined}
                    >
                      {link.label}
                    </FooterLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      <div className="sf-seo-section">
        <div className="sf-seo-inner">
          <h2>Pakistan&apos;s Largest Online Electronics & Robotics Component Store</h2>
          <div className="sf-seo-grid">
            <div className="sf-seo-card">
              <h3>Microcontrollers & IoT Development</h3>
              <p>
                We stock the widest range of development boards including{' '}
                <strong>Arduino Uno, Nano, and Mega 2560</strong>. For IoT
                projects, we offer genuine{' '}
                <strong>ESP32, ESP8266 (NodeMCU)</strong>, and Raspberry Pi
                modules. Our inventory supports Final Year Projects (FYP) and
                advanced prototyping with STM32 and PIC microcontrollers.
              </p>
            </div>
            <div className="sf-seo-card">
              <h3>Industrial Power & Solar Repair</h3>
              <p>
                Specializing in power electronics, digilog.pk supplies
                industrial-grade{' '}
                <strong>IGBT Modules, MOSFETs, and Bridge Rectifiers</strong>{' '}
                essential for solar inverter repair and welding plants. We
                carry trusted brands like Fuji, Infineon, and Semikron,
                alongside solar charge controllers and BMS for
                Lithium-ion/LiFePO4 battery packs.
              </p>
            </div>
            <div className="sf-seo-card">
              <h3>Sensors, Modules & Lab Tools</h3>
              <p>
                From precision <strong>DHT11/DHT22 temperature sensors</strong>{' '}
                to ultrasonic and gas sensors (MQ series), we cover all
                robotics needs. We also provide essential lab equipment
                including Oscilloscopes, Digital Multimeters (Uni-T, Sanwa),
                Soldering Stations, and 3D Printer parts (NEMA 17 motors,
                drivers).
              </p>
            </div>
          </div>
          <div className="sf-seo-delivery">
            <strong>Fast Nationwide Delivery:</strong> We deliver electronic
            components to all major cities in Pakistan including{' '}
            <em>
              Lahore, Karachi, Islamabad, Rawalpindi, Faisalabad, Multan,
              Peshawar, and Quetta
            </em>{' '}
            via reliable courier services and Cash on Delivery (COD).
            <br />
            <strong>Why Buy From digilog.pk?</strong> Unlike generic
            marketplaces, we have over 10 years of experience in this field.
            Whether you are searching for &quot;electronics shop near me&quot;
            or &quot;buy Arduino online Pakistan,&quot; digilog.pk is your
            verified partner in innovation.
          </div>
        </div>
      </div>

      <div className="sf-bottom-bar">
        <h2>Digilog.pk — Pakistan&apos;s Electronics & Robotics Store</h2>
        <p>
          Your trusted online source for Arduino, ESP32, sensors, robotics
          components, 3D printing supplies, and STEM kits. Serving students,
          engineers, and makers across Pakistan with fast nationwide
          delivery.
        </p>
        <div className="sf-info-strip">
          <span>
            <LocationIcon />
            Lahore, Pakistan
          </span>
          <span>
            <ClockIcon />
            Mon–Sat: 11AM–7PM
          </span>
          <span>
            <SupportIcon />
            Expert Technical Support
          </span>
          <span>
            <ProductsIcon />
            6,300+ Products
          </span>
        </div>
      </div>

      <div className="sf-copyright">
        &copy; {new Date().getFullYear()} Digilog.pk — All Rights Reserved. |
        Lahore, Pakistan |{' '}
        <NavLink to="/policies/privacy-policy" prefetch="intent">
          Privacy Policy
        </NavLink>{' '}
        |{' '}
        <NavLink to="/policies/terms-of-service" prefetch="intent">
          Terms
        </NavLink>
      </div>
    </footer>
  );
}

/**
 * @param {{heading: string; links: Array<{label: string; to: string}>}}
 */
function FooterLinkColumn({heading, links}) {
  return (
    <div>
      <h3 className="sf-heading">{heading}</h3>
      <ul className="sf-links">
        {links.map((link) => (
          <li key={link.label}>
            <FooterLink to={link.to}>{link.label}</FooterLink>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * A footer link that's a client-side NavLink for in-app routes, or a plain
 * anchor for routes this Hydrogen app doesn't itself serve as a route (e.g.
 * the static sitemap.xml file).
 * @param {{to: string; className?: string; children: React.ReactNode}}
 */
function FooterLink({to, className, children}) {
  if (to.startsWith('/sitemap')) {
    return (
      <a href={to} className={className}>
        {children}
      </a>
    );
  }
  return (
    <NavLink to={to} className={className} prefetch="intent">
      {children}
    </NavLink>
  );
}

function LocationIcon() {
  return (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 7V5z" />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

function SupportIcon() {
  return (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

function ProductsIcon() {
  return (
    <svg width="14" height="14" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
      <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
    </svg>
  );
}

function InstagramIcon() {
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1112.63 8 4 4 0 0116 11.37z" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  );
}

function WhatsAppIcon() {
  return (
    <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
      <path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.558 4.126 1.533 5.862L.057 23.25l5.565-1.457A11.95 11.95 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.848 0-3.594-.487-5.115-1.34l-.367-.217-3.303.866.88-3.21-.237-.38A9.934 9.934 0 012 12C2 6.477 6.477 2 12 2s10 4.477 10 10-4.477 10-10 10z" />
    </svg>
  );
}

function PlayStoreIcon() {
  return (
    <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
      <path d="M3.18 23.76a1.5 1.5 0 001.66-.17l.09-.07 9.38-5.41-2.63-2.63-8.5 8.28zM.5 1.37A1.5 1.5 0 000 2.5v19a1.5 1.5 0 00.5 1.13l.06.05 10.64-10.64v-.25L.56 1.32.5 1.37zM20.1 10.22l-2.68-1.55-2.96 2.96 2.96 2.96 2.69-1.55a1.5 1.5 0 000-2.82zM4.84.41L14.22 5.9l-2.63 2.63L3.18.24a1.5 1.5 0 001.66.17z" />
    </svg>
  );
}
