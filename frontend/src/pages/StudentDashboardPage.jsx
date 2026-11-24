import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { pointsService, gamificationService, challengeService, authService } from '../services/api';
import {
  Sparkles,
  Coins,
  Trophy,
  Award,
  Crown,
  Flame,
  Shield,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  TrendingUp,
  User,
  Edit3,
  Save,
  X
} from 'lucide-react';

export default function StudentDashboardPage() {
  const { user, refreshUser } = useAuth();
  const { lang, t } = useLanguage();

  const [pointsHistory, setPointsHistory] = useState([]);
  const [coinsHistory, setCoinsHistory] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [levels, setLevels] = useState([]);
  const [classroomRank, setClassroomRank] = useState(null);
  const [overallRank, setOverallRank] = useState(null);
  const [activeTab, setActiveTab] = useState('POINTS_HISTORY'); // 'POINTS_HISTORY', 'COINS_HISTORY', 'ACHIEVEMENTS', 'CHALLENGES'

  // Edit Bio/Avatar
  const [editingProfile, setEditingProfile] = useState(false);
  const [bioInput, setBioInput] = useState('');
  const [avatarInput, setAvatarInput] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  useEffect(() => {
    loadStudentData();
  }, [user]);

  const loadStudentData = async () => {
    if (!user) return;
    try {
      const [ptsRes, cnsRes, achRes, chRes, lvlRes, lbRes] = await Promise.all([
        pointsService.getPointsHistory(),
        pointsService.getCoinsHistory(),
        gamificationService.getAchievements(),
        challengeService.getChallenges(),
        gamificationService.getLevels(),
        gamificationService.getLeaderboard(),
      ]);

      setPointsHistory(ptsRes.data || []);
      setCoinsHistory(cnsRes.data || []);
      setAchievements(achRes.data || []);
      setChallenges(chRes.data || []);
      setLevels(lvlRes.data || []);

      // Calculate ranks from leaderboard
      const ranking = lbRes.data?.ranking || [];
      const overall = ranking.find(s => s.user_id === user.id);
      if (overall) {
        setOverallRank(overall.rank);
      }

      const classroomRanking = ranking.filter(s => s.classroom_id === user.student_profile?.classroom);
      const inClassIndex = classroomRanking.findIndex(s => s.user_id === user.id);
      if (inClassIndex !== -1) {
        setClassroomRank(inClassIndex + 1);
      }

      setBioInput(user.student_profile?.bio || '');
      setAvatarInput(user.student_profile?.avatar || '');

    } catch (err) {
      console.warn('Error loading student dashboard data:', err);
    }
  };

  const profile = user?.student_profile || {};
  const currentPoints = profile.points || 0;
  const currentCoins = profile.coins || 0;

  // Level progression calculation
  const sortedLevels = [...levels].sort((a, b) => a.min_points - b.min_points);
  let currentLevelObj = sortedLevels[0];
  let nextLevelObj = null;

  for (let i = 0; i < sortedLevels.length; i++) {
    if (currentPoints >= sortedLevels[i].min_points) {
      currentLevelObj = sortedLevels[i];
      nextLevelObj = sortedLevels[i + 1] || null;
    }
  }

  let progressPercent = 100;
  let pointsNeeded = 0;
  if (nextLevelObj) {
    const range = nextLevelObj.min_points - currentLevelObj.min_points;
    const progress = currentPoints - currentLevelObj.min_points;
    progressPercent = Math.min(Math.max(Math.round((progress / range) * 100), 0), 100);
    pointsNeeded = nextLevelObj.min_points - currentPoints;
  }

  const handleSaveProfile = async () => {
    setSavingProfile(true);
    try {
      await authService.updateProfile({
        bio: bioInput,
        avatar: avatarInput,
      });
      await refreshUser();
      setEditingProfile(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSavingProfile(false);
    }
  };

  const handleJoinChallenge = async (challengeId) => {
    try {
      await challengeService.joinChallenge(challengeId);
      // reload challenges
      const res = await challengeService.getChallenges();
      setChallenges(res.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const earnedAchievements = achievements.filter(a => a.is_earned);

  return (
    <div className="space-y-8 pb-16">
      
      {/* Student Profile Card Banner */}
      <section className="bg-gradient-to-r from-champ-card via-champ-darkMuted to-champ-card border border-champ-border rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-champ-primary/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative">
          
          {/* Avatar & Info */}
          <div className="flex items-center gap-4 sm:gap-6">
            <div className="relative group">
              <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl border-2 border-champ-primary bg-champ-darkMuted flex items-center justify-center font-black text-3xl text-champ-primary shadow-xl shadow-champ-primary/20 overflow-hidden">
                {profile.avatar ? (
                  <img src={profile.avatar} alt={user.full_name} className="w-full h-full object-cover" />
                ) : (
                  <span>{(user.full_name || user.username).charAt(0)}</span>
                )}
              </div>
              <button
                onClick={() => setEditingProfile(true)}
                className="absolute -bottom-1 -right-1 p-1.5 rounded-lg bg-champ-primary text-champ-bg shadow hover:scale-110 transition-transform"
                title={lang === 'ar' ? 'تعديل النبذة أو الصورة' : 'Edit profile'}
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-champ-text">
                  {user.full_name || user.username}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-champ-primary/15 text-champ-primary border border-champ-primary/30">
                  {profile.classroom_name_ar || profile.classroom_name}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-xs text-champ-muted">
                {profile.position_name_ar ? (
                  <span className="px-2 py-0.5 rounded-md bg-champ-blue/15 text-champ-blue border border-champ-blue/30 font-semibold">
                    {profile.position_name_ar} {profile.committee_name_ar && `(${profile.committee_name_ar})`}
                  </span>
                ) : (
                  <span className="text-champ-muted/80">{lang === 'ar' ? 'طالب متميز' : 'Distinguished Student'}</span>
                )}
                <span>•</span>
                <span>{user.email}</span>
              </div>

              {profile.bio && (
                <p className="text-xs text-champ-muted/90 pt-1 italic max-w-md">
                  "{profile.bio}"
                </p>
              )}
            </div>
          </div>

          {/* Quick Stat Badges */}
          <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
            
            <div className="px-4 py-3 rounded-2xl bg-champ-card border border-champ-primary/40 text-center min-w-[90px] shadow">
              <span className="text-[10px] text-champ-muted block font-semibold">{t('points')}</span>
              <span className="text-xl sm:text-2xl font-black text-champ-primary flex items-center justify-center gap-1">
                <Sparkles className="w-4 h-4" />
                {currentPoints}
              </span>
            </div>

            <div className="px-4 py-3 rounded-2xl bg-champ-card border border-champ-gold/40 text-center min-w-[90px] shadow">
              <span className="text-[10px] text-champ-muted block font-semibold">{t('coins')}</span>
              <span className="text-xl sm:text-2xl font-black text-champ-gold flex items-center justify-center gap-1">
                <Coins className="w-4 h-4" />
                {currentCoins}
              </span>
            </div>

            <div className="px-4 py-3 rounded-2xl bg-champ-card border border-champ-border text-center min-w-[90px] shadow">
              <span className="text-[10px] text-champ-muted block font-semibold">{lang === 'ar' ? 'ترتيب الفصل' : 'Class Rank'}</span>
              <span className="text-xl sm:text-2xl font-black text-champ-text">
                #{classroomRank || '-'}
              </span>
            </div>

            <div className="px-4 py-3 rounded-2xl bg-champ-card border border-champ-border text-center min-w-[90px] shadow">
              <span className="text-[10px] text-champ-muted block font-semibold">{lang === 'ar' ? 'الترتيب العام' : 'Overall'}</span>
              <span className="text-xl sm:text-2xl font-black text-champ-text">
                #{overallRank || '-'}
              </span>
            </div>

          </div>

        </div>

        {/* Level Progression Bar */}
        <div className="mt-6 pt-5 border-t border-champ-border/60">
          <div className="flex items-center justify-between text-xs mb-2">
            <div className="flex items-center gap-1.5 font-bold text-champ-text">
              <Award className="w-4 h-4 text-champ-primary" />
              <span>{lang === 'ar' ? 'المستوى الحالي:' : 'Current Level:'}</span>
              <span className="text-champ-primary">{currentLevelObj?.name_ar || profile.level}</span>
            </div>

            {nextLevelObj ? (
              <span className="text-xs text-champ-muted">
                {lang === 'ar' ? `متبقي ${pointsNeeded} نقطة للترقية إلى: ${nextLevelObj.name_ar}` : `${pointsNeeded} points until ${nextLevelObj.name_en}`}
              </span>
            ) : (
              <span className="text-xs text-champ-gold font-bold flex items-center gap-1">
                <Flame className="w-3.5 h-3.5" />
                {lang === 'ar' ? 'أعلى مرتبة في المنصة (أسطورة)!' : 'Max Level Achieved (Legend)!'}
              </span>
            )}
          </div>

          <div className="w-full h-3 bg-champ-darkMuted rounded-full overflow-hidden border border-champ-border p-0.5">
            <div
              className="h-full bg-gradient-to-r from-champ-primary to-champ-blue rounded-full transition-all duration-700 shadow-sm"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

      </section>

      {/* Edit Bio/Avatar Modal */}
      {editingProfile && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-champ-card border border-champ-border rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-champ-border pb-3">
              <h3 className="font-bold text-base text-champ-text">
                {lang === 'ar' ? 'تعديل الملف الشخصي' : 'Edit Profile'}
              </h3>
              <button onClick={() => setEditingProfile(false)} className="text-champ-muted hover:text-champ-text">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-champ-muted mb-1">
                {lang === 'ar' ? 'رابط الصورة الرمزية (Avatar URL)' : 'Avatar Image URL'}
              </label>
              <input
                type="url"
                value={avatarInput}
                onChange={(e) => setAvatarInput(e.target.value)}
                placeholder="https://..."
                className="w-full bg-champ-darkMuted border border-champ-border rounded-xl px-3 py-2 text-sm text-champ-text focus:outline-none focus:border-champ-primary"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-champ-muted mb-1">
                {lang === 'ar' ? 'نبذة تعريفية (Bio)' : 'Bio / Quote'}
              </label>
              <textarea
                rows="3"
                value={bioInput}
                onChange={(e) => setBioInput(e.target.value)}
                placeholder={lang === 'ar' ? 'أحب مادة الرياضيات والبحث العلمي...' : 'I love science and teamwork...'}
                className="w-full bg-champ-darkMuted border border-champ-border rounded-xl p-3 text-sm text-champ-text focus:outline-none focus:border-champ-primary resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingProfile(false)}
                className="px-4 py-2 rounded-xl text-xs text-champ-muted hover:text-champ-text"
              >
                {t('cancel')}
              </button>
              <button
                type="button"
                disabled={savingProfile}
                onClick={handleSaveProfile}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-champ-primary text-champ-bg shadow hover:bg-champ-primaryHover"
              >
                {savingProfile ? (lang === 'ar' ? 'جارٍ الحفظ...' : 'Saving...') : t('save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-champ-border overflow-x-auto pb-1 text-sm font-bold">
        <button
          onClick={() => setActiveTab('POINTS_HISTORY')}
          className={`px-4 py-2 rounded-t-xl transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'POINTS_HISTORY'
              ? 'border-champ-primary text-champ-primary bg-champ-primary/10'
              : 'border-transparent text-champ-muted hover:text-champ-text'
          }`}
        >
          {lang === 'ar' ? 'سجل النقاط' : 'Points History'} ({pointsHistory.length})
        </button>

        <button
          onClick={() => setActiveTab('COINS_HISTORY')}
          className={`px-4 py-2 rounded-t-xl transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'COINS_HISTORY'
              ? 'border-champ-gold text-champ-gold bg-champ-gold/10'
              : 'border-transparent text-champ-muted hover:text-champ-text'
          }`}
        >
          {lang === 'ar' ? 'سجل العملات' : 'Coins History'} ({coinsHistory.length})
        </button>

        <button
          onClick={() => setActiveTab('ACHIEVEMENTS')}
          className={`px-4 py-2 rounded-t-xl transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'ACHIEVEMENTS'
              ? 'border-champ-purple text-champ-purple bg-champ-purple/10'
              : 'border-transparent text-champ-muted hover:text-champ-text'
          }`}
        >
          {lang === 'ar' ? 'الأوسمة والإنجازات' : 'Achievements'} ({earnedAchievements.length})
        </button>

        <button
          onClick={() => setActiveTab('CHALLENGES')}
          className={`px-4 py-2 rounded-t-xl transition-colors border-b-2 whitespace-nowrap ${
            activeTab === 'CHALLENGES'
              ? 'border-champ-danger text-champ-danger bg-champ-danger/10'
              : 'border-transparent text-champ-muted hover:text-champ-text'
          }`}
        >
          {t('navChallenges')} ({challenges.length})
        </button>
      </div>

      {/* Tab 1: Points History */}
      {activeTab === 'POINTS_HISTORY' && (
        <div className="bg-champ-card border border-champ-border rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-champ-text">
              {lang === 'ar' ? 'سجل النقاط التنافسية الدائم' : 'Permanent Points Transaction Ledger'}
            </h3>
            <span className="text-xs text-champ-muted">
              {lang === 'ar' ? 'جميع المعاملات موثقة وغير قابلة للتعديل الخفي' : 'Permanent audit records'}
            </span>
          </div>

          {pointsHistory.length === 0 ? (
            <div className="text-center py-12 text-champ-muted text-xs">
              {lang === 'ar' ? 'لم يتم تسجيل أي معاملات نقاط بعد. شارك في الأنشطة الصفية للحصول على أول نقاطك!' : 'No points transactions yet.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right rtl:text-right ltr:text-left text-xs">
                <thead>
                  <tr className="border-b border-champ-border text-champ-muted">
                    <th className="py-2.5 px-3">{lang === 'ar' ? 'العملية' : 'Type'}</th>
                    <th className="py-2.5 px-3">{t('amount')}</th>
                    <th className="py-2.5 px-3">{t('reason')}</th>
                    <th className="py-2.5 px-3">{t('category')}</th>
                    <th className="py-2.5 px-3">{lang === 'ar' ? 'المعلم المسؤول' : 'Teacher'}</th>
                    <th className="py-2.5 px-3">{lang === 'ar' ? 'الرصيد السابق' : 'Prev'}</th>
                    <th className="py-2.5 px-3">{lang === 'ar' ? 'الرصيد الجديد' : 'New'}</th>
                    <th className="py-2.5 px-3">{lang === 'ar' ? 'التاريخ والوقت' : 'Timestamp'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-champ-border/40">
                  {pointsHistory.map((tx) => (
                    <tr key={tx.id} className="hover:bg-champ-darkMuted/40 transition-colors">
                      <td className="py-2.5 px-3 font-semibold">
                        {tx.transaction_type === 'ADD' ? (
                          <span className="text-champ-primary">{lang === 'ar' ? 'إضافة نقاط' : 'Add'}</span>
                        ) : tx.transaction_type === 'DEDUCT' ? (
                          <span className="text-champ-danger">{lang === 'ar' ? 'خصم نقاط' : 'Deduct'}</span>
                        ) : (
                          <span className="text-champ-blue">{lang === 'ar' ? 'تعديل إداري' : 'Adjustment'}</span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 font-bold">
                        <span className={tx.amount > 0 ? 'text-champ-primary' : 'text-champ-danger'}>
                          {tx.amount > 0 ? `+${tx.amount}` : tx.amount}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 max-w-xs text-champ-text leading-relaxed">
                        {tx.reason}
                      </td>
                      <td className="py-2.5 px-3 text-champ-muted">
                        {tx.category_display || tx.category}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-champ-text">
                        {tx.teacher_name}
                      </td>
                      <td className="py-2.5 px-3 text-champ-muted font-mono">{tx.previous_balance}</td>
                      <td className="py-2.5 px-3 font-bold text-champ-primary font-mono">{tx.new_balance}</td>
                      <td className="py-2.5 px-3 text-champ-muted text-[11px] whitespace-nowrap">
                        {new Date(tx.timestamp).toLocaleDateString()} {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Coins History */}
      {activeTab === 'COINS_HISTORY' && (
        <div className="bg-champ-card border border-champ-border rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-champ-gold flex items-center gap-1.5">
              <Coins className="w-5 h-5 text-champ-gold" />
              <span>{lang === 'ar' ? 'سجل العملات الذهبية التنافسية' : 'Coins Ledger'}</span>
            </h3>
            <span className="text-xs text-champ-muted font-bold">
              {lang === 'ar' ? `الرصيد الإجمالي: ${currentCoins} عملة` : `Balance: ${currentCoins} coins`}
            </span>
          </div>

          {coinsHistory.length === 0 ? (
            <div className="text-center py-12 text-champ-muted text-xs">
              {lang === 'ar' ? 'لم يتم منح عملات بعد. العملات تُمنح للمبادرات الاستثنائية وحل التحديات الصفية!' : 'No coins transactions recorded yet.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-right rtl:text-right ltr:text-left text-xs">
                <thead>
                  <tr className="border-b border-champ-border text-champ-muted">
                    <th className="py-2.5 px-3">{lang === 'ar' ? 'العملية' : 'Type'}</th>
                    <th className="py-2.5 px-3">{t('amount')}</th>
                    <th className="py-2.5 px-3">{t('reason')}</th>
                    <th className="py-2.5 px-3">{lang === 'ar' ? 'المعلم المسؤول' : 'Teacher'}</th>
                    <th className="py-2.5 px-3">{lang === 'ar' ? 'الرصيد السابق' : 'Prev'}</th>
                    <th className="py-2.5 px-3">{lang === 'ar' ? 'الرصيد الجديد' : 'New'}</th>
                    <th className="py-2.5 px-3">{lang === 'ar' ? 'التاريخ والوقت' : 'Timestamp'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-champ-border/40">
                  {coinsHistory.map((tx) => (
                    <tr key={tx.id} className="hover:bg-champ-darkMuted/40 transition-colors">
                      <td className="py-2.5 px-3 font-semibold text-champ-gold">
                        {lang === 'ar' ? 'منح عملات' : 'Award'}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-champ-gold">
                        +{tx.amount}
                      </td>
                      <td className="py-2.5 px-3 text-champ-text leading-relaxed">
                        {tx.reason}
                      </td>
                      <td className="py-2.5 px-3 font-medium text-champ-text">
                        {tx.teacher_name}
                      </td>
                      <td className="py-2.5 px-3 text-champ-muted font-mono">{tx.previous_balance}</td>
                      <td className="py-2.5 px-3 font-bold text-champ-gold font-mono">{tx.new_balance}</td>
                      <td className="py-2.5 px-3 text-champ-muted text-[11px] whitespace-nowrap">
                        {new Date(tx.timestamp).toLocaleDateString()} {new Date(tx.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Achievements */}
      {activeTab === 'ACHIEVEMENTS' && (
        <div className="bg-champ-card border border-champ-border rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-base text-champ-text">
                {lang === 'ar' ? 'أوسمة وشارات الشرف المكتسبة' : 'Earned Badges & Achievements'}
              </h3>
              <p className="text-xs text-champ-muted">
                {lang === 'ar' ? `حققت ${earnedAchievements.length} من أصل ${achievements.length} شارة متاحة` : `${earnedAchievements.length} of ${achievements.length} unlocked`}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {achievements.map((ach) => (
              <div
                key={ach.id}
                className={`p-4 rounded-2xl border transition-all ${
                  ach.is_earned
                    ? 'bg-champ-darkMuted border-champ-primary/40 shadow-lg shadow-champ-primary/5'
                    : 'bg-champ-card/50 border-champ-border/40 opacity-50 grayscale'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl shrink-0"
                    style={{ backgroundColor: `${ach.badge_color}25`, color: ach.badge_color }}
                  >
                    <Award className="w-6 h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <h4 className="font-bold text-sm text-champ-text truncate">
                        {lang === 'ar' ? ach.name_ar : ach.name_en}
                      </h4>
                      {ach.is_earned && (
                        <CheckCircle2 className="w-4 h-4 text-champ-primary shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-champ-muted mt-1 leading-relaxed">
                      {lang === 'ar' ? ach.description_ar : ach.description_en}
                    </p>
                    {ach.is_earned && ach.earned_at && (
                      <span className="text-[10px] text-champ-primary font-semibold mt-2 block">
                        {lang === 'ar' ? 'تم الفوز بها في:' : 'Unlocked on:'} {new Date(ach.earned_at).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 4: Active Challenges */}
      {activeTab === 'CHALLENGES' && (
        <div className="bg-champ-card border border-champ-border rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-base text-champ-text">
              {lang === 'ar' ? 'التحديات والمسابقات الصفية النشطة' : 'Classroom Challenges'}
            </h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {challenges.map((ch) => (
              <div
                key={ch.id}
                className="p-5 rounded-2xl bg-champ-darkMuted border border-champ-border flex flex-col justify-between space-y-4 hover:border-champ-primary/40 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-sm text-champ-text">
                      {lang === 'ar' ? ch.title_ar : ch.title_en}
                    </h4>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-champ-card text-champ-muted border border-champ-border">
                      {ch.classroom_name_ar || ch.classroom_name}
                    </span>
                  </div>
                  <p className="text-xs text-champ-muted leading-relaxed">
                    {ch.description}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-champ-border/60 text-xs">
                  <div className="flex items-center gap-3">
                    <span className="text-champ-primary font-bold">
                      +{ch.reward_points} {t('points')}
                    </span>
                    <span className="text-champ-gold font-bold">
                      +{ch.reward_coins} {t('coins')}
                    </span>
                  </div>

                  <div>
                    {ch.is_completed ? (
                      <span className="px-3 py-1 rounded-lg bg-champ-primary/20 text-champ-primary font-bold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {t('completedChallenge')}
                      </span>
                    ) : ch.is_joined ? (
                      <span className="px-3 py-1 rounded-lg bg-champ-blue/20 text-champ-blue font-bold">
                        {lang === 'ar' ? 'منضم حالياً' : 'Joined'}
                      </span>
                    ) : (
                      <button
                        onClick={() => handleJoinChallenge(ch.id)}
                        className="px-3.5 py-1 rounded-lg bg-champ-primary hover:bg-champ-primaryHover text-champ-bg font-bold transition-all shadow-sm"
                      >
                        {t('joinChallenge')}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
}
