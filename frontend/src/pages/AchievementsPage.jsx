import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { gamificationService, authService } from '../services/api';
import { Award, CheckCircle2, Trophy, Sparkles, Filter, X, Check } from 'lucide-react';

export default function AchievementsPage() {
  const { user, isTeacher, isAdmin } = useAuth();
  const { lang, t } = useLanguage();

  const [achievements, setAchievements] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);

  // Manual Award Modal
  const [awardModalOpen, setAwardModalOpen] = useState(false);
  const [selectedAch, setSelectedAch] = useState(null);
  const [awardStudentId, setAwardStudentId] = useState('');
  const [awardReason, setAwardReason] = useState('');
  const [awarding, setAwarding] = useState(false);
  const [awardMsg, setAwardMsg] = useState('');

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    try {
      setLoading(true);
      const res = await gamificationService.getAchievements();
      setAchievements(res.data || []);

      if (isTeacher || isAdmin) {
        const uRes = await authService.getAllUsers({ role: 'STUDENT' });
        setStudents(uRes.data || []);
      }
    } catch (err) {
      console.warn('Achievements load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const categories = Array.from(new Set(achievements.map(a => a.category).filter(Boolean)));
  const filtered = achievements.filter(a => !selectedCategory || a.category === selectedCategory);

  const handleManualAward = async (e) => {
    e.preventDefault();
    setAwarding(true);
    setAwardMsg('');
    try {
      const res = await gamificationService.awardAchievement({
        student_id: parseInt(awardStudentId, 10),
        achievement_id: selectedAch.id,
        reason: awardReason.trim() || 'منح تشجيعي من المعلم',
      });
      setAwardMsg(res.data.message);
      setTimeout(() => {
        setAwardModalOpen(false);
        setAwardStudentId('');
        setAwardReason('');
        setAwardMsg('');
        loadAchievements();
      }, 1200);
    } catch (err) {
      alert(err.response?.data?.error || 'Error awarding achievement');
    } finally {
      setAwarding(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Banner */}
      <section className="bg-gradient-to-r from-champ-card via-champ-darkMuted to-champ-card border border-champ-border rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-champ-purple/20 border border-champ-purple/40 text-champ-purple flex items-center justify-center font-bold text-xl shadow">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-champ-text">
                {t('navAchievements')}
              </h1>
              <p className="text-xs text-champ-muted mt-0.5">
                {lang === 'ar' ? 'شارات الشرف والأوسمة المستحقة تلقائياً عند تحقيق الإنجازات والأنشطة' : 'Earn badges and medals through classroom participation and milestones'}
              </p>
            </div>
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-champ-darkMuted border border-champ-border text-xs">
            <button
              onClick={() => setSelectedCategory('')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                !selectedCategory ? 'bg-champ-purple text-champ-bg' : 'text-champ-muted hover:text-champ-text'
              }`}
            >
              {lang === 'ar' ? 'الكل' : 'All'}
            </button>
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  selectedCategory === cat ? 'bg-champ-purple text-champ-bg' : 'text-champ-muted hover:text-champ-text'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {filtered.map((ach) => (
          <div
            key={ach.id}
            className={`p-5 rounded-3xl border transition-all flex flex-col justify-between space-y-4 shadow-xl ${
              ach.is_earned
                ? 'bg-champ-darkMuted border-champ-primary/40 shadow-champ-primary/5'
                : 'bg-champ-card border-champ-border'
            }`}
          >
            <div className="flex items-start gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center font-bold text-2xl shrink-0 shadow-lg"
                style={{ backgroundColor: `${ach.badge_color}25`, color: ach.badge_color, border: `1px solid ${ach.badge_color}50` }}
              >
                <Award className="w-7 h-7" />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-1">
                  <h3 className="font-bold text-base text-champ-text truncate">
                    {lang === 'ar' ? ach.name_ar : ach.name_en}
                  </h3>
                  {ach.is_earned && (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-champ-primary/15 text-champ-primary border border-champ-primary/30 flex items-center gap-1 shrink-0">
                      <CheckCircle2 className="w-3 h-3" />
                      {lang === 'ar' ? 'مكتسب' : 'Earned'}
                    </span>
                  )}
                </div>

                <span className="text-[10px] font-semibold text-champ-muted block mt-0.5">
                  {ach.category}
                </span>

                <p className="text-xs text-champ-muted mt-2 leading-relaxed">
                  {lang === 'ar' ? ach.description_ar : ach.description_en}
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-champ-border/60 flex items-center justify-between text-xs">
              <span className="text-[11px] text-champ-muted font-medium">
                {ach.condition_type === 'POINTS_THRESHOLD' && `${ach.condition_value} ${t('points')}`}
                {ach.condition_type === 'FIRST_POINTS' && (lang === 'ar' ? 'أول معاملة نقاط' : 'First points')}
                {ach.condition_type === 'TOP_THREE' && (lang === 'ar' ? 'المراكز الثلاثة الأولى' : 'Top 3')}
                {ach.condition_type === 'TOP_TEN' && (lang === 'ar' ? 'المراكز العشرة الأولى' : 'Top 10')}
                {ach.condition_type === 'MANUAL' && (lang === 'ar' ? 'تكريم خاص من المعلم' : 'Faculty award')}
              </span>

              {(isTeacher || isAdmin) && (
                <button
                  onClick={() => {
                    setSelectedAch(ach);
                    setAwardModalOpen(true);
                  }}
                  className="px-3 py-1 rounded-lg bg-champ-purple/15 hover:bg-champ-purple text-champ-purple hover:text-champ-bg font-bold text-xs transition-colors"
                >
                  {lang === 'ar' ? 'منح لطالب' : 'Award to Student'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Manual Award Modal */}
      {awardModalOpen && selectedAch && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-champ-card border border-champ-border rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-champ-border pb-3">
              <div>
                <h3 className="font-bold text-base text-champ-text">
                  {lang === 'ar' ? 'منح وسام تشجيعي لطالب' : 'Award Achievement'}
                </h3>
                <p className="text-xs text-champ-purple font-semibold">{selectedAch.name_ar}</p>
              </div>
              <button onClick={() => setAwardModalOpen(false)} className="text-champ-muted hover:text-champ-text">
                <X className="w-5 h-5" />
              </button>
            </div>

            {awardMsg && (
              <div className="p-3 rounded-xl bg-champ-primary/10 border border-champ-primary/30 text-champ-primary text-xs">
                {awardMsg}
              </div>
            )}

            <form onSubmit={handleManualAward} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-champ-muted mb-1">
                  {lang === 'ar' ? 'اختر الطالب' : 'Select Student'} *
                </label>
                <select
                  required
                  value={awardStudentId}
                  onChange={(e) => setAwardStudentId(e.target.value)}
                  className="w-full bg-champ-darkMuted border border-champ-border rounded-xl px-3 py-2 text-champ-text focus:outline-none"
                >
                  <option value="">{lang === 'ar' ? '-- اختر الطالب --' : '-- Select Student --'}</option>
                  {students.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.full_name || st.username} ({st.student_profile?.classroom_name || 'طالب'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-champ-muted mb-1">
                  {lang === 'ar' ? 'سبب المنح' : 'Reason'}
                </label>
                <input
                  type="text"
                  value={awardReason}
                  onChange={(e) => setAwardReason(e.target.value)}
                  placeholder={lang === 'ar' ? 'تميز استثنائي في النشاط...' : 'Excellence in...'}
                  className="w-full bg-champ-darkMuted border border-champ-border rounded-xl px-3 py-2 text-champ-text focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setAwardModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-champ-muted hover:text-champ-text"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={awarding}
                  className="px-5 py-2 rounded-xl bg-champ-purple text-champ-bg font-bold shadow hover:opacity-90"
                >
                  {awarding ? (lang === 'ar' ? 'جارٍ المنح...' : 'Awarding...') : (lang === 'ar' ? 'تأكيد المنح' : 'Confirm Award')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
