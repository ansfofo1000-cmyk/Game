import React, { useState, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { authService } from '../services/api';
import { Users, BookOpen, GraduationCap, Shield } from 'lucide-react';

export default function TeachersDirectoryPage() {
  const { lang, t } = useLanguage();
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTeachers();
  }, []);

  const loadTeachers = async () => {
    try {
      setLoading(true);
      const res = await authService.getTeachersDirectory();
      setTeachers(res.data || []);
    } catch (err) {
      console.warn('Teachers directory error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      
      {/* Banner */}
      <section className="bg-gradient-to-r from-champ-card via-champ-darkMuted to-champ-card border border-champ-border rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-champ-blue/20 border border-champ-blue/40 text-champ-blue flex items-center justify-center font-bold text-xl shadow">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-champ-text">
              {t('navDirectory')}
            </h1>
            <p className="text-xs text-champ-muted mt-0.5">
              {lang === 'ar' ? 'دليل المعلمين المعتمدين والمشرفين على الفصول الدراسية' : 'Verified school teachers and classroom supervisors'}
            </p>
          </div>
        </div>
      </section>

      {/* Directory Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {teachers.map((tch) => (
          <div
            key={tch.id}
            className="p-6 rounded-3xl bg-champ-card border border-champ-border shadow-xl hover:border-champ-blue/40 transition-all flex flex-col justify-between space-y-4"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-champ-darkMuted border border-champ-border flex items-center justify-center font-black text-xl text-champ-blue shadow">
                {tch.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-base text-champ-text">{tch.name}</h3>
                <span className="text-xs text-champ-blue font-semibold block mt-0.5">
                  {tch.subject || (lang === 'ar' ? 'معلم معتمد' : 'Verified Faculty')}
                </span>
              </div>
            </div>

            <div className="space-y-2 pt-2 border-t border-champ-border/60 text-xs">
              <div className="flex items-center justify-between text-champ-muted">
                <span>{lang === 'ar' ? 'الفصول المشرف عليها:' : 'Supervised Classrooms:'}</span>
                <div className="flex items-center gap-1 font-semibold text-champ-text">
                  {tch.assigned_classrooms?.map(c => c.name).join(', ') || '-'}
                </div>
              </div>

              <div className="flex items-center justify-between text-champ-muted">
                <span>{lang === 'ar' ? 'عدد الطلاب المدارين:' : 'Students Managed:'}</span>
                <span className="font-bold text-champ-primary">{tch.students_managed}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
