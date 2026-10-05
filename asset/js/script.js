// Vibe Coding Portfolio - Faith Janessa
document.addEventListener('DOMContentLoaded', () => {
    /* ========================================================
       1. SIDEBAR NAVIGATION & SCROLLSPY (INTERSECTION OBSERVER)
       ======================================================== */
    const navLinks = document.querySelectorAll('.sidebar-nav .nav-link');
    const navItems = document.querySelectorAll('.sidebar-menu .nav-item');
    const sections = Array.from(document.querySelectorAll('main section[id]'));
    const sectionIds = sections.map(s => s.id);

    let activeSectionId = null;
    let isClickScrolling = false;
    let scrollEndTimer = null;

    // Fungsi untuk memperbarui status menu aktif dan URL hash
    function activateSection(sectionId, updateHash = true, pushHistory = false) {
        if (!sectionId || !sectionIds.includes(sectionId)) return;
        if (sectionId === activeSectionId && !pushHistory) return;

        activeSectionId = sectionId;

        // 1. Hapus class .active dari semua .nav-item dan .nav-link
        navItems.forEach(item => item.classList.remove('active'));
        navLinks.forEach(link => link.classList.remove('active'));

        // 2. Cari link yang href-nya sesuai dengan id section
        const targetLink = document.querySelector(`.sidebar-nav a[href="#${sectionId}"]`);

        // 3. Tambahkan class .active ke link tersebut (dan .nav-item pembungkusnya)
        if (targetLink) {
            targetLink.classList.add('active');
            const parentItem = targetLink.closest('.nav-item');
            if (parentItem) {
                parentItem.classList.add('active');
            }
        }

        // 4. Sinkronisasi URL Hash secara seamless
        if (updateHash) {
            const targetHash = `#${sectionId}`;
            if (window.location.hash !== targetHash) {
                try {
                    if (pushHistory) {
                        history.pushState(null, '', targetHash);
                    } else {
                        history.replaceState(null, '', targetHash);
                    }
                } catch (_) { }
            }
        }

        // Trigger typing jika masuk ke about
        if (sectionId === 'about') {
            startAboutTyping();
        }
    }

    /* ========================================================
       TYPING ANIMATION FOR ABOUT HEADING
       ======================================================== */
    const aboutTypingElement = document.getElementById('about-typing');
    const aboutText = "Hi, I'm Faith Janessa Thiora Yozael";
    let hasTypedAbout = false;
    let typingTimer = null;

    function escapeHtml(str) {
        return str
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function renderTypingContent(text, showCursor = true) {
        if (!aboutTypingElement) return;

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) {
            aboutTypingElement.innerHTML = `${escapeHtml(aboutText)}<span class="typing-cursor static-cursor" aria-hidden="true">|</span>`;
            return;
        }

        const lastSpaceIndex = text.lastIndexOf(' ');
        let prefix = '';
        let lastWord = text;

        if (lastSpaceIndex !== -1) {
            prefix = text.slice(0, lastSpaceIndex + 1);
            lastWord = text.slice(lastSpaceIndex + 1);
        }

        const cursorHtml = showCursor ? `<span class="typing-cursor" aria-hidden="true">|</span>` : '';

        // Jika karakter terakhir yang diketik adalah spasi, pastikan spasi tampil inline sebelum kursor
        let wordContent = escapeHtml(lastWord);
        if (lastWord === '' && prefix.length > 0) {
            wordContent = '&nbsp;';
        }

        if (prefix) {
            aboutTypingElement.innerHTML = `${escapeHtml(prefix)}<span class="typing-last-word">${wordContent}${cursorHtml}</span>`;
        } else {
            aboutTypingElement.innerHTML = `<span class="typing-last-word">${wordContent}${cursorHtml}</span>`;
        }
    }

    function startAboutTyping() {
        if (hasTypedAbout || !aboutTypingElement) return;
        hasTypedAbout = true;

        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            renderTypingContent(aboutText, true);
            return;
        }

        let charIndex = 0;

        function typeNextChar() {
            if (charIndex < aboutText.length) {
                charIndex++;
                renderTypingContent(aboutText.slice(0, charIndex), true);
                // Kecepatan natural antara 70-90 ms per karakter
                const speed = Math.floor(Math.random() * (90 - 70 + 1)) + 70;
                typingTimer = setTimeout(typeNextChar, speed);
            }
        }

        typeNextChar();
    }

    // Periksa preferensi reduced-motion saat pertama kali dimuat
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches && aboutTypingElement) {
        hasTypedAbout = true;
        renderTypingContent(aboutText, true);
    }

    // Map untuk menyimpan status intersection setiap section
    const sectionEntries = new Map();

    function getActiveSectionFromObserver() {
        // 1. Boundary: Bagian paling atas halaman -> selalu Home
        if (window.scrollY <= 25) {
            return 'home';
        }

        // 2. Boundary: Halaman mencapai scroll paling bawah -> selalu Contact (meski section pendek)
        const scrollBottom = window.innerHeight + window.scrollY;
        const scrollMax = document.documentElement.scrollHeight;
        if (scrollBottom >= scrollMax - 25) {
            return 'contact';
        }

        // 3. Evaluasi section yang sedang berpotongan di viewport
        let bestId = null;
        let maxVisibleHeight = -1;

        sections.forEach(section => {
            const entry = sectionEntries.get(section.id);
            if (entry && entry.isIntersecting) {
                const visibleHeight = entry.intersectionRect.height;
                if (visibleHeight > maxVisibleHeight) {
                    maxVisibleHeight = visibleHeight;
                    bestId = section.id;
                }
            }
        });

        // 4. Fallback jika tidak ada entry yang berpotongan (misal scroll cepat)
        if (!bestId) {
            const viewportCenter = window.innerHeight / 2;
            let minDistance = Infinity;
            sections.forEach(section => {
                const rect = section.getBoundingClientRect();
                const center = rect.top + rect.height / 2;
                const dist = Math.abs(center - viewportCenter);
                if (dist < minDistance) {
                    minDistance = dist;
                    bestId = section.id;
                }
            });
        }

        return bestId || 'home';
    }

    function syncActiveSection(updateHash = true, pushHistory = false) {
        if (isClickScrolling) return;
        const targetId = getActiveSectionFromObserver();
        activateSection(targetId, updateHash, pushHistory);
    }

    // IntersectionObserver untuk mendeteksi visibilitas section
    if ('IntersectionObserver' in window && sections.length > 0) {
        const observerOptions = {
            root: null,
            rootMargin: '-10% 0px -20% 0px',
            threshold: [0, 0.1, 0.25, 0.5, 0.75, 1.0]
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                sectionEntries.set(entry.target.id, entry);

                if (entry.isIntersecting && entry.target.id === 'about') {
                    startAboutTyping();
                }
            });

            if (!isClickScrolling) {
                syncActiveSection(true, false);
            }
        }, observerOptions);

        sections.forEach(section => observer.observe(section));
    }

    function finishClickScroll() {
        isClickScrolling = false;
        clearTimeout(scrollEndTimer);
        syncActiveSection(true, false);
    }

    // Boundary check listener untuk scroll (top & bottom boundary yang presisi)
    let isTicking = false;
    window.addEventListener('scroll', () => {
        if (isClickScrolling) {
            clearTimeout(scrollEndTimer);
            scrollEndTimer = setTimeout(finishClickScroll, 120);
            return;
        }

        if (!isTicking) {
            window.requestAnimationFrame(() => {
                syncActiveSection(true, false);
                isTicking = false;
            });
            isTicking = true;
        }
    }, { passive: true });

    // Modern scrollend event
    if ('onscrollend' in window) {
        window.addEventListener('scrollend', finishClickScroll);
    }

    // Interupsi manual jika user scroll dengan wheel, sentuhan, atau tombol
    ['wheel', 'touchmove', 'keydown'].forEach(evt => {
        window.addEventListener(evt, () => {
            if (isClickScrolling) {
                finishClickScroll();
            }
        }, { passive: true });
    });

    // Event listener klik pada link menu untuk perpindahan smooth dan terkunci
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href');
            if (href && href.startsWith('#')) {
                const sectionId = href.substring(1);
                const targetElement = document.getElementById(sectionId);

                if (targetElement) {
                    e.preventDefault();

                    // Kunci sementara observer agar pill tidak loncat saat melintasi section lain
                    isClickScrolling = true;
                    clearTimeout(scrollEndTimer);
                    scrollEndTimer = setTimeout(finishClickScroll, 800);

                    // Langsung aktifkan pill dan update hash dengan pushHistory
                    activateSection(sectionId, true, true);

                    // Smooth scroll ke target section dengan scrollIntoView dan fallback
                    try {
                        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    } catch (_) {
                        const targetTop = targetElement.getBoundingClientRect().top + window.pageYOffset;
                        window.scrollTo({
                            top: targetTop,
                            behavior: 'smooth'
                        });
                    }
                }
            }
        });
    });

    // Tangani saat browser back/forward atau URL dibuka langsung dengan hash
    function handleInitialHash() {
        const hash = window.location.hash;
        if (hash && hash.startsWith('#')) {
            const sectionId = hash.substring(1);
            const targetElement = document.getElementById(sectionId);
            if (targetElement && sectionIds.includes(sectionId)) {
                activateSection(sectionId, false, false);
                setTimeout(() => {
                    try {
                        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    } catch (_) {
                        window.scrollTo({
                            top: targetElement.getBoundingClientRect().top + window.pageYOffset,
                            behavior: 'smooth'
                        });
                    }
                }, 100);
                return;
            }
        }
        // Default awal jika tidak ada hash
        activateSection('home', false, false);
    }

    window.addEventListener('hashchange', () => {
        const hash = window.location.hash;
        if (hash && hash.startsWith('#')) {
            const sectionId = hash.substring(1);
            if (sectionIds.includes(sectionId)) {
                const targetElement = document.getElementById(sectionId);
                if (targetElement) {
                    isClickScrolling = true;
                    clearTimeout(scrollEndTimer);
                    scrollEndTimer = setTimeout(finishClickScroll, 800);
                    activateSection(sectionId, false, false);
                    try {
                        targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    } catch (_) {
                        window.scrollTo({
                            top: targetElement.getBoundingClientRect().top + window.pageYOffset,
                            behavior: 'smooth'
                        });
                    }
                }
            }
        }
    });

    // Jalankan inisialisasi hash saat DOM selesai dimuat
    handleInitialHash();

    /* ========================================================
       2. CHARACTER EYE-TRACKING (ACCURATE & ULTRA-SMOOTH)
       ======================================================== */
    const characterImg = document.getElementById('character-img');

    if (characterImg) {
        // Verified 9-Directional Images
        const characterImages = {
            'center': 'asset/image/character-center.png',
            'up': 'asset/image/character-up.png',
            'down': 'asset/image/character-down.png',
            'left': 'asset/image/character-left.png',
            'right': 'asset/image/character-right.png',
            'up-left': 'asset/image/character-up-left.png',
            'up-right': 'asset/image/character-up-right.png',
            'down-left': 'asset/image/character-down-left.png',
            'down-right': 'asset/image/character-down-right.png'
        };

        // Preload all 9 images into browser memory to eliminate any flickering
        const preloaded = {};
        Object.entries(characterImages).forEach(([key, src]) => {
            const img = new Image();
            img.src = src;
            preloaded[key] = img;
        });

        // State tracking
        let currentDirection = 'center';
        let targetX = window.innerWidth / 2;
        let targetY = window.innerHeight / 2;
        let smoothX = targetX;
        let smoothY = targetY;
        let isInitialized = false;
        let animationFrameId = null;

        // Tuned Thresholds for Natural Gaze
        const THRESHOLD_DEADZONE = 75; // Deadzone radius around face for 'center' pose
        const HYSTERESIS = 20;         // Stability buffer to prevent jitter on boundary

        // Calculate direction matching the cursor relative to character eyes
        function getDirection(dx, dy) {
            const dist = Math.hypot(dx, dy);
            const threshold = (currentDirection === 'center')
                ? (THRESHOLD_DEADZONE + HYSTERESIS)
                : THRESHOLD_DEADZONE;

            if (dist < threshold) {
                return 'center';
            }

            // Standard Screen Coordinate Angle (degrees):
            // 0° = Right, 90° = Down, 180° = Left, 270° = Up
            let deg = Math.atan2(dy, dx) * (180 / Math.PI);
            if (deg < 0) deg += 360;

            // 8 sectors (45° each centered on cardinal/diagonal directions)
            if (deg >= 337.5 || deg < 22.5) return 'right';
            if (deg >= 22.5 && deg < 67.5) return 'down-right';
            if (deg >= 67.5 && deg < 112.5) return 'down';
            if (deg >= 112.5 && deg < 157.5) return 'down-left';
            if (deg >= 157.5 && deg < 202.5) return 'left';
            if (deg >= 202.5 && deg < 247.5) return 'up-left';
            if (deg >= 247.5 && deg < 292.5) return 'up';
            return 'up-right';
        }

        // Apply new pose cleanly without delay
        function setPose(newDirection) {
            if (newDirection === currentDirection) return;
            currentDirection = newDirection;
            const targetSrc = characterImages[newDirection];
            if (characterImg.getAttribute('src') !== targetSrc) {
                characterImg.src = targetSrc;
            }
        }

        // Continuous render loop with LERP smoothing for natural, fluid gaze
        function renderLoop() {
            // Easing factor (0.20) provides natural ocular tracking without lag or stutter
            smoothX += (targetX - smoothX) * 0.20;
            smoothY += (targetY - smoothY) * 0.20;

            const rect = characterImg.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height * 0.38; // Face/eye level

                const dx = smoothX - centerX;
                const dy = smoothY - centerY;

                const direction = getDirection(dx, dy);
                setPose(direction);
            }

            // Keep loop active while mouse is moving; sleep when idle
            const delta = Math.hypot(targetX - smoothX, targetY - smoothY);
            if (delta > 0.5) {
                animationFrameId = requestAnimationFrame(renderLoop);
            } else {
                animationFrameId = null;
            }
        }

        // Mouse movement listener
        window.addEventListener('mousemove', (e) => {
            targetX = e.clientX;
            targetY = e.clientY;

            if (!isInitialized) {
                smoothX = targetX;
                smoothY = targetY;
                isInitialized = true;
            }

            if (!animationFrameId) {
                animationFrameId = requestAnimationFrame(renderLoop);
            }
        }, { passive: true });

        // Reset gaze to center when cursor leaves viewport
        document.addEventListener('mouseleave', () => {
            const rect = characterImg.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
                targetX = rect.left + rect.width / 2;
                targetY = rect.top + rect.height * 0.38;
                if (!animationFrameId) {
                    animationFrameId = requestAnimationFrame(renderLoop);
                }
            }
        });

        // Update on window resize
        window.addEventListener('resize', () => {
            if (!animationFrameId) {
                animationFrameId = requestAnimationFrame(renderLoop);
            }
        }, { passive: true });
    }

    /* ========================================================
       3. DRAGGABLE LANYARD WITH VELOCITY ROTATION & SPRING PHYSICS
       ======================================================== */
    const lanyardImg = document.querySelector('.lanyard-img');

    if (lanyardImg) {
        // 1 & 3. Cegah drag bawaan browser / ghost image
        lanyardImg.setAttribute('draggable', 'false');
        lanyardImg.addEventListener('dragstart', (e) => e.preventDefault());

        // Transform-origin di top center agar berayun dari gantungan atas
        lanyardImg.style.transformOrigin = 'top center';

        // State posisi translate dan rotasi
        let currentX = 0;
        let currentY = 0;
        let currentRot = 0;
        let targetRot = 0;
        let rotVelocity = 0;

        let isDragging = false;
        let startPointerX = 0;
        let startPointerY = 0;
        let initialX = 0;
        let initialY = 0;

        let lastPointerX = 0;
        let lastPointerTime = 0;
        let stillTimer = null;

        let dragAnimId = null;
        let springAnimId = null;

        // Render loop selama drag untuk pergerakan translate dan rotasi yang halus
        function renderDrag() {
            if (!isDragging) return;

            // Interpolasi rotasi ke arah targetRot secara halus (easing)
            currentRot += (targetRot - currentRot) * 0.2;

            // Update CSS transform translate X, Y dan rotasi
            lanyardImg.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0) rotate(${currentRot.toFixed(2)}deg)`;

            dragAnimId = requestAnimationFrame(renderDrag);
        }

        // 8. Easing elastic / spring-like saat dilepas (posisi X & Y tetap, rotasi kembali ke 0 derajat)
        function startSpringReturn() {
            if (springAnimId) cancelAnimationFrame(springAnimId);

            // Hooke's Law spring oscillator parameters
            const springK = 0.082; // Kekuatan tarikan pegas ke 0 derajat
            const damping = 0.82;  // Redaman osilasi kenyal (elastic spring)

            function springStep() {
                if (isDragging) {
                    springAnimId = null;
                    return;
                }

                // Gaya pemulih pegas menuju 0 derajat
                const force = -springK * currentRot;
                rotVelocity = (rotVelocity + force) * damping;
                currentRot += rotVelocity;

                // Terapkan: posisi translate X & Y tetap pada titik terakhir saat dilepas!
                lanyardImg.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0) rotate(${currentRot.toFixed(2)}deg)`;

                // Hentikan loop bila osilasi sudah mendekati 0 derajat secara stabil
                if (Math.abs(currentRot) > 0.03 || Math.abs(rotVelocity) > 0.03) {
                    springAnimId = requestAnimationFrame(springStep);
                } else {
                    currentRot = 0;
                    rotVelocity = 0;
                    lanyardImg.style.transform = `translate3d(${currentX.toFixed(2)}px, ${currentY.toFixed(2)}px, 0) rotate(0deg)`;
                    springAnimId = null;
                }
            }

            springAnimId = requestAnimationFrame(springStep);
        }

        // 1 & 2. Pointer Down (Mendukung Mouse & Touch)
        lanyardImg.addEventListener('pointerdown', (e) => {
            // Hanya klik kiri untuk mouse (button 0) atau touch
            if (e.pointerType === 'mouse' && e.button !== 0) return;

            e.preventDefault();

            // Batalkan animasi spring jika sedang aktif
            if (springAnimId) {
                cancelAnimationFrame(springAnimId);
                springAnimId = null;
            }

            isDragging = true;
            rotVelocity = 0;

            // 4. Simpan offset titik klik dan posisi awal gambar agar tidak loncat
            startPointerX = e.clientX;
            startPointerY = e.clientY;
            initialX = currentX;
            initialY = currentY;

            lastPointerX = e.clientX;
            lastPointerTime = performance.now();
            targetRot = currentRot;

            // 9. Ubah cursor dari grab menjadi grabbing
            lanyardImg.classList.add('is-dragging');
            document.body.classList.add('is-lanyard-dragging');

            // Tangkap pointer agar event tetap terdeteksi meski cursor bergerak keluar
            try {
                lanyardImg.setPointerCapture(e.pointerId);
            } catch (_) { }

            // Mulai render drag loop
            if (!dragAnimId) {
                dragAnimId = requestAnimationFrame(renderDrag);
            }
        });

        // Pointer Move (Mouse & Touch)
        lanyardImg.addEventListener('pointermove', (e) => {
            if (!isDragging) return;

            // 5. Izinkan translate X dan Y
            const deltaX = e.clientX - startPointerX;
            const deltaY = e.clientY - startPointerY;
            currentX = initialX + deltaX;
            currentY = initialY + deltaY;

            // 6. Rotasi mengikuti kecepatan horizontal mouse
            const now = performance.now();
            const dt = Math.max(1, now - lastPointerTime);
            const vx = (e.clientX - lastPointerX) / dt; // pixel per milidetik

            lastPointerX = e.clientX;
            lastPointerTime = now;

            // Sensitivitas kemiringan badge berdasarkan arah & kecepatan geser
            const ROT_SENSITIVITY = 18;
            let calculatedRot = -vx * ROT_SENSITIVITY;

            // 7. Batasi rotasi maksimum sekitar -30 sampai 30 derajat
            targetRot = Math.max(-30, Math.min(30, calculatedRot));

            // Jika kursor berhenti bergerak saat masih ditahan, rotasi mereda kembali ke 0
            if (stillTimer) clearTimeout(stillTimer);
            stillTimer = setTimeout(() => {
                if (isDragging) {
                    targetRot = 0;
                }
            }, 60);
        });

        // 8 & 9. Selesai drag (Pointer Up / Pointer Cancel)
        function endDrag(e) {
            if (!isDragging) return;

            isDragging = false;

            if (stillTimer) clearTimeout(stillTimer);
            if (dragAnimId) {
                cancelAnimationFrame(dragAnimId);
                dragAnimId = null;
            }

            // Lepaskan pointer capture
            try {
                if (e && e.pointerId) {
                    lanyardImg.releasePointerCapture(e.pointerId);
                }
            } catch (_) { }

            // Kembalikan cursor dari grabbing ke grab
            lanyardImg.classList.remove('is-dragging');
            document.body.classList.remove('is-lanyard-dragging');

            // Beri dorongan inersia rotasi sebelum spring return
            rotVelocity = (targetRot - currentRot) * 0.2;

            // Posisi X & Y terakhir tetap, rotasi berosilasi kembali ke 0 derajat
            startSpringReturn();
        }

        lanyardImg.addEventListener('pointerup', endDrag);
        lanyardImg.addEventListener('pointercancel', endDrag);

        // Pengaman global jika pointerup terjadi di luar konteks elemen
        window.addEventListener('pointerup', (e) => {
            if (isDragging) endDrag(e);
        });
    }

    /* ========================================================
       4. PROJECT SECTION INFINITE LOOPING CAROUSEL
       ======================================================== */
    const projectSlider = document.getElementById('project-slider');
    const projectPrevBtn = document.getElementById('project-prev');
    const projectNextBtn = document.getElementById('project-next');

    // Shared drag state so swiping/dragging never triggers lightbox clicks
    let isDraggingSlider = false;

    if (projectSlider && projectPrevBtn && projectNextBtn) {
        const originalCards = Array.from(projectSlider.querySelectorAll('.project-card'));
        const originalCount = originalCards.length; // 5 cards (01 to 05)
        const cloneCount = originalCount; // 5 clones before, 5 clones after

        // Create clones for before and after
        const clonesBefore = originalCards.map(card => {
            const clone = card.cloneNode(true);
            clone.classList.add('project-card-clone');
            clone.setAttribute('aria-hidden', 'true');
            clone.setAttribute('tabindex', '-1');
            clone.querySelectorAll('a, button, img, [tabindex]').forEach(el => el.setAttribute('tabindex', '-1'));
            return clone;
        });

        const clonesAfter = originalCards.map(card => {
            const clone = card.cloneNode(true);
            clone.classList.add('project-card-clone');
            clone.setAttribute('aria-hidden', 'true');
            clone.setAttribute('tabindex', '-1');
            clone.querySelectorAll('a, button, img, [tabindex]').forEach(el => el.setAttribute('tabindex', '-1'));
            return clone;
        });

        // Prepend clonesBefore (maintaining 01..05 order)
        clonesBefore.forEach(clone => {
            projectSlider.insertBefore(clone, originalCards[0]);
        });

        // Append clonesAfter (maintaining 01..05 order)
        clonesAfter.forEach(clone => {
            projectSlider.appendChild(clone);
        });

        // Carousel index: index 5 corresponds to Original Card 01
        let currentIndex = cloneCount;
        let isTransitioning = false;
        let queuedStep = 0;
        let transitionTimerId = null;

        // Calculate exact step (card width + gap) from DOM layout
        function getStep() {
            const allCards = projectSlider.querySelectorAll('.project-card');
            if (allCards.length >= 2) {
                const diff = allCards[1].offsetLeft - allCards[0].offsetLeft;
                if (diff > 0) return diff;
            }
            const firstCard = allCards[0];
            if (firstCard) {
                const rect = firstCard.getBoundingClientRect();
                const style = window.getComputedStyle(projectSlider);
                const gap = parseFloat(style.gap) || parseFloat(style.columnGap) || 28;
                return rect.width + gap;
            }
            return 338;
        }

        // Apply hardware-accelerated translation
        function updateSliderPosition(animate = true, onComplete = null) {
            const step = getStep();
            const targetX = -(currentIndex * step);

            if (transitionTimerId) {
                clearTimeout(transitionTimerId);
                transitionTimerId = null;
            }

            const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
            if (!animate || prefersReduced) {
                projectSlider.style.transition = 'none';
                projectSlider.style.transform = `translateX(${targetX}px)`;
                void projectSlider.offsetWidth; // Force synchronous layout reflow
                if (onComplete) onComplete();
                return;
            }

            projectSlider.style.transition = 'transform 0.42s cubic-bezier(0.25, 1, 0.5, 1)';
            projectSlider.style.transform = `translateX(${targetX}px)`;

            let completed = false;
            const handleTransitionEnd = (e) => {
                if (e && e.target !== projectSlider) return;
                if (completed) return;
                completed = true;
                projectSlider.removeEventListener('transitionend', handleTransitionEnd);
                if (transitionTimerId) {
                    clearTimeout(transitionTimerId);
                    transitionTimerId = null;
                }
                if (onComplete) onComplete();
            };

            projectSlider.addEventListener('transitionend', handleTransitionEnd);
            transitionTimerId = setTimeout(handleTransitionEnd, 460);
        }

        // Silent wrap: resets position instantly when landing on clone sets
        function checkAndResetWrap() {
            if (currentIndex >= cloneCount + originalCount) {
                currentIndex -= originalCount;
                updateSliderPosition(false);
            } else if (currentIndex < cloneCount) {
                currentIndex += originalCount;
                updateSliderPosition(false);
            }
        }

        // Navigate by step count (e.g., +1 for next, -1 for previous)
        function navigateCarousel(stepCount) {
            if (isTransitioning) {
                // Queue at most one click so rapid clicking transitions seamlessly without desync
                if (queuedStep === 0) {
                    queuedStep = stepCount;
                }
                return;
            }

            isTransitioning = true;
            currentIndex += stepCount;

            updateSliderPosition(true, () => {
                checkAndResetWrap();
                isTransitioning = false;

                // Execute queued step if user clicked quickly
                if (queuedStep !== 0) {
                    const next = queuedStep;
                    queuedStep = 0;
                    navigateCarousel(next);
                }
            });
        }

        // Initialize position to index 5 (Card 01)
        function setInitialPosition() {
            isTransitioning = false;
            queuedStep = 0;
            updateSliderPosition(false);
        }

        setInitialPosition();
        window.addEventListener('load', setInitialPosition);

        // Keep proper alignment on window resize
        window.addEventListener('resize', () => {
            isTransitioning = false;
            queuedStep = 0;
            updateSliderPosition(false);
        });

        // Prev & Next Buttons (arrows are always active and never dimmed)
        projectPrevBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            navigateCarousel(-1);
        });

        projectNextBtn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            navigateCarousel(1);
        });

        // Touch swipe and mouse drag interactions
        let isPointerDown = false;
        let startX = 0;
        let startY = 0;
        let initialTransformX = 0;
        let isHorizontalDrag = false;

        projectSlider.addEventListener('pointerdown', (e) => {
            if (e.target.closest('.slider-btn') || e.target.closest('#modal-close-btn')) return;

            isPointerDown = true;
            isDraggingSlider = false;
            isHorizontalDrag = false;
            startX = e.clientX;
            startY = e.clientY;
            initialTransformX = -(currentIndex * getStep());

            if (transitionTimerId) {
                clearTimeout(transitionTimerId);
                transitionTimerId = null;
            }
            isTransitioning = false;
            projectSlider.style.transition = 'none';
        });

        projectSlider.addEventListener('pointermove', (e) => {
            if (!isPointerDown) return;

            const dx = e.clientX - startX;
            const dy = e.clientY - startY;

            if (!isHorizontalDrag && Math.abs(dx) > 7 && Math.abs(dx) > Math.abs(dy)) {
                isHorizontalDrag = true;
                isDraggingSlider = true;
                try {
                    projectSlider.setPointerCapture(e.pointerId);
                } catch (_) {}
            }

            if (isHorizontalDrag) {
                projectSlider.style.transition = 'none';
                projectSlider.style.transform = `translateX(${initialTransformX + dx}px)`;
            }
        });

        function handlePointerEnd(e) {
            if (!isPointerDown) return;
            isPointerDown = false;

            if (isHorizontalDrag) {
                try {
                    if (e && e.pointerId && projectSlider.hasPointerCapture(e.pointerId)) {
                        projectSlider.releasePointerCapture(e.pointerId);
                    }
                } catch (_) {}

                const dx = e.clientX - startX;
                const step = getStep();

                if (dx < -45) {
                    const steps = Math.max(1, Math.round(-dx / step));
                    navigateCarousel(steps);
                } else if (dx > 45) {
                    const steps = Math.max(1, Math.round(dx / step));
                    navigateCarousel(-steps);
                } else {
                    isTransitioning = true;
                    updateSliderPosition(true, () => {
                        checkAndResetWrap();
                        isTransitioning = false;
                    });
                }
            }

            // Suppress modal click event briefly after dragging
            setTimeout(() => {
                isDraggingSlider = false;
            }, 80);
        }

        projectSlider.addEventListener('pointerup', handlePointerEnd);
        projectSlider.addEventListener('pointercancel', handlePointerEnd);

        // Keyboard Arrow Left/Right support when carousel has focus or mouse is over it
        window.addEventListener('keydown', (e) => {
            if (projectModal && projectModal.classList.contains('is-active')) return;
            if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;

            const projectSection = document.getElementById('project');
            const hasProjectFocus = projectSection && (projectSection.contains(document.activeElement) || document.activeElement === projectPrevBtn || document.activeElement === projectNextBtn);

            if (e.key === 'ArrowLeft' && hasProjectFocus) {
                e.preventDefault();
                navigateCarousel(-1);
            } else if (e.key === 'ArrowRight' && hasProjectFocus) {
                e.preventDefault();
                navigateCarousel(1);
            }
        });
    }

    /* ========================================================
       5. PROJECT DETAIL POPUP MODAL (LIGHTBOX DISPLAY & CONTROLS)
       ======================================================== */
    const projectModal = document.getElementById('project-modal');
    const modalOverlay = document.getElementById('modal-overlay');
    const modalCloseBtn = document.getElementById('modal-close-btn');
    const modalPrevBtn = document.getElementById('modal-prev-btn');
    const modalNextBtn = document.getElementById('modal-next-btn');
    const modalDialog = projectModal ? projectModal.querySelector('.modal-dialog') : null;

    const modalNumber = document.getElementById('modal-number');
    const modalTitle = document.getElementById('modal-title');
    const modalCategory = document.getElementById('modal-category');
    const modalImg = document.getElementById('modal-img');
    const modalDesc = document.getElementById('modal-description');

    // Single source of truth for all 5 projects
    const projectsData = [
        {
            id: 1,
            number: '01',
            title: 'BnW Illustration',
            category: 'Illustration',
            src: 'image/bnw illustration.jpeg',
            alt: 'BnW Illustration - Black and white portrait',
            description: 'A striking black-and-white portrait illustration exploring high-contrast lighting, hand gesture emotion, and refined digital painting brushwork.'
        },
        {
            id: 2,
            number: '02',
            title: 'Cross Culture',
            category: 'Cultural Design',
            src: 'image/cross culture.jpeg',
            alt: 'Cross Culture - Raras Mizuki cultural artwork',
            description: 'An intricate cultural artwork merging traditional Japanese kimono motifs and Javanese heritage into the regal persona of Raras Mizuki.'
        },
        {
            id: 3,
            number: '03',
            title: 'Cover Book',
            category: 'Book Cover Design',
            src: 'image/cover book.png',
            alt: 'Cover Book - Stitching La Mode vintage book mockup',
            description: 'An ornate vintage hardcover book cover design for Stitching La Mode, featuring classic decorative borders, gold filigree, and period typography.'
        },
        {
            id: 4,
            number: '04',
            title: 'World Travel Poster',
            category: 'Poster Design',
            src: 'image/world travel poster.jpeg',
            alt: 'World Travel Poster - Oriental celebratory poster',
            description: 'A vibrant celebratory poster capturing festive night skies, traditional pagoda architecture, and cultural performing arts.'
        },
        {
            id: 5,
            number: '05',
            title: 'Giselle Illustration',
            category: 'Illustration',
            src: 'image/giselle illustration.jpeg',
            alt: 'Giselle Illustration - Modern character design',
            description: 'A chic, stylized modern fashion illustration depicting Giselle with vibrant millennial aesthetics, eclectic textures, and bold personality.'
        }
    ];

    if (projectModal && modalCloseBtn) {
        let currentProjectIndex = 0;

        // Render project details into modal
        function displayProjectByIndex(index) {
            if (index < 0) index = projectsData.length - 1;
            if (index >= projectsData.length) index = 0;
            currentProjectIndex = index;

            const project = projectsData[index];
            if (!project) return;

            // Reset image first so old image never flashes when switching
            if (modalImg) {
                modalImg.style.opacity = '0';
                modalImg.src = '';
                modalImg.alt = project.alt || project.title;

                // Set new image source
                const nextSrc = project.src;
                const tempImage = new Image();
                tempImage.onload = () => {
                    if (currentProjectIndex === index && modalImg) {
                        modalImg.src = nextSrc;
                        modalImg.style.opacity = '1';
                    }
                };
                tempImage.src = nextSrc;

                // Fallback in case of cached image
                modalImg.src = nextSrc;
                if (modalImg.complete) {
                    modalImg.style.opacity = '1';
                }
            }

            if (modalNumber) modalNumber.textContent = project.number;
            if (modalTitle) modalTitle.textContent = project.title;
            if (modalCategory) modalCategory.textContent = project.category;
            if (modalDesc) modalDesc.textContent = project.description;
        }

        let lastFocusedElement = null;

        // Open modal
        function openProjectModal(index) {
            lastFocusedElement = document.activeElement;
            displayProjectByIndex(index);

            projectModal.classList.add('is-active');
            projectModal.setAttribute('aria-hidden', 'false');

            // Lock body scroll
            document.body.style.overflow = 'hidden';

            // Move focus to modal close button for accessibility
            setTimeout(() => {
                if (modalCloseBtn) modalCloseBtn.focus();
            }, 60);
        }

        // Close modal
        function closeProjectModal() {
            if (!projectModal.classList.contains('is-active')) return;

            projectModal.classList.remove('is-active');
            projectModal.setAttribute('aria-hidden', 'true');

            // Restore body scroll
            document.body.style.overflow = '';

            // Restore focus to triggering card
            if (lastFocusedElement && typeof lastFocusedElement.focus === 'function') {
                lastFocusedElement.focus();
            }
        }

        // Event delegation for opening cards (click & touch)
        if (projectSlider) {
            projectSlider.addEventListener('click', (e) => {
                if (isDraggingSlider) return;

                const card = e.target.closest('.project-card');
                if (!card) return;

                let idx = card.dataset.index !== undefined ? parseInt(card.dataset.index, 10) : -1;
                if (idx === -1 || isNaN(idx)) {
                    const pid = parseInt(card.dataset.projectId, 10);
                    idx = !isNaN(pid) ? pid - 1 : 0;
                }
                if (idx >= 0 && idx < projectsData.length) {
                    openProjectModal(idx);
                }
            });

            // Keyboard Enter & Space activation for project cards
            projectSlider.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    const card = e.target.closest('.project-card');
                    if (!card) return;
                    e.preventDefault();

                    let idx = card.dataset.index !== undefined ? parseInt(card.dataset.index, 10) : -1;
                    if (idx === -1 || isNaN(idx)) {
                        const pid = parseInt(card.dataset.projectId, 10);
                        idx = !isNaN(pid) ? pid - 1 : 0;
                    }
                    if (idx >= 0 && idx < projectsData.length) {
                        openProjectModal(idx);
                    }
                }
            });
        }

        // Modal prev / next navigation
        if (modalPrevBtn) {
            modalPrevBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                displayProjectByIndex(currentProjectIndex - 1);
            });
        }

        if (modalNextBtn) {
            modalNextBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                displayProjectByIndex(currentProjectIndex + 1);
            });
        }

        // Close button click
        modalCloseBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            closeProjectModal();
        });

        // Overlay backdrop click
        if (modalOverlay) {
            modalOverlay.addEventListener('click', closeProjectModal);
        }

        // Click outside dialog closes modal
        projectModal.addEventListener('click', (e) => {
            if (modalDialog && !modalDialog.contains(e.target) && e.target !== modalDialog) {
                closeProjectModal();
            }
        });

        // Keyboard controls: Escape to close, Left/Right arrows to navigate inside modal, Focus trap
        window.addEventListener('keydown', (e) => {
            if (!projectModal.classList.contains('is-active')) return;

            if (e.key === 'Escape' || e.key === 'Esc') {
                closeProjectModal();
            } else if (e.key === 'ArrowLeft') {
                displayProjectByIndex(currentProjectIndex - 1);
            } else if (e.key === 'ArrowRight') {
                displayProjectByIndex(currentProjectIndex + 1);
            } else if (e.key === 'Tab') {
                // Modal Focus Trap
                const focusable = projectModal.querySelectorAll('button:not([disabled]), [tabindex]:not([tabindex="-1"])');
                if (focusable.length > 0) {
                    const first = focusable[0];
                    const last = focusable[focusable.length - 1];
                    if (e.shiftKey && document.activeElement === first) {
                        e.preventDefault();
                        last.focus();
                    } else if (!e.shiftKey && document.activeElement === last) {
                        e.preventDefault();
                        first.focus();
                    }
                }
            }
        });
    }

    /* ========================================================
       6. SECTION #CONTACT (DYNAMIC MEASUREMENT & ACCESSIBLE CTA)
       ======================================================== */
    const envelopeWrapper = document.getElementById('envelope-wrapper');
    const envelopeLetter = document.getElementById('envelope-letter');
    const envelopePocket = document.querySelector('.envelope-pocket');
    const letterActions = document.getElementById('letter-actions');
    const emailBtn = document.getElementById('contact-email-btn');
    const contactActionBtns = document.querySelectorAll('.contact-action-btn');

    // Dynamic measurement of paper travel offset based on real content & pocket height
    function updateEnvelopeTravel() {
        if (!envelopeWrapper || !envelopeLetter || !envelopePocket) return;

        const pocketH = envelopePocket.offsetHeight || 235;
        const letterH = envelopeLetter.offsetHeight || 380;

        // Front pocket top edge relative to bottom of envelope wrapper
        // The top corners begin 12px below the top of the pocket box
        const pocketTopEdgeFromBottom = pocketH - 12;

        // Measure distance from bottom of buttons (letterActions) to bottom of the paper
        let buttonsFromPaperBottom = 90;
        if (letterActions) {
            buttonsFromPaperBottom = Math.max(
                30,
                letterH - (letterActions.offsetTop + letterActions.offsetHeight)
            );
        }

        // Required: at least 24px gap between bottom of buttons and envelope front edge
        const minClearGap = 28;

        // In open state, bottom of buttons must reach: pocketTopEdgeFromBottom + minClearGap
        const targetButtonsBottomOpen = pocketTopEdgeFromBottom + minClearGap;

        // So target bottom of paper in open state is:
        const targetPaperBottomOpen = targetButtonsBottomOpen - buttonsFromPaperBottom;

        // In rest state, paper is positioned at envelope bottom
        const paperBottomAtRest = 0;

        // Calculated travel offset to ensure ALL content clears the envelope with >= 24px gap
        let calculatedTravel = Math.round(targetPaperBottomOpen - paperBottomAtRest);

        // Safe bounds
        calculatedTravel = Math.max(140, Math.min(270, calculatedTravel));

        envelopeWrapper.style.setProperty('--letter-travel', `${calculatedTravel}px`);
    }

    // Run dynamic measurement on load, window resize, and font load
    updateEnvelopeTravel();
    window.addEventListener('resize', updateEnvelopeTravel, { passive: true });
    if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(updateEnvelopeTravel);
    }

    // Email copy to clipboard with fallback
    if (emailBtn) {
        const EMAIL_ADDRESS = "faithjanessaa@gmail.com";
        const CHECK_ICON_INNER = '<polyline points="20 6 9 17 4 12"></polyline>';
        const ENVELOPE_ICON_INNER = '<rect x="2" y="4" width="20" height="16" rx="4"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path>';
        let copyTimer = null;

        emailBtn.addEventListener('click', async (e) => {
            let copied = false;
            if (navigator.clipboard && navigator.clipboard.writeText) {
                try {
                    await navigator.clipboard.writeText(EMAIL_ADDRESS);
                    copied = true;
                } catch (_) {}
            }
            if (!copied) {
                try {
                    const temp = document.createElement('textarea');
                    temp.value = EMAIL_ADDRESS;
                    temp.setAttribute('readonly', '');
                    temp.style.position = 'fixed';
                    temp.style.opacity = '0';
                    document.body.appendChild(temp);
                    temp.select();
                    copied = document.execCommand('copy');
                    document.body.removeChild(temp);
                } catch (_) {}
            }

            if (copied) {
                const labelEl = emailBtn.querySelector('.contact-btn-label');
                const iconEl = emailBtn.querySelector('.contact-btn-icon');
                const srStatusEl = emailBtn.querySelector('#email-sr-status');

                if (labelEl) labelEl.textContent = 'Copied!';
                if (iconEl) {
                    iconEl.innerHTML = CHECK_ICON_INNER;
                    iconEl.setAttribute('stroke-width', '2.5');
                }
                if (srStatusEl) srStatusEl.textContent = 'Email address copied to clipboard';
                emailBtn.classList.add('is-copied');

                clearTimeout(copyTimer);
                copyTimer = setTimeout(() => {
                    if (labelEl) labelEl.textContent = 'Email';
                    if (iconEl) {
                        iconEl.innerHTML = ENVELOPE_ICON_INNER;
                        iconEl.setAttribute('stroke-width', '2');
                    }
                    if (srStatusEl) srStatusEl.textContent = '';
                    emailBtn.classList.remove('is-copied');
                }, 2200);
            }
        });
    }

    // Gentle button ripple effect
    contactActionBtns.forEach(btn => {
        btn.addEventListener('click', function(e) {
            const rect = this.getBoundingClientRect();
            const ripple = document.createElement('span');
            ripple.className = 'btn-ripple';
            const size = Math.max(rect.width, rect.height) * 1.6;
            const x = e.clientX - rect.left - size / 2;
            const y = e.clientY - rect.top - size / 2;

            ripple.style.cssText = `
                position: absolute;
                border-radius: 50%;
                width: ${size}px;
                height: ${size}px;
                left: ${x}px;
                top: ${y}px;
                background: rgba(255, 255, 255, 0.5);
                transform: scale(0);
                animation: rippleAnim 0.6s linear;
                pointer-events: none;
            `;

            this.appendChild(ripple);
            setTimeout(() => ripple.remove(), 600);
        });
    });
});
