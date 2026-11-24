import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { classroomService } from '../services/api';
import { Shield, Lock, Mail, User, BookOpen, KeyRound, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowLeft, ArrowRight } from 'lucide-react';

export default function TeacherRegisterPage() {
  const { registerTeacher } = useAuth();
  const { lang, t, dir } = useLanguage();
  const navigate = useNavigate();

  const [classrooms, setClassrooms] = useState([]);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [selectedClassrooms, setSelectedClassrooms] = useState([]);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    loadClassrooms();
  }, []);

  const loadClassrooms = async () => {
    try {
      const res = await classroomService.getClassrooms();
      setClassrooms(res.data || []);
      if (res.data?.length > 0) {
        setSelectedClassrooms(res.data.map(c => c.id)); // Default select both Wheeler 2 and Wheeler 3
      }
    } catch (err) {
      console.warn('Classroom load error:', err);
    }
  };

  const handleClassroomToggle = (id) => {
    setSelectedClassrooms(prev =>
      prev.includes(id) ? prev.filter(cId => cId !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(lang === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
      return;
    }

    if (!accessCode.trim()) {
      setError(lang === 'ar' ? 'كود تسجيل المعلم إجباري' : 'Teacher Access Code is required');
      return;
    }

    setLoading(true);

    try {
      await registerTeacher({
        full_name: fullName.trim(),
        email: email.trim(),
        subject: subject.trim(),
        access_code: accessCode.trim(),
        classroom_ids: selectedClassrooms,
        password,
        confirm_password: confirmPassword,
      });

      setIsSubmitted(true);
    } catch (err) {
      console.error(err);
      const resErrors = err.response?.data;
      if (resErrors) {
        const firstKey = Object.keys(resErrors)[0];
        const val = resErrors[firstKey];
        setError(Array.isArray(val) ? val[0] : (typeof val === 'string' ? val : JSON.stringify(val)));
      } else {
        setError(err.message || (lang === 'ar' ? 'حدث خطأ أثناء تسجيل المعلم' : 'Registration error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  if (isSubmitted) {
    return (
      <div className="max-w-md mx-auto my-12 px-4">
        <div className="bg-champ-card border border-champ-border rounded-3xl p-8 shadow-2xl text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-champ-primary/15 border border-champ-primary/30 text-champ-primary flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-black text-champ-text">
            {lang === 'ar' ? 'تم استلام طلب التسجيل بنجاح' : 'Registration Submitted!'}
          </h2>
          <p className="text-xs text-champ-muted leading-relaxed">
            {lang === 'ar'
              ? 'شكراً لك أستاذنا الفاضل. وفقاً لسياسات المنصة، يبدأ حساب المعلم في حالة "قيد المراجعة" حتى يقوم مدير النظام باعتماده وتفعيل صلاحيات إدارة الفصول. ستتمكن من تسجيل الدخول فور الاعتماد.'
              : 'Thank you! Your teacher account has been created and is pending Administrator approval. Once approved, you will be able to log in.'}
          </p>
          <div className="pt-4">
            <Link
              to="/teacher/login"
              className="px-6 py-2.5 rounded-xl bg-champ-blue text-champ-bg font-bold text-xs inline-flex items-center gap-2"
            >
              <span>{lang === 'ar' ? 'الذهاب لصفحة الدخول' : 'Go to Login'}</span>
              <ArrowIcon className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto my-8 sm:my-14 px-4">
      <div className="bg-champ-card border border-champ-border rounded-3xl p-6 sm:p-9 shadow-2xl relative overflow-hidden">
        
        <div className="text-center space-y-2 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-champ-blue/15 border border-champ-blue/30 text-champ-blue flex items-center justify-center mx-auto shadow-lg shadow-champ-blue/10">
            <Shield className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-champ-text">
            {lang === 'ar' ? 'تسجيل حساب معلم جديد' : 'Teacher Registration'}
          </h2>
          <p className="text-xs text-champ-muted">
            {lang === 'ar' ? 'التسجيل محمي ويتطلب كود دعوة المعلمين المعتمد الخاص بالمدرسة' : 'Protected registration requiring the official school access code'}
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-xl bg-champ-danger/10 border border-champ-danger/30 text-champ-danger text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Full Name */}
          <div>
            <label className="block text-xs font-bold text-champ-muted mb-1.5">
              {lang === 'ar' ? 'اسم المعلم كاملاً' : 'Full Teacher Name'} *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-champ-muted absolute top-3 left-3 rtl:left-auto rtl:right-3" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={lang === 'ar' ? 'أ. أحمد الشافعي' : 'e.g. Mr. John Smith'}
                className="w-full bg-champ-darkMuted border border-champ-border rounded-xl px-10 py-2.5 text-champ-text text-sm focus:outline-none focus:border-champ-blue"
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="block text-xs font-bold text-champ-muted mb-1.5">
              {lang === 'ar' ? 'البريد الإلكتروني' : 'Email Address'} *
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

          {/* Subject / Specialization */}
          <div>
            <label className="block text-xs font-bold text-champ-muted mb-1.5">
              {lang === 'ar' ? 'المادة / التخصص' : 'Subject / Specialization'} *
            </label>
            <div className="relative">
              <BookOpen className="w-4 h-4 text-champ-muted absolute top-3 left-3 rtl:left-auto rtl:right-3" />
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder={lang === 'ar' ? 'مثل: الرياضيات، العلوم، اللغة العربية' : 'e.g. Mathematics, Science'}
                className="w-full bg-champ-darkMuted border border-champ-border rounded-xl px-10 py-2.5 text-champ-text text-sm focus:outline-none focus:border-champ-blue"
              />
            </div>
          </div>

          {/* Mandatory Teacher Access Code */}
          <div className="p-3.5 rounded-2xl bg-champ-blue/10 border border-champ-blue/30 space-y-1.5">
            <label className="block text-xs font-bold text-champ-blue">
              {lang === 'ar' ? 'كود تسجيل المعلم السري (Teacher Access Code)' : 'Teacher Access Code'} *
            </label>
            <div className="relative">
              <KeyRound className="w-4 h-4 text-champ-blue absolute top-3 left-3 rtl:left-auto rtl:right-3" />
              <input
                type="text"
                required
                value={accessCode}
                onChange={(e) => setAccessCode(e.target.value)}
                placeholder="teach2026"
                className="w-full bg-champ-card border border-champ-blue/40 rounded-xl px-10 py-2.5 text-champ-text text-sm font-mono tracking-wider focus:outline-none focus:border-champ-blue font-bold"
              />
            </div>
            <p className="text-[11px] text-champ-muted">
              {lang === 'ar' ? 'كود التسجيل المعتمد للإصدار الحالي هو: teach2026' : 'The required registration code for this deployment is teach2026'}
            </p>
          </div>

          {/* Assigned Classrooms Checkboxes */}
          <div>
            <label className="block text-xs font-bold text-champ-muted mb-1.5">
              {lang === 'ar' ? 'الفصول المراد الإشراف عليها' : 'Classrooms to Supervise'}
            </label>
            <div className="grid grid-cols-2 gap-2">
              {classrooms.map((c) => (
                <label
                  key={c.id}
                  className={`p-3 rounded-xl border cursor-pointer flex items-center gap-2 text-xs font-semibold transition-colors ${
                    selectedClassrooms.includes(c.id) ? 'bg-champ-blue/15 text-champ-blue border-champ-blue' : 'bg-champ-darkMuted text-champ-muted border-champ-border'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedClassrooms.includes(c.id)}
                    onChange={() => handleClassroomToggle(c.id)}
                    className="accent-champ-blue"
                  />
                  <span>{c.name} ({c.name_ar || c.name})</span>
                </label>
              ))}
            </div>
          </div>

          {/* Passwords */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-champ-muted mb-1.5">
                {lang === 'ar' ? 'كلمة المرور' : 'Password'} *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-champ-muted absolute top-3 left-3 rtl:left-auto rtl:right-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength="6"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-champ-darkMuted border border-champ-border rounded-xl px-10 py-2.5 text-champ-text text-sm focus:outline-none focus:border-champ-blue"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-champ-muted mb-1.5">
                {lang === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'} *
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-champ-muted absolute top-3 left-3 rtl:left-auto rtl:right-3" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength="6"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
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
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-champ-blue hover:bg-champ-blue/90 text-champ-bg font-bold text-sm shadow-lg shadow-champ-blue/20 flex items-center justify-center gap-2 transition-all"
          >
            {loading ? (
              <span>{lang === 'ar' ? 'جارٍ التحقق والتسجيل...' : 'Verifying & Registering...'}</span>
            ) : (
              <>
                <span>{lang === 'ar' ? 'إرسال طلب تسجيل المعلم' : 'Submit Teacher Registration'}</span>
                <ArrowIcon className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-champ-border/60 text-center text-xs text-champ-muted">
          <span>{lang === 'ar' ? 'لديك حساب معلم معتمد؟' : 'Already have an approved account?'} </span>
          <Link to="/teacher/login" className="text-champ-blue font-bold hover:underline">
            {lang === 'ar' ? 'سجل دخولك هنا' : 'Log in here'}
          </Link>
        </div>

      </div>
    </div>
  );
}
