import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Mail, Lock, User, Eye, EyeOff, Loader2 } from 'lucide-react';

export function LoginPage() {
    const navigate = useNavigate();
    const { signIn, signUp } = useAuthStore();

    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullname, setFullname] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            if (isLogin) {
                const { error } = await signIn(email, password);
                if (error) {
                    setError(error);
                } else {
                    navigate('/');
                }
            } else {
                const { error } = await signUp(email, password, fullname);
                if (error) {
                    setError(error);
                } else {
                    setError('');
                    alert('Registrasi berhasil! Silakan cek email untuk verifikasi.');
                    setIsLogin(true);
                }
            }
        } catch (err: any) {
            setError(err.message || 'Terjadi kesalahan');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-dark flex flex-col items-center justify-center p-6">
            {/* Logo & Title */}
            <div className="text-center mb-8">
                <div className="w-16 h-16 mx-auto bg-gradient-to-tr from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-2xl font-bold mb-4 shadow-lg shadow-indigo-500/30">
                    📋
                </div>
                <h1 className="text-2xl font-bold">Laporan Harian</h1>
                <p className="text-gray-400 text-sm mt-1">Sistem Pelaporan Operasional</p>
            </div>

            {/* Form Card */}
            <div className="w-full max-w-sm bg-dark-card border border-white/5 rounded-2xl p-6 shadow-xl">
                <h2 className="text-xl font-semibold mb-6 text-center">
                    {isLogin ? 'Masuk ke Akun' : 'Daftar Akun Baru'}
                </h2>

                {error && (
                    <div className="bg-danger/10 border border-danger/20 text-danger text-sm p-3 rounded-xl mb-4">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {!isLogin && (
                        <div className="space-y-2">
                            <label className="text-sm text-gray-400">Nama Lengkap</label>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                                <input
                                    type="text"
                                    value={fullname}
                                    onChange={(e) => setFullname(e.target.value)}
                                    placeholder="Masukkan nama lengkap"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-primary"
                                    required={!isLogin}
                                />
                            </div>
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm text-gray-400">Email</label>
                        <div className="relative">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="nama@email.com"
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3 focus:outline-none focus:border-primary"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm text-gray-400">Password</label>
                        <div className="relative">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-12 py-3 focus:outline-none focus:border-primary"
                                required
                                minLength={6}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full py-3 bg-primary hover:bg-primary-dark text-white font-semibold rounded-xl shadow-lg shadow-primary/25 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                <span>Memproses...</span>
                            </>
                        ) : (
                            <span>{isLogin ? 'Masuk' : 'Daftar'}</span>
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-gray-400">
                    {isLogin ? (
                        <>
                            Belum punya akun?{' '}
                            <button onClick={() => setIsLogin(false)} className="text-primary hover:underline">
                                Daftar di sini
                            </button>
                        </>
                    ) : (
                        <>
                            Sudah punya akun?{' '}
                            <button onClick={() => setIsLogin(true)} className="text-primary hover:underline">
                                Masuk
                            </button>
                        </>
                    )}
                </div>


            </div>

            {/* Footer */}
            <p className="text-gray-500 text-xs mt-8 opacity-50">Dari Tj & Co Untuk AQL</p>
        </div>
    );
}
