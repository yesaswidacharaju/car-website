/**
 * NOCTIS Configuration
 * All section heights, chapter ranges, frame counts, frame paths, and callout coordinates.
 * Plain JS object exposed globally as window.NOCTIS_CONFIG.
 */

window.NOCTIS_CONFIG = {
  // Brand details
  brand: {
    name: 'NOCTIS',
    tagline: 'Drive the night.',
    year: '2026'
  },

  // Preloader settings
  preloader: {
    initialHeroFrames: 40 // Hero frames 1–40 loaded before screen reveals
  },

  // Section 1: Hero Scrollytelling
  hero: {
    wrapperHeightVh: 600, // Tall scroll container height in vh
    frameCount: 598, // Real converted frame count (200 + 199 + 199)
    desktopPathPattern: 'assets/frames/hero/frame_%s.webp',
    mobilePathPattern: 'assets/frames/hero-mobile/frame_%s.webp',
    speedMaxKmH: 118,
    distanceMaxKm: 4.2,
    fadeToBlackStart: 0.95, // Progress at which canvas fades to solid black
    chapters: [
      {
        id: 1,
        startProgress: 0.00,
        endProgress: 0.12,
        title: 'NOCTIS',
        subtitle: 'The city is asleep.',
        hint: 'SCROLL TO WAKE IT'
      },
      {
        id: 2,
        startProgress: 0.22,
        endProgress: 0.40,
        title: "It doesn't need the city's light."
      },
      {
        id: 3,
        startProgress: 0.50,
        endProgress: 0.68,
        title: 'It brings its own.'
      },
      {
        id: 4,
        startProgress: 0.80,
        endProgress: 1.00,
        title: 'GT-E',
        specs: '0–100 KM/H 3.1S · 640 KM RANGE · DUAL MOTOR',
        linkText: 'Discover the GT-E',
        linkHref: '#lineup'
      }
    ]
  },

  // Section 2: Statement Section
  statement: {
    label: '02 — ENGINEERING',
    text: 'Every part was designed to disappear into one line of light.'
  },

  // Section 3: Dismantle Scrollytelling
  dismantle: {
    wrapperHeightVh: 350, // Tall scroll container height in vh
    frameCount: 200, // Real converted frame count
    desktopPathPattern: 'assets/frames/dismantle/frame_%s.webp',
    mobilePathPattern: 'assets/frames/dismantle-mobile/frame_%s.webp',
    title: 'Look closer.',
    calloutsStartProgress: 0.70, // Callouts begin fading in after 70%
    // Percentage coordinates (x: % from left, y: % from top of stage)
    callouts: [
      {
        id: 'body',
        code: 'BODY',
        title: 'Carbon composite monocoque',
        startProgress: 0.70,
        x: 35,
        y: 32,
        lineAngle: -40,
        lineLength: 80
      },
      {
        id: 'battery',
        code: 'BATTERY',
        title: '110 kWh structural pack',
        startProgress: 0.78,
        x: 39,
        y: 72,
        lineAngle: 45,
        lineLength: 80
      },
      {
        id: 'drive',
        code: 'DRIVE',
        title: 'Dual axial-flux motors, 680 kW',
        startProgress: 0.86,
        x: 67,
        y: 65,
        lineAngle: 30,
        lineLength: 80
      },
      {
        id: 'light',
        code: 'LIGHT',
        title: 'Single-line LED signature',
        startProgress: 0.93,
        x: 75,
        y: 48,
        lineAngle: -25,
        lineLength: 80
      }
    ]
  },

  // Section 4: Lineup Accordion
  lineup: {
    label: '03 — THE LINEUP',
    title: 'Five ways to drive the night.',
    defaultOpenIndex: 0, // 0-indexed: GT-E is open by default
    models: [
      {
        id: 'gt-e',
        num: '01',
        name: 'GT-E',
        tagline: 'The grand tourer.',
        specs: {
          range: '640 km',
          accel: '3.1 s',
          power: '680 kW'
        },
        image: 'assets/cars/gt-e.webp',
        alt: 'NOCTIS GT-E matte graphite electric grand tourer coupe',
        colors: ['#121418', '#EDEAE4', '#1F2A38', '#2A0808']
      },
      {
        id: 's',
        num: '02',
        name: 'S',
        tagline: 'Four doors, no compromise.',
        specs: {
          range: '600 km',
          accel: '3.6 s',
          power: '520 kW'
        },
        image: 'assets/cars/s.webp',
        alt: 'NOCTIS S satin bone white four-door sport sedan',
        colors: ['#EDEAE4', '#121418', '#2D313A', '#0B1C2E']
      },
      {
        id: 'x',
        num: '03',
        name: 'X',
        tagline: 'Higher, never heavier.',
        specs: {
          range: '560 km',
          accel: '4.2 s',
          power: '480 kW'
        },
        image: 'assets/cars/x.webp',
        alt: 'NOCTIS X midnight blue electric SUV coupe',
        colors: ['#0B1C2E', '#121418', '#EDEAE4', '#26292E']
      },
      {
        id: 'r',
        num: '04',
        name: 'R',
        tagline: 'Built for the track.',
        specs: {
          range: '420 km',
          accel: '2.4 s',
          power: '900 kW'
        },
        image: 'assets/cars/r.webp',
        alt: 'NOCTIS R satin black track coupe with fixed rear wing',
        colors: ['#0D0E10', '#350C0C', '#24272D', '#EDEAE4']
      },
      {
        id: 'one',
        num: '05',
        name: 'ONE',
        tagline: 'The future, early.',
        specs: {
          range: 'Concept',
          accel: 'Sub 2.0 s',
          power: '1,100 kW'
        },
        image: 'assets/cars/one.webp',
        alt: 'NOCTIS ONE liquid silver concept hypercar',
        colors: ['#C4C8D0', '#121418', '#07080A', '#CFE3FF']
      }
    ]
  },

  // Section 5: Reserve
  reserve: {
    title: 'Drive the night.',
    subtitle: 'Production strictly limited to 1,000 numbered units for 2026.',
    ctaText: 'RESERVE YOUR NOCTIS'
  },

  // Custom Cursor
  cursor: {
    lerpFactor: 0.18,
    clickBoostDurationMs: 120
  }
};

