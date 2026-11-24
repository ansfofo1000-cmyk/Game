import React from 'react';
import { Trophy, Heart } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function Footer() {
  const { lang } = useLanguage();

  return (
    <footer className="bg-champ-card border-t border-champ-border mt-auto py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-champ-primary/20 border border-champ-primary/30 flex items-center justify-center">
              <Trophy className="w-4 h-4 text-champ-primary" />
            </div>
            <div>
              <span className="font-bold text-sm text-champ-text">
                {lang === 'ar' ? 'أبطال الفصل — Class Champions' : 'Class Champions'}
              </span>
              <p className="text-[11px] text-champ-muted">
                {lang === 'ar' ? 'منظومة التنافس الإيجابي والريادة المدرسية الذكية' : 'Gamified Leadership & School Competition Platform'}
              </p>
            </div>
          </div>

          <div className="text-xs text-champ-muted flex items-center gap-1">
            <span>{lang === 'ar' ? 'تم التطوير بعناية واحترافية' : 'Designed & Engineered for School Excellence'}</span>
            <span>•</span>
            <span>Wheeler 2 & Wheeler 3</span>
          </div>

          <div className="text-xs text-champ-muted/70">
            &copy; 2026 {lang === 'ar' ? 'جميع الحقوق محفوظة' : 'All rights reserved'}.
          </div>
        </div>
      </div>
    </footer>
  );
}
