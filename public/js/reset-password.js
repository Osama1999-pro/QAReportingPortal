const token = new URLSearchParams(window.location.search).get('token');
if (!token) {
  document.getElementById('formError').textContent = 'This reset link is missing its token. Please request a new one.';
  document.getElementById('formError').classList.add('show');
  document.getElementById('resetForm').style.display = 'none';
}

document.getElementById('resetForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = document.getElementById('formError');
  errEl.classList.remove('show');
  const p1 = document.getElementById('newPassword').value;
  const p2 = document.getElementById('confirmPassword').value;
  if (p1 !== p2) {
    errEl.textContent = 'Passwords do not match.';
    errEl.classList.add('show');
    return;
  }

  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.textContent = 'Resetting…';
  try {
    await Api.post('/auth/reset-password', { token, newPassword: p1 });
    toast('Password reset. Redirecting to login…');
    setTimeout(() => { window.location.href = '/index.html'; }, 1200);
  } catch (err) {
    errEl.textContent = err.message || 'Reset link is invalid or has expired.';
    errEl.classList.add('show');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Reset password';
  }
});
