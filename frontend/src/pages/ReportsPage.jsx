import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { reportService, classroomService } from '../services/api';
import {
  BarChart3,
  Download,
  FileSpreadsheet,
  FileText,
  PieChart,
  TrendingUp,
  Users,
  Sparkles,
  Coins,
  Building
} from 'lucide-react';

export default function ReportsPage() {
  const { isTeacher, isAdmin } = useAuth();
  const { lang, t } = useLanguage();

  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroom, setSelectedClassroom] = useState('');
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClassrooms();
  }, []);

  useEffect(() => {
    loadAnalytics();
  }, [selectedClassroom]);

  const loadClassrooms = async () => {
    try {
      const res = await classroomService.getClassrooms();
      setClassrooms(res.data || []);
    } catch (err) {
      console.warn('Classroom error:', err);
    }
  };

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const params = selectedClassroom ? { classroom_id: selectedClassroom } : {};
      const res = await reportService.getAnalyticsSummary(params);
      setAnalytics(res.data);
    } catch (err) {
      console.warn('Analytics error:', err);
    } finally {
      setLoading(false);
    }
  };

  const overview = analytics?.overview || {};
  const pointsByCat = analytics?.points_by_category || [];
  const classroomComp = analytics?.classroom_comparison || [];
  const committeePerf = analytics?.committee_performance || [];
  const topStudents = analytics?.top_students || [];

  const maxCategoryPoints = Math.max(...pointsByCat.map(c => c.total_points), 1);

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header Banner */}
      <section className="bg-gradient-to-r from-champ-card via-champ-darkMuted to-champ-card border border-champ-border rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-champ-primary/20 border border-champ-primary/40 text-champ-primary flex items-center justify-center font-bold text-xl shadow">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-champ-text">
                {t('navReports')}
              </h1>
              <p className="text-xs text-champ-muted mt-0.5">
                {lang === 'ar' ? 'تحليلات الأداء الصفي وتوزيع النقاط والعملات والتقارير القابلة للتصدير' : 'Performance analytics, points distribution, and exportable CSV/PDF reports'}
              </p>
            </div>
          </div>

          {/* Export Buttons */}
          {(isTeacher || isAdmin) && (
            <div className="flex items-center gap-2">
              <a
                href={reportService.getCSVUrl(selectedClassroom)}
                download="class_champions_report.csv"
                className="px-4 py-2.5 rounded-xl bg-champ-primary/15 hover:bg-champ-primary text-champ-primary hover:text-champ-bg font-bold text-xs flex items-center gap-2 border border-champ-primary/30 transition-all shadow"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>{t('exportCSV')}</span>
              </a>

              <a
                href={reportService.getPDFUrl(selectedClassroom)}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-xl bg-champ-card hover:bg-champ-cardHover text-champ-text border border-champ-border hover:border-champ-primary font-bold text-xs flex items-center gap-2 transition-all shadow"
              >
                <FileText className="w-4 h-4 text-champ-danger" />
                <span>{t('exportPDF')}</span>
              </a>
            </div>
          )}
        </div>
      </section>

      {/* Classroom Filter */}
      <div className="flex items-center gap-2">
        <label className="text-xs font-bold text-champ-muted">
          {lang === 'ar' ? 'تصفية حسب الفصل:' : 'Filter Classroom:'}
        </label>
        <select
          value={selectedClassroom}
          onChange={(e) => setSelectedClassroom(e.target.value)}
          className="bg-champ-card border border-champ-border rounded-xl px-3 py-1.5 text-xs font-bold text-champ-text focus:outline-none"
        >
          <option value="">{t('allClassrooms')}</option>
          {classrooms.map((c) => (
            <option key={c.id} value={c.id}>{c.name} ({c.name_ar})</option>
          ))}
        </select>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-champ-card border border-champ-border">
          <span className="text-xs text-champ-muted block">{lang === 'ar' ? 'إجمالي الطلاب' : 'Students'}</span>
          <span className="text-2xl font-black text-champ-text mt-1 block">{overview.total_students || 0}</span>
        </div>
        <div className="p-4 rounded-2xl bg-champ-card border border-champ-border">
          <span className="text-xs text-champ-muted block">{lang === 'ar' ? 'إجمالي النقاط' : 'Total Points'}</span>
          <span className="text-2xl font-black text-champ-primary mt-1 block">{overview.total_points || 0}</span>
        </div>
        <div className="p-4 rounded-2xl bg-champ-card border border-champ-border">
          <span className="text-xs text-champ-muted block">{lang === 'ar' ? 'إجمالي العملات' : 'Total Coins'}</span>
          <span className="text-2xl font-black text-champ-gold mt-1 block">{overview.total_coins || 0}</span>
        </div>
        <div className="p-4 rounded-2xl bg-champ-card border border-champ-border">
          <span className="text-xs text-champ-muted block">{lang === 'ar' ? 'متوسط نقاط الطالب' : 'Average Points'}</span>
          <span className="text-2xl font-black text-champ-blue mt-1 block">{overview.average_points || 0}</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Points by Category Progress Bars */}
        <div className="p-6 rounded-3xl bg-champ-card border border-champ-border shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-champ-border pb-3">
            <h3 className="font-bold text-sm text-champ-text flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-champ-primary" />
              <span>{lang === 'ar' ? 'توزيع النقاط حسب مجالات التميز' : 'Points by Activity Category'}</span>
            </h3>
          </div>

          <div className="space-y-3 pt-2">
            {pointsByCat.map((cat) => {
              const pct = Math.round((cat.total_points / maxCategoryPoints) * 100);
              return (
                <div key={cat.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-champ-text font-semibold">{cat.label}</span>
                    <span className="text-champ-primary font-bold">{cat.total_points} {t('points')}</span>
                  </div>
                  <div className="w-full h-2.5 bg-champ-darkMuted rounded-full overflow-hidden border border-champ-border/60">
                    <div
                      className="h-full bg-gradient-to-r from-champ-primary to-champ-blue rounded-full transition-all duration-500"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Classroom Comparison */}
        <div className="p-6 rounded-3xl bg-champ-card border border-champ-border shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-champ-border pb-3">
            <h3 className="font-bold text-sm text-champ-text flex items-center gap-2">
              <Building className="w-4 h-4 text-champ-blue" />
              <span>{lang === 'ar' ? 'مقارنة التنافس بين الفصول (ويلر 2 وويلر 3)' : 'Classrooms Comparison'}</span>
            </h3>
          </div>

          <div className="space-y-4 pt-2">
            {classroomComp.map((c) => (
              <div key={c.classroom_id} className="p-4 rounded-2xl bg-champ-darkMuted border border-champ-border space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-sm text-champ-text">{c.name} ({c.name_ar})</h4>
                  <span className="text-xs text-champ-muted font-semibold">{c.student_count} {lang === 'ar' ? 'طالب' : 'students'}</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-champ-border/60">
                  <div>
                    <span className="text-[10px] text-champ-muted block">{lang === 'ar' ? 'النقاط' : 'Points'}</span>
                    <span className="text-sm font-black text-champ-primary">{c.total_points}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-champ-muted block">{lang === 'ar' ? 'العملات' : 'Coins'}</span>
                    <span className="text-sm font-black text-champ-gold">{c.total_coins}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-champ-muted block">{lang === 'ar' ? 'المتوسط' : 'Average'}</span>
                    <span className="text-sm font-black text-champ-blue">{c.average_points}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* Top Students Roster */}
      <div className="p-6 rounded-3xl bg-champ-card border border-champ-border shadow-xl space-y-4">
        <h3 className="font-bold text-base text-champ-text">
          {lang === 'ar' ? 'الطلاب الأبرز أداءً وتنافساً' : 'Top Performing Champions'}
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-right rtl:text-right ltr:text-left text-xs">
            <thead>
              <tr className="border-b border-champ-border text-champ-muted font-bold">
                <th className="py-2.5 px-3">#</th>
                <th className="py-2.5 px-3">{lang === 'ar' ? 'الطالب' : 'Student'}</th>
                <th className="py-2.5 px-3">{t('classroom')}</th>
                <th className="py-2.5 px-3">{t('points')}</th>
                <th className="py-2.5 px-3">{t('coins')}</th>
                <th className="py-2.5 px-3">{t('level')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-champ-border/40">
              {topStudents.map((st, i) => (
                <tr key={st.id} className="hover:bg-champ-darkMuted/30">
                  <td className="py-2.5 px-3 font-bold">{i + 1}</td>
                  <td className="py-2.5 px-3 font-bold text-champ-text">{st.name}</td>
                  <td className="py-2.5 px-3 text-champ-muted">{st.classroom}</td>
                  <td className="py-2.5 px-3 font-black text-champ-primary">{st.points}</td>
                  <td className="py-2.5 px-3 font-bold text-champ-gold">{st.coins}</td>
                  <td className="py-2.5 px-3 text-champ-muted text-[11px]">{st.level}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
