document.addEventListener('DOMContentLoaded', () => {
  if (auth.isLoggedIn()) {
    const user = auth.getUser();
    window.location.href = user?.role === 'admin' ? '/admin-dashboard.html' : '/donor-dashboard.html';
    return;
  }

  const form = document.getElementById('loginForm');
  const alertId = 'login-alert';
  const submitBtn = document.getElementById('submitBtn');
  const tabs = document.querySelectorAll('.login-tab');
  let selectedRole = 'donor';

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      tab.classList.add('active');
      selectedRole = tab.dataset.role;
    });
  });

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert(alertId);

      const email = form.email.value.trim();
      const password = form.password.value;

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading-spinner"></span> Signing in...';

        const res = await api.post('/auth/login', { email, password, role: selectedRole });
        auth.setSession(res.token, res.user);

        showAlert(alertId, res.message || 'Login successful!', 'success');

        setTimeout(() => {
          window.location.href = res.user.role === 'admin' ? '/admin-dashboard.html' : '/donor-dashboard.html';
        }, 1000);
      } catch (err) {
        showAlert(alertId, err.message || 'Invalid email or password', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = 'Sign In';
      }
    });
  }
});
