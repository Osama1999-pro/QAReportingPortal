if (Auth.isLoggedIn()) {
  window.location.href = '/dashboard.html';
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const errEl = document.getElementById('loginError');
  errEl.classList.remove('show');
  const btn = document.getElementById('loginBtn');
  btn.disabled = true;
  btn.textContent = 'Logging in…';

  try {
    const data = await Api.post('/auth/login', {
      email: document.getElementById('email').value.trim(),
      password: document.getElementById('password').value,
      rememberMe: document.getElementById('rememberMe').checked,
    });
    Auth.setSession(data.token, data.user);
    window.location.href = '/dashboard.html';
  } catch (err) {
    errEl.textContent = err.message || 'Login failed.';
    errEl.classList.add('show');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Log in';
  }
});
