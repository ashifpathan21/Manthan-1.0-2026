document.addEventListener("DOMContentLoaded", () => {
    
    // --- 1. Smart Navbar Logic ---
    const navbar = document.getElementById('main-nav');
    let lastScrollY = window.scrollY;

    window.addEventListener('scroll', () => {
        if (window.scrollY > lastScrollY && window.scrollY > 100) {
            // Scrolling Down -> Hide
            navbar.classList.add('nav-hidden');
        } else {
            // Scrolling Up -> Show
            navbar.classList.remove('nav-hidden');
        }
        lastScrollY = window.scrollY;
    });

    // --- 2. Intersection Observer for Animations ---
    const scenes = document.querySelectorAll('.scene');
    
    const observerOptions = {
        root: null,
        threshold: 0.25,
        rootMargin: "0px"
    };

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
            }
        });
    }, observerOptions);

    scenes.forEach(scene => {
        observer.observe(scene);
    });

    // --- 3. Smooth Scroll ---
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function (e) {
            e.preventDefault();
            const target = document.querySelector(this.getAttribute('href'));
            if(target){
                target.scrollIntoView({
                    behavior: 'smooth'
                });
            }
        });
    });

    // --- 4. Simulated Live Data Updates (Visual Flair) ---
    // This makes the "threat scan" look alive
    const threatStatus = document.querySelector('.project-status.safe');
    if(threatStatus) {
        setInterval(() => {
            threatStatus.style.opacity = '0.7';
            setTimeout(() => {
                threatStatus.style.opacity = '1';
            }, 500);
        }, 3000);
    }

    console.log("SmartHire v2.1 [Security Modules Active] Loaded");
});