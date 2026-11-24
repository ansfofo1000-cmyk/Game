import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { classroomService } from '../services/api';
import { GraduationCap, Lock, Mail, User, BookOpen, Shield, Eye, EyeOff, AlertCircle, CheckCircle, ArrowLeft, ArrowRight } from 'lucide-react';

export default function StudentRegisterPage() {
  const { registerStudent } = useAuth();
  const { lang, t, dir } = useLanguage();
  const navigate = useNavigate();

  const [classrooms, setClassrooms] = useState([]);
  const [positions, setPositions] = useState([]);
  const [committees, setCommittees] = useState([]);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [classroomId, setClassroomId] = useState('');
  const [positionId, setPositionId] = useState('');
  const [committeeId, setCommitteeId] = useState('');
  const [notes, setNotes] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    loadClassroomData();
  }, []);

  const loadClassroomData = async () => {
    try {
      const [clsRes, posRes, comRes] = await Promise.all([
        classroomService.getClassrooms(),
        classroomService.getPositions(),
        classroomService.getCommittees(),
      ]);

      setClassrooms(clsRes.data || []);
      if (clsRes.data?.length > 0) {
        setClassroomId(clsRes.data[0].id);
      }
      setPositions(posRes.data || []);
      setCommittees(comRes.data || []);
    } catch (err) {
      console.warn('Error loading registration metadata:', err);
    }
  };

  const selectedPosition = positions.find(p => String(p.id) === String(positionId));
  const isReporter = selectedPosition?.requires_committee;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError(lang === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
      return;
    }

    if (isReporter && !committeeId) {
      setError(lang === 'ar' ? 'يرجى اختيار اللجنة المقررة عند اختيار صفة مقرر' : 'Please select a committee for the Reporter role');
      return;
    }

    setLoading(true);

    try {
      await registerStudent({
        full_name: fullName.trim(),
        email: email.trim(),
        password,
        confirm_password: confirmPassword,
        classroom_id: parseInt(classroomId, 10),
        position_id: positionId ? parseInt(positionId, 10) : null,
        committee_id: (isReporter && committeeId) ? parseInt(committeeId, 10) : null,
        notes: notes.trim(),
      });

      navigate('/student/dashboard');
    } catch (err) {
      console.error(err);
      const resErrors = err.response?.data;
      if (resErrors) {
        const firstKey = Object.keys(resErrors)[0];
        const val = resErrors[firstKey];
        setError(Array.isArray(val) ? val[0] : (typeof val === 'string' ? val : JSON.stringify(val)));
      } else {
        setError(err.message || (lang === 'ar' ? 'حدث خطأ أثناء التسجيل' : 'Registration error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <div className="max-w-xl mx-auto my-8 sm:my-14 px-4">
      <div className="bg-champ-card border border-champ-border rounded-3xl p-6 sm:p-9 shadow-2xl relative overflow-hidden">
        
        <div className="text-center space-y-2 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-champ-primary/15 border border-champ-primary/30 text-champ-primary flex items-center justify-center mx-auto shadow-lg shadow-champ-primary/10">
            <GraduationCap className="w-7 h-7" />
          </div>
          <h2 className="text-2xl font-black text-champ-text">
            {lang === 'ar' ? 'تسجيل طالب جديد' : 'New Student Registration'}
          </h2>
          <p className="text-xs text-champ-muted">
            {lang === 'ar' ? 'انضم إلى فصلك وتنافس بنزاهة على صدارة لوحة الشرف والريادة' : 'Join your classroom and start competing for the leaderboard podium'}
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
              {lang === 'ar' ? 'الاسم الثلاثي أو الرباعي للطالب' : 'Full Student Name'} *
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-champ-muted absolute top-3 left-3 rtl:left-auto rtl:right-3" />
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={lang === 'ar' ? 'مثال: أحمد محمد علي' : 'e.g. John Doe'}
                className="w-full bg-champ-darkMuted border border-champ-border rounded-xl px-10 py-2.5 text-champ-text text-sm focus:outline-none focus:border-champ-primary"
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
                placeholder="student@school.edu"
                className="w-full bg-champ-darkMuted border border-champ-border rounded-xl px-10 py-2.5 text-champ-text text-sm focus:outline-none focus:border-champ-primary"
              />
            </div>
          </div>

          {/* Classroom Selection (Wheeler 2 or Wheeler 3) */}
          <div>
            <label className="block text-xs font-bold text-champ-muted mb-1.5">
              {lang === 'ar' ? 'اختر الفصل الدراسي' : 'Select Classroom'} *
            </label>
            <div className="relative">
              <BookOpen className="w-4 h-4 text-champ-muted absolute top-3 left-3 rtl:left-auto rtl:right-3" />
              <select
                required
                value={classroomId}
                onChange={(e) => setClassroomId(e.target.value)}
                className="w-full bg-champ-darkMuted border border-champ-border rounded-xl px-10 py-2.5 text-champ-text text-sm focus:outline-none focus:border-champ-primary"
              >
                {classrooms.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} ({c.name_ar || c.name})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Position selection / request */}
          <div>
            <label className="block text-xs font-bold text-champ-muted mb-1.5">
              {lang === 'ar' ? 'طلب منصب قيادي (اختياري - يخضع لاعتماد المعلم)' : 'Requested Leadership Position (Optional)'}
            </label>
            <div className="relative">
              <Shield className="w-4 h-4 text-champ-muted absolute top-3 left-3 rtl:left-auto rtl:right-3" />
              <select
                value={positionId}
                onChange={(e) => {
                  setPositionId(e.target.value);
                  setCommitteeId('');
                }}
                className="w-full bg-champ-darkMuted border border-champ-border rounded-xl px-10 py-2.5 text-champ-text text-sm focus:outline-none focus:border-champ-primary"
              >
                <option value="">{lang === 'ar' ? 'طالب متميز (بدون منصب حالياً)' : 'Student (No position)'}</option>
                {positions.map((p) => (
                  <option key={p.id} value={p.id}>
                    {lang === 'ar' ? p.name_ar : p.name_en}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Conditional Reporter Committee Selection */}
          {isReporter && (
            <div className="p-3.5 rounded-2xl bg-champ-primary/10 border border-champ-primary/30 space-y-2 animate-fadeIn">
              <label className="block text-xs font-bold text-champ-primary">
                {lang === 'ar' ? 'اختر اللجنة المتخصصة للمقرر' : 'Select Reporter Committee'} *
              </label>
              <select
                required
                value={committeeId}
                onChange={(e) => setCommitteeId(e.target.value)}
                className="w-full bg-champ-card border border-champ-primary/40 rounded-xl px-3 py-2 text-champ-text text-sm focus:outline-none focus:border-champ-primary font-semibold"
              >
                <option value="">{lang === 'ar' ? '-- اختر اللجنة --' : '-- Select Committee --'}</option>
                {committees.map((com) => (
                  <option key={com.id} value={com.id}>
                    {lang === 'ar' ? com.name_ar : com.name_en}
                  </option>
                ))}
              </select>
            </div>
          )}

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
                  className="w-full bg-champ-darkMuted border border-champ-border rounded-xl px-10 py-2.5 text-champ-text text-sm focus:outline-none focus:border-champ-primary"
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
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-champ-primary hover:bg-champ-primaryHover text-champ-bg font-bold text-sm shadow-lg shadow-champ-primary/20 flex items-center justify-center gap-2 transition-all"
          >
            {loading ? (
              <span>{lang === 'ar' ? 'جارٍ تسجيل الحساب...' : 'Creating account...'}</span>
            ) : (
              <>
                <span>{lang === 'ar' ? 'تأكيد إنشاء الحساب' : 'Complete Registration'}</span>
                <ArrowIcon className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-4 border-t border-champ-border/60 text-center text-xs text-champ-muted">
          <span>{lang === 'ar' ? 'لديك حساب بالفعل؟' : 'Already have an account?'} </span>
          <Link to="/student/login" className="text-champ-primary font-bold hover:underline">
            {lang === 'ar' ? 'سجل دخولك هنا' : 'Log in here'}
          </Link>
        </div>

      </div>
    </div>
  );
}
