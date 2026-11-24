import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { gamificationService, classroomService } from '../services/api';
import Podium from '../components/Podium';
import { Trophy, Search, Filter, Sparkles, Coins, Award, Users, BookOpen, Crown } from 'lucide-react';

export default function LeaderboardPage() {
  const { lang, t } = useLanguage();
  const [searchParams, setSearchParams] = useSearchParams();

  const [classrooms, setClassrooms] = useState([]);
  const [positions, setPositions] = useState([]);
  const [leaderboardData, setLeaderboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const selectedClassroom = searchParams.get('classroom_id') || '';
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPosition, setSelectedPosition] = useState('');

  useEffect(() => {
    loadMetadata();
  }, []);

  useEffect(() => {
    loadLeaderboard();
  }, [selectedClassroom, selectedPosition]);

  const loadMetadata = async () => {
    try {
      const [clsRes, posRes] = await Promise.all([
        classroomService.getClassrooms(),
        classroomService.getPositions(),
      ]);
      setClassrooms(clsRes.data || []);
      setPositions(posRes.data || []);
    } catch (err) {
      console.warn('Metadata load error:', err);
    }
  };

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const params = {};
      if (selectedClassroom) params.classroom_id = selectedClassroom;
      if (selectedPosition) params.position_id = selectedPosition;
      if (searchQuery) params.search = searchQuery;

      const res = await gamificationService.getLeaderboard(params);
      setLeaderboardData(res.data);
    } catch (err) {
      console.warn('Leaderboard error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleClassroomChange = (clsId) => {
    if (clsId) {
      setSearchParams({ classroom_id: clsId });
    } else {
      setSearchParams({});
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    loadLeaderboard();
  };

  const ranking = leaderboardData?.ranking || [];
  const topThree = leaderboardData?.top_three || [];

  return (
    <div className="space-y-8 pb-16">
      
      {/* Page Title & Scope Selector */}
      <section className="bg-champ-card border border-champ-border rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-champ-gold/15 border border-champ-gold/30 text-champ-gold flex items-center justify-center font-bold text-xl shadow">
              <Trophy className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-champ-text">
                {selectedClassroom
                  ? `${t('navLeaderboard')} — ${classrooms.find(c => String(c.id) === String(selectedClassroom))?.name || ''}`
                  : (lang === 'ar' ? 'لوحة المتصدرين العامة لجميع الفصول' : 'Overall School Leaderboard')}
              </h1>
              <p className="text-xs text-champ-muted mt-0.5">
                {lang === 'ar' ? 'حساب الترتيب يتم آلياً بناءً على النقاط الفعلية وقواعد التساوي الموثقة' : 'Automatic real-time rankings with deterministic tie-breaking logic'}
              </p>
            </div>
          </div>

          {/* Scope Buttons */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-champ-darkMuted border border-champ-border text-xs w-full sm:w-auto">
            <button
              onClick={() => handleClassroomChange('')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-bold transition-colors ${
                !selectedClassroom ? 'bg-champ-primary text-champ-bg shadow' : 'text-champ-muted hover:text-champ-text'
              }`}
            >
              {lang === 'ar' ? 'التصنيف العام' : 'Overall School'}
            </button>
            {classrooms.map((c) => (
              <button
                key={c.id}
                onClick={() => handleClassroomChange(c.id)}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg font-bold transition-colors ${
                  String(selectedClassroom) === String(c.id) ? 'bg-champ-primary text-champ-bg shadow' : 'text-champ-muted hover:text-champ-text'
                }`}
              >
                {lang === 'ar' ? (c.name_ar || c.name) : c.name}
              </button>
            ))}
          </div>
        </div>

        {/* Podium Component */}
        <Podium topThree={topThree} />
      </section>

      {/* Filters & Full Ranking Table */}
      <section className="bg-champ-card border border-champ-border rounded-3xl p-6 shadow-xl space-y-6">
        
        {/* Search & Position Filter */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          
          <form onSubmit={handleSearchSubmit} className="w-full sm:w-80 relative">
            <Search className="w-4 h-4 text-champ-muted absolute top-3 left-3 rtl:left-auto rtl:right-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchStudent')}
              className="w-full bg-champ-darkMuted border border-champ-border rounded-xl px-10 py-2.5 text-xs text-champ-text focus:outline-none focus:border-champ-primary"
            />
          </form>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <select
              value={selectedPosition}
              onChange={(e) => setSelectedPosition(e.target.value)}
              className="w-full sm:w-auto bg-champ-darkMuted border border-champ-border rounded-xl px-3 py-2 text-xs text-champ-text focus:outline-none focus:border-champ-primary"
            >
              <option value="">{lang === 'ar' ? 'تصفية حسب المنصب القيادي' : 'All Positions'}</option>
              {positions.map((p) => (
                <option key={p.id} value={p.id}>
                  {lang === 'ar' ? p.name_ar : p.name_en}
                </option>
              ))}
            </select>
          </div>

        </div>

        {/* Full Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right rtl:text-right ltr:text-left text-xs">
            <thead>
              <tr className="border-b border-champ-border text-champ-muted font-bold">
                <th className="py-3 px-3">{t('rank')}</th>
                <th className="py-3 px-3">{lang === 'ar' ? 'الطالب' : 'Student'}</th>
                <th className="py-3 px-3">{t('classroom')}</th>
                <th className="py-3 px-3">{t('position')}</th>
                <th className="py-3 px-3">{t('points')}</th>
                <th className="py-3 px-3">{t('coins')}</th>
                <th className="py-3 px-3">{t('level')}</th>
                <th className="py-3 px-3">{lang === 'ar' ? 'أبرز الأوسمة' : 'Badges'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-champ-border/40">
              {ranking.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-champ-muted text-xs">
                    {lang === 'ar' ? 'لا توجد نتائج مطابقة لخيارات البحث والتصفية' : 'No students found matching filters'}
                  </td>
                </tr>
              ) : (
                ranking.map((st) => (
                  <tr key={st.user_id} className="hover:bg-champ-darkMuted/30 transition-colors">
                    
                    {/* Rank Badge */}
                    <td className="py-3 px-3 font-bold">
                      <span className={`w-7 h-7 rounded-full inline-flex items-center justify-center font-black text-xs ${
                        st.rank === 1 ? 'bg-champ-gold text-champ-bg shadow-md ring-2 ring-champ-gold/30' :
                        (st.rank === 2 ? 'bg-champ-silver text-champ-bg shadow-sm' :
                        (st.rank === 3 ? 'bg-champ-bronze text-white shadow-sm' : 'bg-champ-darkMuted text-champ-muted'))
                      }`}>
                        {st.rank}
                      </span>
                    </td>

                    {/* Student Name & Avatar */}
                    <td className="py-3 px-3 font-bold text-champ-text">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-champ-darkMuted border border-champ-border flex items-center justify-center font-bold text-champ-primary text-xs shrink-0 overflow-hidden">
                          {st.avatar ? (
                            <img src={st.avatar} alt={st.name} className="w-full h-full object-cover" />
                          ) : (
                            <span>{st.name.charAt(0)}</span>
                          )}
                        </div>
                        <span className="truncate max-w-xs">{st.name}</span>
                      </div>
                    </td>

                    {/* Classroom */}
                    <td className="py-3 px-3 text-champ-muted">
                      <span className="px-2 py-0.5 rounded bg-champ-darkMuted border border-champ-border text-[11px]">
                        {st.classroom_name_ar || st.classroom_name}
                      </span>
                    </td>

                    {/* Position */}
                    <td className="py-3 px-3">
                      {st.position_ar ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-champ-blue/15 text-champ-blue border border-champ-blue/30">
                          {st.position_ar} {st.committee_ar && `(${st.committee_ar})`}
                        </span>
                      ) : (
                        <span className="text-champ-muted/60">-</span>
                      )}
                    </td>

                    {/* Points */}
                    <td className="py-3 px-3 font-black text-champ-primary text-sm">
                      {st.points}
                    </td>

                    {/* Coins */}
                    <td className="py-3 px-3 font-bold text-champ-gold text-sm">
                      {st.coins}
                    </td>

                    {/* Level */}
                    <td className="py-3 px-3 text-champ-muted text-[11px]">
                      {st.level}
                    </td>

                    {/* Badges preview */}
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1">
                        {st.badges?.map((b) => (
                          <span
                            key={b.id}
                            title={lang === 'ar' ? b.name_ar : b.name_en}
                            className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold"
                            style={{ backgroundColor: `${b.badge_color}25`, color: b.badge_color }}
                          >
                            <Award className="w-3.5 h-3.5" />
                          </span>
                        ))}
                        {st.achievements_count > 5 && (
                          <span className="text-[10px] text-champ-muted">+{st.achievements_count - 5}</span>
                        )}
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </section>

    </div>
  );
}
