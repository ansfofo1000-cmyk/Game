import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  ar: {
    appName: 'أبطال الفصل',
    appSubtitle: 'منصة التنافس والريادة وإدارة الصف المدرسية',
    navHome: 'الرئيسية',
    navLeaderboard: 'لوحة المتصدرين',
    navStudentPortal: 'بوابة الطلاب',
    navTeacherPortal: 'بوابة المعلمين',
    navAdminPanel: 'لوحة الإدارة',
    navChallenges: 'التحديات الصفية',
    navAchievements: 'الأوسمة والإنجازات',
    navDirectory: 'دليل المعلمين',
    navReports: 'التقارير والإحصائيات',
    navAudit: 'سجل العمليات',
    login: 'تسجيل الدخول',
    logout: 'تسجيل الخروج',
    register: 'إنشاء حساب جديد',
    studentLogin: 'دخول الطلاب',
    teacherLogin: 'دخول المعلمين',
    studentRegister: 'تسجيل طالب جديد',
    teacherRegister: 'تسجيل معلم جديد',
    points: 'نقاط',
    coins: 'عملات',
    rank: 'الترتيب',
    level: 'المستوى',
    classroom: 'الفصل الدراسي',
    position: 'المنصب القيادي',
    committee: 'اللجنة المتخصصة',
    none: 'لا يوجد',
    addPoints: 'إضافة نقاط (+)',
    deductPoints: 'خصم نقاط (-)',
    awardCoins: 'منح عملات',
    reason: 'سبب العملية (إجباري)',
    category: 'الفئة',
    amount: 'العدد / القيمة',
    cancel: 'إلغاء',
    confirm: 'تأكيد العملية',
    save: 'حفظ التعديلات',
    searchStudent: 'بحث عن طالب بالاسم أو البريد...',
    allClassrooms: 'جميع الفصول',
    wheeler2: 'ويلر 2',
    wheeler3: 'ويلر 3',
    topStudents: 'أبطال منصة التتويج',
    recentActivity: 'أحدث الأنشطة والتفاعلات',
    notifications: 'التنبيهات والإشعارات',
    markAllRead: 'تحديد الكل كمقروء',
    noNotifications: 'لا توجد إشعارات جديدة حالياً',
    pendingApproval: 'قيد الاعتماد والمراجعة',
    approved: 'معتمد',
    suspended: 'معلق',
    rejected: 'مرفوض',
    adminDashboard: 'لوحة تحكم إدارة المدرسة',
    teacherDashboard: 'لوحة المعلم وإدارة الفصول',
    studentDashboard: 'لوحة الطالب الشخصية',
    joinChallenge: 'الانضمام للتحدي',
    completedChallenge: 'مكتمل',
    exportCSV: 'تصدير كملف CSV',
    exportPDF: 'تصدير كتقرير PDF',
  },
  en: {
    appName: 'Class Champions',
    appSubtitle: 'Student Competition, Leadership & Classroom Management Platform',
    navHome: 'Home',
    navLeaderboard: 'Leaderboards',
    navStudentPortal: 'Student Portal',
    navTeacherPortal: 'Teachers Portal',
    navAdminPanel: 'Admin Panel',
    navChallenges: 'Challenges',
    navAchievements: 'Achievements',
    navDirectory: 'Teachers Directory',
    navReports: 'Reports & Analytics',
    navAudit: 'Audit Logs',
    login: 'Log In',
    logout: 'Log Out',
    register: 'Create Account',
    studentLogin: 'Student Portal',
    teacherLogin: 'Teachers Portal',
    studentRegister: 'Student Registration',
    teacherRegister: 'Teacher Registration',
    points: 'Points',
    coins: 'Coins',
    rank: 'Rank',
    level: 'Level',
    classroom: 'Classroom',
    position: 'Leadership Position',
    committee: 'Committee',
    none: 'None',
    addPoints: 'Add Points (+)',
    deductPoints: 'Deduct Points (-)',
    awardCoins: 'Award Coins',
    reason: 'Reason (Mandatory)',
    category: 'Category',
    amount: 'Amount',
    cancel: 'Cancel',
    confirm: 'Confirm Action',
    save: 'Save Changes',
    searchStudent: 'Search student by name or email...',
    allClassrooms: 'All Classrooms',
    wheeler2: 'Wheeler 2',
    wheeler3: 'Wheeler 3',
    topStudents: 'Champions Podium',
    recentActivity: 'Recent Activities & Transactions',
    notifications: 'Notifications',
    markAllRead: 'Mark all as read',
    noNotifications: 'No notifications at this time',
    pendingApproval: 'Pending Approval',
    approved: 'Approved',
    suspended: 'Suspended',
    rejected: 'Rejected',
    adminDashboard: 'Administrator Dashboard',
    teacherDashboard: 'Teacher Dashboard',
    studentDashboard: 'Student Personal Dashboard',
    joinChallenge: 'Join Challenge',
    completedChallenge: 'Completed',
    exportCSV: 'Export as CSV',
    exportPDF: 'Export as PDF',
  }
};

const LanguageContext = createContext(null);

export const LanguageProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('cc_lang') || 'ar');

  useEffect(() => {
    localStorage.setItem('cc_lang', lang);
    const dir = lang === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', lang);
    if (lang === 'ar') {
      document.body.classList.remove('font-inter');
      document.body.classList.add('font-cairo');
    } else {
      document.body.classList.remove('font-cairo');
      document.body.classList.add('font-inter');
    }
  }, [lang]);

  const toggleLanguage = () => {
    setLang(prev => (prev === 'ar' ? 'en' : 'ar'));
  };

  const t = (key) => {
    return translations[lang]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, dir: lang === 'ar' ? 'rtl' : 'ltr', toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
