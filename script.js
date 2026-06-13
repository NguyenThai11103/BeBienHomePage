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
       2. MOBILE MENU TOGGLE WITH BACKDROP
       ========================================== */
    const mobileToggle = document.getElementById('mobile-nav-toggle');
    const navMenu = document.getElementById('nav-menu');
    const navBackdrop = document.getElementById('nav-backdrop');
    const toggleIcon = mobileToggle.querySelector('i');
    
    function closeMobileMenu() {
        navMenu.classList.remove('active');
        if (navBackdrop) navBackdrop.classList.remove('active');
        toggleIcon.classList.remove('fa-xmark');
        toggleIcon.classList.add('fa-bars-staggered');
    }

    mobileToggle.addEventListener('click', () => {
        const isActive = navMenu.classList.toggle('active');
        if (navBackdrop) navBackdrop.classList.toggle('active', isActive);
        
        // Change icon between burger menu and cross icon
        if (isActive) {
            toggleIcon.classList.remove('fa-bars-staggered');
            toggleIcon.classList.add('fa-xmark');
        } else {
            toggleIcon.classList.remove('fa-xmark');
            toggleIcon.classList.add('fa-bars-staggered');
        }
    });

    // Close menu when clicking on backdrop
    if (navBackdrop) {
        navBackdrop.addEventListener('click', closeMobileMenu);
    }

    // Close menu when clicking on any link
    const navLinks = document.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
        link.addEventListener('click', closeMobileMenu);
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
            
            // Generate a random booking code
            const randomNum = Math.floor(1000 + Math.random() * 9000);
            const bookingCode = `#BB-${randomNum}`;
            
            const payload = {
                bookingCode: bookingCode,
                name: name,
                phone: phone,
                guests: guests,
                date: date,
                time: time,
                note: note
            };

            // URL ứng dụng web Google Apps Script của chủ quán
            const webAppUrl = 'https://script.google.com/macros/s/AKfycbzABW39jdgEuSeZD6fTVJUWOgB_cQPF9gxyQiwlQmqqVoq6Z_yl1MHmGg6h9VRHS6nNag/exec';

            // Gửi dữ liệu đặt bàn thực tế lên Google Sheets & Telegram Bot
            fetch(webAppUrl, {
                method: 'POST',
                mode: 'no-cors', // Sử dụng no-cors để tránh bị chặn bởi chính sách CORS khi redirect
                headers: {
                    'Content-Type': 'text/plain'
                },
                body: JSON.stringify(payload)
            })
            .then(() => {
                // Mở lại nút Đặt bàn
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
                
                // Hiển thị mã đặt bàn trong thông báo thành công
                toastCode.textContent = bookingCode;
                
                // Mở thông báo toast thành công
                toast.classList.add('active');
                
                // Reset form nhập liệu
                reservationForm.reset();
                // Reset lại ngày giờ mặc định
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
                
                // Xoá timeout đóng toast cũ nếu có
                clearTimeout(toastTimeout);
                
                // Tự động đóng toast sau 7 giây
                toastTimeout = setTimeout(() => {
                    toast.classList.remove('active');
                }, 7000);
            })
            .catch((error) => {
                console.error('Lỗi khi gửi thông tin đặt bàn:', error);
                alert('Có lỗi xảy ra khi đăng ký đặt bàn. Vui lòng kiểm tra lại kết nối mạng hoặc liên hệ trực tiếp với chúng tôi!');
                submitBtn.disabled = false;
                submitBtn.innerHTML = originalBtnText;
            });
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
       7. HERO RADIAL SHOWCASE AUTO-ROTATE
       ========================================== */
    const radialSats = document.querySelectorAll('.radial-sat');
    let radialActiveIndex = 0;
    
    function switchRadialActive(index) {
        radialSats.forEach((sat, i) => {
            sat.classList.toggle('active', i === index);
        });
    }
    
    if (radialSats.length > 0) {
        // Set first item as active initially
        switchRadialActive(0);
        
        // Automatically switch active highlight every 4 seconds
        setInterval(() => {
            radialActiveIndex = (radialActiveIndex + 1) % radialSats.length;
            switchRadialActive(radialActiveIndex);
        }, 4000);
        
        // Add click listener to satellites
        radialSats.forEach((sat, i) => {
            sat.addEventListener('click', () => {
                radialActiveIndex = i;
                switchRadialActive(radialActiveIndex);
            });
        });
    }
        const featuredDishes = [
        {
            id: 1,
            image: "img/monan/tomsubotoi.png",
            tag: "Bán Chạy",
            rating: 4.9,
            stars: 5,
            title: "Tôm Sú Bơ Tỏi",
            desc: "Tôm sú tươi ngon chiên cháy tỏi thơm lừng quyện sốt bơ béo ngậy đậm đà."
        },
        {
            id: 2,
            image: "img/monan/tomhumhap.png",
            tag: "Đặc Sản",
            rating: 5.0,
            stars: 5,
            title: "Tôm Hùm Hấp",
            desc: "Tôm hùm tươi sống hấp nhiệt giữ trọn vị ngọt thanh tự nhiên cực kỳ săn chắc."
        },
        {
            id: 3,
            image: "img/monan/cuaxao.png",
            tag: "Signature",
            rating: 4.9,
            stars: 5,
            title: "Cua Xào",
            desc: "Cua biển chắc thịt xào cùng sốt đặc chế đậm đà thơm ngon khó cưỡng."
        },
        {
            id: 4,
            image: "img/monan/haunuongmohanh.png",
            tag: "Ưa Thích",
            rating: 4.8,
            stars: 4.5,
            title: "Hàu Nướng Mỡ Hành",
            desc: "Hàu sữa béo mọng nướng trên than hồng, xèo xèo mỡ hành thơm lừng và lạc rang giòn bùi."
        },
        {
            id: 5,
            image: "img/monan/sodiepphomai.png",
            tag: "Mới",
            rating: 4.9,
            stars: 5,
            title: "Sò Điệp Phô Mai",
            desc: "Sò điệp cồi to mập mạp nướng sốt phô mai kéo sợi thơm ngậy béo mịn."
        },
        {
            id: 6,
            image: "img/monan/ochuongsotbotoi.png",
            tag: "Đặc Sản",
            rating: 4.8,
            stars: 4.5,
            title: "Ốc Hương Hấp",
            desc: "Ốc hương tự nhiên hấp sả gừng giữ nguyên độ giòn sần sật và vị ngọt thanh đặc trưng."
        },
        {
            id: 7,
            image: "img/monan/tomtitchaytoi.png",
            tag: "Bán Chạy",
            rating: 4.9,
            stars: 5,
            title: "Tôm Tít Cháy Tỏi",
            desc: "Tôm tít (bề bề) thịt ngọt đậm đà, cháy tỏi giòn tan thơm lừng kích thích vị giác."
        },
        {
            id: 8,
            image: "img/monan/muclanuong.png",
            tag: "Signature",
            rating: 5.0,
            stars: 5,
            title: "Mực Lá Nướng",
            desc: "Mực lá dày mình ngọt lịm nướng mọi hoặc nướng sa tế thơm phức dai giòn."
        },
        {
            id: 9,
            image: "img/monan/comchienhaisan.png",
            tag: "Ưa Thích",
            rating: 4.7,
            stars: 4.5,
            title: "Cơm Chiên Hải Sản",
            desc: "Hạt cơm vàng óng tơi xốp chiên cùng tôm, mực tươi roi rói và rau củ thanh ngọt."
        },
        {
            id: 10,
            image: "img/monan/lauhaisan.png",
            tag: "Bán Chạy",
            rating: 5.0,
            stars: 5,
            title: "Lẩu Hải Sản",
            desc: "Nước lẩu chua cay đậm đà, đầy ắp tôm, mực, cá tươi cùng các loại rau nấm thanh mát."
        },
        {
            id: 11,
            image: "img/monan/chipchiphap.png",
            tag: "Đặc Sản",
            rating: 4.8,
            stars: 4.5,
            title: "Chíp Chíp Hấp",
            desc: "Chíp chíp tươi sống hấp sả ớt cay nồng, nước hấp ngọt lịm đậm vị biển."
        },
        {
            id: 12,
            image: "img/monan/camuhap.png",
            tag: "Đặc Sắc",
            rating: 5.0,
            stars: 5,
            title: "Cá Mú Hấp",
            desc: "Cá mú tươi rói hấp hành gừng chuẩn vị, giữ nguyên độ ngọt dai, béo ngậy của thịt cá."
        },
        {
            id: 13,
            image: "img/monan/raumuongxaotoi.png",
            tag: "Mới",
            rating: 4.6,
            stars: 4.5,
            title: "Rau Muống Xào Tỏi",
            desc: "Rau muống xanh mướt giòn sần sật xào cùng tỏi phi vàng thơm phức cực kỳ đưa cơm."
        }
    ];

    const featuredScrollInner = document.getElementById('featured-scroll-inner');
    if (featuredScrollInner) {
        // Double the dishes array to create a seamless infinite marquee loop
        const doubleDishes = [...featuredDishes, ...featuredDishes];
        featuredScrollInner.innerHTML = doubleDishes.map(dish => {
            let starsHTML = '';
            for (let i = 1; i <= 5; i++) {
                if (i <= Math.floor(dish.stars)) {
                    starsHTML += '<i class="fa-solid fa-star"></i>';
                } else if (i === Math.ceil(dish.stars) && dish.stars % 1 !== 0) {
                    starsHTML += '<i class="fa-regular fa-star-half-stroke"></i>';
                } else {
                    starsHTML += '<i class="fa-regular fa-star"></i>';
                }
            }

            return `
                <div class="dish-card">
                    <div class="dish-image-container">
                        <img src="${dish.image}" alt="${dish.title}" class="dish-img" loading="lazy">
                    </div>
                    <div class="dish-info">
                        <div class="dish-rating">
                            ${starsHTML}
                            <span>(${dish.rating.toFixed(1)})</span>
                        </div>
                        <h3 class="dish-title">${dish.title}</h3>
                        <p class="dish-desc">${dish.desc}</p>
                        <div class="dish-footer">
                            <a href="#contact" class="btn-dish-order-full">Đặt món ngay <i class="fa-solid fa-arrow-right"></i></a>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
    }

    /* ==========================================
       9. FEATURED DISHES INFINITE MARQUEE SCROLL (GLIDING EFFECT)
       ========================================== */
    const scrollWrapper = document.getElementById('featured-scroll-wrapper');
    const featuredPrevBtn = document.getElementById('featured-prev');
    const featuredNextBtn = document.getElementById('featured-next');
    
    if (scrollWrapper && featuredPrevBtn && featuredNextBtn) {
        const scrollAmount = () => {
            const firstCard = scrollWrapper.querySelector('.dish-card');
            if (firstCard) {
                const cardWidth = firstCard.offsetWidth;
                const gap = parseFloat(window.getComputedStyle(scrollWrapper.querySelector('.featured-scroll-inner')).gap) || 30;
                return cardWidth + gap;
            }
            return 310;
        };

        // Continuous Marquee Logic
        let speed = 0.8; // Gliding speed (pixels per frame)
        let isHovered = false;
        let isTouching = false;
        let isManualScrolling = false;
        let animationFrameId = null;

        const loopMarquee = () => {
            if (isHovered || isTouching || isManualScrolling) {
                animationFrameId = requestAnimationFrame(loopMarquee);
                return;
            }

            const currentScroll = scrollWrapper.scrollLeft;
            const firstCard = scrollWrapper.querySelector('.dish-card');
            if (!firstCard) {
                animationFrameId = requestAnimationFrame(loopMarquee);
                return;
            }

            const cardWidth = firstCard.offsetWidth;
            const gap = parseFloat(window.getComputedStyle(scrollWrapper.querySelector('.featured-scroll-inner')).gap) || 30;
            // The exact scroll width of one complete set of 4 cards
            const singleSetWidth = (cardWidth + gap) * featuredDishes.length;

            // Seamlessly wrap around if we have scrolled past the first set
            if (currentScroll >= singleSetWidth) {
                scrollWrapper.scrollLeft = currentScroll - singleSetWidth;
            } else {
                scrollWrapper.scrollLeft += speed;
            }

            animationFrameId = requestAnimationFrame(loopMarquee);
        };

        // Start marquee loop after rendering
        setTimeout(() => {
            // Ensure buttons are always visible and active in infinite mode
            featuredPrevBtn.style.opacity = '1';
            featuredPrevBtn.style.pointerEvents = 'auto';
            featuredNextBtn.style.opacity = '1';
            featuredNextBtn.style.pointerEvents = 'auto';
            
            animationFrameId = requestAnimationFrame(loopMarquee);
        }, 500);

        // Hover & Touch controls to pause/resume marquee smoothly
        scrollWrapper.addEventListener('mouseenter', () => { isHovered = true; });
        scrollWrapper.addEventListener('mouseleave', () => { isHovered = false; });
        scrollWrapper.addEventListener('touchstart', () => { isTouching = true; }, { passive: true });
        scrollWrapper.addEventListener('touchend', () => {
            isTouching = false;
            // Allow swipe momentum scroll to settle before resuming marquee
            isManualScrolling = true;
            setTimeout(() => { isManualScrolling = false; }, 1000);
        }, { passive: true });

        // Manual controls
        featuredPrevBtn.addEventListener('click', () => {
            isManualScrolling = true;
            scrollWrapper.scrollBy({
                left: -scrollAmount(),
                behavior: 'smooth'
            });
            // Resume marquee after smooth scroll finishes
            setTimeout(() => { isManualScrolling = false; }, 800);
        });

        featuredNextBtn.addEventListener('click', () => {
            isManualScrolling = true;
            // If clicking next would scroll past the singleSetWidth, wrap back first
            const currentScroll = scrollWrapper.scrollLeft;
            const firstCard = scrollWrapper.querySelector('.dish-card');
            const cardWidth = firstCard ? firstCard.offsetWidth : 280;
            const gap = parseFloat(window.getComputedStyle(scrollWrapper.querySelector('.featured-scroll-inner')).gap) || 30;
            const singleSetWidth = (cardWidth + gap) * featuredDishes.length;

            if (currentScroll >= singleSetWidth - 10) {
                scrollWrapper.scrollLeft = currentScroll - singleSetWidth;
            }

            scrollWrapper.scrollBy({
                left: scrollAmount(),
                behavior: 'smooth'
            });
            setTimeout(() => { isManualScrolling = false; }, 800);
        });
    }

    /* ==========================================
       10. TESTIMONIALS COLLAGE DYNAMIC RENDER
       ========================================== */
    const reviewImages = [
        "img/danhgia/danh_gia_1.png",
        "img/danhgia/danh_gia_2.png",
        "img/danhgia/danh_gia_3.png",
        "img/danhgia/danh_gia_4.png",
        "img/danhgia/danh_gia_5.png",
        "img/danhgia/danh_gia_6.png",
        "img/danhgia/danh_gia_7.png"
    ];

    const reviewsCollage = document.getElementById('reviews-collage');
    if (reviewsCollage) {
        // Shuffle the array of images to display them in a random order
        const shuffledReviews = [...reviewImages].sort(() => Math.random() - 0.5);
        reviewsCollage.innerHTML = shuffledReviews.map((imgSrc, index) => {
            return `
                <div class="review-image-card">
                    <img src="${imgSrc}" alt="Đánh giá khách hàng Bé Biển ${index + 1}" loading="lazy">
                </div>
            `;
        }).join('');
    }

    /* ==========================================
       11. MOBILE MENU GALLERY SLIDER
       ========================================== */
    const mobileMenuSlider = document.getElementById('mobile-menu-slider');
    const mobileMenuPrevBtn = document.getElementById('mobile-menu-prev');
    const mobileMenuNextBtn = document.getElementById('mobile-menu-next');
    const mobileMenuCounter = document.getElementById('mobile-menu-counter');

    if (mobileMenuSlider && mobileMenuPrevBtn && mobileMenuNextBtn && mobileMenuCounter) {
        // Update indicator on scroll
        mobileMenuSlider.addEventListener('scroll', () => {
            const pageIndex = Math.round(mobileMenuSlider.scrollLeft / mobileMenuSlider.clientWidth) + 1;
            mobileMenuCounter.textContent = `Trang ${pageIndex} / 18`;
        });

        // Prev page scroll
        mobileMenuPrevBtn.addEventListener('click', () => {
            mobileMenuSlider.scrollBy({
                left: -mobileMenuSlider.clientWidth,
                behavior: 'smooth'
            });
        });

        // Next page scroll
        mobileMenuNextBtn.addEventListener('click', () => {
            mobileMenuSlider.scrollBy({
                left: mobileMenuSlider.clientWidth,
                behavior: 'smooth'
            });
        });
    }

    /* ==========================================
       12. MENU LIGHTBOX ZOOM MODAL
       ========================================== */
    const lightbox = document.getElementById('menu-lightbox');
    const lightboxImg = document.getElementById('lightbox-img');
    const lightboxClose = document.getElementById('lightbox-close-btn');
    const lightboxPrev = document.getElementById('lightbox-prev-btn');
    const lightboxNext = document.getElementById('lightbox-next-btn');
    const lightboxCounter = document.getElementById('lightbox-counter');
    
    let currentLightboxPage = 1;

    function openLightbox(pageNumber) {
        currentLightboxPage = pageNumber;
        lightboxImg.src = `img/menu/${pageNumber}.png`;
        lightboxCounter.textContent = `Trang ${pageNumber} / 18`;
        lightbox.classList.add('active');
        document.body.style.overflow = 'hidden'; // Lock body scroll
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        document.body.style.overflow = ''; // Unlock body scroll
    }

    // Helper to dynamically extract page number from background image url
    const getPageNumFromBg = (element) => {
        const bg = window.getComputedStyle(element).backgroundImage;
        const match = bg.match(/menu\/(\d+)\.png/);
        return match ? parseInt(match[1]) : 1;
    };

    // 1. Bind click events for desktop book pages hover zoom button
    document.querySelectorAll('.page-front, .page-back').forEach(el => {
        const zoomBtn = document.createElement('div');
        zoomBtn.className = 'page-zoom-btn';
        zoomBtn.innerHTML = '<i class="fa-solid fa-magnifying-glass-plus"></i>';
        zoomBtn.setAttribute('title', 'Phóng to trang này');
        el.appendChild(zoomBtn);
        
        zoomBtn.addEventListener('click', (e) => {
            e.stopPropagation(); // Prevent page flipping!
            const pageNum = getPageNumFromBg(el);
            openLightbox(pageNum);
        });
    });

    // 2. Bind click events for mobile menu slider pages
    document.querySelectorAll('.mobile-menu-page').forEach(el => {
        el.addEventListener('click', () => {
            const pageNum = parseInt(el.getAttribute('data-page')) || 1;
            openLightbox(pageNum);
        });
    });

    // Lightbox navigation
    if (lightboxPrev && lightboxNext) {
        lightboxPrev.addEventListener('click', (e) => {
            e.stopPropagation();
            if (currentLightboxPage > 1) {
                openLightbox(currentLightboxPage - 1);
            }
        });

        lightboxNext.addEventListener('click', (e) => {
            e.stopPropagation();
            if (currentLightboxPage < 18) {
                openLightbox(currentLightboxPage + 1);
            }
        });
    }

    // Close lightbox triggers
    if (lightboxClose) {
        lightboxClose.addEventListener('click', closeLightbox);
    }
    if (lightbox) {
        lightbox.addEventListener('click', (e) => {
            // Click outside the image content to close
            if (e.target === lightbox || e.target.classList.contains('lightbox-content')) {
                closeLightbox();
            }
        });
    }

    // Keyboard support (Escape to close, Left/Right arrow keys to navigate)
    document.addEventListener('keydown', (e) => {
        if (!lightbox || !lightbox.classList.contains('active')) return;
        
        if (e.key === 'Escape') {
            closeLightbox();
        } else if (e.key === 'ArrowLeft' && currentLightboxPage > 1) {
            openLightbox(currentLightboxPage - 1);
        } else if (e.key === 'ArrowRight' && currentLightboxPage < 18) {
            openLightbox(currentLightboxPage + 1);
        }
    });
});

