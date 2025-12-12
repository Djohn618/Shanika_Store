// Initialize location page functionality
document.addEventListener('DOMContentLoaded', function() {
  initializeLocationAnimations();
  initializeContactForm();
  initializeDirectionsButton();
});

function initializeLocationAnimations() {
  const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
  };
  
  const observer = new IntersectionObserver(function(entries) {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('animated');
      }
    });
  }, observerOptions);
  
  // Observe elements that should animate on scroll
  const animateElements = document.querySelectorAll(
    '.detail-card, .landmark-card, .contact-feature, .map-container'
  );
  
  animateElements.forEach((el, index) => {
    el.classList.add('animate-on-scroll');
    el.style.animationDelay = `${index * 0.1}s`;
    observer.observe(el);
  });
}

function initializeContactForm() {
  const form = document.getElementById('contactForm');
  
  if (form) {
    form.addEventListener('submit', handleFormSubmit);
    
    // Add real-time validation
    const inputs = form.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
      input.addEventListener('blur', validateField);
      input.addEventListener('input', clearFieldError);
    });
  }
}

function handleFormSubmit(e) {
  e.preventDefault();
  
  const form = e.target;
  const formData = new FormData(form);
  
  // Validate form
  if (!validateForm(form)) {
    return;
  }
  
  // Show loading state
  form.classList.add('loading');
  
  // Simulate form submission (replace with actual submission logic)
  setTimeout(() => {
    form.classList.remove('loading');
    showFormSuccess();
    form.reset();
  }, 2000);
}

function validateForm(form) {
  let isValid = true;
  const requiredFields = form.querySelectorAll('[required]');
  
  requiredFields.forEach(field => {
    if (!validateField({ target: field })) {
      isValid = false;
    }
  });
  
  return isValid;
}

function validateField(e) {
  const field = e.target;
  const value = field.value.trim();
  let isValid = true;
  
  // Remove existing error
  clearFieldError(e);
  
  // Check if required field is empty
  if (field.hasAttribute('required') && !value) {
    showFieldError(field, 'This field is required');
    isValid = false;
  }
  
  // Email validation
  if (field.type === 'email' && value) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      showFieldError(field, 'Please enter a valid email address');
      isValid = false;
    }
  }
  
  // Phone validation (basic)
  if (field.type === 'tel' && value) {
    const phoneRegex = /^[\+]?[0-9\s\-\(\)]{10,}$/;
    if (!phoneRegex.test(value)) {
      showFieldError(field, 'Please enter a valid phone number');
      isValid = false;
    }
  }
  
  return isValid;
}

function showFieldError(field, message) {
  field.style.borderColor = '#ef4444';
  
  // Create error message if it doesn't exist
  let errorMsg = field.parentNode.querySelector('.error-message');
  if (!errorMsg) {
    errorMsg = document.createElement('div');
    errorMsg.className = 'error-message';
    errorMsg.style.color = '#ef4444';
    errorMsg.style.fontSize = '0.875rem';
    errorMsg.style.marginTop = '0.25rem';
    field.parentNode.appendChild(errorMsg);
  }
  
  errorMsg.textContent = message;
}

function clearFieldError(e) {
  const field = e.target;
  field.style.borderColor = '';
  
  const errorMsg = field.parentNode.querySelector('.error-message');
  if (errorMsg) {
    errorMsg.remove();
  }
}

function showFormSuccess() {
  // Create success message
  const successMsg = document.createElement('div');
  successMsg.className = 'success-message';
  successMsg.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: #10b981;
    color: white;
    padding: 1rem 2rem;
    border-radius: 0.5rem;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    animation: fadeInUp 0.3s ease;
  `;
  successMsg.innerHTML = `
    <div style="display: flex; align-items: center; gap: 0.5rem;">
      <i class="fas fa-check-circle"></i>
      <span>Message sent successfully! We'll get back to you soon.</span>
    </div>
  `;
  
  document.body.appendChild(successMsg);
  
  // Remove success message after 3 seconds
  setTimeout(() => {
    successMsg.style.animation = 'fadeOut 0.3s ease';
    setTimeout(() => {
      successMsg.remove();
    }, 300);
  }, 3000);
}

function initializeDirectionsButton() {
  const directionsBtn = document.querySelector('.directions-btn');
  
  if (directionsBtn) {
    directionsBtn.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Coordinates for Trincomalee (approximate)
      const lat = 8.5874;
      const lng = 81.2152;
      
      // Try to open in Google Maps app first, fallback to web
      const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
      
      // Add click animation
      this.style.transform = 'scale(0.95)';
      setTimeout(() => {
        this.style.transform = '';
        window.open(googleMapsUrl, '_blank');
      }, 150);
    });
  }
}

// Add hover effects to detail cards
document.querySelectorAll('.detail-card').forEach(card => {
  card.addEventListener('mouseenter', function() {
    this.style.transform = 'translateY(-8px) scale(1.02)';
  });
  
  card.addEventListener('mouseleave', function() {
    this.style.transform = '';
  });
});

// Add click effects to landmark cards
document.querySelectorAll('.landmark-card').forEach(card => {
  card.addEventListener('click', function() {
    this.style.transform = 'scale(0.98)';
    setTimeout(() => {
      this.style.transform = '';
    }, 150);
  });
});

// Parallax effect for map section
window.addEventListener('scroll', function() {
  const scrolled = window.pageYOffset;
  const mapSection = document.querySelector('.map-section');
  
  if (mapSection) {
    const rect = mapSection.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
    
    if (isVisible) {
      const speed = scrolled * 0.1;
      mapSection.style.transform = `translateY(${speed}px)`;
    }
  }
});

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translate(-50%, -40%);
    }
    to {
      opacity: 1;
      transform: translate(-50%, -50%);
    }
  }
  
  @keyframes fadeOut {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

