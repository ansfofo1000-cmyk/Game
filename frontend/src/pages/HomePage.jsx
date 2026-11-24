import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { gamificationService, classroomService, pointsService, reportService } from '../services/api';
import Podium from '../components/Podium';
import {
  Trophy,
  Users,
  Sparkles,
  Coins,
  Award,
  ArrowRight,
  ArrowLeft,
  ChevronRight,
  Shield,
  GraduationCap,
  Calendar,
  Layers,
  BarChart3,
  Flame,
  CheckCircle2
} from 'lucide-react';

export default function HomePage() {
  const { lang, t, dir } = useLanguage();
  const { isAuthenticated, isStudent, isTeacher, isAdmin } = useAuth();

  const [leaderboardScope, setLeaderboardScope] = useState('ALL'); // 'ALL' or classroomId
  const [classrooms, setClassrooms] = useState([]);
  const [topThree, setTopThree] = useState([]);
  const [overview, setOverview] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadHomeData();
  }, [leaderboardScope]);

  const loadHomeData = async () => {
    try {
      setLoading(true);
      const [clsRes, repRes, actRes] = await Promise.all([
        classroomService.getClassrooms(),
        reportService.getAnalyticsSummary(),
        pointsService.getActivityFeed({ limit: 6 })
      ]);

      setClassrooms(clsRes.data || []);
      setOverview(repRes.data.overview || null);
      setRecentActivities(actRes.data || []);

      // Fetch leaderboard based on scope
      const lbParams = leaderboardScope !== 'ALL' ? { classroom_id: leaderboardScope } : {};
      const lbRes = await gamificationService.getLeaderboard(lbParams);
      setTopThree(lbRes.data.top_three || []);
    } catch (err) {
      console.warn('Error loading home data:', err);
    } finally {
      setLoading(false);
    }
  };

  const ArrowIcon = dir === 'rtl' ? ArrowLeft : ArrowRight;

  return (
    <div className="space-y-12 pb-16">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-champ-card via-champ-bg to-champ-darkMuted border border-champ-border p-6 sm:p-10 lg:p-14 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-champ-primary/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-champ-blue/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-champ-primary/15 border border-champ-primary/30 text-champ-primary text-xs font-bold">
            <Sparkles className="w-4 h-4" />
            <span>{lang === 'ar' ? 'منصة التنافس والريادة المدرسية الرسمية' : 'Official Student Leadership Platform'}</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-black text-champ-text tracking-tight leading-tight">
            {lang === 'ar' ? (
              <>
                مرحباً بكم في <span className="bg-gradient-to-r from-champ-primary via-champ-blue to-champ-gold bg-clip-text text-transparent">أبطال الفصل</span>
              </>
            ) : (
              <>
                Welcome to <span className="bg-gradient-to-r from-champ-primary via-champ-blue to-champ-gold bg-clip-text text-transparent">Class Champions</span>
              </>
            )}
          </h1>

          <p className="text-sm sm:text-base text-champ-muted leading-relaxed max-w-2xl">
            {lang === 'ar'
              ? 'المنصة التعليمية التنافسية المصممة لتحفيز الطلاب على المشاركة الصفية الفعالة، وتحمل المسؤولية، وتطوير روح العمل الجماعي والقيادة العالية من خلال النقاط، العملات، الأوسمة، والرتب التقديرية.'
              : 'Empowering students to actively participate, demonstrate leadership, take responsibility, and compete fairly through points, coins, levels, rankings, and achievements.'}
          </p>

          {/* Quick Action Portals */}
          <div className="flex flex-wrap items-center gap-3 pt-2">
            {!isAuthenticated ? (
              <>
                <Link
                  to="/student/login"
                  className="px-6 py-3 rounded-xl bg-champ-primary hover:bg-champ-primaryHover text-champ-bg font-bold text-sm shadow-lg shadow-champ-primary/20 flex items-center gap-2 transition-transform hover:-translate-y-0.5"
                >
                  <GraduationCap className="w-5 h-5" />
                  <span>{t('studentLogin')}</span>
                  <ArrowIcon className="w-4 h-4" />
                </Link>

                <Link
                  to="/teacher/login"
                  className="px-6 py-3 rounded-xl bg-champ-card hover:bg-champ-cardHover text-champ-text border border-champ-border hover:border-champ-blue font-bold text-sm shadow-md flex items-center gap-2 transition-transform hover:-translate-y-0.5"
                >
                  <Shield className="w-5 h-5 text-champ-blue" />
                  <span>{t('teacherLogin')}</span>
                </Link>

                <Link
                  to="/leaderboard"
                  className="px-5 py-3 rounded-xl text-champ-muted hover:text-champ-primary text-sm font-semibold flex items-center gap-1.5 transition-colors"
                >
                  <span>{t('navLeaderboard')}</span>
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-3">
                {isStudent && (
                  <Link
                    to="/student/dashboard"
                    className="px-6 py-3 rounded-xl bg-champ-primary text-champ-bg font-bold text-sm shadow-lg flex items-center gap-2"
                  >
                    <span>{t('studentDashboard')}</span>
                    <ArrowIcon className="w-4 h-4" />
                  </Link>
                )}
                {isTeacher && (
                  <Link
                    to="/teacher/dashboard"
                    className="px-6 py-3 rounded-xl bg-champ-blue text-champ-bg font-bold text-sm shadow-lg flex items-center gap-2"
                  >
                    <span>{t('teacherDashboard')}</span>
                    <ArrowIcon className="w-4 h-4" />
                  </Link>
                )}
                {isAdmin && (
                  <Link
                    to="/admin/dashboard"
                    className="px-6 py-3 rounded-xl bg-champ-gold text-champ-bg font-bold text-sm shadow-lg flex items-center gap-2"
                  >
                    <span>{t('navAdminPanel')}</span>
                    <ArrowIcon className="w-4 h-4" />
                  </Link>
                )}
                <Link
                  to="/leaderboard"
                  className="px-5 py-3 rounded-xl bg-champ-card hover:bg-champ-cardHover text-champ-text border border-champ-border text-sm font-semibold flex items-center gap-2"
                >
                  <Trophy className="w-4 h-4 text-champ-gold" />
                  <span>{t('navLeaderboard')}</span>
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Podium & Leaderboard Spotlight */}
      <section className="bg-champ-card/80 border border-champ-border rounded-3xl p-6 sm:p-8 backdrop-blur-sm space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-champ-border pb-4">
          <div>
            <div className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-champ-gold" />
              <h2 className="text-xl sm:text-2xl font-bold text-champ-text">
                {t('topStudents')}
              </h2>
            </div>
            <p className="text-xs sm:text-sm text-champ-muted mt-1">
              {lang === 'ar' ? 'المراكز الثلاثة الأولى وفقاً للبيانات الفعلية المسجلة' : 'Top three podium leaders calculated live from database records'}
            </p>
          </div>

          {/* Scope Filter Switcher */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-champ-darkMuted border border-champ-border text-xs">
            <button
              onClick={() => setLeaderboardScope('ALL')}
              className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                leaderboardScope === 'ALL' ? 'bg-champ-primary text-champ-bg shadow' : 'text-champ-muted hover:text-champ-text'
              }`}
            >
              {lang === 'ar' ? 'التصنيف العام' : 'Overall School'}
            </button>
            {classrooms.map((c) => (
              <button
                key={c.id}
                onClick={() => setLeaderboardScope(c.id)}
                className={`px-3 py-1.5 rounded-lg font-bold transition-colors ${
                  leaderboardScope === c.id ? 'bg-champ-primary text-champ-bg shadow' : 'text-champ-muted hover:text-champ-text'
                }`}
              >
                {lang === 'ar' ? (c.name_ar || c.name) : c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Podium Component */}
        <Podium topThree={topThree} />

        <div className="text-center pt-2">
          <Link
            to={leaderboardScope !== 'ALL' ? `/leaderboard?classroom_id=${leaderboardScope}` : '/leaderboard'}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-champ-primary hover:underline"
          >
            <span>{lang === 'ar' ? 'عرض قائمة الترتيب الكاملة لجميع الطلاب' : 'View Full Leaderboard & Complete Rankings'}</span>
            <ArrowIcon className="w-4 h-4" />
          </Link>
        </div>
      </section>

      {/* Real Statistics Overview Cards */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-champ-text flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-champ-blue" />
          <span>{lang === 'ar' ? 'إحصائيات المنصة الحية' : 'Live Platform Statistics'}</span>
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
          
          <div className="p-4 rounded-2xl bg-champ-card border border-champ-border flex flex-col justify-between">
            <span className="text-xs text-champ-muted font-medium">{lang === 'ar' ? 'إجمالي الطلاب' : 'Students'}</span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-black text-champ-text">{overview?.total_students ?? 0}</span>
              <Users className="w-5 h-5 text-champ-blue opacity-80" />
            </div>
            <span className="text-[10px] text-champ-muted mt-1">Wheeler 2 & 3</span>
          </div>

          <div className="p-4 rounded-2xl bg-champ-card border border-champ-border flex flex-col justify-between">
            <span className="text-xs text-champ-muted font-medium">{t('points')}</span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-black text-champ-primary">{overview?.total_points ?? 0}</span>
              <Sparkles className="w-5 h-5 text-champ-primary opacity-80" />
            </div>
            <span className="text-[10px] text-champ-muted mt-1">{lang === 'ar' ? 'نقاط تنافسية' : 'Total points'}</span>
          </div>

          <div className="p-4 rounded-2xl bg-champ-card border border-champ-border flex flex-col justify-between">
            <span className="text-xs text-champ-muted font-medium">{t('coins')}</span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-black text-champ-gold">{overview?.total_coins ?? 0}</span>
              <Coins className="w-5 h-5 text-champ-gold opacity-80" />
            </div>
            <span className="text-[10px] text-champ-muted mt-1">{lang === 'ar' ? 'عملات ذهبية' : 'Virtual coins'}</span>
          </div>

          <div className="p-4 rounded-2xl bg-champ-card border border-champ-border flex flex-col justify-between">
            <span className="text-xs text-champ-muted font-medium">{lang === 'ar' ? 'المعلمون المعتمدون' : 'Teachers'}</span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-black text-champ-text">{overview?.total_teachers ?? 0}</span>
              <Shield className="w-5 h-5 text-champ-blue opacity-80" />
            </div>
            <span className="text-[10px] text-champ-muted mt-1">{lang === 'ar' ? 'هيئة التدريس' : 'Active faculty'}</span>
          </div>

          <div className="p-4 rounded-2xl bg-champ-card border border-champ-border flex flex-col justify-between">
            <span className="text-xs text-champ-muted font-medium">{lang === 'ar' ? 'الأوسمة الممنوحة' : 'Badges Earned'}</span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-black text-champ-purple">{overview?.total_achievements_awarded ?? 0}</span>
              <Award className="w-5 h-5 text-champ-purple opacity-80" />
            </div>
            <span className="text-[10px] text-champ-muted mt-1">{lang === 'ar' ? 'إنجازات محققة' : 'Achievements'}</span>
          </div>

          <div className="p-4 rounded-2xl bg-champ-card border border-champ-border flex flex-col justify-between">
            <span className="text-xs text-champ-muted font-medium">{lang === 'ar' ? 'التحديات النشطة' : 'Active Challenges'}</span>
            <div className="flex items-center justify-between mt-2">
              <span className="text-2xl font-black text-champ-danger">{overview?.active_challenges ?? 0}</span>
              <Flame className="w-5 h-5 text-champ-danger opacity-80" />
            </div>
            <span className="text-[10px] text-champ-muted mt-1">{lang === 'ar' ? 'مسابقات صفية' : 'Open challenges'}</span>
          </div>

        </div>
      </section>

      {/* Recent Activity Feed & Navigation Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Recent Activity (2 Cols) */}
        <div className="lg:col-span-2 bg-champ-card border border-champ-border rounded-3xl p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-champ-border pb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-champ-primary" />
              <h3 className="font-bold text-base text-champ-text">{t('recentActivity')}</h3>
            </div>
            <span className="text-xs text-champ-muted">{lang === 'ar' ? 'تحديث فوري' : 'Live updates'}</span>
          </div>

          <div className="space-y-3">
            {recentActivities.length === 0 ? (
              <div className="text-center py-8 text-champ-muted text-xs">
                {lang === 'ar' ? 'لا توجد عمليات مسجلة حديثاً' : 'No recent transactions recorded'}
              </div>
            ) : (
              recentActivities.map((act) => (
                <div
                  key={act.id}
                  className="p-3 rounded-2xl bg-champ-darkMuted/60 border border-champ-border/60 flex items-center justify-between gap-3 hover:border-champ-border transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      act.amount > 0 ? 'bg-champ-primary/15 text-champ-primary border border-champ-primary/30' : 'bg-champ-danger/15 text-champ-danger border border-champ-danger/30'
                    }`}>
                      {act.amount > 0 ? `+${act.amount}` : act.amount}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-champ-text truncate">{act.student_name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-champ-card text-champ-muted">
                          {act.classroom_name}
                        </span>
                      </div>
                      <p className="text-[11px] text-champ-muted mt-0.5 truncate">{act.reason}</p>
                    </div>
                  </div>

                  <div className="text-right rtl:text-left shrink-0">
                    <span className="text-[10px] text-champ-muted block">{act.teacher_name}</span>
                    <span className="text-[9px] text-champ-muted/60 block">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Quick Navigation Cards (1 Col) */}
        <div className="space-y-3">
          <h3 className="font-bold text-sm text-champ-text px-1">
            {lang === 'ar' ? 'روابط الوصول السريع' : 'Quick Navigation'}
          </h3>

          <Link
            to="/leaderboard"
            className="p-4 rounded-2xl bg-champ-card hover:bg-champ-cardHover border border-champ-border hover:border-champ-gold/50 flex items-center justify-between group transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-champ-gold/15 text-champ-gold flex items-center justify-center">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-champ-text group-hover:text-champ-gold transition-colors">
                  {t('navLeaderboard')}
                </h4>
                <p className="text-xs text-champ-muted">{lang === 'ar' ? 'ويلر 2 وويلر 3' : 'Wheeler 2 & Wheeler 3'}</p>
              </div>
            </div>
            <ArrowIcon className="w-4 h-4 text-champ-muted group-hover:text-champ-text group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            to="/challenges"
            className="p-4 rounded-2xl bg-champ-card hover:bg-champ-cardHover border border-champ-border hover:border-champ-danger/50 flex items-center justify-between group transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-champ-danger/15 text-champ-danger flex items-center justify-center">
                <Flame className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-champ-text group-hover:text-champ-danger transition-colors">
                  {t('navChallenges')}
                </h4>
                <p className="text-xs text-champ-muted">{lang === 'ar' ? 'منافسات واكتساب نقاط' : 'Earn bonus points & coins'}</p>
              </div>
            </div>
            <ArrowIcon className="w-4 h-4 text-champ-muted group-hover:text-champ-text group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            to="/achievements"
            className="p-4 rounded-2xl bg-champ-card hover:bg-champ-cardHover border border-champ-border hover:border-champ-purple/50 flex items-center justify-between group transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-champ-purple/15 text-champ-purple flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-champ-text group-hover:text-champ-purple transition-colors">
                  {t('navAchievements')}
                </h4>
                <p className="text-xs text-champ-muted">{lang === 'ar' ? 'الأوسمة وشارات الشرف' : 'Unlock badges & medals'}</p>
              </div>
            </div>
            <ArrowIcon className="w-4 h-4 text-champ-muted group-hover:text-champ-text group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            to="/teachers"
            className="p-4 rounded-2xl bg-champ-card hover:bg-champ-cardHover border border-champ-border hover:border-champ-blue/50 flex items-center justify-between group transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-champ-blue/15 text-champ-blue flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-champ-text group-hover:text-champ-blue transition-colors">
                  {t('navDirectory')}
                </h4>
                <p className="text-xs text-champ-muted">{lang === 'ar' ? 'دليل المعلمين وتخصصاتهم' : 'Faculty directory'}</p>
              </div>
            </div>
            <ArrowIcon className="w-4 h-4 text-champ-muted group-hover:text-champ-text group-hover:translate-x-1 transition-all" />
          </Link>

          <Link
            to="/reports"
            className="p-4 rounded-2xl bg-champ-card hover:bg-champ-cardHover border border-champ-border hover:border-champ-primary/50 flex items-center justify-between group transition-all"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-champ-primary/15 text-champ-primary flex items-center justify-center">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-champ-text group-hover:text-champ-primary transition-colors">
                  {t('navReports')}
                </h4>
                <p className="text-xs text-champ-muted">{lang === 'ar' ? 'تقارير CSV و PDF رسمية' : 'Official CSV & PDF export'}</p>
              </div>
            </div>
            <ArrowIcon className="w-4 h-4 text-champ-muted group-hover:text-champ-text group-hover:translate-x-1 transition-all" />
          </Link>
        </div>

      </div>

    </div>
  );
}
