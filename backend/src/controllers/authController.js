const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const supabase = require('../config/supabase');

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const generateToken = (user) =>
  jwt.sign(
    { id: user.id, username: user.username, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );

// POST /api/auth/register
const register = async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).json({ error: 'Todos los campos son requeridos' });

  try {
    const { data: existing } = await supabase
      .from('users').select('id').eq('email', email).single();
    if (existing) return res.status(409).json({ error: 'El email ya está registrado' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const { data: newUser, error } = await supabase
      .from('users')
      .insert([{ username, email, password: hashedPassword }])
      .select('id, username, email').single();

    if (error) throw error;
    res.status(201).json({ token: generateToken(newUser), user: newUser });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
};

// POST /api/auth/login
const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password)
    return res.status(400).json({ error: 'Email y contraseña requeridos' });

  try {
    const { data: user } = await supabase
      .from('users').select('*').eq('email', email).single();

    if (!user || !(await bcrypt.compare(password, user.password)))
      return res.status(401).json({ error: 'Credenciales inválidas' });

    const { password: _, ...safeUser } = user;
    res.json({ token: generateToken(safeUser), user: safeUser });
  } catch (err) {
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
};

// POST /api/auth/google  ← Google OAuth
const googleLogin = async (req, res) => {
  const { credential } = req.body;
  if (!credential) return res.status(400).json({ error: 'Token de Google requerido' });

  try {
    // Verify Google token
    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID
    });
    const payload = ticket.getPayload();
    const { email, name, picture, sub: googleId } = payload;

    // Check if user exists
    let { data: user } = await supabase
      .from('users').select('*').eq('email', email).single();

    if (!user) {
      // Create new user from Google
      const { data: newUser, error } = await supabase
        .from('users')
        .insert([{
          username: name,
          email,
          password: await bcrypt.hash(googleId, 10), // dummy password
          avatar: picture,
          google_id: googleId
        }])
        .select('id, username, email, avatar').single();

      if (error) throw error;
      user = newUser;
    }

    const { password: _, ...safeUser } = user;
    res.json({ token: generateToken(safeUser), user: safeUser });
  } catch (err) {
    console.error('Google auth error:', err);
    res.status(401).json({ error: 'Error al autenticar con Google' });
  }
};
// POST /api/auth/forgot-password
// POST /api/auth/forgot-password
const forgotPassword = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email requerido' });

  try {
    const { data: user } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single();

    if (!user) return res.status(404).json({ error: 'No existe una cuenta con ese email' });

    // Generar token único
    const crypto = require('crypto');
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hora

    // Guardar token en Supabase
    const { error: insertError } = await supabase
      .from('password_reset_tokens')
      .insert([{ user_id: user.id, token, expires_at: expiresAt }]);

    if (insertError) throw insertError;

    // Enviar email con Resend
    const { Resend } = require('resend');
    const resend = new Resend(process.env.RESEND_API_KEY);

    const resetLink = `http://localhost:5173/reset-password?token=${token}`;

    const result = await resend.emails.send({
      from: 'onboarding@resend.dev',
      to: email,
      subject: 'Recuperá tu contraseña - Watchly',
      html: `
        <h2>Recuperar contraseña</h2>
        <p>Hacé click en el link para resetear tu contraseña. Expira en 1 hora.</p>
        <a href="${resetLink}">Resetear contraseña</a>
      `
    });
    console.log('Resend result:', JSON.stringify(result));

    res.json({ message: 'Te enviamos un email para resetear tu contraseña' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al enviar el email' });
  }
};
// POST /api/auth/reset-password
const resetPassword = async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) return res.status(400).json({ error: 'Token y contraseña requeridos' });

  try {
    // Buscar el token en la BD
    const { data: resetToken } = await supabase
      .from('password_reset_tokens')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .single();

    if (!resetToken) return res.status(400).json({ error: 'Token inválido' });

    // Verificar que no expiró
    if (new Date() > new Date(resetToken.expires_at)) {
      return res.status(400).json({ error: 'El token expiró' });
    }

    // Actualizar la contraseña
    const hashedPassword = await bcrypt.hash(password, 10);
    await supabase
      .from('users')
      .update({ password: hashedPassword })
      .eq('id', resetToken.user_id);

    // Marcar el token como usado
    await supabase
      .from('password_reset_tokens')
      .update({ used: true })
      .eq('id', resetToken.id);

    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error al resetear la contraseña' });
  }
};
module.exports = { register, login, googleLogin, forgotPassword, resetPassword };
