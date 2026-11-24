import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { challengeService, classroomService } from '../services/api';
import {
  Flame,
  PlusCircle,
  CheckCircle2,
  Calendar,
  Sparkles,
  Coins,
  Users,
  Award,
  X,
  Check
} from 'lucide-react';

export default function ChallengesPage() {
  const { user, isStudent, isTeacher, isAdmin } = useAuth();
  const { lang, t } = useLanguage();

  const [challenges, setChallenges] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [committees, setCommittees] = useState([]);
  const [loading, setLoading] = useState(true);

  // Create Challenge Modal
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [titleAr, setTitleAr] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [description, setDescription] = useState('');
  const [rewardPoints, setRewardPoints] = useState(25);
  const [rewardCoins, setRewardCoins] = useState(10);
  const [targetPoints, setTargetPoints] = useState(50);
  const [classroomId, setClassroomId] = useState('');
  const [endDate, setEndDate] = useState('');
  const [creating, setCreating] = useState(false);

  // Manage Challenge Completion Modal
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [challengeDetails, setChallengeDetails] = useState(null);
  const [completingStudentId, setCompletingStudentId] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [chRes, clsRes, comRes] = await Promise.all([
        challengeService.getChallenges(),
        classroomService.getClassrooms(),
        classroomService.getCommittees(),
      ]);
      setChallenges(chRes.data || []);
      setClassrooms(clsRes.data || []);
      setCommittees(comRes.data || []);
    } catch (err) {
      console.warn('Challenges load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleJoin = async (id) => {
    try {
      await challengeService.joinChallenge(id);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error joining challenge');
    }
  };

  const handleCreateChallenge = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      await challengeService.createChallenge({
        title_ar: titleAr.trim(),
        title_en: titleEn.trim() || titleAr.trim(),
        description: description.trim(),
        reward_points: parseInt(rewardPoints, 10),
        reward_coins: parseInt(rewardCoins, 10),
        target_points: parseInt(targetPoints, 10),
        classroom_id: classroomId ? parseInt(classroomId, 10) : null,
        end_date: endDate,
      });

      setCreateModalOpen(false);
      setTitleAr('');
      setTitleEn('');
      setDescription('');
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error creating challenge');
    } finally {
      setCreating(false);
    }
  };

  const openCompletionModal = async (ch) => {
    setSelectedChallenge(ch);
    try {
      const res = await challengeService.getChallengeDetail(ch.id);
      setChallengeDetails(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkComplete = async (studentId) => {
    try {
      setCompletingStudentId(studentId);
      await challengeService.completeChallenge(selectedChallenge.id, studentId);
      const res = await challengeService.getChallengeDetail(selectedChallenge.id);
      setChallengeDetails(res.data);
      loadData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error marking completion');
    } finally {
      setCompletingStudentId(null);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Banner */}
      <section className="bg-gradient-to-r from-champ-card via-champ-darkMuted to-champ-card border border-champ-border rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-champ-danger/20 border border-champ-danger/40 text-champ-danger flex items-center justify-center font-bold text-xl shadow">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-champ-text">
                {t('navChallenges')}
              </h1>
              <p className="text-xs text-champ-muted mt-0.5">
                {lang === 'ar' ? 'مسابقات وأنشطة تنافسية تمنح نقاطاً وعملات إضافية عند إكمالها' : 'Classroom competitions with bonus points and coin rewards'}
              </p>
            </div>
          </div>

          {(isTeacher || isAdmin) && (
            <button
              onClick={() => setCreateModalOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-champ-primary hover:bg-champ-primaryHover text-champ-bg font-bold text-xs flex items-center gap-2 shadow-lg transition-transform hover:-translate-y-0.5"
            >
              <PlusCircle className="w-4 h-4" />
              <span>{lang === 'ar' ? 'إنشاء تحدي جديد' : 'New Challenge'}</span>
            </button>
          )}
        </div>
      </section>

      {/* Challenges Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {challenges.map((ch) => (
          <div
            key={ch.id}
            className="p-5 rounded-3xl bg-champ-card border border-champ-border flex flex-col justify-between space-y-4 hover:border-champ-primary/40 transition-all shadow-xl"
          >
            <div className="space-y-2.5">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-base text-champ-text leading-snug">
                  {lang === 'ar' ? ch.title_ar : ch.title_en}
                </h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-champ-darkMuted text-champ-primary border border-champ-border shrink-0">
                  {ch.classroom_name_ar || ch.classroom_name}
                </span>
              </div>

              <p className="text-xs text-champ-muted leading-relaxed line-clamp-3">
                {ch.description}
              </p>

              <div className="flex items-center gap-2 text-[11px] text-champ-muted pt-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{lang === 'ar' ? 'ينتهي في:' : 'Ends on:'} {ch.end_date}</span>
                <span>•</span>
                <Users className="w-3.5 h-3.5" />
                <span>{ch.participant_count} {lang === 'ar' ? 'مشارك' : 'joined'}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-champ-border/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-1 rounded-lg bg-champ-primary/15 text-champ-primary font-bold text-xs flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  +{ch.reward_points}
                </span>
                <span className="px-2.5 py-1 rounded-lg bg-champ-gold/15 text-champ-gold font-bold text-xs flex items-center gap-1">
                  <Coins className="w-3 h-3" />
                  +{ch.reward_coins}
                </span>
              </div>

              {isStudent && (
                <div>
                  {ch.is_completed ? (
                    <span className="px-3 py-1 rounded-lg bg-champ-primary/20 text-champ-primary font-bold text-xs flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {t('completedChallenge')}
                    </span>
                  ) : ch.is_joined ? (
                    <span className="px-3 py-1 rounded-lg bg-champ-blue/20 text-champ-blue font-bold text-xs">
                      {lang === 'ar' ? 'منضم' : 'Joined'}
                    </span>
                  ) : (
                    <button
                      onClick={() => handleJoin(ch.id)}
                      className="px-3.5 py-1 rounded-lg bg-champ-primary hover:bg-champ-primaryHover text-champ-bg font-bold text-xs shadow"
                    >
                      {t('joinChallenge')}
                    </button>
                  )}
                </div>
              )}

              {(isTeacher || isAdmin) && (
                <button
                  onClick={() => openCompletionModal(ch)}
                  className="px-3 py-1 rounded-lg bg-champ-blue/20 hover:bg-champ-blue text-champ-blue hover:text-champ-bg font-bold text-xs transition-colors"
                >
                  {lang === 'ar' ? 'إدارة المشاركين' : 'Manage Participants'}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create Challenge Modal */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-champ-card border border-champ-border rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-champ-border pb-3">
              <h3 className="font-bold text-base text-champ-text">
                {lang === 'ar' ? 'إنشاء تحدي فصلي جديد' : 'Create New Challenge'}
              </h3>
              <button onClick={() => setCreateModalOpen(false)} className="text-champ-muted hover:text-champ-text">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateChallenge} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-champ-muted mb-1">
                  {lang === 'ar' ? 'عنوان التحدي (بالعربية)' : 'Title (Arabic)'} *
                </label>
                <input
                  type="text"
                  required
                  value={titleAr}
                  onChange={(e) => setTitleAr(e.target.value)}
                  placeholder="مثال: تحدي النظافة والتعاون الصفي الأسبوعي"
                  className="w-full bg-champ-darkMuted border border-champ-border rounded-xl px-3 py-2 text-champ-text focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-bold text-champ-muted mb-1">
                  {lang === 'ar' ? 'وصف التحدي وشروط إكماله' : 'Description & Requirements'} *
                </label>
                <textarea
                  rows="3"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="تفاصيل التحدي..."
                  className="w-full bg-champ-darkMuted border border-champ-border rounded-xl p-3 text-champ-text focus:outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-bold text-champ-muted mb-1">{lang === 'ar' ? 'نقاط المكافأة' : 'Reward Points'}</label>
                  <input
                    type="number"
                    min="1"
                    value={rewardPoints}
                    onChange={(e) => setRewardPoints(e.target.value)}
                    className="w-full bg-champ-darkMuted border border-champ-border rounded-xl px-3 py-2 text-champ-text font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-champ-muted mb-1">{lang === 'ar' ? 'عملات المكافأة' : 'Reward Coins'}</label>
                  <input
                    type="number"
                    min="0"
                    value={rewardCoins}
                    onChange={(e) => setRewardCoins(e.target.value)}
                    className="w-full bg-champ-darkMuted border border-champ-border rounded-xl px-3 py-2 text-champ-text font-bold"
                  />
                </div>
                <div>
                  <label className="block font-bold text-champ-muted mb-1">{lang === 'ar' ? 'تاريخ الانتهاء' : 'End Date'}</label>
                  <input
                    type="date"
                    required
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full bg-champ-darkMuted border border-champ-border rounded-xl px-2 py-2 text-champ-text"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-champ-muted mb-1">
                  {lang === 'ar' ? 'الفصل المؤهل (فارغ لجميع الفصول)' : 'Classroom (blank for all)'}
                </label>
                <select
                  value={classroomId}
                  onChange={(e) => setClassroomId(e.target.value)}
                  className="w-full bg-champ-darkMuted border border-champ-border rounded-xl px-3 py-2 text-champ-text focus:outline-none"
                >
                  <option value="">{lang === 'ar' ? 'متاح لجميع الفصول (ويلر 2 وويلر 3)' : 'All Classrooms'}</option>
                  {classrooms.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.name_ar})</option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-champ-muted hover:text-champ-text"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="px-5 py-2 rounded-xl bg-champ-primary text-champ-bg font-bold shadow hover:bg-champ-primaryHover"
                >
                  {creating ? (lang === 'ar' ? 'جارٍ الإنشاء...' : 'Creating...') : (lang === 'ar' ? 'نشر التحدي' : 'Publish')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Participants Completion Modal */}
      {selectedChallenge && challengeDetails && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
          <div className="bg-champ-card border border-champ-border rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-champ-border pb-3">
              <div>
                <h3 className="font-bold text-base text-champ-text">
                  {lang === 'ar' ? 'المشاركون في التحدي' : 'Challenge Participants'}
                </h3>
                <p className="text-xs text-champ-muted">{selectedChallenge.title_ar}</p>
              </div>
              <button onClick={() => setSelectedChallenge(null)} className="text-champ-muted hover:text-champ-text">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2.5 divide-y divide-champ-border/30">
              {challengeDetails.participations?.length === 0 ? (
                <div className="text-center py-8 text-champ-muted text-xs">
                  {lang === 'ar' ? 'لا يوجد طلاب منضمون لهذا التحدي بعد' : 'No students joined yet'}
                </div>
              ) : (
                challengeDetails.participations?.map((p) => (
                  <div key={p.id} className="pt-2.5 first:pt-0 flex items-center justify-between gap-3">
                    <div>
                      <h4 className="font-bold text-sm text-champ-text">{p.student_name}</h4>
                      <p className="text-xs text-champ-muted">{p.classroom_name}</p>
                    </div>

                    <div>
                      {p.status === 'COMPLETED' ? (
                        <span className="px-2.5 py-1 rounded-lg bg-champ-primary/15 text-champ-primary text-xs font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          {lang === 'ar' ? 'مكتمل ومصروف' : 'Completed'}
                        </span>
                      ) : (
                        <button
                          disabled={completingStudentId === p.student}
                          onClick={() => handleMarkComplete(p.student)}
                          className="px-3 py-1 rounded-lg bg-champ-primary hover:bg-champ-primaryHover text-champ-bg text-xs font-bold shadow flex items-center gap-1"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>{completingStudentId === p.student ? '...' : (lang === 'ar' ? 'اعتماد الإنجاز وصرف المكافأة' : 'Award')}</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
