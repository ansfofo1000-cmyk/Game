import React, { useState } from 'react';
import { pointsService } from '../services/api';
import { useLanguage } from '../contexts/LanguageContext';
import { X, PlusCircle, MinusCircle, Coins, AlertTriangle, CheckCircle, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export default function PointsModal({ student, initialMode = 'ADD', onClose, onSuccess }) {
  const { lang, t } = useLanguage();
  const [mode, setMode] = useState(initialMode); // 'ADD', 'DEDUCT', 'COINS'
  const [amount, setAmount] = useState(10);
  const [reason, setReason] = useState('');
  const [category, setCategory] = useState('ACADEMIC');
  const [confirmStep, setConfirmStep] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const categories = [
    { value: 'ACADEMIC', labelAr: 'التميز الأكاديمي', labelEn: 'Academic Excellence' },
    { value: 'HELPING', labelAr: 'مساعدة الآخرين', labelEn: 'Helping Others' },
    { value: 'SPORTS', labelAr: 'المشاركة الرياضية', labelEn: 'Sports Participation' },
    { value: 'ARTISTIC', labelAr: 'الإبداع الفني', labelEn: 'Artistic Creativity' },
    { value: 'DISCIPLINE', labelAr: 'الانضباط الصفي', labelEn: 'Classroom Discipline' },
    { value: 'TEAMWORK', labelAr: 'العمل الجماعي', labelEn: 'Teamwork' },
    { value: 'VOLUNTEERING', labelAr: 'العمل التطوعي', labelEn: 'Volunteering' },
    { value: 'OTHER', labelAr: 'أخرى', labelEn: 'Other' },
  ];

  const handleSubmit = async () => {
    setError('');
    setLoading(true);

    try {
      if (!reason.trim()) {
        setError(lang === 'ar' ? 'سبب العملية إجباري ولا يمكن تركه فارغاً' : 'Reason is mandatory');
        setLoading(false);
        return;
      }

      if (amount <= 0) {
        setError(lang === 'ar' ? 'يجب إدخال قيمة موجبة أكبر من صفر' : 'Amount must be greater than zero');
        setLoading(false);
        return;
      }

      let res;
      if (mode === 'ADD') {
        res = await pointsService.addPoints({
          student_id: student.user_id || student.id,
          amount: parseInt(amount, 10),
          reason: reason.trim(),
          category: category,
        });
        // Gamified confetti trigger!
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 }
        });
      } else if (mode === 'DEDUCT') {
        res = await pointsService.deductPoints({
          student_id: student.user_id || student.id,
          amount: parseInt(amount, 10),
          reason: reason.trim(),
          category: category,
        });
      } else if (mode === 'COINS') {
        res = await pointsService.awardCoins({
          student_id: student.user_id || student.id,
          amount: parseInt(amount, 10),
          reason: reason.trim(),
        });
        confetti({
          particleCount: 50,
          spread: 60,
          colors: ['#FBBF24', '#F59E0B', '#D97706'],
          origin: { y: 0.6 }
        });
      }

      setSuccessMsg(res.data.message || (lang === 'ar' ? 'تمت العملية بنجاح!' : 'Transaction successful!'));
      setTimeout(() => {
        if (onSuccess) onSuccess(res.data);
        onClose();
      }, 1200);

    } catch (err) {
      console.error(err);
      const serverErr = err.response?.data?.error || err.response?.data?.message || err.message;
      setError(serverErr || (lang === 'ar' ? 'حدث خطأ أثناء تنفيذ العملية' : 'Error executing transaction'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-champ-card border border-champ-border rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-4 border-b border-champ-border bg-champ-darkMuted/60">
          <div>
            <h3 className="font-bold text-lg text-champ-text">
              {mode === 'ADD' ? t('addPoints') : (mode === 'DEDUCT' ? t('deductPoints') : t('awardCoins'))}
            </h3>
            <p className="text-xs text-champ-muted mt-0.5">
              {lang === 'ar' ? 'الطالب:' : 'Student:'} <span className="text-champ-primary font-semibold">{student.name}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-champ-muted hover:text-champ-text hover:bg-champ-card"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="flex border-b border-champ-border bg-champ-darkMuted/30 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => { setMode('ADD'); setConfirmStep(false); }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
              mode === 'ADD' ? 'bg-champ-primary text-champ-bg shadow' : 'text-champ-muted hover:text-champ-text'
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            {t('addPoints')}
          </button>

          <button
            type="button"
            onClick={() => { setMode('DEDUCT'); setConfirmStep(false); }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
              mode === 'DEDUCT' ? 'bg-champ-danger text-white shadow' : 'text-champ-muted hover:text-champ-text'
            }`}
          >
            <MinusCircle className="w-4 h-4" />
            {t('deductPoints')}
          </button>

          <button
            type="button"
            onClick={() => { setMode('COINS'); setConfirmStep(false); }}
            className={`flex-1 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
              mode === 'COINS' ? 'bg-champ-gold text-champ-bg shadow' : 'text-champ-muted hover:text-champ-text'
            }`}
          >
            <Coins className="w-4 h-4" />
            {t('awardCoins')}
          </button>
        </div>

        {/* Body Form */}
        <div className="p-5 space-y-4">
          
          {error && (
            <div className="p-3 rounded-xl bg-champ-danger/10 border border-champ-danger/30 text-champ-danger text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-champ-primary/10 border border-champ-primary/30 text-champ-primary text-xs flex items-center gap-2">
              <CheckCircle className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {!confirmStep ? (
            <>
              {/* Amount field */}
              <div>
                <label className="block text-xs font-semibold text-champ-muted mb-1.5">
                  {t('amount')} ({mode === 'COINS' ? t('coins') : t('points')})
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full bg-champ-darkMuted border border-champ-border rounded-xl px-3.5 py-2 text-champ-text text-sm focus:outline-none focus:border-champ-primary font-bold"
                  />
                  {/* Preset Quick Chips */}
                  <div className="flex items-center gap-1 shrink-0">
                    {[5, 10, 20, 50].map((val) => (
                      <button
                        key={val}
                        type="button"
                        onClick={() => setAmount(val)}
                        className={`px-2 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                          amount === val ? 'bg-champ-primary/20 text-champ-primary border-champ-primary' : 'bg-champ-darkMuted text-champ-muted border-champ-border hover:text-champ-text'
                        }`}
                      >
                        +{val}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Category (for Points) */}
              {mode !== 'COINS' && (
                <div>
                  <label className="block text-xs font-semibold text-champ-muted mb-1.5">
                    {t('category')}
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-champ-darkMuted border border-champ-border rounded-xl px-3.5 py-2 text-champ-text text-sm focus:outline-none focus:border-champ-primary"
                  >
                    {categories.map((c) => (
                      <option key={c.value} value={c.value}>
                        {lang === 'ar' ? c.labelAr : c.labelEn}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Mandatory Reason */}
              <div>
                <label className="block text-xs font-semibold text-champ-muted mb-1.5">
                  {t('reason')} *
                </label>
                <textarea
                  rows="3"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder={lang === 'ar' ? 'اكتب سبب إضافة أو خصم النقاط بالتفصيل (مثل: تميز في حل المسائل الرياضية)...' : 'Write a detailed mandatory reason...'}
                  className="w-full bg-champ-darkMuted border border-champ-border rounded-xl p-3 text-champ-text text-sm focus:outline-none focus:border-champ-primary resize-none placeholder:text-champ-muted/50"
                  required
                />
              </div>

              {/* Next to Confirmation Button */}
              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-champ-muted hover:text-champ-text hover:bg-champ-darkMuted transition-colors"
                >
                  {t('cancel')}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (!reason.trim()) {
                      setError(lang === 'ar' ? 'سبب العملية إجباري ولا يمكن تركه فارغاً' : 'Reason is mandatory');
                      return;
                    }
                    setError('');
                    setConfirmStep(true);
                  }}
                  className={`px-5 py-2 rounded-xl text-xs font-bold shadow-md transition-all ${
                    mode === 'ADD' ? 'bg-champ-primary text-champ-bg hover:bg-champ-primaryHover' :
                    (mode === 'DEDUCT' ? 'bg-champ-danger text-white hover:opacity-90' : 'bg-champ-gold text-champ-bg hover:opacity-90')
                  }`}
                >
                  {lang === 'ar' ? 'متابعة وتأكيد' : 'Review & Confirm'}
                </button>
              </div>
            </>
          ) : (
            /* Confirmation Dialog Step */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-champ-darkMuted border border-champ-border text-center space-y-2">
                <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-champ-card border border-champ-border">
                  {mode === 'ADD' && <Sparkles className="w-6 h-6 text-champ-primary" />}
                  {mode === 'DEDUCT' && <AlertTriangle className="w-6 h-6 text-champ-danger" />}
                  {mode === 'COINS' && <Coins className="w-6 h-6 text-champ-gold" />}
                </div>

                <h4 className="font-bold text-sm text-champ-text">
                  {lang === 'ar' ? 'يرجى تأكيد تنفيذ العملية:' : 'Please confirm this transaction:'}
                </h4>

                <div className="text-xs text-champ-muted space-y-1">
                  <p>
                    <strong className="text-champ-text">{lang === 'ar' ? 'الطالب:' : 'Student:'}</strong> {student.name}
                  </p>
                  <p>
                    <strong className="text-champ-text">{lang === 'ar' ? 'العملية:' : 'Action:'}</strong>{' '}
                    <span className={mode === 'ADD' ? 'text-champ-primary font-bold' : (mode === 'DEDUCT' ? 'text-champ-danger font-bold' : 'text-champ-gold font-bold')}>
                      {mode === 'ADD' ? `+${amount} ${t('points')}` : (mode === 'DEDUCT' ? `-${amount} ${t('points')}` : `+${amount} ${t('coins')}`)}
                    </span>
                  </p>
                  <p>
                    <strong className="text-champ-text">{lang === 'ar' ? 'السبب:' : 'Reason:'}</strong> {reason}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  disabled={loading}
                  onClick={() => setConfirmStep(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-champ-muted hover:text-champ-text hover:bg-champ-darkMuted"
                >
                  {lang === 'ar' ? 'رجوع' : 'Back'}
                </button>
                <button
                  type="button"
                  disabled={loading}
                  onClick={handleSubmit}
                  className={`px-5 py-2 rounded-xl text-xs font-bold text-white shadow-md flex items-center gap-1.5 ${
                    mode === 'ADD' ? 'bg-champ-primary text-champ-bg' :
                    (mode === 'DEDUCT' ? 'bg-champ-danger' : 'bg-champ-gold text-champ-bg')
                  }`}
                >
                  {loading ? (lang === 'ar' ? 'جارٍ التنفيذ...' : 'Processing...') : t('confirm')}
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
