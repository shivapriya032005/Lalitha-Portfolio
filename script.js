/* ---------- Scroll reveal + navbar (throttled with rAF) ---------- */
const header = document.querySelector('.site-header');

function revealOnScroll() {
  const threshold = window.innerHeight - 150;
  document.querySelectorAll('.reveal').forEach(el => {
    el.classList.toggle('active', el.getBoundingClientRect().top < threshold);
  });
}

function handleNavbarScroll() {
  if (header) header.classList.toggle('scrolled', window.scrollY > 100);
}

let ticking = false;
window.addEventListener('scroll', () => {
  if (ticking) return;
  ticking = true;
  requestAnimationFrame(() => {
    revealOnScroll();
    handleNavbarScroll();
    ticking = false;
  });
}, { passive: true });

revealOnScroll();
handleNavbarScroll();

const logo = document.querySelector('.site-header h2');
if (logo) logo.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

/* ---------- Footer year ---------- */
const yearEl = document.getElementById('year');
if (yearEl) yearEl.textContent = new Date().getFullYear();

/* ---------- Certifications carousel ---------- */
const track = document.querySelector('.carousel-track');
const prevBtn = document.querySelector('.carousel-btn.prev');
const nextBtn = document.querySelector('.carousel-btn.next');

if (track && prevBtn && nextBtn) {
  let index = 0;

  const getCardWidth = () => {
    const card = track.children[0];
    if (!card) return 0;
    const styles = window.getComputedStyle(track);
    const gap = parseFloat(styles.columnGap || styles.gap || '0');
    return card.getBoundingClientRect().width + (Number.isNaN(gap) ? 0 : gap);
  };

  const getVisibleCount = () => {
    const w = window.innerWidth;
    return w < 600 ? 1 : w < 900 ? 2 : 3;
  };

  const maxIndex = () => Math.max(0, track.children.length - getVisibleCount());

  const updateCarousel = () => {
    const cardWidth = getCardWidth();
    if (!cardWidth) return;
    if (getVisibleCount() <= 1) {
      const containerWidth = track.parentElement.getBoundingClientRect().width;
      const center = Math.max(0, (containerWidth - cardWidth) / 2);
      track.style.transform = `translateX(${center - index * cardWidth}px)`;
    } else {
      track.style.transform = `translateX(-${index * cardWidth}px)`;
    }
  };

  nextBtn.addEventListener('click', () => {
    const max = maxIndex();
    if (!max) return;
    index = index < max ? index + 1 : 0;
    updateCarousel();
  });

  prevBtn.addEventListener('click', () => {
    const max = maxIndex();
    if (!max) return;
    index = index > 0 ? index - 1 : max;
    updateCarousel();
  });

  window.addEventListener('resize', () => {
    index = Math.min(index, maxIndex());
    updateCarousel();
  });

  updateCarousel();
}

/* ---------- Mobile menu ---------- */
const toggle = document.getElementById('menuToggle');
const navLinks = document.getElementById('navLinks');

if (toggle && navLinks) {
  const NAV_VISIBLE_BREAKPOINT = 1024;

  const setMenu = open => {
    navLinks.classList.toggle('show', open);
    toggle.classList.toggle('active', open);
    toggle.setAttribute('aria-expanded', String(open));
  };

  toggle.addEventListener('click', () => setMenu(!navLinks.classList.contains('show')));
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && navLinks.classList.contains('show')) {
      setMenu(false);
      toggle.focus();
    }
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > NAV_VISIBLE_BREAKPOINT) setMenu(false);
  });
}

/* ---------- Toasts ---------- */
const toastRegion = document.querySelector('.toast-region');

function showToast({ message, status = 'info' }) {
  if (!toastRegion) return;

  const toast = document.createElement('div');
  toast.className = `toast ${status}`;
  toast.setAttribute('role', 'alert');
  toast.setAttribute('aria-live', 'assertive');
  const p = document.createElement('p');
  p.textContent = message;
  toast.appendChild(p);
  toastRegion.appendChild(toast);

  setTimeout(() => toast.classList.add('visible'), 10);
  setTimeout(() => {
    toast.classList.remove('visible');
    const cleanup = () => { if (toast.isConnected) toast.remove(); };
    toast.addEventListener('transitionend', cleanup, { once: true });
    toast.addEventListener('animationend', cleanup, { once: true });
    setTimeout(cleanup, 600);
  }, 4000);
}

/* ---------- Theme (storage-safe) ---------- */
const THEME_KEY = 'preferred-theme';
const themeBtn = document.getElementById('themeToggle');
const darkQuery = window.matchMedia('(prefers-color-scheme: dark)');

const store = {
  get(key) { try { return localStorage.getItem(key); } catch { return null; } },
  set(key, value) { try { localStorage.setItem(key, value); } catch { /* storage unavailable */ } }
};

function updateThemeToggleUI(theme) {
  if (!themeBtn) return;
  const isLight = theme === 'light';
  const icon = themeBtn.querySelector('.theme-toggle__icon');
  const label = themeBtn.querySelector('.theme-toggle__label');
  themeBtn.classList.toggle('is-light', isLight);
  if (icon) icon.textContent = isLight ? '☀️' : '🌙';
  if (label) label.textContent = isLight ? 'Light mode' : 'Dark mode';
  themeBtn.setAttribute('aria-label', `Switch to ${isLight ? 'dark' : 'light'} mode`);
}

function applyTheme(theme, { persist = true } = {}) {
  document.body.dataset.theme = theme;
  if (persist) store.set(THEME_KEY, theme);
  updateThemeToggleUI(theme);
}

const initialTheme = store.get(THEME_KEY) || document.body.dataset.theme || (darkQuery.matches ? 'dark' : 'light');
applyTheme(initialTheme, { persist: false });

if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    applyTheme(document.body.dataset.theme === 'light' ? 'dark' : 'light');
  });
}

darkQuery.addEventListener('change', e => {
  if (store.get(THEME_KEY)) return;
  applyTheme(e.matches ? 'dark' : 'light', { persist: false });
});

/* ---------- Contact form ---------- */
const emailServiceAvailable = typeof window.emailjs !== 'undefined';
if (emailServiceAvailable) {
  emailjs.init('lrKZo9vsEWTomBtV5');
} else {
  console.warn('EmailJS library is not loaded. Contact form submissions will be disabled.');
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_RE = /^\+?[\d\s()-]{7,}$/;

function validateForm(formEl) {
  const fields = Array.from(formEl.querySelectorAll('input[required], textarea[required]'));
  let firstInvalid = null;
  let message = 'Please fill in all required fields.';

  fields.forEach(field => {
    const value = field.value.trim();
    let invalid = !value;
    if (!invalid && field.type === 'email' && !EMAIL_RE.test(value)) {
      invalid = true;
      message = 'Please enter a valid email address.';
    }
    if (!invalid && field.type === 'tel' && !PHONE_RE.test(value)) {
      invalid = true;
      message = 'Please enter a valid phone number.';
    }
    field.classList.toggle('has-error', invalid);
    if (invalid) {
      field.setAttribute('aria-invalid', 'true');
      if (!firstInvalid) firstInvalid = field;
    } else {
      field.removeAttribute('aria-invalid');
    }
  });

  if (firstInvalid) {
    firstInvalid.focus();
    showToast({ message, status: 'error' });
    return false;
  }
  return true;
}

const form = document.getElementById('contact-form');

if (form) {
  const submitBtn = form.querySelector('button[type="submit"]');
  const submitLabel = submitBtn ? submitBtn.textContent : '';

  form.addEventListener('submit', e => {
    e.preventDefault();
    if (!validateForm(form)) return;

    if (!emailServiceAvailable) {
      showToast({ message: '📨 Email service unavailable. Please try again later.', status: 'error' });
      return;
    }

    if (submitBtn) { submitBtn.disabled = true; submitBtn.textContent = 'Sending…'; }

    emailjs.sendForm('service_59n334m', 'template_y66apok', form)
      .then(() => {
        showToast({ message: '✅ Message sent successfully!', status: 'success' });
        form.reset();
      })
      .catch(() => showToast({ message: '❌ Failed to send. Please try again.', status: 'error' }))
      .finally(() => {
        if (submitBtn) { submitBtn.disabled = false; submitBtn.textContent = submitLabel; }
      });
  });
}

/* ---------- Course card stagger ---------- */
document.querySelectorAll('.course-card').forEach((card, i) => {
  card.style.transitionDelay = `${i * 0.15}s`;
});
