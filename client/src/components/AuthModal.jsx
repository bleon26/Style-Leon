import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { GoogleLogin } from '@react-oauth/google';

const AuthModal = () => {
    const { isOpen, setIsOpen, login, register, forgotPassword, resetPassword, googleLogin } = useAuth();
    const { showToast } = useToast();
    const [mode, setMode] = useState('login'); // login, register, forgot, reset
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        code: '',
        confirmPassword: ''
    });
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (mode === 'login') {
                await login(formData.email, formData.password);
                showToast('Bienvenido de nuevo!', 'success');
                setIsOpen(false);
            } else if (mode === 'register') {
                await register(formData.name, formData.email, formData.password);
                showToast('Cuenta creada con éxito!', 'success');
                setIsOpen(false);
            } else if (mode === 'forgot') {
                const res = await forgotPassword(formData.email);
                showToast(`Código enviado: ${res.data.token}`, 'success'); // Mock code show
                setMode('reset');
            } else if (mode === 'reset') {
                await resetPassword(formData.email, formData.code, formData.password);
                showToast('Contraseña actualizada!', 'success');
                setMode('login');
            }
        } catch (err) {
            showToast(err.response?.data?.message || 'Algo salió mal', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleSuccess = async (credentialResponse) => {
        setLoading(true);
        try {
            await googleLogin(credentialResponse.credential);
            showToast('Ingreso con Google exitoso!', 'success');
            setIsOpen(false);
        } catch (err) {
            showToast(err.response?.data?.message || 'Fallo autenticación con Google', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleError = () => {
        showToast('Login de Google fallido', 'error');
    };

    return (
        <div className={`auth-overlay ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(false)}>
            <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
                <button className="auth-close" onClick={() => setIsOpen(false)}>×</button>
                <div className="auth-logo">StyleShop</div>

                <h2 style={{ textAlign: 'center', marginBottom: '8px' }}>
                    {mode === 'login' && 'Iniciar Sesión'}
                    {mode === 'register' && 'Crear Cuenta'}
                    {mode === 'forgot' && 'Recuperar Contraseña'}
                    {mode === 'reset' && 'Nueva Contraseña'}
                </h2>
                <p style={{ textAlign: 'center', color: 'var(--text-muted)', marginBottom: '24px', fontSize: '14px' }}>
                    {mode === 'login' && 'Accede a tus pedidos y favoritos'}
                    {mode === 'register' && 'Únete a nuestra comunidad de moda'}
                    {mode === 'forgot' && 'Te enviaremos un código a tu correo'}
                    {mode === 'reset' && 'Ingresa el código y tu nueva contraseña'}
                </p>

                <form onSubmit={handleSubmit}>
                    <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                        {mode === 'register' && (
                            <div className="form-group">
                                <label>Nombre Completo</label>
                                <input name="name" type="text" placeholder="Tu nombre" required onChange={handleChange} />
                            </div>
                        )}

                        <div className="form-group">
                            <label>Correo Electrónico</label>
                            <input name="email" type="email" placeholder="ejemplo@correo.com" required onChange={handleChange} />
                        </div>

                        {mode === 'reset' && (
                            <div className="form-group">
                                <label>Código de Verificación</label>
                                <input name="code" type="text" placeholder="Código de 6 dígitos" required onChange={handleChange} />
                            </div>
                        )}

                        {(mode === 'login' || mode === 'register' || mode === 'reset') && (
                            <div className="form-group">
                                <label>{mode === 'reset' ? 'Nueva Contraseña' : 'Contraseña'}</label>
                                <input name="password" type="password" placeholder="••••••••" required onChange={handleChange} />
                            </div>
                        )}
                    </div>

                    <button type="submit" className="btn-primary checkout-submit" style={{ marginTop: '20px' }} disabled={loading}>
                        {loading ? 'Procesando...' :
                            mode === 'login' ? 'Entrar' :
                                mode === 'register' ? 'Registrarse' :
                                    mode === 'forgot' ? 'Enviar Código' : 'Cambiar Contraseña'}
                    </button>
                </form>

                {(mode === 'login' || mode === 'register') && (
                    <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', width: '100%' }}>
                            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }}></div>
                            <span style={{ fontSize: '13px', color: '#666' }}>O continúa con</span>
                            <div style={{ flex: 1, height: '1px', backgroundColor: 'var(--border)' }}></div>
                        </div>
                        <GoogleLogin
                            onSuccess={handleGoogleSuccess}
                            onError={handleGoogleError}
                            theme="filled_blue"
                            shape="pill"
                            text={mode === 'login' ? 'signin_with' : 'signup_with'}
                        />
                    </div>
                )}

                <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '14px' }}>
                    {mode === 'login' && (
                        <>
                            <p style={{ marginBottom: '8px' }}>
                                <a href="#" onClick={(e) => { e.preventDefault(); setMode('forgot'); }}>¿Olvidaste tu contraseña?</a>
                            </p>
                            <p>
                                ¿No tienes cuenta? <a href="#" onClick={(e) => { e.preventDefault(); setMode('register'); }}>Regístrate</a>
                            </p>
                        </>
                    )}
                    {mode === 'register' && (
                        <p>
                            ¿Ya tienes cuenta? <a href="#" onClick={(e) => { e.preventDefault(); setMode('login'); }}>Inicia sesión</a>
                        </p>
                    )}
                    {(mode === 'forgot' || mode === 'reset') && (
                        <p>
                            <a href="#" onClick={(e) => { e.preventDefault(); setMode('login'); }}>Volver al inicio</a>
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AuthModal;
