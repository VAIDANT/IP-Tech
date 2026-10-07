(() => {
  const form = document.getElementById('signupForm');
  const emailInput = document.getElementById('email');
  const button = document.getElementById('submitButton');
  const status = document.getElementById('formStatus');
  const year = document.getElementById('year');

  year.textContent = new Date().getFullYear();
  requestAnimationFrame(() => document.body.classList.add('ready'));

  const cfg = window.IPTECH_CONFIG || {};
  const configured = cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY &&
    !cfg.SUPABASE_URL.includes('YOUR_') && !cfg.SUPABASE_ANON_KEY.includes('YOUR_');

  const setStatus = (message, type = '') => {
    status.textContent = message;
    status.className = `form-status ${type}`.trim();
  };

  const setBusy = (busy) => {
    button.disabled = busy;
    button.querySelector('span').textContent = busy ? 'Joining…' : 'Notify me';
  };

  form.addEventListener('submit', async (event) => {
    event.preventDefault();

    // Honeypot field: real users never fill this.
    if (form.elements.company.value) return;

    const email = emailInput.value.trim().toLowerCase();
    if (!emailInput.validity.valid || !email) {
      setStatus('Please enter a valid email address.', 'error');
      emailInput.focus();
      return;
    }

    if (!configured) {
      setStatus('Signup storage is not connected yet. Add your Supabase keys in config.js.', 'error');
      return;
    }

    setBusy(true);
    setStatus('Adding you to the launch list…');

    try {
      const endpoint = `${cfg.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/subscribers`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          apikey: cfg.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${cfg.SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal'
        },
        body: JSON.stringify({ email, source: 'coming-soon' })
      });

      if (response.ok) {
        form.reset();
        setStatus('You’re on the list. We’ll let you know when iPTECH is ready.', 'success');
        return;
      }

      let payload = {};
      try { payload = await response.json(); } catch (_) {}
      if (response.status === 409 || payload.code === '23505') {
        setStatus('You’re already on the launch list.', 'success');
      } else {
        throw new Error(payload.message || `Signup failed (${response.status})`);
      }
    } catch (error) {
      console.error(error);
      setStatus('Couldn’t save your email right now. Please try again shortly.', 'error');
    } finally {
      setBusy(false);
    }
  });
})();
