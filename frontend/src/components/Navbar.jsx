import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import {
  Trophy,
  Award,
  Crown,
  Bell,
  Menu,
  X,
  LogOut,
  User as UserIcon,
  Globe,
  Coins,
  Sparkles,
  BarChart3,
  ShieldAlert,
  Users
} from 'lucide-react';
import NotificationModal from './NotificationModal';

export default function Navbar() {
  const { user, isAuthenticated, isStudent, isTeacher, isAdmin, logout, unreadNotifications } = useAuth();
  const { lang, toggleLanguage, t } = useLanguage();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifModalOpen, setNotifModalOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className="sticky top-0 z-40 bg-champ-card/90 backdrop-blur-md border-b border-champ-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo & Brand */}
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-champ-primary to-champ-blue flex items-center justify-center shadow-lg shadow-champ-primary/20 group-hover:scale-105 transition-transform">
              <Trophy className="w-5 h-5 text-champ-bg fill-champ-bg" />
            </div>
            <div>
              <span className="text-xl font-bold bg-gradient-to-r from-champ-text via-champ-primary to-champ-blue bg-clip-text text-transparent">
                {lang === 'ar' ? 'أبطال الفصل' : 'Class Champions'}
              </span>
              <span className="block text-[10px] text-champ-muted tracking-wider">
                {lang === 'ar' ? 'منصة التنافس والريادة' : 'Student Competition Platform'}
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2">
            <Link
              to="/"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive('/') ? 'bg-champ-primary/10 text-champ-primary border border-champ-primary/30' : 'text-champ-muted hover:text-champ-text hover:bg-champ-darkMuted'
              }`}
            >
              {t('navHome')}
            </Link>

            <Link
              to="/leaderboard"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive('/leaderboard') ? 'bg-champ-primary/10 text-champ-primary border border-champ-primary/30' : 'text-champ-muted hover:text-champ-text hover:bg-champ-darkMuted'
              }`}
            >
              {t('navLeaderboard')}
            </Link>

            <Link
              to="/challenges"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive('/challenges') ? 'bg-champ-primary/10 text-champ-primary border border-champ-primary/30' : 'text-champ-muted hover:text-champ-text hover:bg-champ-darkMuted'
              }`}
            >
              {t('navChallenges')}
            </Link>

            <Link
              to="/teachers"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive('/teachers') ? 'bg-champ-primary/10 text-champ-primary border border-champ-primary/30' : 'text-champ-muted hover:text-champ-text hover:bg-champ-darkMuted'
              }`}
            >
              {t('navDirectory')}
            </Link>

            {isAuthenticated && isStudent && (
              <Link
                to="/student/dashboard"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/student/dashboard') ? 'bg-champ-primary/15 text-champ-primary border border-champ-primary/40' : 'text-champ-muted hover:text-champ-text hover:bg-champ-darkMuted'
                }`}
              >
                {t('studentDashboard')}
              </Link>
            )}

            {isAuthenticated && isTeacher && (
              <Link
                to="/teacher/dashboard"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/teacher/dashboard') ? 'bg-champ-blue/15 text-champ-blue border border-champ-blue/40' : 'text-champ-muted hover:text-champ-text hover:bg-champ-darkMuted'
                }`}
              >
                {t('teacherDashboard')}
              </Link>
            )}

            {isAuthenticated && isAdmin && (
              <Link
                to="/admin/dashboard"
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isActive('/admin/dashboard') ? 'bg-champ-gold/15 text-champ-gold border border-champ-gold/40' : 'text-champ-muted hover:text-champ-text hover:bg-champ-darkMuted'
                }`}
              >
                {t('navAdminPanel')}
              </Link>
            )}

            <Link
              to="/reports"
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                isActive('/reports') ? 'bg-champ-primary/10 text-champ-primary border border-champ-primary/30' : 'text-champ-muted hover:text-champ-text hover:bg-champ-darkMuted'
              }`}
            >
              {t('navReports')}
            </Link>
          </nav>

          {/* Right Action Icons: Language, Notifications, User Chips, Auth */}
          <div className="hidden md:flex items-center gap-3">
            
            {/* Language Switcher */}
            <button
              onClick={toggleLanguage}
              className="p-2 rounded-lg text-champ-muted hover:text-champ-primary hover:bg-champ-darkMuted transition-colors flex items-center gap-1.5 text-xs font-semibold"
              title="Switch Language"
            >
              <Globe className="w-4 h-4" />
              <span>{lang === 'ar' ? 'English' : 'عربي'}</span>
            </button>

            {/* Notifications Bell */}
            {isAuthenticated && (
              <button
                onClick={() => setNotifModalOpen(true)}
                className="relative p-2 rounded-lg text-champ-muted hover:text-champ-primary hover:bg-champ-darkMuted transition-colors"
                title={t('notifications')}
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-champ-danger text-white text-[10px] font-bold flex items-center justify-center animate-pulse">
                    {unreadNotifications > 9 ? '9+' : unreadNotifications}
                  </span>
                )}
              </button>
            )}

            {/* Authenticated User Status Chips */}
            {isAuthenticated ? (
              <div className="flex items-center gap-2">
                {isStudent && user.student_profile && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-champ-darkMuted rounded-full border border-champ-border text-xs">
                    <span className="flex items-center gap-1 text-champ-primary font-semibold">
                      <Sparkles className="w-3.5 h-3.5" />
                      {user.student_profile.points} {t('points')}
                    </span>
                    <span className="text-champ-border">|</span>
                    <span className="flex items-center gap-1 text-champ-gold font-semibold">
                      <Coins className="w-3.5 h-3.5" />
                      {user.student_profile.coins} {t('coins')}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-sm font-semibold text-champ-text leading-tight">
                      {user.full_name || user.username}
                    </div>
                    <div className="text-[11px] text-champ-muted">
                      {user.role === 'STUDENT' ? (user.student_profile?.classroom_name || 'طالب') : (user.role === 'TEACHER' ? 'معلم معتمد' : 'مدير النظام')}
                    </div>
                  </div>

                  <button
                    onClick={handleLogout}
                    className="p-2 rounded-lg text-champ-muted hover:text-champ-danger hover:bg-champ-darkMuted transition-colors"
                    title={t('logout')}
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/student/login"
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-champ-darkMuted hover:bg-champ-border text-champ-text border border-champ-border transition-colors"
                >
                  {t('studentLogin')}
                </Link>
                <Link
                  to="/teacher/login"
                  className="px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-champ-primary to-champ-primaryHover text-champ-bg shadow-sm hover:opacity-95 transition-all"
                >
                  {t('teacherLogin')}
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Hamburger Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleLanguage}
              className="p-1.5 rounded-lg text-champ-muted hover:text-champ-primary text-xs"
            >
              {lang === 'ar' ? 'EN' : 'عربي'}
            </button>
            {isAuthenticated && (
              <button
                onClick={() => setNotifModalOpen(true)}
                className="relative p-1.5 rounded-lg text-champ-muted hover:text-champ-primary"
              >
                <Bell className="w-5 h-5" />
                {unreadNotifications > 0 && (
                  <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-champ-danger text-white text-[9px] flex items-center justify-center">
                    {unreadNotifications}
                  </span>
                )}
              </button>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-champ-muted hover:text-champ-text hover:bg-champ-darkMuted"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>

        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-champ-card border-b border-champ-border px-4 pt-2 pb-4 space-y-2">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-champ-text hover:bg-champ-darkMuted"
          >
            {t('navHome')}
          </Link>
          <Link
            to="/leaderboard"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-champ-text hover:bg-champ-darkMuted"
          >
            {t('navLeaderboard')}
          </Link>
          <Link
            to="/challenges"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-champ-text hover:bg-champ-darkMuted"
          >
            {t('navChallenges')}
          </Link>
          <Link
            to="/teachers"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-champ-text hover:bg-champ-darkMuted"
          >
            {t('navDirectory')}
          </Link>
          <Link
            to="/reports"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-medium text-champ-text hover:bg-champ-darkMuted"
          >
            {t('navReports')}
          </Link>

          {isAuthenticated ? (
            <div className="pt-2 border-t border-champ-border space-y-2">
              {isStudent && (
                <Link
                  to="/student/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-medium text-champ-primary bg-champ-primary/10"
                >
                  {t('studentDashboard')}
                </Link>
              )}
              {isTeacher && (
                <Link
                  to="/teacher/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-medium text-champ-blue bg-champ-blue/10"
                >
                  {t('teacherDashboard')}
                </Link>
              )}
              {isAdmin && (
                <Link
                  to="/admin/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-lg text-sm font-medium text-champ-gold bg-champ-gold/10"
                >
                  {t('navAdminPanel')}
                </Link>
              )}
              <button
                onClick={() => { setMobileMenuOpen(false); handleLogout(); }}
                className="w-full text-left rtl:text-right px-3 py-2 rounded-lg text-sm font-medium text-champ-danger hover:bg-champ-darkMuted flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                {t('logout')}
              </button>
            </div>
          ) : (
            <div className="pt-2 border-t border-champ-border grid grid-cols-2 gap-2">
              <Link
                to="/student/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center py-2 rounded-lg text-xs font-semibold bg-champ-darkMuted text-champ-text"
              >
                {t('studentLogin')}
              </Link>
              <Link
                to="/teacher/login"
                onClick={() => setMobileMenuOpen(false)}
                className="text-center py-2 rounded-lg text-xs font-semibold bg-champ-primary text-champ-bg"
              >
                {t('teacherLogin')}
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Notifications Modal */}
      {notifModalOpen && (
        <NotificationModal onClose={() => setNotifModalOpen(false)} />
      )}
    </header>
  );
}
