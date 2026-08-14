const API_BASE = '/api';

const api = {
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('bloodconnect_token');
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    };

    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401) {
        localStorage.removeItem('bloodconnect_token');
        localStorage.removeItem('bloodconnect_user');
        if (window.location.pathname.includes('dashboard')) {
          window.location.href = '/login.html';
        }
      }
      throw new Error(data.message || 'Something went wrong');
    }

    return data;
  },

  get(endpoint) {
    return this.request(endpoint);
  },

  post(endpoint, body) {
    return this.request(endpoint, { method: 'POST', body: JSON.stringify(body) });
  },

  put(endpoint, body) {
    return this.request(endpoint, { method: 'PUT', body: JSON.stringify(body) });
  },

  delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  },
};

const auth = {
  getToken() {
    return localStorage.getItem('bloodconnect_token');
  },

  getUser() {
    const user = localStorage.getItem('bloodconnect_user');
    return user ? JSON.parse(user) : null;
  },

  setSession(token, user) {
    localStorage.setItem('bloodconnect_token', token);
    localStorage.setItem('bloodconnect_user', JSON.stringify(user));
  },

  logout() {
    localStorage.removeItem('bloodconnect_token');
    localStorage.removeItem('bloodconnect_user');
    window.location.href = '/login.html';
  },

  isLoggedIn() {
    return !!this.getToken();
  },

  requireAuth(role) {
    if (!this.isLoggedIn()) {
      window.location.href = '/login.html';
      return false;
    }
    const user = this.getUser();
    if (role && user.role !== role) {
      window.location.href = user.role === 'admin' ? '/admin-dashboard.html' : '/donor-dashboard.html';
      return false;
    }
    return true;
  },
};

function showAlert(elementId, message, type = 'success') {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.className = `alert alert-${type} show`;
  el.innerHTML = `${type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️'} ${message}`;
  el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  if (type === 'success') {
    setTimeout(() => el.classList.remove('show'), 5000);
  }
}

function hideAlert(elementId) {
  const el = document.getElementById(elementId);
  if (el) el.classList.remove('show');
}

function animateCounter(element, target, duration = 2000) {
  if (!element) return;
  const start = 0;
  const startTime = performance.now();

  function update(currentTime) {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    const current = Math.floor(start + (target - start) * eased);
    element.textContent = current.toLocaleString() + (element.dataset.suffix || '');
    if (progress < 1) requestAnimationFrame(update);
  }

  requestAnimationFrame(update);
}

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

function getAvailabilityBadge(isAvailable) {
  return isAvailable
    ? '<span class="badge badge-success">🟢 Available</span>'
    : '<span class="badge badge-gray">🔴 Unavailable</span>';
}

function getStatusBadge(status) {
  const map = {
    Pending: 'badge-warning',
    'In Progress': 'badge-info',
    Completed: 'badge-success',
    Cancelled: 'badge-gray',
    Critical: 'badge-danger',
    High: 'badge-warning',
    Medium: 'badge-info',
    Low: 'badge-gray',
    Available: 'badge-success',
    'Low Stock': 'badge-warning',
  };
  const cls = map[status] || 'badge-gray';
  return `<span class="badge ${cls}">${status}</span>`;
}

function initNavbar() {
  const navbar = document.querySelector('.navbar');
  const hamburger = document.querySelector('.hamburger');
  const mobileMenu = document.querySelector('.mobile-menu');
  const user = auth.getUser();
  const isLoggedIn = auth.isLoggedIn() && user;

  if (navbar) {
    window.addEventListener('scroll', () => {
      navbar.classList.toggle('scrolled', window.scrollY > 20);
    });
  }

  // Handle logged-in vs logged-out navigation items
  const navLinksContainer = document.querySelector('.nav-links');
  const navActions = document.querySelector('.nav-actions');

  if (isLoggedIn) {
    const dashLink = user.role === 'admin' ? '/admin-dashboard.html' : '/donor-dashboard.html';

    // Remove Login & Register from desktop nav-links
    if (navLinksContainer) {
      navLinksContainer.querySelectorAll('a').forEach((link) => {
        const href = link.getAttribute('href') || '';
        if (href.includes('login.html') || href.includes('register.html')) {
          link.remove();
        }
      });
      // Add Dashboard link to nav-links if not already present
      if (!navLinksContainer.querySelector(`a[href="${dashLink}"]`)) {
        const dashA = document.createElement('a');
        dashA.href = dashLink;
        dashA.textContent = 'Dashboard';
        navLinksContainer.appendChild(dashA);
      }
    }

    // Remove Login & Register from mobile menu
    if (mobileMenu) {
      mobileMenu.querySelectorAll('a').forEach((link) => {
        const href = link.getAttribute('href') || '';
        if (href.includes('login.html') || href.includes('register.html')) {
          link.remove();
        }
      });
    }

    // Update navActions
    if (navActions) {
      const roleBadge = user.role === 'admin'
        ? '<span class="badge badge-danger" style="font-size: 0.85rem;">🛡️ Admin</span>'
        : `<span class="badge badge-info" style="font-size: 0.85rem;">❤️ ${user.fullName ? user.fullName.split(' ')[0] : 'Donor'}</span>`;

      navActions.innerHTML = `
        ${roleBadge}
        <button onclick="auth.logout()" class="btn btn-outline btn-sm">Logout</button>
      `;
    }

    // Update mobile menu extra links
    if (mobileMenu) {
      let extraLinks = mobileMenu.querySelector('.auth-links');
      if (!extraLinks) {
        extraLinks = document.createElement('div');
        extraLinks.className = 'auth-links';
        mobileMenu.appendChild(extraLinks);
      }
      extraLinks.innerHTML = `
        <a href="${dashLink}">Dashboard</a>
        <a href="#" onclick="auth.logout(); return false;" style="color: var(--primary);">Logout</a>
      `;
    }
  }

  if (hamburger && mobileMenu) {
    hamburger.addEventListener('click', () => {
      hamburger.classList.toggle('active');
      mobileMenu.classList.toggle('open');
    });

    mobileMenu.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', () => {
        hamburger.classList.remove('active');
        mobileMenu.classList.remove('open');
      });
    });
  }

  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a, .mobile-menu a').forEach((link) => {
    const href = link.getAttribute('href') || '';
    if (href === currentPage || href === `/${currentPage}`) {
      link.classList.add('active');
    }
  });
}

function initPageLoader() {
  const loader = document.querySelector('.page-loader');
  if (loader) {
    window.addEventListener('load', () => {
      setTimeout(() => loader.classList.add('hidden'), 300);
    });
  }
}

function initSidebar() {
  const toggle = document.getElementById('sidebarToggleBtn') || document.querySelector('.sidebar-toggle');
  const sidebar = document.getElementById('sidebar') || document.querySelector('.sidebar');
  const backdrop = document.getElementById('sidebarBackdrop');
  const closeBtn = document.getElementById('sidebarCloseBtn');

  const isMobile = () => window.innerWidth <= 768;

  function openSidebar() {
    if (!sidebar) return;
    if (isMobile()) {
      sidebar.classList.add('open');
      if (backdrop) backdrop.classList.add('visible');
      document.body.style.overflow = 'hidden';
    } else {
      document.body.classList.remove('sidebar-collapsed');
    }
    if (toggle) toggle.textContent = '✕';
  }

  function closeSidebar() {
    if (!sidebar) return;
    if (isMobile()) {
      sidebar.classList.remove('open');
      if (backdrop) backdrop.classList.remove('visible');
      document.body.style.overflow = '';
    } else {
      document.body.classList.add('sidebar-collapsed');
    }
    if (toggle) toggle.textContent = '☰';
  }

  function isSidebarOpen() {
    if (isMobile()) return sidebar?.classList.contains('open');
    return !document.body.classList.contains('sidebar-collapsed');
  }

  if (toggle && sidebar) {
    toggle.addEventListener('click', () => {
      if (isSidebarOpen()) closeSidebar(); else openSidebar();
    });
  }

  if (closeBtn) closeBtn.addEventListener('click', closeSidebar);
  if (backdrop) backdrop.addEventListener('click', closeSidebar);

  // Close sidebar when a nav link is clicked (on mobile)
  document.querySelectorAll('.sidebar-nav a').forEach((link) => {
    link.addEventListener('click', () => {
      if (isMobile()) closeSidebar();
    });
  });

  // On resize, reset states
  window.addEventListener('resize', () => {
    if (!isMobile()) {
      sidebar?.classList.remove('open');
      if (backdrop) backdrop.classList.remove('visible');
      document.body.style.overflow = '';
    }
  });

  // Active nav link
  const currentPage = window.location.pathname.split('/').pop();
  document.querySelectorAll('.sidebar-nav a').forEach((link) => {
    const href = link.getAttribute('href');
    if (href === currentPage || href === `/${currentPage}`) {
      link.classList.add('active');
    }
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initNavbar();
  initPageLoader();
  initSidebar();
});
