import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { Shield, Lock, Mail, Eye, EyeOff, AlertCircle, ArrowLeft, ArrowRight } from 'lucide-react';

export default function TeacherLoginPage() {
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
      if (data.user.role === 'TEACHER') {
        navigate('/teacher/dashboard');
      } else if (data.user.role === 'ADMIN') {
        navigate('/admin/dashboard');
      } else {
        navigate('/student/dashboard');
      }
    } catch (err) {
      console.error(err);
      const msg = err.response?.data?.error || err.response?.data?.message || err.message;
      setError(msg || (lang === 'ar' ? 'فشل تسجيل الدخول للمعلم' : 'Teacher login failed'));
    } finally {
      setLoading(false);
    }
  };

  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <div className="max-w-md mx-auto my-8 sm:my-16 px-4">
      <div className="bg-champ-card border border-champ-border rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        
        <div className="absolute -top-12 -left-12 w-36 h-36 bg-champ-blue/15 rounded-full blur-2xl pointer-events-none" />

        <div className="text-center space-y-2 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-champ-blue/15 border border-champ-blue/30 text-champ-blue flex items-center justify-center mx-auto shadow-lg shadow-champ-blue/10">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-champ-text">
            {lang === 'ar' ? 'بوابة المعلمين والإدارة' : 'Teachers & Admin Portal'}
          </h2>
          <p className="text-xs text-champ-muted">
            {lang === 'ar' ? 'سجل دخولك لإدارة الطلاب ورصد النقاط والعملات والمناصب الصفية' : 'Log in to manage classrooms, evaluate students, and award points'}
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
                placeholder="teacher@school.edu"
                className="w-full bg-champ-darkMuted border border-champ-border rounded-xl px-10 py-2.5 text-champ-text text-sm focus:outline-none focus:border-champ-blue"
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
                className="w-full bg-champ-darkMuted border border-champ-border rounded-xl px-10 py-2.5 text-champ-text text-sm focus:outline-none focus:border-champ-blue"
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
            className="w-full py-3 rounded-xl bg-champ-blue hover:bg-champ-blue/90 text-champ-bg font-bold text-sm shadow-lg shadow-champ-blue/20 flex items-center justify-center gap-2 transition-all"
          >
            {loading ? (
              <span>{lang === 'ar' ? 'جارٍ التحقق...' : 'Logging in...'}</span>
            ) : (
              <>
                <span>{lang === 'ar' ? 'دخول بوابة المعلمين' : 'Access Teacher Portal'}</span>
                <ArrowIcon className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-champ-border/60 text-center text-xs text-champ-muted">
          <span>{lang === 'ar' ? 'معلم جديد ولديك كود التسجيل؟' : 'New teacher with an access code?'} </span>
          <Link to="/teacher/register" className="text-champ-blue font-bold hover:underline">
            {lang === 'ar' ? 'سجل حساب معلم جديد' : 'Register Here'}
          </Link>
        </div>

      </div>
    </div>
  );
}
