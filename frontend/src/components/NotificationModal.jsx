import React, { useState, useEffect } from 'react';
import { notificationService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { X, Bell, Check, CheckCheck, Sparkles, Trophy, Award, ShieldAlert } from 'lucide-react';

export default function NotificationModal({ onClose }) {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const { fetchNotificationsCount } = useAuth();
  const { lang, t } = useLanguage();

  const loadNotifications = async () => {
    try {
      const res = await notificationService.getNotifications();
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.warn('Error loading notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleMarkRead = async (id) => {
    try {
      await notificationService.markRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
      fetchNotificationsCount();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationService.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      fetchNotificationsCount();
    } catch (err) {
      console.error(err);
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'POINTS_CHANGE':
        return <Sparkles className="w-5 h-5 text-champ-primary" />;
      case 'LEVEL_UP':
        return <Trophy className="w-5 h-5 text-champ-gold" />;
      case 'ACHIEVEMENT_UNLOCKED':
        return <Award className="w-5 h-5 text-champ-purple" />;
      default:
        return <Bell className="w-5 h-5 text-champ-blue" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
      <div className="bg-champ-card border border-champ-border rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[85vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-champ-border bg-champ-darkMuted/50">
          <div className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-champ-primary" />
            <h3 className="font-bold text-lg text-champ-text">{t('notifications')}</h3>
          </div>
          <div className="flex items-center gap-2">
            {notifications.some(n => !n.is_read) && (
              <button
                onClick={handleMarkAllRead}
                className="text-xs text-champ-primary hover:underline flex items-center gap-1 font-semibold"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                {t('markAllRead')}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-champ-muted hover:text-champ-text hover:bg-champ-card"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Notification List */}
        <div className="p-4 overflow-y-auto space-y-2.5 flex-1 divide-y divide-champ-border/30">
          {loading ? (
            <div className="text-center py-8 text-champ-muted">{lang === 'ar' ? 'جارٍ تحميل الإشعارات...' : 'Loading notifications...'}</div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-12 text-champ-muted">
              <Bell className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>{t('noNotifications')}</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.is_read && handleMarkRead(n.id)}
                className={`pt-2.5 first:pt-0 flex items-start gap-3 p-2.5 rounded-xl transition-colors cursor-pointer ${
                  n.is_read ? 'hover:bg-champ-darkMuted/40 opacity-75' : 'bg-champ-primary/5 hover:bg-champ-primary/10 border border-champ-primary/20'
                }`}
              >
                <div className="p-2 rounded-xl bg-champ-darkMuted border border-champ-border shrink-0">
                  {getIcon(n.notification_type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-bold text-champ-text truncate">
                      {lang === 'ar' ? n.title_ar : n.title_en}
                    </h4>
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-champ-primary shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-champ-muted mt-1 leading-relaxed">
                    {lang === 'ar' ? n.message_ar : n.message_en}
                  </p>
                  <span className="text-[10px] text-champ-muted/70 mt-1.5 block">
                    {new Date(n.created_at).toLocaleDateString()} {new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
