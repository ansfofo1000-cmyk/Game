import React from 'react';
import { Crown, Trophy, Sparkles, Coins, Medal, Award } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export default function Podium({ topThree = [] }) {
  const { lang, t } = useLanguage();

  if (!topThree || topThree.length === 0) {
    return (
      <div className="text-center py-10 text-champ-muted bg-champ-card/40 rounded-2xl border border-champ-border">
        {lang === 'ar' ? 'لا يوجد طلاب على منصة التتويج حتى الآن' : 'No students on the podium yet'}
      </div>
    );
  }

  const first = topThree[0];
  const second = topThree[1];
  const third = topThree[2];

  return (
    <div className="relative pt-8 pb-4">
      {/* Background glow behind 1st place */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 bg-champ-gold/15 rounded-full blur-3xl pointer-events-none" />

      <div className="grid grid-cols-3 gap-2 sm:gap-4 items-end max-w-2xl mx-auto px-2">
        
        {/* 2nd Place (Silver) */}
        <div className="flex flex-col items-center">
          {second ? (
            <div className="w-full flex flex-col items-center group">
              <div className="relative mb-2">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-champ-silver/70 bg-champ-darkMuted flex items-center justify-center text-xl font-bold text-champ-silver shadow-lg shadow-champ-silver/20 overflow-hidden">
                  {second.avatar ? (
                    <img src={second.avatar} alt={second.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{second.name.charAt(0)}</span>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-1 w-6 h-6 rounded-full bg-champ-silver text-champ-bg flex items-center justify-center font-black text-xs shadow">
                  2
                </div>
              </div>

              <div className="text-center mb-2 px-1 w-full">
                <div className="font-bold text-xs sm:text-sm text-champ-text truncate" title={second.name}>
                  {second.name}
                </div>
                <div className="text-[10px] text-champ-muted truncate">
                  {second.classroom_name_ar || second.classroom_name}
                </div>
              </div>

              {/* Podium Column */}
              <div className="w-full h-28 sm:h-36 bg-gradient-to-t from-champ-card to-champ-cardHover border-t-2 border-champ-silver/60 rounded-t-2xl p-2 flex flex-col items-center justify-start shadow-xl">
                <Medal className="w-5 h-5 text-champ-silver mt-1" />
                <div className="mt-2 text-center">
                  <span className="font-black text-sm sm:text-base text-champ-silver">
                    {second.points}
                  </span>
                  <span className="text-[10px] text-champ-muted block">{t('points')}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-28 bg-champ-darkMuted/30 rounded-t-2xl border-t border-champ-border/40" />
          )}
        </div>

        {/* 1st Place (Gold Champion) */}
        <div className="flex flex-col items-center -mt-6 z-10">
          {first ? (
            <div className="w-full flex flex-col items-center group">
              {/* Animated Floating Crown */}
              <Crown className="w-8 h-8 text-champ-gold animate-bounce drop-shadow-[0_4px_12px_rgba(251,191,36,0.6)] mb-1" />

              <div className="relative mb-2">
                <div className="w-18 h-18 sm:w-20 sm:h-20 rounded-full border-4 border-champ-gold bg-champ-darkMuted flex items-center justify-center text-2xl font-black text-champ-gold shadow-2xl shadow-champ-gold/40 ring-4 ring-champ-gold/20 overflow-hidden">
                  {first.avatar ? (
                    <img src={first.avatar} alt={first.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{first.name.charAt(0)}</span>
                  )}
                </div>
                <div className="absolute -bottom-2.5 -right-1.5 w-7 h-7 rounded-full bg-champ-gold text-champ-bg flex items-center justify-center font-black text-sm shadow-md ring-2 ring-champ-card">
                  1
                </div>
              </div>

              <div className="text-center mb-2 px-1 w-full">
                <div className="font-extrabold text-sm sm:text-base text-champ-gold truncate flex items-center justify-center gap-1" title={first.name}>
                  {first.name}
                </div>
                <div className="text-[11px] text-champ-primary font-medium">
                  {first.classroom_name_ar || first.classroom_name}
                </div>
                <div className="text-[10px] text-champ-muted mt-0.5">
                  {first.level}
                </div>
              </div>

              {/* Gold Podium Column */}
              <div className="w-full h-36 sm:h-48 bg-gradient-to-t from-champ-card via-champ-cardHover to-champ-gold/10 border-t-4 border-champ-gold rounded-t-2xl p-2.5 flex flex-col items-center justify-start shadow-2xl shadow-champ-gold/10">
                <Trophy className="w-7 h-7 text-champ-gold mt-1 animate-pulse" />
                <div className="mt-2 text-center">
                  <div className="font-black text-lg sm:text-2xl text-champ-gold">
                    {first.points}
                  </div>
                  <div className="text-[11px] text-champ-muted font-semibold">{t('points')}</div>
                </div>

                {first.coins > 0 && (
                  <div className="mt-2 px-2 py-0.5 rounded-full bg-champ-gold/15 border border-champ-gold/30 flex items-center gap-1 text-[11px] text-champ-gold font-bold">
                    <Coins className="w-3 h-3" />
                    <span>{first.coins}</span>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="w-full h-36 bg-champ-darkMuted/30 rounded-t-2xl border-t border-champ-border/40" />
          )}
        </div>

        {/* 3rd Place (Bronze) */}
        <div className="flex flex-col items-center">
          {third ? (
            <div className="w-full flex flex-col items-center group">
              <div className="relative mb-2">
                <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full border-2 border-champ-bronze bg-champ-darkMuted flex items-center justify-center text-xl font-bold text-champ-bronze shadow-lg shadow-champ-bronze/20 overflow-hidden">
                  {third.avatar ? (
                    <img src={third.avatar} alt={third.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{third.name.charAt(0)}</span>
                  )}
                </div>
                <div className="absolute -bottom-2 -right-1 w-6 h-6 rounded-full bg-champ-bronze text-white flex items-center justify-center font-black text-xs shadow">
                  3
                </div>
              </div>

              <div className="text-center mb-2 px-1 w-full">
                <div className="font-bold text-xs sm:text-sm text-champ-text truncate" title={third.name}>
                  {third.name}
                </div>
                <div className="text-[10px] text-champ-muted truncate">
                  {third.classroom_name_ar || third.classroom_name}
                </div>
              </div>

              {/* Podium Column */}
              <div className="w-full h-24 sm:h-32 bg-gradient-to-t from-champ-card to-champ-cardHover border-t-2 border-champ-bronze rounded-t-2xl p-2 flex flex-col items-center justify-start shadow-xl">
                <Medal className="w-5 h-5 text-champ-bronze mt-1" />
                <div className="mt-2 text-center">
                  <span className="font-black text-sm sm:text-base text-champ-bronze">
                    {third.points}
                  </span>
                  <span className="text-[10px] text-champ-muted block">{t('points')}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-24 bg-champ-darkMuted/30 rounded-t-2xl border-t border-champ-border/40" />
          )}
        </div>

      </div>
    </div>
  );
}
