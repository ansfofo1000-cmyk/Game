import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { GraduationCap, Lock, Mail, Eye, EyeOff, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';

export default function StudentLoginPage() {
  const { login } = useAuth();
  const { lang, t, dir } = useLanguage();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const data = await login(email, password);
      if (data.user.role === 'STUDENT') {
        navigate('/student/dashboard');
      } else if (data.user.role === 'TEACHER') {
        navigate('/teacher/dashboard');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || err.response?.data?.message || err.message;
      setError(msg || (lang === 'ar' ? 'بيانات الدخول غير صحيحة' : 'Invalid login credentials'));
    } finally {
      setLoading(false);
    }
  };

  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <div className="max-w-md mx-auto my-8 sm:my-16 px-4">
      <div className="bg-champ-card border border-champ-border rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        
        {/* Glow */}
        <div className="absolute -top-12 -right-12 w-36 h-36 bg-champ-primary/15 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center space-y-2 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-champ-primary/15 border border-champ-primary/30 text-champ-primary flex items-center justify-center mx-auto shadow-lg shadow-champ-primary/10">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-champ-text">
            {lang === 'ar' ? 'دخول بوابة الطلاب' : 'Student Portal Login'}
          </h2>
          <p className="text-xs text-champ-muted">
            {lang === 'ar' ? 'أدخل بريدك الإلكتروني وكلمة المرور لمتابعة نقاطك وترتيبك' : 'Enter your email and password to access your dashboard'}
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-champ-danger/10 border border-champ-danger/30 text-champ-danger text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-champ-muted mb-1.5">
              {lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-champ-muted absolute top-3 left-3 rtl:left-auto rtl:right-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="student@example.com"
                className="w-full bg-champ-darkMuted border border-champ-border rounded-xl px-10 py-2.5 text-champ-text text-sm focus:outline-none focus:border-champ-primary"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-champ-muted mb-1.5">
              {lang === 'ar' ? 'كلمة المرور' : 'Password'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-champ-muted absolute top-3 left-3 rtl:left-auto rtl:right-3" />
              <input
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-champ-darkMuted border border-champ-border rounded-xl px-10 py-2.5 text-champ-text text-sm focus:outline-none focus:border-champ-primary"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute top-3 right-3 rtl:right-auto rtl:left-3 text-champ-muted hover:text-champ-text"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-champ-primary hover:bg-champ-primaryHover text-champ-bg font-bold text-sm shadow-lg shadow-champ-primary/20 flex items-center justify-center gap-2 transition-all"
          >
            {loading ? (
              <span>{lang === 'ar' ? 'جارٍ التحقق...' : 'Logging in...'}</span>
            ) : (
              <>
                <span>{lang === 'ar' ? 'دخول المنصة' : 'Log In'}</span>
                <ArrowIcon className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-champ-border/60 text-center text-xs text-champ-muted">
          <span>{lang === 'ar' ? 'طالب جديد ولم تسجل بعد؟' : "Don't have an account?"} </span>
          <Link to="/student/register" className="text-champ-primary font-bold hover:underline">
            {lang === 'ar' ? 'سجل حساب طالب الآن' : 'Register Here'}
          </Link>
        </div>

      </div>
    </div>
  );
}
