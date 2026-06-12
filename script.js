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
    /* ==========================================
       8. FEATURED DISHES DATA & DYNAMIC RENDER
       ========================================== */
    const featuredDishes = [
        {
            id: 1,
            image: "img/monan/1.jpg",
            tag: "Bán Chạy",
            rating: 4.9,
            stars: 5,
            title: "Tôm Hùm Nướng Phô Mai",
            desc: "Tôm hùm bông tươi sống nướng sốt phô mai đút lò thơm ngậy béo mịn kiểu Pháp."
        },
        {
            id: 2,
            image: "img/monan/2.jpg",
            tag: "Signature",
            rating: 5.0,
            stars: 5,
            title: "Cua Hoàng Đế Sốt Trứng Muối",
            desc: "Cua Alaska khổng lồ hấp chín, phủ đẫm sốt trứng muối sánh mịn, thơm bùi đậm đà."
        },
        {
            id: 3,
            image: "img/monan/3.jpg",
            tag: "Ưa Thích",
            rating: 4.8,
            stars: 4.5,
            title: "Hàu Sữa Nướng Mỡ Hành",
            desc: "Hàu sữa béo mọng nướng trên than hồng, xèo xèo mỡ hành thơm lừng, lạc rang giòn rụm."
        },
        {
            id: 4,
            image: "img/monan/4.jpg",
            tag: "Mới",
            rating: 4.9,
            stars: 5,
            title: "Cá Hồi Áp Chảo Chanh Leo",
            desc: "Cá hồi Nauy áp chảo da giòn, thịt ẩm mềm quyện sốt chanh leo chua ngọt thơm mát thanh tao."
        },
        {
            id: 5,
            image: "img/monan/5.png",
            tag: "Bán Chạy",
            rating: 5.0,
            stars: 5,
            title: "Lẩu Hải Sản Bé Biển",
            desc: "Nước lẩu chua cay đậm đà chuẩn vị biển khơi, đầy ắp tôm hùm, cua, mực tươi rói và nấm rau thanh mát."
        },
        {
            id: 6,
            image: "img/monan/6.png",
            tag: "Đặc Sản",
            rating: 4.9,
            stars: 5,
            title: "Mực Lá Nướng Sa Tế",
            desc: "Mực lá dày mình ngọt lịm nướng sốt sa tế đặc chế, thơm cay đậm đà đánh thức mọi giác quan."
        },
        {
            id: 7,
            image: "img/monan/7.png",
            tag: "Ưa Thích",
            rating: 4.8,
            stars: 4.5,
            title: "Ghẹ Đỏ Hấp Bia Sả",
            desc: "Ghẹ đỏ tươi rói bắt tại hồ, hấp bia sả giữ trọn vẹn vị ngọt thanh thuần khiết từ biển khơi."
        },
        {
            id: 8,
            image: "img/monan/8.png",
            tag: "Mới",
            rating: 5.0,
            stars: 5,
            title: "Sò Điệp Nướng Phô Mai",
            desc: "Sò điệp cồi to mập mạp nướng sốt phô mai kéo sợi thơm ngậy kết hợp hành phi giòn bùi."
        },
        {
            id: 9,
            image: "img/monan/9.png",
            tag: "Bán Chạy",
            rating: 4.9,
            stars: 5,
            title: "Tôm Sú Sốt Bơ Tỏi",
            desc: "Tôm sú lớn nướng bơ tỏi thơm lừng, thịt tôm ngọt dai đẫm sốt bơ béo ngậy."
        },
        {
            id: 10,
            image: "img/monan/10.png",
            tag: "Đặc Sản",
            rating: 4.9,
            stars: 5,
            title: "Ốc Hương Rang Muối Ớt",
            desc: "Ốc hương tươi giòn sần sật rang cùng muối ớt cay nồng đậm vị quyến rũ."
        },
        {
            id: 11,
            image: "img/monan/11.png",
            tag: "Mới",
            rating: 5.0,
            stars: 5,
            title: "Cua Lột Chiên Giòn Sốt Me",
            desc: "Cua lột nguyên con tẩm bột chiên giòn rụm, quyện sốt me chua ngọt đậm đà hấp dẫn."
        },
        {
            id: 12,
            image: "img/monan/12.png",
            tag: "Đặc Sắc",
            rating: 5.0,
            stars: 5,
            title: "Cá Mú Hấp Hồng Kông",
            desc: "Cá mú đỏ tươi hấp cùng hành gừng và nước tương đặc chế chuẩn vị nhà hàng Hồng Kông."
        }
    ];

    const featuredScrollInner = document.getElementById('featured-scroll-inner');
    if (featuredScrollInner) {
        featuredScrollInner.innerHTML = featuredDishes.map(dish => {
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
                        <span class="dish-tag">${dish.tag}</span>
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
       9. FEATURED DISHES CAROUSEL SCROLL
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
        
        featuredPrevBtn.addEventListener('click', () => {
            scrollWrapper.scrollBy({
                left: -scrollAmount(),
                behavior: 'smooth'
            });
        });
        
        featuredNextBtn.addEventListener('click', () => {
            scrollWrapper.scrollBy({
                left: scrollAmount(),
                behavior: 'smooth'
            });
        });
        
        const toggleButtons = () => {
            const scrollLeft = scrollWrapper.scrollLeft;
            const maxScrollLeft = scrollWrapper.scrollWidth - scrollWrapper.clientWidth;
            
            if (scrollLeft <= 5) {
                featuredPrevBtn.style.opacity = '0.3';
                featuredPrevBtn.style.pointerEvents = 'none';
            } else {
                featuredPrevBtn.style.opacity = '1';
                featuredPrevBtn.style.pointerEvents = 'auto';
            }
            
            if (scrollLeft >= maxScrollLeft - 5) {
                featuredNextBtn.style.opacity = '0.3';
                featuredNextBtn.style.pointerEvents = 'none';
            } else {
                featuredNextBtn.style.opacity = '1';
                featuredNextBtn.style.pointerEvents = 'auto';
            }
        };
        
        scrollWrapper.addEventListener('scroll', toggleButtons);
        window.addEventListener('resize', toggleButtons);
        
        // Initial delay to wait for rendering
        setTimeout(toggleButtons, 500);
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
});

