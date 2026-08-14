document.addEventListener('DOMContentLoaded', () => {
  if (auth.isLoggedIn()) {
    const user = auth.getUser();
    window.location.href = user?.role === 'admin' ? '/admin-dashboard.html' : '/donor-dashboard.html';
    return;
  }

  const form = document.getElementById('registerForm');
  const alertId = 'register-alert';
  const submitBtn = document.getElementById('submitBtn');

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      hideAlert(alertId);

      const password = form.password.value;
      const confirmPassword = form.confirmPassword.value;

      if (password !== confirmPassword) {
        showAlert(alertId, 'Passwords do not match', 'error');
        return;
      }

      const formData = {
        fullName: form.fullName.value.trim(),
        email: form.email.value.trim(),
        phone: form.phone.value.trim(),
        bloodGroup: form.bloodGroup.value,
        dateOfBirth: form.dateOfBirth.value,
        gender: form.gender.value,
        location: form.location.value.trim(),
        address: form.address?.value.trim() || '',
        lastDonationDate: form.lastDonationDate?.value || null,
        password: password,
        confirmPassword: confirmPassword,
        isAvailable: form.isAvailable.checked,
      };

      try {
        submitBtn.disabled = true;
        submitBtn.innerHTML = '<span class="loading-spinner"></span> Creating your account...';

        const res = await api.post('/auth/register', formData);
        auth.setSession(res.token, res.user);

        showAlert(alertId, 'Registration successful! Redirecting to dashboard...', 'success');
        setTimeout(() => {
          window.location.href = '/donor-dashboard.html';
        }, 1200);
      } catch (err) {
        showAlert(alertId, err.message || 'Registration failed', 'error');
      } finally {
        submitBtn.disabled = false;
        submitBtn.innerHTML = '❤️ Register as Life Saver';
      }
    });
  }
});
