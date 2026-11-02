/**
 * NOCTIS — MAIN JAVASCRIPT ENGINE
 * Pure Vanilla JavaScript (ES6+). Zero frameworks, zero external dependencies.
 * Handles:
 *  1. Noise Grain Engine (Shifted ~8x/sec on offscreen canvas)
 *  2. Custom Cursor ("The Headlight" with lerp 0.18, morphing light bar, 120ms click boost)
 *  3. Progressive Frame Preloader (Initial 1–40 frames -> page reveal -> background queue)
 *  4. Pinned Scrollytelling Engine for Hero (598 frames) & Dismantle (200 frames)
 *  5. Nearest-Loaded Frame Fallback & DevicePixelRatio scaling
 *  6. Landscape Cover-fit / Portrait Contain-fit Canvas Rendering
 *  7. Telemetry HUD & Chapters State Management
 *  8. Statement Word-by-Word Scroll Scrubber
 *  9. Dismantle Exploded Callouts & Leader Lines
 * 10. Hover & Keyboard Accordion for Model Lineup (Debounced 80ms)
 * 11. Smart Nav Hide/Show on Scroll Direction
 * 12. Full Accessibility & Reduced Motion Handling
 */

(function () {
  'use strict';

  // Read configuration from window.NOCTIS_CONFIG with safe fallbacks
  const CFG = window.NOCTIS_CONFIG || {
    hero: {
      frameCount: 598,
      wrapperHeightVh: 600,
      desktopPathPattern: 'assets/frames/hero/frame_%s.webp',
      mobilePathPattern: 'assets/frames/hero-mobile/frame_%s.webp',
      speedMaxKmH: 118,
      distanceMaxKm: 4.2,
      fadeToBlackStart: 0.95,
      chapters: [
        { id: 1, startProgress: 0.00, endProgress: 0.12 },
        { id: 2, startProgress: 0.22, endProgress: 0.40 },
        { id: 3, startProgress: 0.50, endProgress: 0.68 },
        { id: 4, startProgress: 0.80, endProgress: 1.00 }
      ]
    },
    statement: {
      text: 'Every part was designed to disappear into one line of light.'
    },
    dismantle: {
      frameCount: 200,
      wrapperHeightVh: 350,
      desktopPathPattern: 'assets/frames/dismantle/frame_%s.webp',
      mobilePathPattern: 'assets/frames/dismantle-mobile/frame_%s.webp',
      callouts: [
        { id: 'body', startProgress: 0.70 },
        { id: 'battery', startProgress: 0.78 },
        { id: 'drive', startProgress: 0.86 },
        { id: 'light', startProgress: 0.93 }
      ]
    },
    lineup: {
      defaultOpenIndex: 0
    },
    preloader: {
      initialHeroFrames: 40
    },
    cursor: {
      lerpFactor: 0.18,
      clickBoostDurationMs: 120
    }
  };

  // Check prefers-reduced-motion
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    document.body.classList.add('reduced-motion');
  }

  // =========================================================================
  // 1. FILM GRAIN OVERLAY
  // Fixed film-grain overlay: small noise tile drawn once to offscreen canvas,
  // shifted randomly ~8 times per second (125ms), 3.5% opacity, pointer-events none.
  // =========================================================================
  function initFilmGrain() {
    const grainCanvas = document.getElementById('grain-overlay');
    if (!grainCanvas) return;

    const ctx = grainCanvas.getContext('2d', { alpha: false });
    const tileSize = 256;
    const tileCanvas = document.createElement('canvas');
    tileCanvas.width = tileSize;
    tileCanvas.height = tileSize;
    const tileCtx = tileCanvas.getContext('2d');
    const imgData = tileCtx.createImageData(tileSize, tileSize);
    const buffer = new Uint32Array(imgData.data.buffer);

    // Generate monochrome high-frequency grain
    for (let i = 0; i < buffer.length; i++) {
      const v = (Math.random() * 255) | 0;
      // ABGR format: Alpha 255, Red v, Green v, Blue v
      buffer[i] = (255 << 24) | (v << 16) | (v << 8) | v;
    }
    tileCtx.putImageData(imgData, 0, 0);

    function resizeGrain() {
      grainCanvas.width = window.innerWidth + 100;
      grainCanvas.height = window.innerHeight + 100;
    }
    resizeGrain();
    window.addEventListener('resize', resizeGrain, { passive: true });

    // Pattern pattern fill
    const pattern = ctx.createPattern(tileCanvas, 'repeat');

    // Shift randomly ~8 times per second (125ms)
    setInterval(() => {
      ctx.save();
      const ox = (Math.random() * -50) | 0;
      const oy = (Math.random() * -50) | 0;
      ctx.translate(ox, oy);
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, grainCanvas.width + 50, grainCanvas.height + 50);
      ctx.restore();
    }, 125);
  }

  // =========================================================================
  // 2. CUSTOM CURSOR ("The Headlight", Desktop Only)
  // 6px solid xenon dot inside 28px ring with 1px stroke. Follows mouse with lerp 0.18.
  // Morphs over links/buttons into 44x2px horizontal light bar with mono label.
  // Mousedown turns brighter for 120ms.
  // =========================================================================
  function initCustomCursor() {
    if (prefersReducedMotion || !window.matchMedia('(pointer: fine)').matches) return;

    const cursor = document.getElementById('cursor');
    const cursorLabel = document.getElementById('cursor-label');
    if (!cursor) return;

    let mouseX = window.innerWidth / 2;
    let mouseY = window.innerHeight / 2;
    let cursorX = mouseX;
    let cursorY = mouseY;
    const lerpFactor = CFG.cursor?.lerpFactor || 0.18;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }, { passive: true });

    // Click boost: turns brighter for 120ms
    window.addEventListener('mousedown', () => {
      cursor.classList.add('cursor-active');
      setTimeout(() => {
        cursor.classList.remove('cursor-active');
      }, CFG.cursor?.clickBoostDurationMs || 120);
    });

    // Update target cursor label and morph state
    function updateCursorTargets() {
      const targets = document.querySelectorAll('.cursor-target, a, button, [role="button"], [role="tab"], .swatch-btn');
      targets.forEach(target => {
        target.addEventListener('mouseenter', () => {
          cursor.classList.add('state-hover');
          const customText = target.getAttribute('data-cursor') || 'VIEW';
          if (cursorLabel) cursorLabel.textContent = customText;
        });

        target.addEventListener('mouseleave', () => {
          cursor.classList.remove('state-hover');
        });
      });
    }
    updateCursorTargets();
    window.refreshCursorTargets = updateCursorTargets;

    // Cursor RAF loop with lerp
    function cursorLoop() {
      cursorX += (mouseX - cursorX) * lerpFactor;
      cursorY += (mouseY - cursorY) * lerpFactor;
      cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
      requestAnimationFrame(cursorLoop);
    }
    requestAnimationFrame(cursorLoop);
  }

  // =========================================================================
  // 3. SMART NAVBAR
  // Fixed, transparent, mix-blend-mode difference. Hides on scroll down, shows on scroll up.
  // =========================================================================
  function initNavbar() {
    const navbar = document.getElementById('navbar');
    if (!navbar) return;

    let lastScrollY = window.scrollY;
    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          if (currentScrollY > 100 && currentScrollY > lastScrollY) {
            navbar.classList.add('nav-hidden');
          } else {
            navbar.classList.remove('nav-hidden');
          }
          lastScrollY = Math.max(0, currentScrollY);
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  // =========================================================================
  // 4. FRAME SEQUENCE LOADER & CACHE
  // Preloads frames as Image objects with img.decode().
  // Provides nearest-loaded frame fallback for flicker-free scrub.
  // =========================================================================
  class SequenceLoader {
    constructor(config, isHero = true) {
      this.frameCount = config.frameCount;
      this.isHero = isHero;
      this.isMobile = window.innerWidth < 768;
      this.desktopPattern = config.desktopPathPattern;
      this.mobilePattern = config.mobilePathPattern;
      this.images = new Array(this.frameCount);
      this.loadedIndices = new Set();
      this.loadedCount = 0;
      this.onProgress = null;

      window.addEventListener('resize', () => {
        const newIsMobile = window.innerWidth < 768;
        if (newIsMobile !== this.isMobile) {
          this.isMobile = newIsMobile;
          this.images = new Array(this.frameCount);
          this.loadedIndices.clear();
          this.loadedCount = 0;
        }
      }, { passive: true });
    }

    getFramePath(index) {
      const numStr = String(index + 1).padStart(4, '0');
      const pattern = this.isMobile ? this.mobilePattern : this.desktopPattern;
      return pattern.replace('%s', numStr);
    }

    async loadFrame(index) {
      if (index < 0 || index >= this.frameCount) return null;
      if (this.images[index] && this.images[index].complete && this.images[index].naturalWidth > 0) {
        return this.images[index];
      }

      return new Promise((resolve) => {
        const img = new Image();
        let settled = false;

        const onFinish = (success) => {
          if (settled) return;
          settled = true;
          if (success && img.naturalWidth > 0) {
            this.images[index] = img;
            if (!this.loadedIndices.has(index)) {
              this.loadedIndices.add(index);
              this.loadedCount++;
              if (this.onProgress) {
                this.onProgress(this.loadedCount, this.frameCount);
              }
            }
          }
          resolve(this.images[index] || null);
        };

        // Safety timeout per frame: never block the queue if an asset stalls
        const timeoutId = setTimeout(() => {
          onFinish(img.complete && img.naturalWidth > 0);
        }, 2500);

        img.onload = () => {
          clearTimeout(timeoutId);
          if (img.decode) {
            img.decode().then(() => onFinish(true)).catch(() => onFinish(true));
          } else {
            onFinish(true);
          }
        };

        img.onerror = () => {
          clearTimeout(timeoutId);
          onFinish(false);
        };

        img.src = this.getFramePath(index);
      });
    }

    getNearestLoadedFrame(targetIndex) {
      if (this.images[targetIndex] && this.images[targetIndex].naturalWidth > 0) {
        return this.images[targetIndex];
      }
      if (this.loadedIndices.size === 0) return null;

      let nearestIdx = -1;
      let minDistance = Infinity;

      for (const idx of this.loadedIndices) {
        const dist = Math.abs(idx - targetIndex);
        if (dist < minDistance && this.images[idx] && this.images[idx].naturalWidth > 0) {
          minDistance = dist;
          nearestIdx = idx;
        }
      }
      return nearestIdx !== -1 ? this.images[nearestIdx] : null;
    }
  }

  // =========================================================================
  // 5. CANVAS RENDERER (Cover-fit on landscape, Contain-fit on portrait)
  // Scale canvas by devicePixelRatio (cap at 2). Centred on --asphalt.
  // =========================================================================
  function renderFrameToCanvas(canvas, ctx, img) {
    if (!canvas || !ctx || !img) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const displayWidth = canvas.clientWidth || window.innerWidth;
    const displayHeight = canvas.clientHeight || window.innerHeight;

    const targetWidth = Math.round(displayWidth * dpr);
    const targetHeight = Math.round(displayHeight * dpr);

    if (canvas.width !== targetWidth || canvas.height !== targetHeight) {
      canvas.width = targetWidth;
      canvas.height = targetHeight;
    }

    const cw = canvas.width;
    const ch = canvas.height;
    const iw = img.naturalWidth || img.width;
    const ih = img.naturalHeight || img.height;

    if (!iw || !ih || cw === 0 || ch === 0) return;

    // Background fill
    ctx.fillStyle = '#07080A';
    ctx.fillRect(0, 0, cw, ch);

    const isLandscape = cw >= ch;
    let renderW, renderH, offsetX, offsetY;

    if (isLandscape) {
      // Cover fit for landscape screens
      const scale = Math.max(cw / iw, ch / ih);
      renderW = iw * scale;
      renderH = ih * scale;
      offsetX = (cw - renderW) / 2;
      offsetY = (ch - renderH) / 2;
    } else {
      // Contain fit for portrait screens: vertically centred on --asphalt, car never cropped
      const scale = Math.min(cw / iw, ch / ih);
      renderW = iw * scale;
      renderH = ih * scale;
      offsetX = (cw - renderW) / 2;
      offsetY = (ch - renderH) / 2;
    }

    ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
  }

  // =========================================================================
  // 6. HERO SCROLLYTELLING ENGINE
  // Pinned 600vh wrapper. Sticky stage. Canvas scrubs joined hero frames 0->1.
  // HUD speed 000->118 km/h, distance 0.0->4.2 km, chapter indicator, sky chapters.
  // Canvas fades to black over last 5%.
  // =========================================================================
  function initHeroScrollytelling(heroLoader) {
    const wrapper = document.getElementById('hero') || document.getElementById('hero-wrapper');
    const canvas = document.getElementById('hero-canvas');
    const blackout = document.getElementById('hero-blackout');
    const progressLine = document.getElementById('hero-progress-line');
    const hudChapter = document.getElementById('hud-chapter');
    const hudSpeed = document.getElementById('hud-speed');
    const hudDistance = document.getElementById('hud-distance');

    if (!wrapper || !canvas) return;

    // Force explicit section height from config
    wrapper.style.height = `${CFG.hero.wrapperHeightVh || 600}vh`;

    const ctx = canvas.getContext('2d', { alpha: false });
    const frameCount = CFG.hero.frameCount;
    const chapters = CFG.hero.chapters;

    let currentFrame = 0;
    let targetFrame = 0;
    let lastDrawnFrame = -1;
    let heroProgress = 0;

    const chapterEls = [
      document.getElementById('hero-chap-1'),
      document.getElementById('hero-chap-2'),
      document.getElementById('hero-chap-3'),
      document.getElementById('hero-chap-4')
    ];

    function calculateProgress() {
      const rect = wrapper.getBoundingClientRect();
      const scrollDist = wrapper.offsetHeight - window.innerHeight;
      if (scrollDist <= 0) return 0;
      const prog = -rect.top / scrollDist;
      return Math.max(0, Math.min(1, prog));
    }

    function updateHeroHUD(prog) {
      // Speed 000 -> 118 KM/H
      const speed = Math.round(prog * (CFG.hero.speedMaxKmH || 118));
      if (hudSpeed) hudSpeed.textContent = `${String(speed).padStart(3, '0')} KM/H`;

      // Distance 0.0 -> 4.2 KM
      const dist = (prog * (CFG.hero.distanceMaxKm || 4.2)).toFixed(1);
      if (hudDistance) hudDistance.textContent = `${dist} KM`;

      // Active Chapter
      let activeChapterIdx = 0;
      chapters.forEach((chap, idx) => {
        const inRange = prog >= chap.startProgress && prog <= chap.endProgress;
        if (chapterEls[idx]) {
          if (inRange) {
            chapterEls[idx].classList.add('active');
            activeChapterIdx = idx;
          } else {
            chapterEls[idx].classList.remove('active');
          }
        }
      });

      if (hudChapter) {
        hudChapter.textContent = `0${activeChapterIdx + 1}/04`;
      }

      // Progress Line
      if (progressLine) {
        progressLine.style.transform = `scaleX(${prog})`;
      }

      // Last 5% fade to black
      if (blackout) {
        if (prog >= (CFG.hero.fadeToBlackStart || 0.95)) {
          const fadeProg = (prog - 0.95) / 0.05;
          blackout.style.opacity = String(fadeProg);
        } else {
          blackout.style.opacity = '0';
        }
      }
    }

    // Initial frame 0 render immediately
    heroLoader.loadFrame(0).then(img => {
      if (img) renderFrameToCanvas(canvas, ctx, img);
    });

    function heroRafLoop() {
      heroProgress = calculateProgress();
      targetFrame = Math.round(heroProgress * (frameCount - 1));

      // Lerp frame scrub
      currentFrame += (targetFrame - currentFrame) * 0.15;
      const roundedFrame = Math.round(currentFrame);

      if (roundedFrame !== lastDrawnFrame) {
        const img = heroLoader.getNearestLoadedFrame(roundedFrame);
        if (img) {
          renderFrameToCanvas(canvas, ctx, img);
          lastDrawnFrame = roundedFrame;
        }
      }

      updateHeroHUD(heroProgress);
      requestAnimationFrame(heroRafLoop);
    }

    requestAnimationFrame(heroRafLoop);

    // Redraw on window resize
    window.addEventListener('resize', () => {
      const img = heroLoader.getNearestLoadedFrame(lastDrawnFrame >= 0 ? lastDrawnFrame : 0);
      if (img) renderFrameToCanvas(canvas, ctx, img);
    }, { passive: true });
  }

  // =========================================================================
  // 7. STATEMENT SECTION (Word-by-word scroll scrubber)
  // Reveals word by word (15% to 100% opacity)
  // =========================================================================
  function initStatementScroller() {
    const headline = document.getElementById('statement-headline');
    const section = document.getElementById('statement-section');
    if (!headline || !section) return;

    const sentence = CFG.statement?.text || headline.textContent.trim();
    const words = sentence.split(/\s+/);
    headline.innerHTML = words.map(w => `<span class="statement-word">${w}</span>`).join(' ');

    const wordSpans = headline.querySelectorAll('.statement-word');

    function checkStatementScroll() {
      const rect = section.getBoundingClientRect();
      const vh = window.innerHeight;
      // Start revealing when top hits 75% vh, finish at 25% vh
      const start = vh * 0.75;
      const end = vh * 0.25;
      const progress = Math.max(0, Math.min(1, (start - rect.top) / (start - end)));

      const activeWordCount = Math.floor(progress * wordSpans.length);
      wordSpans.forEach((span, i) => {
        if (i <= activeWordCount) {
          span.style.opacity = '1';
          span.style.color = 'var(--bone)';
        } else {
          span.style.opacity = '0.15';
          span.style.color = 'var(--fog)';
        }
      });
    }

    window.addEventListener('scroll', checkStatementScroll, { passive: true });
    checkStatementScroll();
  }

  // =========================================================================
  // 8. DISMANTLE SCROLLYTELLING ENGINE
  // Pinned 350vh wrapper. Exploded assembly under scroll.
  // After 70% progress, 4 callouts fade in one by one.
  // =========================================================================
  function initDismantleScrollytelling(dismantleLoader) {
    const wrapper = document.getElementById('dismantle-wrapper') || document.getElementById('dismantle');
    const canvas = document.getElementById('dismantle-canvas');
    const progressLine = document.getElementById('dismantle-progress-line');

    if (!wrapper || !canvas) return;

    // Force explicit section height from config
    wrapper.style.height = `${CFG.dismantle.wrapperHeightVh || 350}vh`;

    const ctx = canvas.getContext('2d', { alpha: false });
    const frameCount = CFG.dismantle.frameCount;
    const callouts = CFG.dismantle.callouts;

    let currentFrame = 0;
    let targetFrame = 0;
    let lastDrawnFrame = -1;
    let dismantleProgress = 0;

    const calloutEls = [
      document.getElementById('callout-body'),
      document.getElementById('callout-battery'),
      document.getElementById('callout-drive'),
      document.getElementById('callout-light')
    ];

    function calculateProgress() {
      const rect = wrapper.getBoundingClientRect();
      const scrollDist = wrapper.offsetHeight - window.innerHeight;
      if (scrollDist <= 0) return 0;
      const prog = -rect.top / scrollDist;
      return Math.max(0, Math.min(1, prog));
    }

    function updateDismantleState(prog) {
      if (progressLine) {
        progressLine.style.transform = `scaleX(${prog})`;
      }

      // Four callouts after 70% progress
      callouts.forEach((callout, idx) => {
        const el = calloutEls[idx];
        if (!el) return;
        if (prog >= callout.startProgress) {
          el.classList.add('active');
        } else {
          el.classList.remove('active');
        }
      });
    }

    // Initial frame 0 render immediately
    dismantleLoader.loadFrame(0).then(img => {
      if (img) renderFrameToCanvas(canvas, ctx, img);
    });

    function dismantleRafLoop() {
      dismantleProgress = calculateProgress();
      targetFrame = Math.round(dismantleProgress * (frameCount - 1));

      // Lerp frame scrub
      currentFrame += (targetFrame - currentFrame) * 0.15;
      const roundedFrame = Math.round(currentFrame);

      if (roundedFrame !== lastDrawnFrame) {
        const img = dismantleLoader.getNearestLoadedFrame(roundedFrame);
        if (img) {
          renderFrameToCanvas(canvas, ctx, img);
          lastDrawnFrame = roundedFrame;
        }
      }

      updateDismantleState(dismantleProgress);
      requestAnimationFrame(dismantleRafLoop);
    }

    requestAnimationFrame(dismantleRafLoop);

    window.addEventListener('resize', () => {
      const img = dismantleLoader.getNearestLoadedFrame(lastDrawnFrame >= 0 ? lastDrawnFrame : 0);
      if (img) renderFrameToCanvas(canvas, ctx, img);
    }, { passive: true });
  }

  // =========================================================================
  // 9. LINEUP HOVER & KEYBOARD ACCORDION
  // 5 vertical slides across full width. GT-E open by default.
  // Debounce hover by 80ms. Smooth flex-grow transition. Full ARIA accessibility.
  // =========================================================================
  function initLineupAccordion() {
    const container = document.getElementById('lineup-accordion');
    const lineupSection = document.getElementById('lineup-section');
    if (!container) return;

    const slides = Array.from(container.querySelectorAll('.accordion-slide'));
    let activeIndex = CFG.lineup?.defaultOpenIndex ?? 0;
    let hoverTimeout = null;

    function setActiveSlide(newIndex, updateFocus = false) {
      if (newIndex < 0 || newIndex >= slides.length) return;
      activeIndex = newIndex;

      slides.forEach((slide, idx) => {
        const isOpen = idx === activeIndex;
        slide.classList.toggle('active', isOpen);
        slide.setAttribute('aria-expanded', String(isOpen));
        slide.setAttribute('aria-selected', String(isOpen));
        slide.setAttribute('data-cursor', isOpen ? 'CONFIGURE' : 'OPEN');
      });

      if (updateFocus && slides[activeIndex]) {
        slides[activeIndex].focus();
      }

      if (window.refreshCursorTargets) {
        window.refreshCursorTargets();
      }
    }

    // Hover trigger with 80ms debounce (Desktop)
    slides.forEach((slide, index) => {
      slide.addEventListener('mouseenter', () => {
        if (window.innerWidth < 768) return;
        clearTimeout(hoverTimeout);
        hoverTimeout = setTimeout(() => {
          setActiveSlide(index);
        }, 80);
      });

      slide.addEventListener('mouseleave', () => {
        clearTimeout(hoverTimeout);
      });

      // Click / Tap support
      slide.addEventListener('click', (e) => {
        if (e.target.closest('.swatch-btn') || e.target.closest('.configure-link')) return;
        setActiveSlide(index);
      });

      // Keyboard navigation
      slide.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
          e.preventDefault();
          setActiveSlide((activeIndex + 1) % slides.length, true);
        } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
          e.preventDefault();
          setActiveSlide((activeIndex - 1 + slides.length) % slides.length, true);
        } else if (e.key === 'Home') {
          e.preventDefault();
          setActiveSlide(0, true);
        } else if (e.key === 'End') {
          e.preventDefault();
          setActiveSlide(slides.length - 1, true);
        } else if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          setActiveSlide(index);
        }
      });
    });

    // Swatch buttons selection
    const swatchButtons = container.querySelectorAll('.swatch-btn');
    swatchButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const parentSlide = btn.closest('.accordion-slide');
        if (!parentSlide) return;
        parentSlide.querySelectorAll('.swatch-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Section entrance observer (slides rise 40px, stagger 0.08s)
    if (lineupSection && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            lineupSection.classList.add('lineup-revealed');
            observer.unobserve(lineupSection);
          }
        });
      }, { threshold: 0.05 });
      observer.observe(lineupSection);
    } else if (lineupSection) {
      lineupSection.classList.add('lineup-revealed');
    }
  }

  // =========================================================================
  // 10. PRELOADER & BACKGROUND STREAMING ORCHESTRATION
  // Load hero frames 1–40 concurrently -> reveal screen with bright pulse
  // Stream remaining hero frames and dismantle frames in background queues
  // =========================================================================
  async function initPreloaderAndQueue() {
    const preloader = document.getElementById('preloader');
    const preloaderBar = document.getElementById('preloader-bar');
    const preloaderCounter = document.getElementById('preloader-counter');

    const heroLoader = new SequenceLoader(CFG.hero, true);
    const dismantleLoader = new SequenceLoader(CFG.dismantle, false);

    // Initialize scrollytelling loops immediately so canvas & HUD are active
    initHeroScrollytelling(heroLoader);
    initDismantleScrollytelling(dismantleLoader);

    const initialFramesTarget = CFG.preloader?.initialHeroFrames || 40;
    let loadedCount = 0;
    let isComplete = false;

    function updatePreloader(percent) {
      const clamped = Math.min(100, Math.max(0, Math.round(percent)));
      if (preloaderBar) preloaderBar.style.transform = `translateX(-50%) scaleX(${clamped / 100})`;
      if (preloaderCounter) preloaderCounter.textContent = `${String(clamped).padStart(3, '0')}%`;
    }

    function dismissPreloader() {
      if (isComplete) return;
      isComplete = true;
      updatePreloader(100);

      if (preloader) {
        preloader.classList.add('boost');
        setTimeout(() => {
          preloader.classList.add('loaded');
          // Trigger Chapter 1 animation reveal
          const chap1 = document.getElementById('hero-chap-1');
          if (chap1) chap1.classList.add('active');
        }, 220);
      }
    }

    // Safety timeout: Never leave preloader on screen longer than 1.8s
    const maxWaitTimer = setTimeout(() => {
      dismissPreloader();
    }, 1800);

    // Concurrently load the initial batch of hero frames
    const initialTasks = [];
    for (let i = 0; i < initialFramesTarget; i++) {
      initialTasks.push(
        heroLoader.loadFrame(i).then(() => {
          loadedCount++;
          updatePreloader((loadedCount / initialFramesTarget) * 100);
        })
      );
    }

    // When initial frames are loaded, reveal immediately
    Promise.all(initialTasks).then(() => {
      clearTimeout(maxWaitTimer);
      dismissPreloader();
    });

    // Background streaming of remaining frames
    async function backgroundStreaming() {
      const heroTotal = CFG.hero.frameCount;
      const dismantleTotal = CFG.dismantle.frameCount;

      // Checkpoints first
      const heroKeyframes = [
        Math.round(heroTotal * 0.25),
        Math.round(heroTotal * 0.50),
        Math.round(heroTotal * 0.75),
        heroTotal - 1
      ];
      for (const idx of heroKeyframes) {
        await heroLoader.loadFrame(idx);
      }

      await dismantleLoader.loadFrame(0);
      await dismantleLoader.loadFrame(dismantleTotal - 1);

      // Stream hero frames in batches of 4
      for (let i = initialFramesTarget; i < heroTotal; i += 4) {
        const batch = [i, i + 1, i + 2, i + 3].filter(idx => idx < heroTotal);
        await Promise.all(batch.map(idx => heroLoader.loadFrame(idx)));
        await new Promise(r => setTimeout(r, 16));
      }

      // Stream dismantle frames in batches of 4
      for (let i = 1; i < dismantleTotal - 1; i += 4) {
        const batch = [i, i + 1, i + 2, i + 3].filter(idx => idx < dismantleTotal);
        await Promise.all(batch.map(idx => dismantleLoader.loadFrame(idx)));
        await new Promise(r => setTimeout(r, 16));
      }
    }

    backgroundStreaming();
  }

  // =========================================================================
  // BOOTSTRAP APPLICATION
  // =========================================================================
  function bootstrap() {
    initFilmGrain();
    initCustomCursor();
    initNavbar();
    initStatementScroller();
    initLineupAccordion();
    initPreloaderAndQueue();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
  } else {
    bootstrap();
  }

})();
