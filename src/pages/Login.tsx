import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ArrowRight, ShieldCheck } from 'lucide-react';

export default function Login() {
    const navigate = useNavigate();
    const [showPassword, setShowPassword] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Cấp quyền và lưu cờ đã đăng nhập
        localStorage.setItem('isAuthenticated', 'true');
        navigate('/timekeeping');
    };

    return (
        <div className="login-container">
            {/* Left Panel: Branding & Dynamic Gradient */}
            <div className="login-brand-panel">
                <div className="glass-blob blob-1"></div>
                <div className="glass-blob blob-2"></div>
                
                <div className="brand-content" style={{ opacity: isMounted ? 1 : 0, transform: isMounted ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                    <img 
                        src={`${import.meta.env.BASE_URL}logo.png`} 
                        alt="Smiley Agency Logo" 
                        className="brand-logo"
                    />
                    <h1 className="brand-title">
                        Kiến tạo<br/>
                        <span className="brand-highlight">Không gian làm việc</span><br/>
                        tương lai.
                    </h1>
                    <p className="brand-subtitle">
                        Nền tảng quản trị thông minh, giúp bạn quản lý nhân sự, dự án và tương tác đội ngũ dễ dàng hơn bao giờ hết.
                    </p>
                    
                    <div className="trust-badge">
                        <ShieldCheck size={20} color="#ff7d0d" />
                        <span>Hệ thống bảo mật đầu cuối.</span>
                    </div>
                </div>
            </div>

            {/* Right Panel: Login Form */}
            <div className="login-form-panel">
                <div className="form-wrapper" style={{ opacity: isMounted ? 1 : 0, transform: isMounted ? 'translateY(0)' : 'translateY(20px)', transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.15s' }}>
                    <div className="form-header">
                        <h2>Chào mừng trở lại! 👋</h2>
                        <p>Đăng nhập để vào không gian làm việc của Smiley.</p>
                    </div>

                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="input-group">
                            <label>Hộp thư / Tên đăng nhập</label>
                            <input
                                type="text"
                                placeholder="name@smileyagency.com"
                                required
                                className="styled-input"
                            />
                        </div>

                        <div className="input-group">
                            <div className="password-header">
                                <label>Mật khẩu an toàn</label>
                                <a href="#" className="forgot-link">Quên mật khẩu?</a>
                            </div>
                            <div className="password-wrapper">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••••••"
                                    required
                                    className="styled-input"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="toggle-password"
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button type="submit" className="submit-btn group">
                            Đăng nhập hệ thống
                            <ArrowRight size={18} className="btn-icon" />
                        </button>
                    </form>

                    <div className="form-footer">
                        Chưa có tài khoản nội bộ?{' '}
                        <a href="/register" onClick={(e) => { e.preventDefault(); navigate('/register'); }}>
                            Đăng ký ngay
                        </a>
                    </div>
                </div>
            </div>

            {/* Scoped Styles for Login Page */}
            <style>{`
                .login-container {
                    display: flex;
                    min-height: 100vh;
                    font-family: 'Inter', sans-serif;
                    background-color: #ffffff;
                }

                .login-brand-panel {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    padding: 4rem;
                    background: linear-gradient(135deg, #121212 0%, #2a1101 100%);
                    position: relative;
                    overflow: hidden;
                }

                @media (max-width: 900px) {
                    .login-brand-panel {
                        display: none; /* Hide on smaller screens */
                    }
                }

                /* Aesthetic Blobs */
                .glass-blob {
                    position: absolute;
                    border-radius: 50%;
                    filter: blur(80px);
                    z-index: 0;
                }
                .blob-1 {
                    top: -10%; left: -10%;
                    width: 50vw; height: 50vw;
                    background: radial-gradient(circle, rgba(255,125,13,0.15) 0%, rgba(255,125,13,0) 70%);
                }
                .blob-2 {
                    bottom: -10%; right: -10%;
                    width: 40vw; height: 40vw;
                    background: radial-gradient(circle, rgba(230,80,0,0.1) 0%, rgba(230,80,0,0) 70%);
                }

                .brand-content {
                    position: relative;
                    z-index: 10;
                    max-width: 540px;
                }

                .brand-logo {
                    width: 60px;
                    height: 60px;
                    border-radius: 12px;
                    margin-bottom: 2.5rem;
                }

                .brand-title {
                    color: #ffffff;
                    font-size: 3.5rem;
                    font-weight: 800;
                    line-height: 1.1;
                    letter-spacing: -1.5px;
                    margin-bottom: 1.5rem;
                }

                .brand-highlight {
                    color: #ff7d0d;
                    background: linear-gradient(90deg, #ff7d0d, #ff9f4d);
                    -webkit-background-clip: text;
                    -webkit-text-fill-color: transparent;
                }

                .brand-subtitle {
                    color: #a3a3a3;
                    font-size: 1.1rem;
                    line-height: 1.6;
                    margin-bottom: 3rem;
                    font-weight: 400;
                }

                .trust-badge {
                    display: inline-flex;
                    align-items: center;
                    gap: 0.75rem;
                    padding: 0.75rem 1.25rem;
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 100px;
                    color: #e5e5e5;
                    font-size: 0.9rem;
                    font-weight: 500;
                    backdrop-filter: blur(10px);
                }

                .login-form-panel {
                    flex: 1;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    padding: 2rem;
                    background-color: #ffffff;
                }

                .form-wrapper {
                    width: 100%;
                    max-width: 420px;
                }

                .form-header {
                    margin-bottom: 2.5rem;
                }

                .form-header h2 {
                    font-size: 2rem;
                    font-weight: 800;
                    color: #1a1a1a;
                    margin-bottom: 0.5rem;
                    letter-spacing: -0.5px;
                }

                .form-header p {
                    color: #666;
                    font-size: 0.95rem;
                }

                .auth-form {
                    display: flex;
                    flex-direction: column;
                    gap: 1.5rem;
                }

                .input-group label {
                    display: block;
                    font-size: 0.85rem;
                    font-weight: 600;
                    color: #4a4a4a;
                    margin-bottom: 0.5rem;
                }

                .password-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: flex-end;
                    margin-bottom: 0.5rem;
                }

                .password-header label { margin-bottom: 0; }

                .forgot-link {
                    font-size: 0.8rem;
                    color: #ff7d0d;
                    font-weight: 600;
                    text-decoration: none;
                    transition: color 0.2s;
                }
                .forgot-link:hover { color: #e66c00; }

                .styled-input {
                    width: 100%;
                    padding: 0.9rem 1.25rem;
                    border-radius: 12px;
                    border: 1px solid #e5e5e5;
                    background-color: #fafafa;
                    font-size: 0.95rem;
                    outline: none;
                    font-family: inherit;
                    transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
                    box-shadow: 0 2px 4px rgba(0,0,0,0.01) inset;
                }

                .styled-input:focus {
                    border-color: #ff7d0d;
                    background-color: #ffffff;
                    box-shadow: 0 0 0 4px rgba(255, 125, 13, 0.1);
                }

                .password-wrapper {
                    position: relative;
                }

                .password-wrapper .styled-input {
                    padding-right: 3rem;
                }

                .toggle-password {
                    position: absolute;
                    right: 1rem;
                    top: 50%;
                    transform: translateY(-50%);
                    background: none;
                    border: none;
                    color: #a3a3a3;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    padding: 0;
                    transition: color 0.2s;
                }

                .toggle-password:hover { color: #1a1a1a; }

                .submit-btn {
                    margin-top: 0.5rem;
                    width: 100%;
                    padding: 1rem;
                    border-radius: 12px;
                    background: linear-gradient(135deg, #ff7d0d 0%, #f96300 100%);
                    color: white;
                    border: none;
                    font-size: 1rem;
                    font-weight: 700;
                    cursor: pointer;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    gap: 0.75rem;
                    transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
                    box-shadow: 0 4px 15px rgba(255, 125, 13, 0.25);
                }

                .submit-btn:hover {
                    box-shadow: 0 6px 20px rgba(255, 125, 13, 0.35);
                    transform: translateY(-2px);
                }

                .submit-btn:active {
                    transform: translateY(0);
                }

                .btn-icon {
                    transition: transform 0.3s ease;
                }

                .submit-btn:hover .btn-icon {
                    transform: translateX(4px);
                }

                .form-footer {
                    margin-top: 2.5rem;
                    text-align: center;
                    font-size: 0.9rem;
                    color: #666;
                }

                .form-footer a {
                    color: #1a1a1a;
                    font-weight: 700;
                    text-decoration: none;
                    transition: color 0.2s;
                }

                .form-footer a:hover {
                    color: #ff7d0d;
                }
            `}</style>
        </div>
    );
}
