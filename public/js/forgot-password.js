document.getElementById('forgotForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = document.getElementById('formError');
  errEl.classList.remove('show');
  const btn = document.getElementById('submitBtn');
  btn.disabled = true;
  btn.textContent = 'Sending…';
  try {
    await Api.post('/auth/forgot-password', { email: document.getElementById('email').value.trim() });
    document.getElementById('forgotForm').style.display = 'none';
    document.getElementById('successMsg').style.display = 'block';
  } catch (err) {
    errEl.textContent = err.message || 'Something went wrong.';
    errEl.classList.add('show');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Send reset link';
  }
});
