import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { authService, classroomService, pointsService, auditService } from '../services/api';
import {
  ShieldAlert,
  Users,
  UserCheck,
  UserX,
  KeyRound,
  BookOpen,
  Sliders,
  History,
  Check,
  X,
  Search,
  AlertTriangle,
  Sparkles,
  Coins,
  RefreshCw
} from 'lucide-react';

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const { lang, t } = useLanguage();

  const [activeTab, setActiveTab] = useState('TEACHER_APPROVALS'); // 'TEACHER_APPROVALS', 'USERS_MANAGEMENT', 'TEACHER_CODES', 'ADJUSTMENTS', 'AUDIT_LOGS'
  const [pendingTeachers, setPendingTeachers] = useState([]);
  const [allUsers, setAllUsers] = useState([]);
  const [teacherCodes, setTeacherCodes] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [classrooms, setClassrooms] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [userSearch, setUserSearch] = useState('');

  // Adjustment form states
  const [adjStudentId, setAdjStudentId] = useState('');
  const [adjCurrency, setAdjCurrency] = useState('POINTS');
  const [adjAmount, setAdjAmount] = useState(0);
  const [adjReason, setAdjReason] = useState('');
  const [adjMessage, setAdjMessage] = useState('');
  const [adjError, setAdjError] = useState('');

  // New Code Form state
  const [newCodeStr, setNewCodeStr] = useState('');
  const [newCodeUses, setNewCodeUses] = useState(100);

  useEffect(() => {
    loadAllAdminData();
  }, [activeTab]);

  const loadAllAdminData = async () => {
    setLoading(true);
    try {
      const [pendRes, usersRes, codesRes, logsRes, clsRes] = await Promise.all([
        authService.getPendingTeachers(),
        authService.getAllUsers(),
        authService.getTeacherCodes(),
        auditService.getAuditLogs(),
        classroomService.getClassrooms(),
      ]);

      setPendingTeachers(pendRes.data || []);
      setAllUsers(usersRes.data || []);
      setTeacherCodes(codesRes.data || []);
      setAuditLogs(logsRes.data || []);
      setClassrooms(clsRes.data || []);
    } catch (err) {
      console.warn('Admin data load error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTeacher = async (teacherId) => {
    try {
      const allClassroomIds = classrooms.map(c => c.id);
      await authService.approveTeacher(teacherId, { classroom_ids: allClassroomIds });
      loadAllAdminData();
    } catch (err) {
      alert('Error approving teacher');
    }
  };

  const handleRejectTeacher = async (teacherId) => {
    if (!window.confirm(lang === 'ar' ? 'هل أنت متأكد من رفض طلب المعلم؟' : 'Reject this teacher?')) return;
    try {
      await authService.rejectTeacher(teacherId);
      loadAllAdminData();
    } catch (err) {
      alert('Error rejecting teacher');
    }
  };

  const handleToggleUserStatus = async (targetUser) => {
    try {
      await authService.toggleUserStatus(targetUser.id);
      loadAllAdminData();
    } catch (err) {
      alert(err.response?.data?.error || 'Error toggling user status');
    }
  };

  const handleCreateCode = async (e) => {
    e.preventDefault();
    if (!newCodeStr.trim()) return;
    try {
      await authService.createTeacherCode({
        code: newCodeStr.trim(),
        max_uses: parseInt(newCodeUses, 10),
      });
      setNewCodeStr('');
      const res = await authService.getTeacherCodes();
      setTeacherCodes(res.data || []);
    } catch (err) {
      alert('Error creating teacher code');
    }
  };

  const handleProcessAdjustment = async (e) => {
    e.preventDefault();
    setAdjMessage('');
    setAdjError('');

    try {
      const res = await pointsService.adminAdjustment({
        student_id: parseInt(adjStudentId, 10),
        currency_type: adjCurrency,
        amount: parseInt(adjAmount, 10),
        reason: adjReason.trim(),
      });
      setAdjMessage(res.data.message);
      setAdjAmount(0);
      setAdjReason('');
      loadAllAdminData();
    } catch (err) {
      setAdjError(err.response?.data?.error || 'Error executing adjustment');
    }
  };

  const filteredUsers = allUsers.filter(u => {
    const matchesRole = !userRoleFilter || u.role === userRoleFilter;
    const matchesSearch = !userSearch || (
      u.full_name?.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email?.toLowerCase().includes(userSearch.toLowerCase())
    );
    return matchesRole && matchesSearch;
  });

  return (
    <div className="space-y-8 pb-16">
      
      {/* Header Banner */}
      <section className="bg-gradient-to-r from-champ-card via-champ-darkMuted to-champ-card border border-champ-border rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-champ-gold/20 border border-champ-gold/40 text-champ-gold flex items-center justify-center font-bold text-2xl shadow-lg">
              <ShieldAlert className="w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-champ-text">
                {t('adminDashboard')}
              </h1>
              <p className="text-xs text-champ-muted mt-0.5">
                {lang === 'ar' ? 'التحكم الشامل، اعتماد المعلمين، إدارة أكواد التسجيل، والتدقيق الإداري' : 'Full governance, teacher approvals, access code management, and audit trails'}
              </p>
            </div>
          </div>

          <button
            onClick={loadAllAdminData}
            className="p-2.5 rounded-xl bg-champ-darkMuted border border-champ-border text-champ-muted hover:text-champ-text transition-colors"
            title="Refresh Data"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-champ-border overflow-x-auto pb-1 text-xs sm:text-sm font-bold">
        
        <button
          onClick={() => setActiveTab('TEACHER_APPROVALS')}
          className={`px-4 py-2 rounded-t-xl transition-colors border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'TEACHER_APPROVALS'
              ? 'border-champ-blue text-champ-blue bg-champ-blue/10'
              : 'border-transparent text-champ-muted hover:text-champ-text'
          }`}
        >
          <UserCheck className="w-4 h-4" />
          <span>{lang === 'ar' ? 'طلبات اعتماد المعلمين' : 'Teacher Approvals'}</span>
          {pendingTeachers.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-champ-blue text-champ-bg text-xs flex items-center justify-center font-black">
              {pendingTeachers.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('USERS_MANAGEMENT')}
          className={`px-4 py-2 rounded-t-xl transition-colors border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'USERS_MANAGEMENT'
              ? 'border-champ-primary text-champ-primary bg-champ-primary/10'
              : 'border-transparent text-champ-muted hover:text-champ-text'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>{lang === 'ar' ? 'إدارة المستخدمين والحسابات' : 'Users Management'}</span>
        </button>

        <button
          onClick={() => setActiveTab('TEACHER_CODES')}
          className={`px-4 py-2 rounded-t-xl transition-colors border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'TEACHER_CODES'
              ? 'border-champ-gold text-champ-gold bg-champ-gold/10'
              : 'border-transparent text-champ-muted hover:text-champ-text'
          }`}
        >
          <KeyRound className="w-4 h-4" />
          <span>{lang === 'ar' ? 'أكواد تسجيل المعلمين' : 'Teacher Access Codes'}</span>
        </button>

        <button
          onClick={() => setActiveTab('ADJUSTMENTS')}
          className={`px-4 py-2 rounded-t-xl transition-colors border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'ADJUSTMENTS'
              ? 'border-champ-purple text-champ-purple bg-champ-purple/10'
              : 'border-transparent text-champ-muted hover:text-champ-text'
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>{lang === 'ar' ? 'تعديلات الأرصدة الإدارية' : 'Balance Adjustments'}</span>
        </button>

        <button
          onClick={() => setActiveTab('AUDIT_LOGS')}
          className={`px-4 py-2 rounded-t-xl transition-colors border-b-2 whitespace-nowrap flex items-center gap-1.5 ${
            activeTab === 'AUDIT_LOGS'
              ? 'border-champ-text text-champ-text bg-champ-card'
              : 'border-transparent text-champ-muted hover:text-champ-text'
          }`}
        >
          <History className="w-4 h-4" />
          <span>{lang === 'ar' ? 'سجل التدقيق الإداري' : 'Audit Logs'}</span>
        </button>

      </div>

      {/* Tab 1: Teacher Approvals */}
      {activeTab === 'TEACHER_APPROVALS' && (
        <section className="bg-champ-card border border-champ-border rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-champ-border pb-3">
            <h3 className="font-bold text-base text-champ-text">
              {lang === 'ar' ? 'طلبات تسجيل المعلمين المعلقة بانتظار الاعتماد' : 'Pending Teacher Registration Requests'}
            </h3>
            <span className="text-xs text-champ-muted">
              {pendingTeachers.length} {lang === 'ar' ? 'معلم بانتظار الموافقة' : 'pending'}
            </span>
          </div>

          {pendingTeachers.length === 0 ? (
            <div className="text-center py-12 text-champ-muted text-xs">
              <Check className="w-8 h-8 mx-auto mb-2 text-champ-primary opacity-60" />
              <p>{lang === 'ar' ? 'لا توجد طلبات معلمين معلقة حالياً' : 'No pending teacher requests'}</p>
            </div>
          ) : (
            <div className="divide-y divide-champ-border/40">
              {pendingTeachers.map((tch) => (
                <div key={tch.id} className="py-4 flex items-center justify-between gap-4">
                  <div>
                    <h4 className="font-bold text-sm text-champ-text">{tch.full_name || tch.username}</h4>
                    <p className="text-xs text-champ-muted mt-0.5">{tch.email}</p>
                    <span className="inline-block mt-1 text-[11px] px-2 py-0.5 rounded bg-champ-darkMuted text-champ-blue border border-champ-border font-semibold">
                      {tch.teacher_profile?.subject || 'مدرس'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApproveTeacher(tch.id)}
                      className="px-4 py-2 rounded-xl bg-champ-primary hover:bg-champ-primaryHover text-champ-bg font-bold text-xs flex items-center gap-1.5 shadow transition-all"
                    >
                      <Check className="w-4 h-4" />
                      <span>{lang === 'ar' ? 'اعتماد المعلم وتعيين الفصول' : 'Approve Teacher'}</span>
                    </button>
                    <button
                      onClick={() => handleRejectTeacher(tch.id)}
                      className="px-3.5 py-2 rounded-xl bg-champ-danger/20 hover:bg-champ-danger text-champ-danger hover:text-white font-bold text-xs flex items-center gap-1 transition-all"
                    >
                      <X className="w-4 h-4" />
                      <span>{lang === 'ar' ? 'رفض' : 'Reject'}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Tab 2: Users Management */}
      {activeTab === 'USERS_MANAGEMENT' && (
        <section className="bg-champ-card border border-champ-border rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h3 className="font-bold text-base text-champ-text">
              {lang === 'ar' ? 'سجل المستخدمين وإدارة الحسابات' : 'System Users Directory'}
            </h3>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="bg-champ-darkMuted border border-champ-border rounded-xl px-3 py-2 text-xs text-champ-text focus:outline-none"
              >
                <option value="">{lang === 'ar' ? 'جميع الرتب' : 'All Roles'}</option>
                <option value="STUDENT">{lang === 'ar' ? 'الطلاب' : 'Students'}</option>
                <option value="TEACHER">{lang === 'ar' ? 'المعلمون' : 'Teachers'}</option>
                <option value="ADMIN">{lang === 'ar' ? 'المدراء' : 'Administrators'}</option>
              </select>

              <div className="relative flex-1 sm:w-60">
                <Search className="w-4 h-4 text-champ-muted absolute top-2.5 left-3 rtl:left-auto rtl:right-3" />
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder={lang === 'ar' ? 'بحث بالاسم أو البريد...' : 'Search users...'}
                  className="w-full bg-champ-darkMuted border border-champ-border rounded-xl px-9 py-2 text-xs text-champ-text focus:outline-none"
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right rtl:text-right ltr:text-left text-xs">
              <thead>
                <tr className="border-b border-champ-border text-champ-muted font-bold">
                  <th className="py-2.5 px-3">{lang === 'ar' ? 'المستخدم' : 'User'}</th>
                  <th className="py-2.5 px-3">{lang === 'ar' ? 'البريد الإلكتروني' : 'Email'}</th>
                  <th className="py-2.5 px-3">{lang === 'ar' ? 'الرتبة' : 'Role'}</th>
                  <th className="py-2.5 px-3">{lang === 'ar' ? 'الفصل / التخصص' : 'Class/Subject'}</th>
                  <th className="py-2.5 px-3">{lang === 'ar' ? 'الحالة' : 'Status'}</th>
                  <th className="py-2.5 px-3 text-center">{lang === 'ar' ? 'الإجراء' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-champ-border/40">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-champ-darkMuted/30">
                    <td className="py-2.5 px-3 font-bold text-champ-text">{u.full_name || u.username}</td>
                    <td className="py-2.5 px-3 text-champ-muted">{u.email}</td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.role === 'ADMIN' ? 'bg-champ-gold/20 text-champ-gold' :
                        (u.role === 'TEACHER' ? 'bg-champ-blue/20 text-champ-blue' : 'bg-champ-primary/20 text-champ-primary')
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-champ-muted">
                      {u.student_profile?.classroom_name || u.teacher_profile?.subject || '-'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        u.status === 'APPROVED' ? 'text-champ-primary' :
                        (u.status === 'PENDING' ? 'text-champ-gold' : 'text-champ-danger')
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {!u.is_superuser && (
                        <button
                          onClick={() => handleToggleUserStatus(u)}
                          className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-colors ${
                            u.status === 'APPROVED'
                              ? 'bg-champ-danger/15 text-champ-danger hover:bg-champ-danger hover:text-white'
                              : 'bg-champ-primary/15 text-champ-primary hover:bg-champ-primary hover:text-champ-bg'
                          }`}
                        >
                          {u.status === 'APPROVED' ? (lang === 'ar' ? 'تجميد الحساب' : 'Suspend') : (lang === 'ar' ? 'تفعيل الحساب' : 'Activate')}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* Tab 3: Teacher Codes Management */}
      {activeTab === 'TEACHER_CODES' && (
        <section className="bg-champ-card border border-champ-border rounded-3xl p-6 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="font-bold text-base text-champ-text">
                {lang === 'ar' ? 'إدارة أكواد تسجيل المعلمين (Access Codes)' : 'Teacher Access Codes'}
              </h3>
              <p className="text-xs text-champ-muted">
                {lang === 'ar' ? 'الكود الإجباري المعتمد حالياً: teach2026' : 'Active system code: teach2026'}
              </p>
            </div>
          </div>

          {/* Create Code Form */}
          <form onSubmit={handleCreateCode} className="p-4 rounded-2xl bg-champ-darkMuted border border-champ-border grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
            <div>
              <label className="block text-xs font-semibold text-champ-muted mb-1">
                {lang === 'ar' ? 'كود جديد' : 'New Code'}
              </label>
              <input
                type="text"
                required
                value={newCodeStr}
                onChange={(e) => setNewCodeStr(e.target.value)}
                placeholder="e.g. teach2026"
                className="w-full bg-champ-card border border-champ-border rounded-xl px-3 py-2 text-xs text-champ-text font-mono font-bold"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-champ-muted mb-1">
                {lang === 'ar' ? 'الحد الأقصى للاستخدام' : 'Max Uses'}
              </label>
              <input
                type="number"
                min="1"
                value={newCodeUses}
                onChange={(e) => setNewCodeUses(e.target.value)}
                className="w-full bg-champ-card border border-champ-border rounded-xl px-3 py-2 text-xs text-champ-text font-bold"
              />
            </div>

            <button
              type="submit"
              className="py-2 px-4 rounded-xl bg-champ-gold text-champ-bg font-bold text-xs shadow hover:opacity-90 transition-all"
            >
              {lang === 'ar' ? 'إضافة / تفعيل كود' : 'Add Access Code'}
            </button>
          </form>

          {/* Active Codes List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {teacherCodes.map((c) => (
              <div key={c.id} className="p-4 rounded-2xl bg-champ-darkMuted border border-champ-border flex items-center justify-between">
                <div>
                  <span className="font-mono font-black text-sm text-champ-gold tracking-wider block">
                    {c.code}
                  </span>
                  <span className="text-[10px] text-champ-muted block mt-1">
                    {lang === 'ar' ? `استُخدم ${c.current_uses} من أصل ${c.max_uses}` : `Used ${c.current_uses} of ${c.max_uses}`}
                  </span>
                </div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${c.is_active ? 'bg-champ-primary/20 text-champ-primary' : 'bg-champ-danger/20 text-champ-danger'}`}>
                  {c.is_active ? (lang === 'ar' ? 'مفعل' : 'Active') : (lang === 'ar' ? 'معطل' : 'Disabled')}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Tab 4: Balance Adjustments */}
      {activeTab === 'ADJUSTMENTS' && (
        <section className="bg-champ-card border border-champ-border rounded-3xl p-6 shadow-xl space-y-6 max-w-xl">
          <div>
            <h3 className="font-bold text-base text-champ-text">
              {lang === 'ar' ? 'إجراء تعديل إداري رسمي على الأرصدة' : 'Administrative Balance Adjustment'}
            </h3>
            <p className="text-xs text-champ-muted">
              {lang === 'ar' ? 'لتصحيح الأخطاء مع توثيق السبب بصورة دائمة في سجل التدقيق' : 'Fix errors with mandatory documented audit logging'}
            </p>
          </div>

          {adjMessage && (
            <div className="p-3 rounded-xl bg-champ-primary/10 border border-champ-primary/30 text-champ-primary text-xs">
              {adjMessage}
            </div>
          )}

          {adjError && (
            <div className="p-3 rounded-xl bg-champ-danger/10 border border-champ-danger/30 text-champ-danger text-xs">
              {adjError}
            </div>
          )}

          <form onSubmit={handleProcessAdjustment} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-champ-muted mb-1.5">
                {lang === 'ar' ? 'اختر الطالب' : 'Select Student'} *
              </label>
              <select
                required
                value={adjStudentId}
                onChange={(e) => setAdjStudentId(e.target.value)}
                className="w-full bg-champ-darkMuted border border-champ-border rounded-xl px-3 py-2 text-xs text-champ-text focus:outline-none"
              >
                <option value="">{lang === 'ar' ? '-- اختر الطالب --' : '-- Select Student --'}</option>
                {allUsers.filter(u => u.role === 'STUDENT').map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.full_name || st.username} ({st.student_profile?.classroom_name || 'طالب'}) - {st.student_profile?.points || 0} pts
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-champ-muted mb-1.5">
                  {lang === 'ar' ? 'نوع الرصيد' : 'Currency'}
                </label>
                <select
                  value={adjCurrency}
                  onChange={(e) => setAdjCurrency(e.target.value)}
                  className="w-full bg-champ-darkMuted border border-champ-border rounded-xl px-3 py-2 text-xs text-champ-text focus:outline-none"
                >
                  <option value="POINTS">{t('points')}</option>
                  <option value="COINS">{t('coins')}</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-champ-muted mb-1.5">
                  {lang === 'ar' ? 'القيمة (+ أو -)' : 'Amount (+ or -)'} *
                </label>
                <input
                  type="number"
                  required
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(e.target.value)}
                  placeholder="e.g. 15 or -10"
                  className="w-full bg-champ-darkMuted border border-champ-border rounded-xl px-3 py-2 text-xs text-champ-text font-bold"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-champ-muted mb-1.5">
                {lang === 'ar' ? 'السبب التوثيقي للتعديل الإداري' : 'Mandatory Adjustment Reason'} *
              </label>
              <textarea
                rows="3"
                required
                value={adjReason}
                onChange={(e) => setAdjReason(e.target.value)}
                placeholder={lang === 'ar' ? 'تصحيح خطأ غير مقصود في تسجيل النقاط للنشاط الصفي...' : 'Reason for correction...'}
                className="w-full bg-champ-darkMuted border border-champ-border rounded-xl p-3 text-xs text-champ-text resize-none focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-champ-purple text-champ-bg font-bold text-xs shadow hover:opacity-90 transition-all"
            >
              {lang === 'ar' ? 'تنفيذ التعديل الإداري وتوثيقه' : 'Submit Adjustment'}
            </button>
          </form>
        </section>
      )}

      {/* Tab 5: Audit Logs */}
      {activeTab === 'AUDIT_LOGS' && (
        <section className="bg-champ-card border border-champ-border rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between border-b border-champ-border pb-3">
            <h3 className="font-bold text-base text-champ-text">
              {lang === 'ar' ? 'سجل التدقيق والعمليات الشاملة' : 'System Audit Logs'}
            </h3>
            <span className="text-xs text-champ-muted">
              {auditLogs.length} {lang === 'ar' ? 'سجل مسجل' : 'events'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right rtl:text-right ltr:text-left text-xs">
              <thead>
                <tr className="border-b border-champ-border text-champ-muted font-bold">
                  <th className="py-2.5 px-3">{lang === 'ar' ? 'نوع الإجراء' : 'Action'}</th>
                  <th className="py-2.5 px-3">{lang === 'ar' ? 'الفاعل' : 'Actor'}</th>
                  <th className="py-2.5 px-3">{lang === 'ar' ? 'التفاصيل' : 'Description'}</th>
                  <th className="py-2.5 px-3">{lang === 'ar' ? 'الوقت' : 'Timestamp'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-champ-border/40">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-champ-darkMuted/30">
                    <td className="py-2.5 px-3 font-semibold text-champ-primary">{log.action_type}</td>
                    <td className="py-2.5 px-3 font-bold text-champ-text">{log.actor_name}</td>
                    <td className="py-2.5 px-3 text-champ-muted max-w-sm truncate">
                      {lang === 'ar' ? log.description_ar : log.description_en}
                    </td>
                    <td className="py-2.5 px-3 text-champ-muted text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

    </div>
  );
}
