document.addEventListener('DOMContentLoaded', () => {
    
    /* ==========================================
       1. HEADER SCROLL EFFECT
       ========================================== */
    const header = document.getElementById('main-header');
    
    window.addEventListener('scroll', () => {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    /* ==========================================
       2. MOBILE MENU TOGGLE
       ========================================== */
    const mobileToggle = document.getElementById('mobile-nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const toggleIcon = mobileToggle.querySelector('i');
    
    mobileToggle.addEventListener('click', () => {
        navMenu.classList.toggle('active');
        
        // Change icon between burger menu and cross icon
        if (navMenu.classList.contains('active')) {
            toggleIcon.classList.remove('fa-bars-staggered');
            toggleIcon.classList.add('fa-xmark');
        } else {
            toggleIcon.classList.remove('fa-xmark');
            toggleIcon.classList.add('fa-bars-staggered');
        }
    });

    // Close menu when clicking on any link
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', () => {
            navMenu.classList.remove('active');
            toggleIcon.classList.remove('fa-xmark');
            toggleIcon.classList.add('fa-bars-staggered');
        });
    });

    /* ==========================================
       3. ACTIVE LINK STATE ON SCROLL
       ========================================== */
    const sections = document.querySelectorAll('section');
    
    window.addEventListener('scroll', () => {
        let currentSectionId = 'home';
        
        sections.forEach(section => {
            const sectionTop = section.offsetTop;
            const sectionHeight = section.clientHeight;
            
            // Adjust offset for sticky header height
            if (window.scrollY >= (sectionTop - 120)) {
                currentSectionId = section.getAttribute('id');
            }
        });
        
        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.getAttribute('href') === `#${currentSectionId}`) {
                link.classList.add('active');
            }
        });
    });

    /* ==========================================
       4. 3D FLIPBOOK MENU LOGIC
       ========================================== */
    const book = document.getElementById('menu-book');
    const bookPages = document.querySelectorAll('.book-page');
    const prevBtn = document.getElementById('book-prev-btn');
    const nextBtn = document.getElementById('book-next-btn');
    const N = bookPages.length;

    function updateZIndexes() {
        bookPages.forEach((page, index) => {
            const i = index + 1; // 1-indexed
            const isFlipped = page.classList.contains('flipped');
            if (isFlipped) {
                page.style.zIndex = i;
            } else {
                page.style.zIndex = N - i + 1;
            }
        });
    }

    function updateBookPosition() {
        // Book is always open, centered on the spine
        book.style.transform = 'translateX(0)';
    }

    // Initialize z-indexes and position
    updateZIndexes();
    updateBookPosition();

    // Next page navigation click (Flips the next unflipped page, except the very last sheet)
    nextBtn.addEventListener('click', () => {
        const unflippedPages = Array.from(bookPages).filter((p, index) => !p.classList.contains('flipped') && index < N - 1);
        if (unflippedPages.length > 0) {
            const pageToFlip = unflippedPages[0];
            pageToFlip.style.zIndex = 100; // Put on top during rotation
            pageToFlip.classList.add('flipped');
            setTimeout(() => {
                updateZIndexes();
            }, 800);
        }
    });

    // Prev page navigation click (Unflips the last flipped page, except the very first sheet)
    prevBtn.addEventListener('click', () => {
        const flippedPages = Array.from(bookPages).filter((p, index) => p.classList.contains('flipped') && index > 0);
        if (flippedPages.length > 0) {
            const pageToUnflip = flippedPages[flippedPages.length - 1];
            pageToUnflip.style.zIndex = 100; // Put on top during rotation
            pageToUnflip.classList.remove('flipped');
            setTimeout(() => {
                updateZIndexes();
            }, 800);
        }
    });

    // Flip page by clicking the page sides (excluding first and last sheet to prevent closing the book)
    bookPages.forEach((page, index) => {
        // First and last sheet are permanent boundaries
        if (index === 0 || index === N - 1) return;

        const front = page.querySelector('.page-front');
        const back = page.querySelector('.page-back');
        
        front.addEventListener('click', () => {
            page.style.zIndex = 100;
            page.classList.add('flipped');
            setTimeout(() => {
                updateZIndexes();
            }, 800);
        });
        
        back.addEventListener('click', () => {
            page.style.zIndex = 100;
            page.classList.remove('flipped');
            setTimeout(() => {
                updateZIndexes();
            }, 800);
        });
    });

    /* ==========================================
       5. FORM DATE MIN VALIDATION
       ========================================== */
    const dateInput = document.getElementById('form-date');
    if (dateInput) {
        const today = new Date();
        const dd = String(today.getDate()).padStart(2, '0');
        const mm = String(today.getMonth() + 1).padStart(2, '0'); // January is 0!
        const yyyy = today.getFullYear();
        
        const todayFormatted = `${yyyy}-${mm}-${dd}`;
        dateInput.min = todayFormatted;
        dateInput.value = todayFormatted; // Set default date to today
    }
    
    // Set default time to current time + 1 hour (rounded to next 15/30 mins if needed, or simple hour)
    const timeInput = document.getElementById('form-time');
    if (timeInput) {
        const now = new Date();
        let hours = String((now.getHours() + 1) % 24).padStart(2, '0');
        // Bound to restaurant opening hours (10:00 - 23:00)
        if (parseInt(hours) < 10) hours = '10';
        if (parseInt(hours) > 23) hours = '22';
        timeInput.value = `${hours}:00`;
    }

    /* ==========================================
       6. RESERVATION FORM SUBMISSION
       ========================================== */
    const reservationForm = document.getElementById('reservation-form');
    const submitBtn = document.getElementById('form-submit');
    const toast = document.getElementById('toast-success');
    const toastCode = document.getElementById('toast-booking-code');
    const toastClose = document.getElementById('toast-close-btn');
    let toastTimeout;
    
    if (reservationForm) {
        reservationForm.addEventListener('submit', (e) => {
            e.preventDefault();
            
            // Disable submit button and show loading text
            submitBtn.disabled = true;
            const originalBtnText = submitBtn.innerHTML;
            submitBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Đang Đăng Ký Đặt Bàn...';
            
            // Retrieve field values for potential API integrations
            const name = document.getElementById('form-name').value;
            const phone = document.getElementById('form-phone').value;
            const guests = document.getElementById('form-guests').value;
            const date = document.getElementById('form-date').value;
            const time = document.getElementById('form-time').value;
            const note = document.getElementById('form-note').value;
            
            // Simulate server network latency (1.5 seconds)
            setTimeout(() => {
                // Re-enable submit button
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
                
                // Generate a random booking code
                const randomNum = Math.floor(1000 + Math.random() * 9000);
                const bookingCode = `#BB-${randomNum}`;
                
                // Set booking code in toast notification
                toastCode.textContent = bookingCode;
                
                // Open Toast Notification
                toast.classList.add('active');
                
                // Reset form fields
                reservationForm.reset();
                // Reset default date & time
                if (dateInput) {
                    const today = new Date().toISOString().split('T')[0];
                    dateInput.value = today;
                }
                if (timeInput) {
                    const now = new Date();
                    let hours = String((now.getHours() + 1) % 24).padStart(2, '0');
                    if (parseInt(hours) < 10) hours = '10';
                    if (parseInt(hours) > 23) hours = '22';
                    timeInput.value = `${hours}:00`;
                }
                
                // Clear any existing toast auto-close timeout
                clearTimeout(toastTimeout);
                
                // Auto-close Toast after 7 seconds
                toastTimeout = setTimeout(() => {
                    toast.classList.remove('active');
                }, 7000);
                
            }, 1500);
        });
    }
    
    // Close toast button click
    if (toastClose) {
        toastClose.addEventListener('click', () => {
            toast.classList.remove('active');
            clearTimeout(toastTimeout);
        });
    }

    /* ==========================================
       7. HERO ROTATING CIRCULAR SHOWCASE LOGIC
       ========================================== */
    const heroDotsRing = document.getElementById('hero-dots-ring');
    const heroDots = document.querySelectorAll('.showcase-dot');
    const heroDishes = document.querySelectorAll('.dish-item');
    const heroDishTag = document.getElementById('hero-dish-tag');
    
    const dishNames = [
        "Tôm Hùm Nướng Phô Mai",
        "Cua Hoàng Đế Trứng Muối",
        "Hàu Sữa Nướng Mỡ Hành",
        "Cá Hồi Sốt Chanh Leo"
    ];
    
    let activeHeroIndex = 0;
    let heroRotationInterval;
    
    function switchHeroDish(index) {
        if (index === activeHeroIndex) return;
        
        activeHeroIndex = index;
        
        // 1. Rotate outer dots ring (bring selected dot to top: rotate by -index * 90deg)
        const rotationAngle = -index * 90;
        if (heroDotsRing) {
            heroDotsRing.style.transform = `rotate(${rotationAngle}deg)`;
        }
        
        // 2. Keep the preview dot images upright by counter-rotating them
        heroDots.forEach((dot) => {
            const dotInner = dot.querySelector('.dot-inner');
            if (dotInner) {
                dotInner.style.transform = `rotate(${-rotationAngle}deg)`;
            }
            
            // Toggle active styling
            const dotIndex = parseInt(dot.getAttribute('data-index'));
            if (dotIndex === index) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
        
        // 3. Switch active dish in central display
        heroDishes.forEach((dish) => {
            const dishIndex = parseInt(dish.getAttribute('data-index'));
            if (dishIndex === index) {
                dish.classList.add('active');
            } else {
                dish.classList.remove('active');
            }
        });
        
        // 4. Update detail badge tag with smooth fade
        if (heroDishTag) {
            heroDishTag.style.opacity = '0';
            setTimeout(() => {
                heroDishTag.textContent = dishNames[index];
                heroDishTag.style.opacity = '1';
            }, 300);
        }
    }
    
    // Add click event triggers for each preview dot
    heroDots.forEach((dot) => {
        dot.addEventListener('click', () => {
            const index = parseInt(dot.getAttribute('data-index'));
            switchHeroDish(index);
            resetHeroAutoplay();
        });
    });
    
    // Autoplay interval
    function startHeroAutoplay() {
        heroRotationInterval = setInterval(() => {
            let nextIndex = (activeHeroIndex + 1) % heroDishes.length;
            switchHeroDish(nextIndex);
        }, 4000);
    }
    
    function resetHeroAutoplay() {
        clearInterval(heroRotationInterval);
        startHeroAutoplay();
    }
    
    // Auto-run carousel if elements exist on page
    if (heroDotsRing && heroDots.length > 0 && heroDishes.length > 0) {
        startHeroAutoplay();
        
        // Initialize dots upright on page load
        heroDots.forEach((dot) => {
            const dotInner = dot.querySelector('.dot-inner');
            if (dotInner) {
                dotInner.style.transform = 'rotate(0deg)';
            }
        });
    }
});
