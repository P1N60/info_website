// Mobile dropdown toggle
document.addEventListener('DOMContentLoaded', function() {
    const dropdown = document.querySelector('.dropdown');
    if (!dropdown) return;
    
    const dropdownBtn = dropdown.querySelector('.dropdown-btn');
    
    dropdownBtn.addEventListener('click', function(e) {
        if (window.innerWidth <= 768) {
            e.preventDefault();
            dropdown.classList.toggle('active');
        }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', function(e) {
        if (!dropdown.contains(e.target) && window.innerWidth <= 768) {
            dropdown.classList.remove('active');
        }
    });
    
    // Close dropdown when window is resized above mobile breakpoint
    window.addEventListener('resize', function() {
        if (window.innerWidth > 768) {
            dropdown.classList.remove('active');
        }
    });
});
