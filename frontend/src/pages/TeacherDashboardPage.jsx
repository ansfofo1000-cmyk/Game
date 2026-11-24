import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { classroomService, pointsService, gamificationService } from '../services/api';
import PointsModal from '../components/PointsModal';
import {
  Shield,
  BookOpen,
  Users,
  Search,
  PlusCircle,
  MinusCircle,
  Coins,
  Sparkles,
  Trophy,
  Check,
  X,
  Clock,
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function TeacherDashboardPage() {
  const { user } = useAuth();
  const { lang, t } = useLanguage();

  const [classrooms, setClassrooms] = useState([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState('');
  const [classroomData, setClassroomData] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [positionRequests, setPositionRequests] = useState([]);
  const [recentClassActivities, setRecentClassActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Points Modal State
  const [selectedStudentForAction, setSelectedStudentForAction] = useState(null);
  const [modalMode, setModalMode] = useState('ADD');

  useEffect(() => {
    loadTeacherClassrooms();
  }, [user]);

  useEffect(() => {
    if (selectedClassroomId) {
      loadClassroomDetails(selectedClassroomId);
    }
  }, [selectedClassroomId]);

  const loadTeacherClassrooms = async () => {
    try {
      setLoading(true);
      const res = await classroomService.getClassrooms();
      let available = res.data || [];

      // If teacher has assigned classrooms, filter to only those unless admin
      if (user?.role === 'TEACHER' && user.teacher_profile?.assigned_classrooms?.length > 0) {
        const assignedIds = user.teacher_profile.assigned_classrooms;
        available = available.filter(c => assignedIds.includes(c.id));
      }

      setClassrooms(available);
      if (available.length > 0) {
        setSelectedClassroomId(available[0].id);
      }
    } catch (err) {
      console.warn('Teacher classroom load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadClassroomDetails = async (clsId) => {
    try {
      const [detailRes, reqRes, actRes] = await Promise.all([
        classroomService.getClassroomDetail(clsId),
        classroomService.getPositionRequests({ classroom_id: clsId, status: 'PENDING' }),
        pointsService.getActivityFeed({ classroom_id: clsId, limit: 8 }),
      ]);

      setClassroomData(detailRes.data || null);
      setPositionRequests(reqRes.data || []);
      setRecentClassActivities(actRes.data || []);
    } catch (err) {
      console.warn('Classroom details error:', err);
    }
  };

  const handleReviewRequest = async (requestId, action) => {
    try {
      await classroomService.reviewPositionRequest(requestId, action, 'مراجعة المعلم');
      loadClassroomDetails(selectedClassroomId);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.error || 'Error reviewing position request');
    }
  };

  const handleOpenActionModal = (student, mode) => {
    setSelectedStudentForAction(student);
    setModalMode(mode);
  };

  const handleActionSuccess = () => {
    loadClassroomDetails(selectedClassroomId);
  };

  const studentsList = classroomData?.students || [];
  const filteredStudents = studentsList.filter(s =>
    s.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-16">
      
      {/* Teacher Welcome Header */}
      <section className="bg-gradient-to-r from-champ-card via-champ-darkMuted to-champ-card border border-champ-border rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-champ-blue/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-champ-blue/20 border border-champ-blue/40 text-champ-blue flex items-center justify-center font-bold text-2xl shadow-lg">
              <Shield className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black text-champ-text">
                  {lang === 'ar' ? 'بوابة المعلم لإدارة الفصول والطلاب' : 'Teacher Classroom Portal'}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-champ-blue/20 text-champ-blue border border-champ-blue/30">
                  {t('approved')}
                </span>
              </div>
              <p className="text-xs text-champ-muted mt-0.5">
                {lang === 'ar' ? 'المعلم:' : 'Teacher:'} <strong className="text-champ-text">{user?.full_name || user?.username}</strong> ({user?.teacher_profile?.subject || 'مدرس'})
              </p>
            </div>
          </div>

          {/* Classroom Selector */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <label className="text-xs font-bold text-champ-muted shrink-0">
              {lang === 'ar' ? 'الفصل الدراسي:' : 'Active Classroom:'}
            </label>
            <select
              value={selectedClassroomId}
              onChange={(e) => setSelectedClassroomId(e.target.value)}
              className="bg-champ-card border border-champ-border rounded-xl px-3 py-2 text-sm font-bold text-champ-text focus:outline-none focus:border-champ-blue"
            >
              {classrooms.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.name_ar || c.name})
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Classroom Statistics Banner */}
      {classroomData && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="p-4 rounded-2xl bg-champ-card border border-champ-border">
            <span className="text-xs text-champ-muted block">{lang === 'ar' ? 'عدد طلاب الفصل' : 'Total Students'}</span>
            <span className="text-2xl font-black text-champ-text mt-1 block">
              {classroomData.students?.length || 0}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-champ-card border border-champ-border">
            <span className="text-xs text-champ-muted block">{lang === 'ar' ? 'إجمالي نقاط الفصل' : 'Total Points'}</span>
            <span className="text-2xl font-black text-champ-primary mt-1 block">
              {classroomData.classroom?.total_points || 0}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-champ-card border border-champ-border">
            <span className="text-xs text-champ-muted block">{lang === 'ar' ? 'إجمالي العملات' : 'Total Coins'}</span>
            <span className="text-2xl font-black text-champ-gold mt-1 block">
              {classroomData.classroom?.total_coins || 0}
            </span>
          </div>

          <div className="p-4 rounded-2xl bg-champ-card border border-champ-border">
            <span className="text-xs text-champ-muted block">{lang === 'ar' ? 'طلبات مناصب قيد المراجعة' : 'Pending Requests'}</span>
            <span className="text-2xl font-black text-champ-blue mt-1 block">
              {positionRequests.length}
            </span>
          </div>
        </div>
      )}

      {/* Pending Position Requests (if any) */}
      {positionRequests.length > 0 && (
        <section className="bg-champ-card border border-champ-blue/40 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-champ-border pb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-champ-blue" />
              <h3 className="font-bold text-base text-champ-text">
                {lang === 'ar' ? 'طلبات المناصب القيادية المعلقة بانتظار اعتمادك' : 'Pending Position Requests'}
              </h3>
            </div>
            <span className="text-xs text-champ-blue font-bold px-2 py-0.5 rounded bg-champ-blue/10">
              {positionRequests.length} {lang === 'ar' ? 'طلب' : 'requests'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {positionRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-2xl bg-champ-darkMuted border border-champ-border flex items-center justify-between gap-3"
              >
                <div>
                  <h4 className="font-bold text-sm text-champ-text">{req.student_name}</h4>
                  <div className="text-xs text-champ-blue font-semibold mt-0.5">
                    {lang === 'ar' ? req.position_name_ar : req.position_name_en}
                    {req.committee_name_ar && ` (${req.committee_name_ar})`}
                  </div>
                  {req.notes && (
                    <p className="text-[11px] text-champ-muted mt-1 italic">"{req.notes}"</p>
                  )}
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleReviewRequest(req.id, 'APPROVE')}
                    className="p-2 rounded-xl bg-champ-primary/20 text-champ-primary hover:bg-champ-primary hover:text-champ-bg transition-colors"
                    title={lang === 'ar' ? 'اعتماد المنصب' : 'Approve'}
                  >
                    <Check className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleReviewRequest(req.id, 'REJECT')}
                    className="p-2 rounded-xl bg-champ-danger/20 text-champ-danger hover:bg-champ-danger hover:text-white transition-colors"
                    title={lang === 'ar' ? 'رفض الطلب' : 'Reject'}
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Main Classroom Students Directory & Action Table */}
      <section className="bg-champ-card border border-champ-border rounded-3xl p-6 shadow-xl space-y-6">
        
        {/* Table Header & Search */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-lg text-champ-text">
              {lang === 'ar' ? 'إدارة طلاب الفصل والتقييم الفوري' : 'Classroom Students Management'}
            </h3>
            <p className="text-xs text-champ-muted">
              {lang === 'ar' ? 'اختر أي طالب لإضافة أو خصم النقاط أو منح العملات مع تدوين السبب الإجباري' : 'Select any student to award/deduct points or grant coins with mandatory reasons'}
            </p>
          </div>

          <div className="w-full sm:w-72 relative">
            <Search className="w-4 h-4 text-champ-muted absolute top-3 left-3 rtl:left-auto rtl:right-3" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchStudent')}
              className="w-full bg-champ-darkMuted border border-champ-border rounded-xl px-10 py-2 text-xs text-champ-text focus:outline-none focus:border-champ-primary"
            />
          </div>
        </div>

        {/* Students Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-right rtl:text-right ltr:text-left text-xs">
            <thead>
              <tr className="border-b border-champ-border text-champ-muted font-bold">
                <th className="py-3 px-3">{t('rank')}</th>
                <th className="py-3 px-3">{lang === 'ar' ? 'الطالب' : 'Student'}</th>
                <th className="py-3 px-3">{t('position')}</th>
                <th className="py-3 px-3">{t('points')}</th>
                <th className="py-3 px-3">{t('coins')}</th>
                <th className="py-3 px-3">{t('level')}</th>
                <th className="py-3 px-3 text-center">{lang === 'ar' ? 'إجراءات التقييم الفورية' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-champ-border/40">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-8 text-center text-champ-muted text-xs">
                    {lang === 'ar' ? 'لا يوجد طلاب مطابقون لبحثك في هذا الفصل' : 'No students found in this classroom'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((st) => (
                  <tr key={st.id} className="hover:bg-champ-darkMuted/30 transition-colors">
                    <td className="py-3 px-3 font-bold text-champ-text">
                      <span className="w-6 h-6 rounded-full bg-champ-darkMuted inline-flex items-center justify-center text-xs">
                        {st.rank}
                      </span>
                    </td>

                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-champ-darkMuted border border-champ-border flex items-center justify-center font-bold text-champ-primary text-xs shrink-0 overflow-hidden">
                          {st.avatar ? (
                            <img src={st.avatar} alt={st.name} className="w-full h-full object-cover" />
                          ) : (
                            <span>{st.name.charAt(0)}</span>
                          )}
                        </div>
                        <span className="font-bold text-champ-text">{st.name}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3">
                      {st.position_ar ? (
                        <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-champ-blue/15 text-champ-blue border border-champ-blue/30">
                          {st.position_ar} {st.committee_ar && `(${st.committee_ar})`}
                        </span>
                      ) : (
                        <span className="text-champ-muted/60">-</span>
                      )}
                    </td>

                    <td className="py-3 px-3 font-black text-champ-primary text-sm">
                      {st.points}
                    </td>

                    <td className="py-3 px-3 font-bold text-champ-gold text-sm">
                      {st.coins}
                    </td>

                    <td className="py-3 px-3 text-champ-muted text-[11px]">
                      {st.level}
                    </td>

                    {/* Quick Evaluation Buttons */}
                    <td className="py-3 px-3 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          onClick={() => handleOpenActionModal(st, 'ADD')}
                          className="px-2.5 py-1.5 rounded-lg bg-champ-primary/15 hover:bg-champ-primary text-champ-primary hover:text-champ-bg font-bold text-xs flex items-center gap-1 transition-colors"
                          title={t('addPoints')}
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          <span>{lang === 'ar' ? 'إضافة نقاط' : 'Add'}</span>
                        </button>

                        <button
                          onClick={() => handleOpenActionModal(st, 'DEDUCT')}
                          className="px-2.5 py-1.5 rounded-lg bg-champ-danger/15 hover:bg-champ-danger text-champ-danger hover:text-white font-bold text-xs flex items-center gap-1 transition-colors"
                          title={t('deductPoints')}
                        >
                          <MinusCircle className="w-3.5 h-3.5" />
                          <span>{lang === 'ar' ? 'خصم نقاط' : 'Deduct'}</span>
                        </button>

                        <button
                          onClick={() => handleOpenActionModal(st, 'COINS')}
                          className="px-2.5 py-1.5 rounded-lg bg-champ-gold/15 hover:bg-champ-gold text-champ-gold hover:text-champ-bg font-bold text-xs flex items-center gap-1 transition-colors"
                          title={t('awardCoins')}
                        >
                          <Coins className="w-3.5 h-3.5" />
                          <span>{lang === 'ar' ? 'منح عملات' : 'Coins'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

      </section>

      {/* Points & Evaluation Modal Dialog */}
      {selectedStudentForAction && (
        <PointsModal
          student={selectedStudentForAction}
          initialMode={modalMode}
          onClose={() => setSelectedStudentForAction(null)}
          onSuccess={handleActionSuccess}
        />
      )}

    </div>
  );
}
