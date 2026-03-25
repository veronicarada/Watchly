// ─── Auth State ──────────────────────────────────────────────────────────────
const auth = {
  get token() { return localStorage.getItem('watchly_token'); },
  get user() {
    const u = localStorage.getItem('watchly_user');
    return u ? JSON.parse(u) : null;
  },
  get isLoggedIn() { return !!this.token; },

  save(token, user) {
    localStorage.setItem('watchly_token', token);
    localStorage.setItem('watchly_user', JSON.stringify(user));
    this.updateUI();
  },

  logout() {
    localStorage.removeItem('watchly_token');
    localStorage.removeItem('watchly_user');
    this.updateUI();
    showSection('home');
    showToast('Sesión cerrada', 'info');
  },

  updateUI() {
    const logged = this.isLoggedIn;
    const user = this.user;
    document.querySelectorAll('.auth-required').forEach(el => {
      el.style.display = logged ? '' : 'none';
    });
    document.querySelectorAll('.auth-hidden').forEach(el => {
      el.style.display = logged ? 'none' : '';
    });
    const usernameEl = document.getElementById('nav-username');
    if (usernameEl && user) usernameEl.textContent = user.username;
  }
};

// ─── Auth Modal ───────────────────────────────────────────────────────────────
function openAuthModal(tab = 'login') {
  document.getElementById('auth-modal').classList.add('active');
  switchAuthTab(tab);
}

function closeAuthModal() {
  document.getElementById('auth-modal').classList.remove('active');
}

function switchAuthTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
  document.querySelector(`.auth-tab[data-tab="${tab}"]`)?.classList.add('active');
  document.getElementById(`form-${tab}`)?.classList.add('active');
}

async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  const btn = e.target.querySelector('button[type="submit"]');

  btn.disabled = true;
  btn.textContent = 'Ingresando...';

  try {
    const { token, user } = await api.login(email, password);
    auth.save(token, user);
    closeAuthModal();
    showToast(`¡Bienvenido, ${user.username}! 🎬`, 'success');
    loadFavorites();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Ingresar';
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const username = document.getElementById('reg-username').value;
  const email = document.getElementById('reg-email').value;
  const password = document.getElementById('reg-password').value;
  const btn = e.target.querySelector('button[type="submit"]');

  btn.disabled = true;
  btn.textContent = 'Registrando...';

  try {
    const { token, user } = await api.register(username, email, password);
    auth.save(token, user);
    closeAuthModal();
    showToast(`¡Cuenta creada! Bienvenido ${user.username} 🎉`, 'success');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Registrarse';
  }
}

window.auth = auth;
window.openAuthModal = openAuthModal;
window.closeAuthModal = closeAuthModal;
window.switchAuthTab = switchAuthTab;
window.handleLogin = handleLogin;
window.handleRegister = handleRegister;
