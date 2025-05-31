document.addEventListener('DOMContentLoaded', function() {
    // Mobile Menu Toggle
    const mobileMenuBtn = document.querySelector('.mobile-menu-btn');
    const mobileMenu = document.querySelector('.mobile-menu');
    
    mobileMenuBtn.addEventListener('click', function() {
        mobileMenu.classList.toggle('active');
    });
    
    // Mobile Dropdown Toggle
    const mobileDropdowns = document.querySelectorAll('.mobile-dropdown');
    
    mobileDropdowns.forEach(dropdown => {
        dropdown.addEventListener('click', function(e) {
            e.preventDefault();
            const menu = this.querySelector('.mobile-dropdown-menu');
            menu.classList.toggle('active');
        });
    });
    
    // Close mobile menu when clicking outside
    document.addEventListener('click', function(e) {
        if (!mobileMenu.contains(e.target) && !mobileMenuBtn.contains(e.target)) {
            mobileMenu.classList.remove('active');
        }
    });
    
    // Smooth scrolling for anchor links
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            if (targetId === '#') return;
            
            const targetElement = document.querySelector(targetId);
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 80,
                    behavior: 'smooth'
                });
                
                // Close mobile menu if open
                mobileMenu.classList.remove('active');
            }
        });
    });
    
    // Add active class to current page in navigation
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';
    const navLinks = document.querySelectorAll('.nav-links a, .mobile-menu a');
    
    navLinks.forEach(link => {
        const linkPage = link.getAttribute('href').split('/').pop();
        
        if (linkPage === currentPage) {
            link.classList.add('active');
            
            // If this is in a dropdown, also highlight the parent
            let parent = link.closest('.dropdown-menu');
            if (parent) {
                const dropdownToggle = document.querySelector(`.dropdown a[href="#"]`);
                if (dropdownToggle) {
                    dropdownToggle.classList.add('active');
                }
            }
        }
    });
});