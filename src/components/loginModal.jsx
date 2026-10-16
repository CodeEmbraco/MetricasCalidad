import React, { useState } from 'react';

// Lista de usuarios "harcodeados" permitidos
const USUARIOS_VALIDOS = [
  { usuario: "pgarcia", password: "123" },
  { usuario: "admin", password: "adminpassword" },
  { usuario: "calidad", password: "nidec2026" }
];

export default function LoginModal({ onLoginSuccess }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      // Buscamos si existe un usuario que coincida exactamente con el usuario y contraseña
      const usuarioEncontrado = USUARIOS_VALIDOS.find(
        (u) => u.usuario === username.trim() && u.password === password
      );

      if (usuarioEncontrado) {
        // Si coincide, guardamos el token simulado y damos acceso
        localStorage.setItem('nidec_auth_token', 'token-estatico-valido');
        localStorage.setItem('nidec_username', usuarioEncontrado.usuario);
        setLoading(false);
        onLoginSuccess();
      } else {
        // Si no coincide, mostramos error
        setError('Usuario o contraseña incorrectos.');
        setLoading(false);
      }
    }, 500);
  };

  return (
    <div className="modal-overlay">
      <div className="card" style={{ width: 'min(420px, 100%)', overflow: 'hidden' }}>
        
        <div className="card-header" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
          <div className="row" style={{ gap: '10px' }}>
            <div className="sidebar-brand" style={{ padding: 0, border: 'none' }}>
              <div className="logo-mark" style={{ width: '32px', height: '32px', fontSize: '16px' }}>N</div>
            </div>
            <div>
              <h2>Métricas de Calidad</h2>
              <span className="card-sub">Nidec Global Appliance</span>
            </div>
          </div>
        </div>

        <div className="card-body">
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div style={{ marginBottom: '4px' }}>
              <h3 style={{ fontSize: '15px', marginBottom: '2px' }}>Iniciar Sesión</h3>
              <p className="text-muted" style={{ fontSize: '12px' }}>Ingresa tus credenciales autorizadas.</p>
            </div>

            {error && (
              <div style={{ 
                background: 'var(--sem-red-bg)', 
                color: 'var(--sem-red)', 
                padding: '10px 12px', 
                borderRadius: '8px', 
                fontSize: '13px',
                fontWeight: 600 
              }}>
                {error}
              </div>
            )}

            <div className="field">
              <label htmlFor="username">
                Usuario / ID de Empleado <span className="req">*</span>
              </label>
              <input 
                id="username"
                type="text" 
                placeholder="Ej. pgarcia" 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="field">
              <label htmlFor="password">
                Contraseña <span className="req">*</span>
              </label>
              <input 
                id="password"
                type="password" 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="mt-4" style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ width: '100%', justifyContent: 'center' }}
                disabled={loading}
              >
                {loading ? 'Validando acceso...' : 'Acceder al Sistema'}
              </button>
            </div>

          </form>
        </div>

        <div style={{ 
          padding: '14px 20px', 
          background: 'var(--bg-subtle)', 
          borderTop: '1px solid var(--border)', 
          textAlign: 'center', 
          fontSize: '11px', 
          color: 'var(--text-faint)' 
        }}>
          Acceso restringido — Uso interno exclusivo Nidec Global Appliance
        </div>

      </div>
    </div>
  );
}