/* =========================================================
   BEAUTY ZONE — 2026 interactions (vanilla JS, без бібліотек)
   ========================================================= */
const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(pointer: fine)').matches;

/* ---------- Split text на літери ---------- */
$$('[data-split]').forEach(el => {
    const text = el.textContent;
    el.textContent = '';
    [...text].forEach((ch, i) => {
        const s = document.createElement('span');
        s.className = 'char';
        s.style.setProperty('--i', i + (el.classList.contains('split--accent') ? 6 : 0));
        s.textContent = ch;
        el.appendChild(s);
    });
});

/* ---------- Слова для "підсвітки" при скролі ---------- */
const wordsBlock = $('[data-words]');
if (wordsBlock) {
    wordsBlock.innerHTML = wordsBlock.textContent.trim().split(/\s+/)
        .map(w => `<span class="w">${w}</span>`).join(' ');
}

/* ---------- Інтро ---------- */
function revealPage() {
    document.body.classList.add('is-ready');
    document.body.classList.remove('is-loading');
}
window.addEventListener('load', () => setTimeout(revealPage, reduceMotion ? 0 : 1100));
setTimeout(revealPage, 3500); // страховка, якщо load затримується (карта, шрифти)

/* ---------- Скрол: прогрес, навбар, кнопка нагору, підсвітка слів, паралакс ---------- */
const nav = $('.nav');
const toTop = $('#scrollToTop');
const progress = $('.scroll-progress');
const parallaxEls = $$('[data-parallax]');
const words = $$('.about__big .w');
let lastY = window.scrollY;
let ticking = false;

function onScroll() {
    const y = window.scrollY;
    const max = document.documentElement.scrollHeight - innerHeight;
    const p = max > 0 ? y / max : 0;
    progress.style.setProperty('--p', p);
    toTop.style.setProperty('--p', p);
    toTop.classList.toggle('show', y > 500);

    nav.classList.toggle('is-scrolled', y > 40);
    const menuOpen = $('.mobile-menu').classList.contains('is-open');
    nav.classList.toggle('is-hidden', !menuOpen && y > lastY && y > 400);
    lastY = y;

    if (words.length) {
        const r = wordsBlock.getBoundingClientRect();
        const start = innerHeight * 0.85, end = innerHeight * 0.35;
        const t = Math.min(1, Math.max(0, (start - r.top) / (start - end + r.height * 0.6)));
        const lit = Math.round(t * words.length);
        words.forEach((w, i) => w.classList.toggle('on', i < lit));
    }

    const parallaxOn = !reduceMotion && innerWidth > 1100;
    parallaxEls.forEach(el => {
        if (!parallaxOn) { el.style.translate = ''; return; }
        const r = el.getBoundingClientRect();
        const offset = (r.top + r.height / 2 - innerHeight / 2) * parseFloat(el.dataset.parallax);
        el.style.translate = `0 ${offset}px`;
    });
    ticking = false;
}
window.addEventListener('scroll', () => {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
}, { passive: true });
onScroll();

toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

/* ---------- Активний пункт меню ---------- */
const navLinks = $$('.nav__link');
const sectionObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
        if (e.isIntersecting) {
            navLinks.forEach(l => l.classList.toggle('is-active', l.getAttribute('href') === '#' + e.target.id));
        }
    });
}, { rootMargin: '-45% 0px -50% 0px' });
$$('main section[id]').forEach(s => sectionObserver.observe(s));

/* ---------- Reveal + лічильники ---------- */
const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        revealObserver.unobserve(e.target);
    });
}, { threshold: 0.15 });
$$('.reveal').forEach(el => revealObserver.observe(el));

function animateCount(el) {
    const target = parseFloat(el.dataset.count);
    const dec = parseInt(el.dataset.decimals || 0, 10);
    const dur = reduceMotion ? 0 : 1800;
    const t0 = performance.now();
    (function step(now) {
        const k = dur ? Math.min(1, (now - t0) / dur) : 1;
        const eased = 1 - Math.pow(1 - k, 4);
        el.textContent = (target * eased).toFixed(dec);
        if (k < 1) requestAnimationFrame(step);
    })(t0);
}
const countObserver = new IntersectionObserver(entries => {
    entries.forEach(e => {
        if (!e.isIntersecting) return;
        // у hero чекаємо, поки завершиться інтро
        const delay = e.target.closest('.hero') && !document.body.classList.contains('is-ready') ? 1800 : 0;
        setTimeout(() => animateCount(e.target), delay);
        countObserver.unobserve(e.target);
    });
}, { threshold: 0.6 });
$$('[data-count]').forEach(el => countObserver.observe(el));

/* ---------- Мобільне меню ---------- */
const burger = $('.burger');
const mobileMenu = $('.mobile-menu');
function toggleMenu(force) {
    const open = typeof force === 'boolean' ? force : !mobileMenu.classList.contains('is-open');
    mobileMenu.classList.toggle('is-open', open);
    burger.classList.toggle('is-open', open);
    burger.setAttribute('aria-expanded', open);
    mobileMenu.setAttribute('aria-hidden', !open);
    document.body.style.overflow = open ? 'hidden' : '';
    nav.classList.remove('is-hidden');
    nav.classList.toggle('menu-open', open);
}
burger.addEventListener('click', () => toggleMenu());
$$('a', mobileMenu).forEach(a => a.addEventListener('click', () => toggleMenu(false)));

/* ---------- Модалка (<dialog>) ---------- */
const modal = $('#call-modal');
function openModal() {
    if (modal.open) return;
    toggleMenu(false);
    modal.showModal();
}
function closeModal() {
    if (!modal.open) return;
    if (reduceMotion) { modal.close(); return; }
    modal.classList.add('is-closing');
    const onEnd = e => {
        if (e.target !== modal) return; // ігноруємо анімації дочірніх елементів
        modal.removeEventListener('animationend', onEnd);
        modal.classList.remove('is-closing');
        modal.close();
    };
    modal.addEventListener('animationend', onEnd);
}
$$('.modal_btn_open').forEach(b => b.addEventListener('click', openModal));
$('#modal-close').addEventListener('click', closeModal);
modal.addEventListener('click', e => { if (e.target === modal) closeModal(); });
modal.addEventListener('cancel', e => { e.preventDefault(); closeModal(); });

/* ---------- Форми ---------- */
const toast = $('#successMessage');
function showToast() {
    toast.classList.add('show');
    clearTimeout(showToast.t);
    showToast.t = setTimeout(() => toast.classList.remove('show'), 3200);
}
function handleForm(form, after) {
    form.addEventListener('submit', e => {
        e.preventDefault();
        let ok = true;
        $$('input', form).forEach(input => {
            const field = input.closest('.field');
            const valid = input.checkValidity();
            field.classList.toggle('is-invalid', !valid);
            if (!valid) ok = false;
        });
        if (!ok) return;
        form.reset();
        showToast();
        after && after();
    });
    $$('input', form).forEach(i => i.addEventListener('input', () => i.closest('.field').classList.remove('is-invalid')));
}
handleForm($('#contactForm'));
handleForm($('#modalContactForm'), closeModal);

/* ---------- Карусель процедур: стрілки, drag, прогрес ---------- */
const track = $('.procedures__track');
const progressBar = $('.procedures__progress');
const navBtns = $$('.procedures__nav .round-btn');

function updateTrack() {
    const max = track.scrollWidth - track.clientWidth;
    const visible = track.clientWidth / track.scrollWidth;
    const p = max > 0 ? track.scrollLeft / max : 1;
    progressBar.style.setProperty('--pp', visible + (1 - visible) * p);
    navBtns[0].disabled = track.scrollLeft <= 4;
    navBtns[1].disabled = track.scrollLeft >= max - 4;
}
track.addEventListener('scroll', updateTrack, { passive: true });
window.addEventListener('resize', () => { updateTrack(); onScroll(); });
updateTrack();

navBtns.forEach(btn => btn.addEventListener('click', () => {
    const card = $('.proc-card', track);
    const step = card.offsetWidth + 20;
    track.scrollBy({ left: step * parseInt(btn.dataset.dir, 10), behavior: 'smooth' });
}));

// drag мишкою
let isDown = false, startX = 0, startScroll = 0, moved = false;
track.addEventListener('pointerdown', e => {
    if (e.pointerType !== 'mouse') return;
    isDown = true; moved = false;
    startX = e.clientX; startScroll = track.scrollLeft;
});
window.addEventListener('pointermove', e => {
    if (!isDown) return;
    const dx = e.clientX - startX;
    if (Math.abs(dx) > 4) { moved = true; track.classList.add('is-dragging'); }
    track.scrollLeft = startScroll - dx;
});
window.addEventListener('pointerup', () => {
    if (!isDown) return;
    isDown = false;
    track.classList.remove('is-dragging');
});
// клік по картці відкриває запис (якщо це не drag)
$$('.proc-card').forEach(card => card.addEventListener('click', () => { if (!moved) openModal(); }));

/* ---------- Ефекти тільки для миші ---------- */
if (finePointer && !reduceMotion) {
    // Кастомний курсор
    const cursor = $('.cursor');
    const label = $('.cursor__label');
    let cx = innerWidth / 2, cy = innerHeight / 2, tx = cx, ty = cy;
    window.addEventListener('pointermove', e => {
        tx = e.clientX; ty = e.clientY;
        cursor.classList.add('is-visible');
    });
    document.addEventListener('pointerleave', () => cursor.classList.remove('is-visible'));
    (function loop() {
        cx += (tx - cx) * 0.2; cy += (ty - cy) * 0.2;
        cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
        requestAnimationFrame(loop);
    })();
    $$('a, button, input, [data-spotlight]').forEach(el => {
        el.addEventListener('pointerenter', () => cursor.classList.add('is-hover'));
        el.addEventListener('pointerleave', () => cursor.classList.remove('is-hover'));
    });
    $$('[data-cursor]').forEach(el => {
        el.addEventListener('pointerenter', () => { label.textContent = el.dataset.cursor; cursor.classList.add('is-label'); });
        el.addEventListener('pointerleave', () => cursor.classList.remove('is-label'));
    });

    // Магнітні кнопки
    $$('[data-magnetic]').forEach(btn => {
        btn.addEventListener('pointermove', e => {
            const r = btn.getBoundingClientRect();
            const x = e.clientX - r.left - r.width / 2;
            const y = e.clientY - r.top - r.height / 2;
            btn.style.transform = `translate(${x * 0.25}px, ${y * 0.35}px)`;
        });
        btn.addEventListener('pointerleave', () => { btn.style.transform = ''; });
    });

    // 3D-нахил карток процедур
    $$('[data-tilt]').forEach(card => {
        card.addEventListener('pointermove', e => {
            if (isDown) return;
            const r = card.getBoundingClientRect();
            const px = (e.clientX - r.left) / r.width - 0.5;
            const py = (e.clientY - r.top) / r.height - 0.5;
            card.style.setProperty('--ry', `${px * 12}deg`);
            card.style.setProperty('--rx', `${-py * 12}deg`);
        });
        card.addEventListener('pointerleave', () => {
            card.style.setProperty('--ry', '0deg');
            card.style.setProperty('--rx', '0deg');
        });
    });

    // Spotlight на bento-картках
    $$('[data-spotlight]').forEach(card => {
        card.addEventListener('pointermove', e => {
            const r = card.getBoundingClientRect();
            card.style.setProperty('--mx', `${e.clientX - r.left}px`);
            card.style.setProperty('--my', `${e.clientY - r.top}px`);
        });
    });

    // Паралакс шарів у hero за мишею
    const scene = $('[data-tilt-scene]');
    const layers = $$('[data-depth]', scene);
    $('.hero').addEventListener('pointermove', e => {
        const x = e.clientX / innerWidth - 0.5;
        const y = e.clientY / innerHeight - 0.5;
        layers.forEach(l => {
            const d = parseFloat(l.dataset.depth);
            l.style.transform = `translate3d(${-x * 24 * d}px, ${-y * 24 * d}px, 0)`;
        });
    });
}
