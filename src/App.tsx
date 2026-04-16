import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Vote, 
  BarChart3, 
  User as UserIcon,
  Settings, 
  Plus, 
  LogOut, 
  Moon, 
  Sun, 
  Globe, 
  ChevronRight, 
  CheckCircle2,
  X,
  Loader2,
  MessageCircle,
  ArrowLeft,
  Star,
  Eye,
  EyeOff,
  Lock,
  FileQuestion,
  TrendingUp,
  Clock,
  Edit3,
  Image as ImageIcon,
  Upload,
  ExternalLink,
  ChevronRight as ChevronRightIcon
} from 'lucide-react';
import { User as UserType, Survey, VoteResult, Language, translations, QuestionType, SurveyType } from './types';

export default function App() {
  const [user, setUser] = useState<UserType | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });
  const [lang, setLang] = useState<Language>(() => (localStorage.getItem('lang') as Language) || 'uz');
  const [theme, setTheme] = useState<'light' | 'dark'>(() => (localStorage.getItem('theme') as 'light' | 'dark') || 'dark');
  const [view, setView] = useState<'surveys' | 'create' | 'profile' | 'stats' | 'support'>('surveys');
  const [surveys, setSurveys] = useState<Survey[]>([]);
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [selectedSurvey, setSelectedSurvey] = useState<Survey | null>(null);
  const [editingSurvey, setEditingSurvey] = useState<Survey | null>(null);
  const [users, setUsers] = useState<UserType[]>([]);
  const [results, setResults] = useState<VoteResult[]>([]);
  const [currentVotes, setCurrentVotes] = useState<{ question_id: number, option_id: number }[]>([]);
  const [newSurveyQuestions, setNewSurveyQuestions] = useState<{ text: string, options: string[], image_url?: string | null, type: QuestionType, correct_option_index?: number }[]>([
    { text: '', options: ['', ''], image_url: null, type: 'multiple_choice', correct_option_index: 0 }
  ]);
  const [isPrivate, setIsPrivate] = useState(false);
  const [accessCode, setAccessCode] = useState('');
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [isAccessCodeModalOpen, setIsAccessCodeModalOpen] = useState(false);
  const [pendingSurvey, setPendingSurvey] = useState<Survey | null>(null);
  const [ratedSurveyId, setRatedSurveyId] = useState<number | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [hasExpiration, setHasExpiration] = useState(false);
  const [googleFormUrl, setGoogleFormUrl] = useState('');
  const [googleViewUrl, setGoogleViewUrl] = useState('');
  const [googleEditUrl, setGoogleEditUrl] = useState('');
  const [surveyType, setSurveyType] = useState<SurveyType>('internal');
  const [isGoogleLinked, setIsGoogleLinked] = useState(false);
  const [showGoogleScript, setShowGoogleScript] = useState(false);
  const [googleScript, setGoogleScript] = useState('');

  const [testResult, setTestResult] = useState<{ score: number, total: number, details: { question_id: number, is_correct: boolean, correct_option_id: number }[] } | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isCodeSent, setIsCodeSent] = useState(false);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [emailForCode, setEmailForCode] = useState('');
  const [isLangOpen, setIsLangOpen] = useState(false);

  const t = translations[lang];

  const getTimeLeft = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - new Date().getTime();
    if (diff <= 0) return t.expired;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt).getTime() <= new Date().getTime();
  };

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  useEffect(() => {
    localStorage.setItem('theme', theme);
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  useEffect(() => {
    if (user) fetchSurveys();
    if (user?.is_admin && view === 'profile') fetchUsers();
  }, [user, view]);

  const fetchSurveys = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/surveys');
      const data = await res.json();
      setSurveys(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    if (!user?.is_admin) return;
    try {
      const res = await fetch(`/api/users?admin_id=${user.id}`);
      const data = await res.json();
      if (res.ok) setUsers(data);
    } catch (e) {
      console.error(e);
    }
  };

  const handleBlockUser = async (targetId: number, isBlocked: boolean) => {
    if (!user?.is_admin) return;
    try {
      const res = await fetch(`/api/users/${targetId}/block`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_id: user.id, is_blocked: isBlocked }),
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || t.error);
      }
    } catch (e) {
      alert(t.error);
    }
  };

  const handleDeleteUser = async (targetId: number) => {
    if (!user?.is_admin || !confirm(t.confirmDeleteUser)) return;
    try {
      const res = await fetch(`/api/users/${targetId}?admin_id=${user.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchUsers();
      } else {
        const data = await res.json();
        alert(data.error || t.error);
      }
    } catch (e) {
      alert(t.error);
    }
  };

  const handleDeleteMyAccount = async () => {
    if (!user || !confirm(t.confirmDeleteAccount)) return;
    try {
      const res = await fetch('/api/users/me', {
        method: 'DELETE',
        headers: { 'user-id': user.id.toString() }
      });
      if (res.ok) {
        localStorage.removeItem('user');
        setUser(null);
      } else {
        const data = await res.json();
        alert(data.error || t.error);
      }
    } catch (e) {
      alert(t.error);
    }
  };

  const sendVerificationCode = async (email: string) => {
    if (!email) return;
    setIsSendingCode(true);
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      const result = await res.json();
      if (res.ok) {
        setIsCodeSent(true);
        setEmailForCode(email);
      } else {
        setAuthError(result.error || t.error);
      }
    } catch (e) {
      setAuthError(t.error);
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleAuth = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = Object.fromEntries(formData);
    const endpoint = authMode === 'login' ? '/api/auth/login' : '/api/auth/register';
    
    setAuthError(null);
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        setUser(result.user);
        localStorage.setItem('user', JSON.stringify(result.user));
        setIsCodeSent(false);
        setEmailForCode('');
      } else {
        setAuthError(result.error || t.error);
      }
    } catch (e) {
      setAuthError(t.error);
    }
  };

  const handleVote = async (surveyId: number) => {
    if (!user || currentVotes.length === 0) return;
    
    const survey = surveys.find(s => s.id === surveyId);
    if (survey?.survey_type === 'test') {
      let score = 0;
      const details = survey.questions.map(q => {
        const vote = currentVotes.find(v => v.question_id === q.id);
        const isCorrect = vote?.option_id === q.correct_option_id;
        if (isCorrect) score++;
        return {
          question_id: q.id,
          is_correct: isCorrect,
          correct_option_id: q.correct_option_id || 0
        };
      });
      setTestResult({ score, total: survey.questions.length, details });
    }

    try {
      const res = await fetch(`/api/surveys/${surveyId}/vote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: user.id, votes: currentVotes }),
      });
      
      let result;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        result = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || "Server error");
      }

      if (result.success) {
        fetchSurveys();
        showResults(surveyId);
        setCurrentVotes([]);
      } else {
        alert(result.error || t.error);
      }
    } catch (e: any) {
      alert(e.message || t.error);
    }
  };

  const showResults = async (surveyId: number) => {
    try {
      const res = await fetch(`/api/surveys/${surveyId}/results`);
      const data = await res.json();
      setResults(data);
      setSelectedSurvey(surveys.find(s => s.id === surveyId) || null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleCreateSurvey = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!user || isSubmitting) return;
    
    const validQuestions = newSurveyQuestions.filter(q => q.text.trim() !== '');
    if (validQuestions.length === 0) {
      alert(t.atLeastOneQuestion);
      return;
    }

    setIsSubmitting(true);
    const formData = new FormData(e.currentTarget);
    
    const data = {
      title: formData.get('title'),
      description: formData.get('description'),
      creator_id: user.id,
      admin_id: user.id, // For PUT compatibility
      is_private: isPrivate ? 1 : 0,
      access_code: isPrivate ? accessCode : null,
      image_url: imageUrl,
      expires_at: hasExpiration ? (expiresAt || null) : null,
      google_form_url: googleFormUrl || null,
      google_view_url: googleViewUrl || null,
      google_edit_url: googleEditUrl || null,
      is_google_linked: isGoogleLinked ? 1 : 0,
      survey_type: surveyType,
      questions: validQuestions.map((q, qIdx) => ({
        text: q.text,
        image_url: q.image_url,
        type: q.type,
        options: q.options.filter(o => o.trim() !== ''),
        correct_option_index: q.correct_option_index
      }))
    };

    const endpoint = editingSurvey ? `/api/surveys/${editingSurvey.id}` : '/api/surveys';
    const method = editingSurvey ? 'PUT' : 'POST';

    try {
      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      
      let result;
      const contentType = res.headers.get("content-type");
      if (contentType && contentType.indexOf("application/json") !== -1) {
        result = await res.json();
      } else {
        const text = await res.text();
        throw new Error(text || "Server error");
      }

      if (res.ok) {
        setView('surveys');
        fetchSurveys();
        setNewSurveyQuestions([{ text: '', options: ['', ''], image_url: null, type: 'multiple_choice', correct_option_index: 0 }]);
        setIsPrivate(false);
        setAccessCode('');
        setImageUrl(null);
        setExpiresAt('');
        setHasExpiration(false);
        setGoogleFormUrl('');
        setGoogleViewUrl('');
        setGoogleEditUrl('');
        setSurveyType('internal');
        setIsGoogleLinked(false);
        setEditingSurvey(null);
      } else {
        alert(result.error || t.error);
      }
    } catch (e) {
      alert(t.error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleSurvey = async (id: number) => {
    if (!user || user.is_admin !== 1) return;
    try {
      const res = await fetch(`/api/surveys/${id}/toggle`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_id: user.id })
      });
      const data = await res.json();
      if (res.ok) {
        fetchSurveys();
        alert(data.is_active === 1 ? t.surveyActivated : t.surveyStopped);
      } else {
        alert(data.error || t.error);
      }
    } catch (e) {
      alert(t.error);
    }
  };

  const handleDeleteSurvey = async (id: number) => {
    if (!user || !confirm(t.confirmDelete)) return;
    try {
      const res = await fetch(`/api/surveys/${id}?admin_id=${user.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        fetchSurveys();
      } else {
        const data = await res.json();
        alert(data.error || t.error);
      }
    } catch (e) {
      alert(t.error);
    }
  };

  const startEditing = (survey: Survey) => {
    setEditingSurvey(survey);
    setIsPrivate(survey.is_private === 1);
    setAccessCode(survey.access_code || '');
    setImageUrl(survey.image_url || null);
    setExpiresAt(survey.expires_at || '');
    setHasExpiration(!!survey.expires_at);
    setGoogleFormUrl(survey.google_form_url || '');
    setGoogleViewUrl(survey.google_view_url || '');
    setGoogleEditUrl(survey.google_edit_url || '');
    setSurveyType(survey.survey_type || 'internal');
    setIsGoogleLinked(survey.is_google_linked === 1);
    setNewSurveyQuestions(survey.questions.map(q => ({
      text: q.text,
      image_url: q.image_url || null,
      type: q.type || 'multiple_choice',
      options: q.options.map(o => o.text),
      correct_option_index: q.options.findIndex(o => o.id === q.correct_option_id)
    })));
    setView('create');
  };

  const addQuestion = () => {
    setNewSurveyQuestions([...newSurveyQuestions, { text: '', options: ['', ''], image_url: null, type: 'multiple_choice', correct_option_index: 0 }]);
  };

  const updateQuestionText = (index: number, text: string) => {
    const updated = [...newSurveyQuestions];
    updated[index].text = text;
    setNewSurveyQuestions(updated);
  };

  const updateQuestionImage = (index: number, imageUrl: string | null) => {
    const updated = [...newSurveyQuestions];
    updated[index].image_url = imageUrl;
    setNewSurveyQuestions(updated);
  };

  const updateOptionText = (qIndex: number, oIndex: number, text: string) => {
    const updated = [...newSurveyQuestions];
    updated[qIndex].options[oIndex] = text;
    setNewSurveyQuestions(updated);
  };

  const addOption = (qIndex: number) => {
    const updated = [...newSurveyQuestions];
    updated[qIndex].options.push('');
    setNewSurveyQuestions(updated);
  };

  const generateGoogleScript = () => {
    const validQuestions = newSurveyQuestions.filter(q => q.text.trim() !== '');
    let script = `function createForm() {\n`;
    script += `  var form = FormApp.create('${(editingSurvey?.title || "Yangi So'rovnoma").replace(/'/g, "\\'")}');\n`;
    script += `  form.setDescription('${(editingSurvey?.description || "GlassVote orqali yaratilgan so'rovnoma").replace(/'/g, "\\'")}');\n\n`;
    
    validQuestions.forEach(q => {
      if (q.type === 'multiple_choice') {
        script += `  var item = form.addMultipleChoiceItem();\n`;
        script += `  item.setTitle('${q.text.replace(/'/g, "\\'")}');\n`;
        const opts = q.options.filter(o => o.trim() !== '').map(o => `'${o.replace(/'/g, "\\'")}'`).join(', ');
        script += `  item.setChoiceValues([${opts}]);\n\n`;
      } else if (q.type === 'checkbox') {
        script += `  var item = form.addCheckboxItem();\n`;
        script += `  item.setTitle('${q.text.replace(/'/g, "\\'")}');\n`;
        const opts = q.options.filter(o => o.trim() !== '').map(o => `'${o.replace(/'/g, "\\'")}'`).join(', ');
        script += `  item.setChoiceValues([${opts}]);\n\n`;
      } else if (q.type === 'text') {
        script += `  var item = form.addTextItem();\n`;
        script += `  item.setTitle('${q.text.replace(/'/g, "\\'")}');\n\n`;
      } else if (q.type === 'paragraph') {
        script += `  var item = form.addParagraphTextItem();\n`;
        script += `  item.setTitle('${q.text.replace(/'/g, "\\'")}');\n\n`;
      }
    });
    
    script += `  Logger.log('--------------------------------------------------');\n`;
    script += `  Logger.log('1. Form Edit URL (Tahrirlash): ' + form.getEditUrl());\n`;
    script += `  Logger.log('2. Form Public URL (Ko\\'rish): ' + form.getPublishedUrl());\n`;
    script += `  Logger.log('3. Action URL (formResponse): ' + form.getPublishedUrl().replace('/viewform', '/formResponse'));\n`;
    script += `  Logger.log('--------------------------------------------------');\n`;
    script += `  Logger.log('Nusxalab o\\'ling va ilovaga joylang.');\n`;
    script += `}`;
    
    setGoogleScript(script);
    setShowGoogleScript(true);
    setIsGoogleLinked(true);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[#F8F9FA] dark:bg-[#121212] relative overflow-hidden transition-colors duration-300">
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="minimal-card w-full max-w-[380px] p-7 relative z-10"
        >
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="w-20 h-20 rounded-2xl shadow-2xl shadow-[#2B4F6E]/30 overflow-hidden bg-[#121212] flex items-center justify-center">
                <svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
                  <rect width="512" height="512" fill="#121212"/>
                  <text x="50%" y="48%" dominantBaseline="middle" textAnchor="middle" fill="white" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="180">GV</text>
                  <text x="50%" y="80%" dominantBaseline="middle" textAnchor="middle" fill="white" fontFamily="Inter, sans-serif" fontSize="40" letterSpacing="12">GLASS VOTE</text>
                </svg>
              </div>
            </div>
            <h1 className="text-[26px] font-semibold tracking-tight text-[#212529] dark:text-white mb-1">
              {t.welcome}
            </h1>
            <p className="text-[#ADB5BD] dark:text-[#B0B0B0]/60 text-sm font-medium tracking-[1px] uppercase">
              GlassVote
            </p>
          </div>

          <AnimatePresence>
            {authError && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900/30 text-red-600 dark:text-red-400 text-xs font-medium text-center"
              >
                {authError}
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleAuth} className="space-y-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={authMode}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-3"
              >
                {authMode === 'register' && (
                  <>
                    <div className="relative">
                      <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-[#ADB5BD] dark:text-[#B0B0B0]/40 w-4 h-4" />
                      <input name="full_name" placeholder={t.fullName} required className="minimal-input w-full pl-11 !py-3 !text-sm !rounded-[16px]" />
                    </div>
                    <input name="phone" placeholder={t.phone} required className="minimal-input w-full !py-3 !text-sm !rounded-[16px]" />
                    <div className="flex gap-2">
                        <input 
                          name="email" 
                          type="email" 
                          placeholder={t.email} 
                          required 
                          className="minimal-input flex-1 !py-3 !text-sm !rounded-[16px]" 
                          onChange={(e) => setEmailForCode(e.target.value)}
                          readOnly={isCodeSent}
                        />
                      {!isCodeSent && (
                        <button 
                          type="button"
                          onClick={() => sendVerificationCode(emailForCode)}
                          disabled={isSendingCode || !emailForCode}
                          className="minimal-button !h-[44px] px-4 text-xs whitespace-nowrap"
                        >
                          {isSendingCode ? <Loader2 className="animate-spin" size={16} /> : t.sendCode}
                        </button>
                      )}
                    </div>
                    {isCodeSent && (
                      <div className="space-y-2">
                        <p className="text-[10px] text-green-600 dark:text-green-400 font-medium px-2">{t.codeSent}</p>
                        <input name="code" placeholder={t.verifyCode} required className="minimal-input w-full !py-3 !text-sm !rounded-[16px] border-green-200 dark:border-green-900/30" />
                        <button 
                          type="button"
                          onClick={() => sendVerificationCode(emailForCode)}
                          className="text-[10px] text-[#868E96] hover:text-[#2B4F6E] underline px-2"
                        >
                          {t.resendCode}
                        </button>
                      </div>
                    )}
                  </>
                )}
                
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-[#ADB5BD] dark:text-[#B0B0B0]/40 w-4 h-4" />
                  <input name="username" placeholder={t.username} required className="minimal-input w-full pl-11 !py-3 !text-sm !rounded-[16px]" />
                </div>

                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#ADB5BD] dark:text-[#B0B0B0]/40 w-4 h-4" />
                  <input 
                    name="password" 
                    type={showPassword ? "text" : "password"} 
                    placeholder={t.password} 
                    required 
                    className="minimal-input w-full pl-11 pr-11 !py-3 !text-sm !rounded-[16px]" 
                  />
                  <button 
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#ADB5BD] dark:text-[#B0B0B0]/40 hover:text-[#212529] dark:hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
            
            <button 
              type="submit" 
              className="minimal-button w-full mt-4 !h-[48px] text-sm"
              disabled={authMode === 'register' && !isCodeSent}
            >
              {authMode === 'login' ? t.login : t.register}
            </button>
          </form>

          <div className="mt-8 text-center">
            <button 
              onClick={() => {
                setAuthMode(authMode === 'login' ? 'register' : 'login');
                setAuthError(null);
                setIsCodeSent(false);
                setEmailForCode('');
              }}
              className="text-[#868E96] dark:text-[#B0B0B0] hover:text-[#212529] dark:hover:text-white font-normal text-base transition-all"
            >
              {authMode === 'login' ? t.register : t.login}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#121212] text-[#212529] dark:text-white transition-colors duration-300">
      {/* Navigation */}
      <nav className="fixed bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 minimal-nav rounded-[24px] sm:rounded-[32px] px-6 sm:px-8 py-3 sm:py-4 z-50 flex items-center gap-6 sm:gap-10">
        <NavButton active={view === 'surveys'} onClick={() => setView('surveys')} icon={<Vote size={20} />} />
        <NavButton active={view === 'stats'} onClick={() => setView('stats')} icon={<BarChart3 size={20} />} />
        <NavButton active={view === 'create'} onClick={() => {
          setView('create');
          setEditingSurvey(null);
          setIsPrivate(false);
          setAccessCode('');
          setImageUrl(null);
          setNewSurveyQuestions([{ text: '', options: ['', ''], image_url: null, type: 'multiple_choice', correct_option_index: 0 }]);
        }} icon={<Plus size={20} />} />
        <NavButton active={view === 'profile'} onClick={() => setView('profile')} icon={<UserIcon size={20} />} />
      </nav>

      {/* Header */}
      <header className="p-4 sm:p-6 flex justify-between items-center max-w-5xl mx-auto bg-white/40 dark:bg-[#1E1E1E]/40 backdrop-blur-2xl sticky top-0 z-40 border-b border-white/20 dark:border-white/5 transition-all duration-500">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl sm:rounded-2xl shadow-lg shadow-[#2B4F6E]/20 overflow-hidden bg-[#121212] flex items-center justify-center">
            <svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
              <rect width="512" height="512" fill="#121212"/>
              <text x="50%" y="48%" dominantBaseline="middle" textAnchor="middle" fill="white" fontFamily="Inter, sans-serif" fontWeight="800" fontSize="180">GV</text>
              <text x="50%" y="80%" dominantBaseline="middle" textAnchor="middle" fill="white" fontFamily="Inter, sans-serif" fontSize="40" letterSpacing="12">GLASS VOTE</text>
            </svg>
          </div>
          <h2 className="text-lg sm:text-xl font-light tracking-tight text-[#868E96] dark:text-[#B0B0B0]">GlassVote</h2>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
          <button onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')} className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-[#F8F9FA] dark:bg-[#2A2A2A] border border-[#E9ECEF] dark:border-[#3A3A3A] hover:bg-[#F1F3F5] dark:hover:bg-[#3A3A3A] transition-all group">
            {theme === 'light' ? <Moon size={18} className="text-[#868E96] group-hover:text-[#2B4F6E] transition-colors" /> : <Sun size={18} className="text-yellow-400" />}
          </button>
          <div className="relative">
            <button 
              onClick={() => setIsLangOpen(!isLangOpen)}
              className="p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-[#F8F9FA] dark:bg-[#2A2A2A] border border-[#E9ECEF] dark:border-[#3A3A3A] hover:bg-[#F1F3F5] dark:hover:bg-[#3A3A3A] transition-all flex items-center gap-2"
            >
              <Globe size={18} className="text-[#868E96] dark:text-[#B0B0B0]" />
              <span className="uppercase text-[10px] sm:text-xs font-bold tracking-widest">{lang}</span>
            </button>
            <AnimatePresence>
              {isLangOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute right-0 top-full mt-2 bg-white dark:bg-[#1E1E1E] border border-[#F1F3F5] dark:border-[#2A2A2A] rounded-[24px] p-2 min-w-[160px] shadow-2xl z-[100]"
                >
                  {(['uz', 'ru', 'en'] as Language[]).map(l => (
                    <button 
                      key={l} 
                      onClick={() => {
                        setLang(l);
                        setIsLangOpen(false);
                      }} 
                      className="w-full text-left px-4 py-3 rounded-xl hover:bg-[#F8F9FA] dark:hover:bg-[#2A2A2A] uppercase text-xs font-bold tracking-widest transition-colors"
                    >
                      {l === 'uz' ? "O'zbek" : l === 'ru' ? "Русский" : "English"}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 sm:p-6 pb-32">
        <AnimatePresence mode="wait">
          {view === 'surveys' && (
            <motion.div 
              key="surveys"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >

              <div className={surveys.length === 0 ? "flex flex-col items-center justify-center py-20" : "grid gap-6 md:grid-cols-2 lg:grid-cols-3"}>
                {loading ? (
                  <div className="col-span-full flex justify-center py-32">
                    <Loader2 className="animate-spin text-[#2B4F6E] w-12 h-12" />
                  </div>
                ) : surveys.filter(s => (user?.is_admin === 1 || (s.is_active !== 0 && !isExpired(s.expires_at)))).length === 0 ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="minimal-card w-full max-w-[400px] flex flex-col items-center text-center py-12 px-8"
                >
                  <div className="w-20 h-20 rounded-full bg-[#F1F3F5] dark:bg-[#2A2A2A] flex items-center justify-center mb-6">
                    <FileQuestion size={40} className="text-[#868E96] dark:text-[#B0B0B0]" />
                  </div>
                  <h3 className="text-[22px] font-semibold text-[#212529] dark:text-white mb-2">{t.noSurveys}</h3>
                  <p className="text-base text-[#868E96] dark:text-[#B0B0B0] mb-8">{t.createFirst}</p>
                  <button 
                    onClick={() => setView('create')}
                    className="minimal-button px-10"
                  >
                    + {t.createSurvey}
                  </button>
                </motion.div>
              ) : (
                surveys.filter(s => (user?.is_admin === 1 || (s.is_active !== 0 && !isExpired(s.expires_at)))).map(s => (
                  <motion.div 
                    layout
                    key={s.id} 
                    onClick={() => {
                      if (isExpired(s.expires_at) && user.is_admin === 0) {
                        alert(t.expired);
                        return;
                      }
                      if (s.is_private && user.is_admin === 0) {
                        setPendingSurvey(s);
                        setIsAccessCodeModalOpen(true);
                      } else {
                        showResults(s.id);
                      }
                    }}
                    className={`minimal-card flex flex-col justify-between group hover:border-[#2B4F6E] transition-all duration-500 cursor-pointer p-0 overflow-hidden relative ${(s.is_active === 0 || isExpired(s.expires_at)) ? 'opacity-60 grayscale-[0.5]' : ''}`} 
                  >
                    <div className="p-4 sm:p-6 flex flex-col items-center text-center">
                      {s.image_url && (
                        <div className="w-20 h-20 rounded-2xl overflow-hidden mb-4 border border-[#F1F3F5] dark:border-[#3A3A3A] shadow-sm group-hover:scale-105 transition-transform duration-500">
                          <img src={s.image_url} alt={s.title} className="w-full h-full object-cover" />
                        </div>
                      )}
                      
                      <div className="flex flex-wrap gap-1.5 mb-2 justify-center">
                        <span className="text-[8px] font-bold uppercase tracking-widest text-[#868E96] dark:text-[#B0B0B0] bg-[#F8F9FA] dark:bg-[#2A2A2A] px-2 py-0.5 rounded-full border border-[#F1F3F5] dark:border-[#3A3A3A]">
                          {s.creator_name}
                        </span>
                        {s.is_private === 1 && (
                          <span className="text-[8px] font-bold uppercase tracking-widest text-orange-500 bg-orange-50 dark:bg-orange-900/20 px-2 py-0.5 rounded-full border border-orange-100 dark:border-orange-900/40">
                            {t.private}
                          </span>
                        )}
                        {(s.is_active === 0 || isExpired(s.expires_at)) && (
                          <span className="text-[8px] font-bold uppercase tracking-widest text-red-500 bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded-full border border-red-100 dark:border-red-900/40">
                            {isExpired(s.expires_at) ? t.expired : t.stop}
                          </span>
                        )}
                        {s.expires_at && !isExpired(s.expires_at) && (
                          <span className="text-[8px] font-bold uppercase tracking-widest text-blue-500 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full border border-blue-100 dark:border-blue-900/40 flex items-center gap-1">
                            <Clock size={8} />
                            {getTimeLeft(s.expires_at)}
                          </span>
                        )}
                        {s.survey_type === 'test' && (
                          <span className="text-[8px] font-bold uppercase tracking-widest text-purple-500 bg-purple-50 dark:bg-purple-900/20 px-2 py-0.5 rounded-full border border-purple-100 dark:border-purple-900/40 flex items-center gap-1">
                            <CheckCircle2 size={8} />
                            {t.testSurveys}
                          </span>
                        )}
                        {s.is_google_linked === 1 && (
                          <span className="text-[8px] font-bold uppercase tracking-widest text-green-500 bg-green-50 dark:bg-green-900/20 px-2 py-0.5 rounded-full border border-green-100 dark:border-green-900/40 flex items-center gap-1">
                            <Globe size={8} />
                            Google Form
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold mb-1 leading-tight group-hover:text-[#2B4F6E] transition-colors text-[#212529] dark:text-white line-clamp-1">{s.title}</h3>
                      <p className="text-[#868E96] dark:text-[#B0B0B0] text-[10px] line-clamp-2 font-medium leading-relaxed mb-4">{s.description}</p>
                      
                      {(s.survey_type === 'google' || s.is_google_linked === 1) && (
                        <div className="flex flex-col gap-2 w-full mt-2">
                          {s.google_view_url && (
                            <a 
                              href={s.google_view_url} 
                              target="_blank" 
                              onClick={(e) => e.stopPropagation()}
                              className="w-full py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[9px] font-bold uppercase tracking-widest text-center border border-blue-100 dark:border-blue-900/30 hover:bg-blue-100 transition-all flex items-center justify-center gap-2"
                            >
                              <Eye size={12} />
                              {t.viewGoogleForm}
                            </a>
                          )}
                          {s.google_edit_url && user.id === s.creator_id && (
                            <a 
                              href={s.google_edit_url} 
                              target="_blank" 
                              onClick={(e) => e.stopPropagation()}
                              className="w-full py-2 rounded-xl bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 text-[9px] font-bold uppercase tracking-widest text-center border border-green-100 dark:border-green-900/30 hover:bg-green-100 transition-all flex items-center justify-center gap-2"
                            >
                              <Settings size={12} />
                              {t.editGoogleForm}
                            </a>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="px-4 sm:px-6 pb-4 sm:pb-5 flex items-center justify-between mt-auto">
                      <div className="flex items-center gap-2 text-[8px] font-bold text-[#ADB5BD] dark:text-[#B0B0B0]/40 uppercase tracking-widest">
                        <CheckCircle2 size={12} className="text-[#2B4F6E]" />
                        {s.total_participants} {t.totalVotes}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {(user.id === s.creator_id) && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); startEditing(s); }}
                            className="p-1.5 rounded-lg bg-[#F8F9FA] dark:bg-[#2A2A2A] border border-[#E9ECEF] dark:border-[#3A3A3A] text-[#868E96] hover:text-[#2B4F6E] transition-all"
                            title={t.edit}
                          >
                            <Edit3 size={12} />
                          </button>
                        )}
                        <div className="w-6 h-6 rounded-lg bg-[#F8F9FA] dark:bg-[#2A2A2A] border border-[#E9ECEF] dark:border-[#3A3A3A] flex items-center justify-center group-hover:bg-[#2B4F6E] group-hover:text-white group-hover:border-[#2B4F6E] transition-all shadow-sm">
                          <ChevronRightIcon size={12} className="group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
              </div>
            </motion.div>
          )}

          {view === 'create' && (
            <motion.div 
              key="create"
              initial={{ opacity: 0, scale: 0.99 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.99 }}
              className="max-w-2xl mx-auto"
            >
              <div className="minimal-card p-8">
                <div className="flex flex-col mb-8">
                  <h2 className="text-xl font-semibold tracking-tight">{editingSurvey ? t.edit : t.createSurvey}</h2>
                  <div className="h-[2px] w-12 bg-[#2B4F6E] mt-2"></div>
                </div>
                
                <form onSubmit={handleCreateSurvey} className="space-y-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-[#868E96] dark:text-[#B0B0B0]">{t.surveyType}</label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <button 
                        type="button"
                        onClick={() => {
                          setSurveyType('internal');
                          setIsGoogleLinked(false);
                        }}
                        className={`py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${surveyType === 'internal' ? 'bg-[#2B4F6E] text-white shadow-lg shadow-[#2B4F6E]/20' : 'bg-[#F1F3F5] dark:bg-[#2A2A2A] text-[#868E96]'}`}
                      >
                        {t.internalSurveys}
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          setSurveyType('test');
                          setIsGoogleLinked(false);
                        }}
                        className={`py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${surveyType === 'test' ? 'bg-[#2B4F6E] text-white shadow-lg shadow-[#2B4F6E]/20' : 'bg-[#F1F3F5] dark:bg-[#2A2A2A] text-[#868E96]'}`}
                      >
                        {t.testSurveys}
                      </button>
                      <button 
                        type="button"
                        onClick={() => {
                          setSurveyType('google');
                          setIsGoogleLinked(true);
                        }}
                        className={`py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest transition-all ${surveyType === 'google' ? 'bg-[#2B4F6E] text-white shadow-lg shadow-[#2B4F6E]/20' : 'bg-[#F1F3F5] dark:bg-[#2A2A2A] text-[#868E96]'}`}
                      >
                        {t.googleSurveys}
                      </button>
                    </div>
                  </div>

                  <div className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2">
                      <label className="text-[10px] font-semibold uppercase tracking-widest text-[#868E96] dark:text-[#B0B0B0]">{t.title}</label>
                      <input name="title" defaultValue={editingSurvey?.title} required className="minimal-input w-full !py-2.5 !text-sm" placeholder={t.title + "..."} />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-semibold uppercase tracking-widest text-[#868E96] dark:text-[#B0B0B0]">{t.description}</label>
                      <input name="description" defaultValue={editingSurvey?.description} required className="minimal-input w-full !py-2.5 !text-sm" placeholder={t.description + "..."} />
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] font-semibold uppercase tracking-widest text-[#868E96] dark:text-[#B0B0B0]">{t.questions}</label>
                      <button type="button" onClick={addQuestion} className="text-[10px] font-bold uppercase tracking-widest text-[#2B4F6E] flex items-center gap-1.5 hover:underline transition-all">
                        <Plus size={14} /> {t.addQuestion}
                      </button>
                    </div>
                    
                    {newSurveyQuestions.map((q, qIdx) => (
                      <div key={qIdx} className="p-6 rounded-2xl bg-[#F1F3F5] dark:bg-[#2A2A2A] border border-[#E9ECEF] dark:border-[#3A3A3A] space-y-6 relative group">
                        <button 
                          type="button" 
                          onClick={() => {
                            const newQs = newSurveyQuestions.filter((_, i) => i !== qIdx);
                            setNewSurveyQuestions(newQs);
                          }}
                          className="absolute top-4 right-4 text-[#868E96] dark:text-[#B0B0B0] hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <X size={18} />
                        </button>
                        
                        <div className="space-y-2">
                          <label className="text-[9px] font-semibold uppercase tracking-widest text-[#868E96] dark:text-[#B0B0B0]">{t.question} {qIdx + 1}</label>
                          
                          {surveyType === 'google' && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
                              {(['multiple_choice', 'checkbox', 'text', 'paragraph'] as QuestionType[]).map(type => (
                                <button 
                                  key={type}
                                  type="button"
                                  onClick={() => {
                                    const updated = [...newSurveyQuestions];
                                    updated[qIdx].type = type;
                                    setNewSurveyQuestions(updated);
                                  }}
                                  className={`py-2 rounded-lg text-[8px] font-bold uppercase tracking-widest transition-all ${q.type === type ? 'bg-[#2B4F6E] text-white shadow-md' : 'bg-white dark:bg-[#1E1E1E] text-[#868E96] border border-[#E9ECEF] dark:border-[#3A3A3A]'}`}
                                >
                                  {type === 'multiple_choice' ? t.multipleChoice : type === 'checkbox' ? t.checkbox : type === 'text' ? t.shortAnswer : t.paragraph}
                                </button>
                              ))}
                            </div>
                          )}

                          <div className="flex gap-4">
                            <div className="flex-1">
                              <input 
                                value={q.text}
                                onChange={(e) => updateQuestionText(qIdx, e.target.value)}
                                required 
                                className="minimal-input w-full !py-2 !text-sm" 
                                placeholder={t.question + "..."} 
                              />
                            </div>
                            <div className="relative">
                              <label className="text-[8px] font-bold uppercase tracking-widest text-[#868E96] dark:text-[#B0B0B0] absolute -top-4 right-0">{t.optional}</label>
                              <input 
                                type="file" 
                                id={`q-image-${qIdx}`} 
                                accept="image/*" 
                                className="hidden" 
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                      updateQuestionImage(qIdx, reader.result as string);
                                    };
                                    reader.readAsDataURL(file);
                                  }
                                }}
                              />
                              <label 
                                htmlFor={`q-image-${qIdx}`}
                                className="w-10 h-10 rounded-xl bg-white dark:bg-[#1E1E1E] border border-[#E9ECEF] dark:border-[#3A3A3A] flex items-center justify-center cursor-pointer hover:bg-[#F8F9FA] dark:hover:bg-[#2A2A2A] transition-all overflow-hidden"
                              >
                                {q.image_url ? (
                                  <img src={q.image_url} alt="Q" className="w-full h-full object-cover" />
                                ) : (
                                  <ImageIcon size={16} className="text-[#ADB5BD]" />
                                )}
                              </label>
                              {q.image_url && (
                                <button 
                                  type="button"
                                  onClick={() => updateQuestionImage(qIdx, null)}
                                  className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center shadow-sm"
                                >
                                  <X size={10} />
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <label className="text-[9px] font-semibold uppercase tracking-widest text-[#868E96] dark:text-[#B0B0B0]">{t.options}</label>
                            <button type="button" onClick={() => addOption(qIdx)} className="text-[9px] font-bold uppercase tracking-widest text-[#2B4F6E] hover:underline">
                              {t.addOption}
                            </button>
                          </div>
                          <div className="grid gap-3 sm:grid-cols-2">
                            {q.options.map((opt, oIdx) => (
                              <div key={oIdx} className="relative group/opt flex items-center gap-2">
                                {surveyType === 'test' && (
                                  <button 
                                    type="button"
                                    onClick={() => {
                                      const updated = [...newSurveyQuestions];
                                      updated[qIdx].correct_option_index = oIdx;
                                      setNewSurveyQuestions(updated);
                                    }}
                                    className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${q.correct_option_index === oIdx ? 'bg-green-500 border-green-500 text-white shadow-md' : 'border-[#E9ECEF] dark:border-[#3A3A3A] hover:border-green-500'}`}
                                  >
                                    {q.correct_option_index === oIdx && <CheckCircle2 size={12} />}
                                  </button>
                                )}
                                <div className="relative flex-1">
                                  <input 
                                    value={opt}
                                    onChange={(e) => updateOptionText(qIdx, oIdx, e.target.value)}
                                    className="minimal-input w-full text-xs" 
                                    placeholder={`${t.options} ${oIdx + 1}`} 
                                    required={oIdx <= 1} 
                                  />
                                  {q.options.length > 2 && (
                                    <button 
                                      type="button" 
                                      onClick={() => {
                                        const newQs = [...newSurveyQuestions];
                                        newQs[qIdx].options = newQs[qIdx].options.filter((_, i) => i !== oIdx);
                                        setNewSurveyQuestions(newQs);
                                      }}
                                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#868E96] dark:text-[#B0B0B0] hover:text-red-500 opacity-0 group-hover/opt:opacity-100 transition-all"
                                    >
                                      <X size={14} />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="grid gap-6 md:grid-cols-2 pt-8 border-t border-[#E9ECEF] dark:border-[#3A3A3A]">
                    <div className="space-y-2 col-span-full">
                      <label className="text-[10px] font-semibold uppercase tracking-widest text-[#868E96] dark:text-[#B0B0B0]">{t.image || "Rasm"} ({t.optional})</label>
                      <div className="flex items-center gap-4">
                        <div className="w-24 h-24 rounded-2xl bg-[#F1F3F5] dark:bg-[#2A2A2A] border border-dashed border-[#E9ECEF] dark:border-[#3A3A3A] flex items-center justify-center overflow-hidden relative group">
                          {imageUrl ? (
                            <>
                              <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
                              <button 
                                type="button"
                                onClick={() => setImageUrl(null)}
                                className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white"
                              >
                                <X size={20} />
                              </button>
                            </>
                          ) : (
                            <ImageIcon size={24} className="text-[#ADB5BD]" />
                          )}
                        </div>
                        <div className="flex-1">
                          <input 
                            type="file" 
                            id="survey-image" 
                            accept="image/*" 
                            className="hidden" 
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onloadend = () => {
                                  setImageUrl(reader.result as string);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                          />
                          <label 
                            htmlFor="survey-image" 
                            className="minimal-button-outline !py-2 !px-4 !text-xs flex items-center gap-2 cursor-pointer w-fit"
                          >
                            <Upload size={14} />
                            {imageUrl ? (t.changeImage || "Rasmni o'zgartirish") : (t.uploadImage || "Rasm yuklash")}
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className={`flex items-center justify-between p-4 rounded-2xl bg-[#F1F3F5] dark:bg-[#2A2A2A] border border-[#E9ECEF] dark:border-[#3A3A3A] transition-opacity ${isGoogleLinked ? 'opacity-50 pointer-events-none' : ''}`}>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-[#212529] dark:text-white">{t.expiresAt}</p>
                        <p className="text-[10px] text-[#868E96] dark:text-[#B0B0B0]">{hasExpiration ? t.timeLeft : t.optional}</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => !isGoogleLinked && setHasExpiration(!hasExpiration)}
                        className={`w-12 h-6 rounded-full transition-all relative ${hasExpiration ? 'bg-[#2B4F6E]' : 'bg-gray-300 dark:bg-gray-600'}`}
                      >
                        <motion.div 
                          animate={{ x: hasExpiration ? 24 : 4 }}
                          className="absolute top-1 left-0 w-4 h-4 rounded-full bg-white shadow-sm"
                        />
                      </button>
                    </div>

                    {hasExpiration && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-2"
                      >
                        <label className="text-[10px] font-semibold uppercase tracking-widest text-[#868E96] dark:text-[#B0B0B0]">{t.expiresAt}</label>
                        <input 
                          type="datetime-local" 
                          value={expiresAt}
                          onChange={(e) => setExpiresAt(e.target.value)}
                          className="minimal-input w-full !py-2.5 !text-sm" 
                        />
                      </motion.div>
                    )}

                    {isGoogleLinked && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-4 p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 col-span-full"
                      >
                        <div className="grid gap-4 sm:grid-cols-3">
                          <div className="space-y-2">
                            <label className="text-[10px] font-semibold uppercase tracking-widest text-[#2B4F6E] dark:text-blue-400">{t.googleFormUrl}</label>
                            <input 
                              value={googleFormUrl}
                              onChange={(e) => setGoogleFormUrl(e.target.value)}
                              className="minimal-input w-full !py-2 !text-xs" 
                              placeholder="Action URL" 
                            />
                            <p className="text-[8px] text-[#868E96] dark:text-[#B0B0B0] mt-1">Action URL (formResponse)</p>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-semibold uppercase tracking-widest text-[#2B4F6E] dark:text-blue-400">{t.googleViewUrl}</label>
                            <input 
                              value={googleViewUrl}
                              onChange={(e) => setGoogleViewUrl(e.target.value)}
                              className="minimal-input w-full !py-2 !text-xs" 
                              placeholder="Public URL" 
                            />
                            <p className="text-[8px] text-[#868E96] dark:text-[#B0B0B0] mt-1">Public URL (viewform)</p>
                          </div>
                          <div className="space-y-2">
                            <label className="text-[10px] font-semibold uppercase tracking-widest text-[#2B4F6E] dark:text-blue-400">{t.googleEditUrl}</label>
                            <input 
                              value={googleEditUrl}
                              onChange={(e) => setGoogleEditUrl(e.target.value)}
                              className="minimal-input w-full !py-2 !text-xs" 
                              placeholder="Edit URL" 
                            />
                            <p className="text-[8px] text-[#868E96] dark:text-[#B0B0B0] mt-1">Edit URL</p>
                          </div>
                        </div>
                        
                        <button 
                          type="button"
                          onClick={generateGoogleScript}
                          className="w-full py-2.5 rounded-xl bg-[#2B4F6E] text-white text-[10px] font-bold uppercase tracking-widest hover:bg-[#1e3a52] transition-all flex items-center justify-center gap-2"
                        >
                          <Settings size={14} />
                          {t.pushToGoogleForm}
                        </button>
                      </motion.div>
                    )}

                    <div className={`flex items-center justify-between p-4 rounded-2xl bg-[#F1F3F5] dark:bg-[#2A2A2A] border border-[#E9ECEF] dark:border-[#3A3A3A] transition-opacity ${isGoogleLinked ? 'opacity-50 pointer-events-none' : ''}`}>
                      <div className="space-y-1">
                        <p className="text-sm font-semibold text-[#212529] dark:text-white">{t.isPrivate}</p>
                        <p className="text-[10px] text-[#868E96] dark:text-[#B0B0B0]">{isPrivate ? t.private : t.public}</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => !isGoogleLinked && setIsPrivate(!isPrivate)}
                        className={`w-12 h-6 rounded-full transition-all relative ${isPrivate ? 'bg-[#2B4F6E]' : 'bg-gray-300 dark:bg-gray-600'}`}
                      >
                        <motion.div 
                          animate={{ x: isPrivate ? 24 : 4 }}
                          className="absolute top-1 left-0 w-4 h-4 rounded-full bg-white shadow-sm"
                        />
                      </button>
                    </div>

                    {isPrivate && (
                      <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="space-y-2 col-span-full"
                      >
                        <label className="text-[10px] font-semibold uppercase tracking-widest text-[#868E96] dark:text-[#B0B0B0]">{t.accessCode} ({t.fiveDigitCode})</label>
                        <input 
                          value={accessCode}
                          onChange={(e) => {
                            const val = e.target.value.replace(/\D/g, '').slice(0, 5);
                            setAccessCode(val);
                          }}
                          required={isPrivate}
                          className="minimal-input w-full !py-2.5 !text-sm tracking-[0.5em] font-mono text-center" 
                          placeholder="00000" 
                        />
                      </motion.div>
                    )}
                  </div>

                  <div className="pt-6">
                    <button type="submit" disabled={isSubmitting} className="minimal-button w-full flex items-center justify-center gap-2">
                      {isSubmitting ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          {editingSurvey ? t.editing : t.creating}
                        </>
                      ) : (
                        editingSurvey ? t.save : t.createSurvey
                      )}
                    </button>
                    {editingSurvey && (
                      <button 
                        type="button" 
                        onClick={() => { setEditingSurvey(null); setView('surveys'); }}
                        className="minimal-button-outline w-full mt-3"
                      >
                        {t.cancel}
                      </button>
                    )}
                  </div>
                </form>
              </div>
            </motion.div>
          )}

          {view === 'profile' && (
            <motion.div 
              key="profile"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-xl mx-auto"
            >
              <div className="flex flex-col items-center mb-8">
                <div className="w-20 h-20 rounded-full bg-[#2B4F6E] flex items-center justify-center text-2xl text-white font-semibold mb-3 overflow-hidden border-4 border-white dark:border-[#2A2A2A] shadow-xl">
                  {user.full_name[0]}
                </div>
                <h2 className="text-xl font-semibold mb-1 text-[#212529] dark:text-white">{user.full_name}</h2>
                <div className="px-4 py-1 rounded-full bg-[#F1F3F5] dark:bg-[#2A2A2A] text-[#868E96] dark:text-[#B0B0B0] text-sm font-medium">
                  @{user.username}
                </div>
              </div>

              <div className="minimal-card p-6 space-y-3">
                <ProfileItem label={t.fullName} value={user.full_name} />
                <ProfileItem label={t.phone} value={user.phone} />
                <ProfileItem label={t.email} value={user.email} />
                <ProfileItem label={t.username} value={user.username} />
                
                <div className="pt-4 space-y-3">
                  <button 
                    onClick={() => setView('support')}
                    className="minimal-button w-full !h-[48px] text-sm"
                  >
                    <MessageCircle size={16} className="mr-2" />
                    {t.support}
                  </button>
                  <button 
                    onClick={() => {
                      localStorage.removeItem('user');
                      setUser(null);
                    }}
                    className="minimal-button-danger w-full !h-[48px] text-sm"
                  >
                    <LogOut size={16} className="mr-2" />
                    {t.logout}
                  </button>
                </div>
              </div>

              {user.is_admin === 1 && (
                <div className="mt-8 space-y-6">
                  <div className="flex flex-col">
                    <h3 className="text-lg font-semibold tracking-tight">{t.manageUsers}</h3>
                    <div className="h-[2px] w-12 bg-[#2B4F6E] mt-2"></div>
                  </div>

                  <div className="space-y-4">
                    {users.filter(u => u.id !== user.id).map(u => (
                      <div key={u.id} className="minimal-card p-5 flex flex-wrap items-center justify-between gap-4 group">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-white font-bold ${u.is_blocked ? 'bg-gray-400' : 'bg-[#2B4F6E]'}`}>
                            {u.full_name[0]}
                          </div>
                          <div className="min-w-0">
                            <p className={`font-semibold text-sm truncate ${u.is_blocked ? 'text-gray-400 line-through' : 'text-[#212529] dark:text-white'}`}>
                              {u.full_name}
                            </p>
                            <p className="text-xs text-[#868E96] dark:text-[#B0B0B0] truncate">@{u.username}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-auto">
                          <button 
                            onClick={() => handleBlockUser(u.id, !u.is_blocked)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${u.is_blocked ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100' : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 hover:bg-orange-100'}`}
                          >
                            {u.is_blocked ? t.unblock : t.block}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {user.is_admin === 1 && (
                <div className="mt-12 space-y-6">
                  <div className="flex flex-col">
                    <h3 className="text-lg font-semibold tracking-tight">{t.manageSurveys}</h3>
                    <div className="h-[2px] w-12 bg-[#2B4F6E] mt-2"></div>
                  </div>

                  <div className="space-y-4">
                    {surveys.map(s => (
                      <div key={s.id} className="minimal-card p-5 flex flex-wrap items-center justify-between gap-4 group">
                        <div className="flex items-center gap-4 min-w-0">
                          <div className="w-12 h-12 rounded-xl bg-[#F1F3F5] dark:bg-[#2A2A2A] flex-shrink-0 flex items-center justify-center overflow-hidden border border-[#E9ECEF] dark:border-[#3A3A3A]">
                            {s.image_url ? (
                              <img src={s.image_url} alt={s.title} className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon size={20} className="text-[#ADB5BD]" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className={`font-semibold text-sm truncate ${s.is_active === 0 ? 'text-gray-400 line-through' : 'text-[#212529] dark:text-white'}`}>
                              {s.title}
                            </p>
                            <p className="text-[10px] text-[#868E96] dark:text-[#B0B0B0] truncate">{s.creator_name} • {s.total_participants} {t.votes}</p>
                          </div>
                        </div>
                        <div className="flex gap-2 ml-auto">
                          <button 
                            onClick={() => handleToggleSurvey(s.id)}
                            className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-colors whitespace-nowrap ${s.is_active === 0 ? 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 hover:bg-green-100' : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 hover:bg-orange-100'}`}
                          >
                            {s.is_active === 0 ? t.activate : t.stop}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {view === 'stats' && (
            <motion.div 
              key="stats"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="max-w-4xl mx-auto"
            >
              <div className="grid gap-8">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <StatCard label={t.totalVotes} value={surveys.reduce((acc, s) => acc + s.total_participants, 0)} icon={<TrendingUp size={16} />} />
                  <StatCard label={t.totalSurveys} value={surveys.length} icon={<Vote size={16} />} />
                  <StatCard label={t.activity} value={85} suffix="%" icon={<Clock size={16} />} />
                </div>

                <div className="minimal-card p-6">
                  <h3 className="text-[10px] font-bold tracking-widest text-[#868E96] dark:text-[#B0B0B0] uppercase mb-5">{t.popularSurveys}</h3>
                  
                  <div className="space-y-6">
                    {surveys.slice(0, 5).map(s => (
                      <div key={s.id} className="space-y-3">
                        <div className="flex justify-between items-center">
                          <span className="text-base font-medium text-[#212529] dark:text-white">{s.title}</span>
                          <span className="text-sm text-[#868E96] dark:text-[#B0B0B0]">{s.total_participants} {t.votes}</span>
                        </div>
                        <div className="minimal-progress-bg h-2 w-full">
                          <motion.div 
                            initial={{ width: 0 }}
                            animate={{ width: `${Math.min(100, (s.total_participants / 100) * 100)}%` }}
                            className="minimal-progress-fill"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
          {view === 'support' && (
            <motion.div 
              key="support"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -20 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="max-w-md mx-auto"
            >
              <button 
                onClick={() => setView('profile')}
                className="flex items-center gap-2 text-[#868E96] dark:text-[#B0B0B0] hover:text-[#2B4F6E] transition-colors mb-6 group"
              >
                <ArrowLeft size={18} className="group-hover:-translate-x-1 transition-transform" />
                <span className="text-sm font-medium">{t.back}</span>
              </button>

              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="minimal-card p-8 space-y-8"
              >
                <div className="text-center space-y-2">
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", delay: 0.2 }}
                    className="w-16 h-16 rounded-3xl bg-[#2B4F6E]/10 flex items-center justify-center mx-auto mb-4"
                  >
                    <MessageCircle className="text-[#2B4F6E]" size={32} />
                  </motion.div>
                  <h2 className="text-2xl font-bold text-[#212529] dark:text-white">{t.support}</h2>
                  <p className="text-[#868E96] dark:text-[#B0B0B0] text-sm">{t.supportDescription}</p>
                </div>

                <form 
                  onSubmit={async (e) => {
                    e.preventDefault();
                    const formData = new FormData(e.currentTarget);
                    const message = formData.get('message') as string;
                    if (!message.trim()) return;

                    try {
                      const res = await fetch('/api/support', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ user_id: user.id, message })
                      });
                      const data = await res.json();
                      if (data.success) {
                        alert(t.messageSent);
                        (e.target as HTMLFormElement).reset();
                      } else {
                        alert(data.error || t.error);
                      }
                    } catch (err) {
                      alert(t.error);
                    }
                  }}
                  className="space-y-6"
                >
                  <motion.div 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="space-y-2"
                  >
                    <label className="text-[10px] font-semibold uppercase tracking-widest text-[#868E96] dark:text-[#B0B0B0]">{t.message}</label>
                    <textarea 
                      name="message" 
                      required 
                      rows={4}
                      className="minimal-input w-full !py-3 !text-sm resize-none" 
                      placeholder={t.message + "..."}
                    />
                  </motion.div>
                  <motion.button 
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    type="submit"
                    className="w-full py-4 bg-[#2B4F6E] text-white rounded-2xl text-xs font-bold uppercase tracking-widest shadow-lg shadow-[#2B4F6E]/20 hover:bg-[#1e3a52] transition-all"
                  >
                    {t.send}
                  </motion.button>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Voting Modal */}
      <AnimatePresence>
        {selectedSurvey && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setSelectedSurvey(null);
                setCurrentVotes([]);
                setTestResult(null);
              }}
              className="absolute inset-0 bg-[#212529]/60 dark:bg-black/80 backdrop-blur-[2px]"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.98, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.98, y: 20 }}
              className="minimal-card w-full max-w-xl relative z-10 max-h-[90vh] sm:max-h-[85vh] overflow-y-auto p-5 sm:p-8"
            >
              <button 
                onClick={() => {
                  setSelectedSurvey(null);
                  setCurrentVotes([]);
                  setTestResult(null);
                }} 
                className="absolute top-4 right-4 sm:top-5 sm:right-5 p-2 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl transition-colors"
              >
                <X size={20} sm:size={24} className="text-[#868E96] dark:text-[#B0B0B0]" />
              </button>
              
              <div className="mb-6 sm:mb-10 pr-8 sm:pr-10">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#2B4F6E]">{selectedSurvey.creator_name}</span>
                  {selectedSurvey.is_private === 1 && <span className="text-[10px] font-bold uppercase tracking-widest text-orange-500">{t.private}</span>}
                </div>
                <h2 className="text-xl sm:text-2xl font-semibold mb-2 tracking-tight leading-tight text-[#212529] dark:text-white flex items-center gap-3">
                  {selectedSurvey.title}
                  {selectedSurvey.google_form_url && (
                    <a 
                      href={selectedSurvey.google_form_url} 
                      target="_blank" 
                      className="p-1 sm:p-1.5 rounded-lg bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-100 dark:border-green-900/30 hover:bg-green-100 transition-all"
                      title="Google Form Action URL"
                    >
                      <Settings size={12} sm:size={14} />
                    </a>
                  )}
                  {selectedSurvey.google_view_url && (
                    <a 
                      href={selectedSurvey.google_view_url} 
                      target="_blank" 
                      className="p-1 sm:p-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/30 hover:bg-blue-100 transition-all"
                      title={t.googleViewUrl}
                    >
                      <Eye size={12} sm:size={14} />
                    </a>
                  )}
                </h2>
                {selectedSurvey.image_url && (
                  <div className="w-full h-40 sm:h-64 rounded-2xl overflow-hidden my-4 sm:my-6 border border-[#F1F3F5] dark:border-[#3A3A3A]">
                    <img src={selectedSurvey.image_url} alt={selectedSurvey.title} className="w-full h-full object-cover" />
                  </div>
                )}
                <p className="text-[#868E96] dark:text-[#B0B0B0] text-xs sm:text-sm font-light leading-relaxed">{selectedSurvey.description}</p>

                {/* Rating Section */}
                <div className="mt-6 p-4 rounded-2xl bg-[#F8F9FA] dark:bg-[#2A2A2A] border border-[#F1F3F5] dark:border-[#3A3A3A] flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#868E96]">{t.rating}</span>
                  <div className="flex gap-1 relative">
                    <AnimatePresence>
                      {ratedSurveyId === selectedSurvey.id && (
                        <motion.div 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-bold text-[#2B4F6E] bg-white dark:bg-[#1E1E1E] px-2 py-1 rounded-lg border border-[#F1F3F5] dark:border-[#3A3A3A] shadow-sm"
                        >
                          {t.messageSent}
                        </motion.div>
                      )}
                    </AnimatePresence>
                    {[1, 2, 3, 4, 5].map(star => (
                      <motion.button 
                        key={star}
                        whileHover={{ scale: 1.2 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={async () => {
                          try {
                            const res = await fetch(`/api/surveys/${selectedSurvey.id}/rate`, {
                              method: 'POST',
                              headers: { 'Content-Type': 'application/json' },
                              body: JSON.stringify({ rating: star })
                            });
                            if (res.ok) {
                              fetchSurveys();
                              setRatedSurveyId(selectedSurvey.id);
                              setTimeout(() => setRatedSurveyId(null), 2000);
                            }
                          } catch (e) {
                            console.error(e);
                          }
                        }}
                        className="p-1 transition-transform"
                      >
                        <Star 
                          size={20} 
                          className={star <= Math.round(selectedSurvey.rating || 0) ? "text-yellow-400 fill-yellow-400" : "text-gray-300 dark:text-gray-600"} 
                        />
                      </motion.button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="space-y-10">
                {testResult && (
                  <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-8 rounded-[32px] bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/20 text-center space-y-4"
                  >
                    <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto">
                      <CheckCircle2 size={32} className="text-green-600 dark:text-green-400" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-[#212529] dark:text-white">{t.testCompleted}</h3>
                      <p className="text-sm text-[#868E96] dark:text-[#B0B0B0]">
                        {t.yourScore}: <span className="text-green-600 font-bold text-lg">{testResult.score}</span> {t.outOf} {testResult.total}
                      </p>
                    </div>
                    <button 
                      onClick={() => {
                        setTestResult(null);
                        setSelectedSurvey(null);
                      }}
                      className="text-xs font-bold uppercase tracking-widest text-[#2B4F6E] hover:underline"
                    >
                      {t.back}
                    </button>
                  </motion.div>
                )}

                {(selectedSurvey.survey_type === 'google' || selectedSurvey.is_google_linked === 1) ? (
                  <div className="space-y-6 py-10">
                    <div className="p-8 rounded-[32px] bg-blue-50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20 text-center space-y-6">
                      <div className="w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mx-auto">
                        <Globe size={32} className="text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold text-[#212529] dark:text-white">{t.googleSurveys}</h3>
                        <p className="text-sm text-[#868E96] dark:text-[#B0B0B0]">{t.googleFormLinked}</p>
                      </div>
                      {selectedSurvey.google_view_url && (
                        <a 
                          href={selectedSurvey.google_view_url} 
                          target="_blank"
                          className="w-full py-4 rounded-2xl bg-[#2B4F6E] text-white text-xs font-bold uppercase tracking-widest shadow-lg shadow-[#2B4F6E]/20 hover:bg-[#1e3a52] transition-all flex items-center justify-center gap-2"
                        >
                          <ExternalLink size={16} />
                          {t.viewGoogleForm}
                        </a>
                      )}
                    </div>
                  </div>
                ) : (
                  selectedSurvey.questions.map((q, qIndex) => {
                    const result = results.find(r => r.question_id === q.id);
                    const currentVote = currentVotes.find(v => v.question_id === q.id);
                    
                    return (
                      <div key={q.id} className="space-y-5">
                        <div className="space-y-4">
                          <h4 className="text-base font-semibold tracking-tight flex items-center gap-3 text-[#212529] dark:text-white">
                            <span className="w-6 h-6 rounded-lg bg-[#2B4F6E]/20 text-[#2B4F6E] flex items-center justify-center text-xs font-bold">{qIndex + 1}</span>
                            {q.text}
                          </h4>
                          {q.image_url && (
                            <div className="w-full h-48 rounded-2xl overflow-hidden border border-[#F1F3F5] dark:border-[#3A3A3A]">
                              <img src={q.image_url} alt={q.text} className="w-full h-full object-cover" />
                            </div>
                          )}
                        </div>
                        <div className="grid gap-3 sm:grid-cols-2">
                          {q.options.map((opt) => {
                            const optResult = result?.options.find(o => o.id === opt.id);
                            const totalQVotes = result?.options.reduce((acc, o) => acc + o.count, 0) || 0;
                            const percentage = totalQVotes > 0 ? Math.round((optResult?.count || 0) / totalQVotes * 100) : 0;
                            const isSelected = currentVote?.option_id === opt.id;
                            const testDetail = testResult?.details.find(d => d.question_id === q.id);
                            const isCorrect = opt.id === q.correct_option_id;
                            
                            let bgColor = 'bg-[#F1F3F5] dark:bg-[#2A2A2A]';
                            let borderColor = 'border-transparent';
                            let textColor = 'text-[#212529] dark:text-white';

                            if (testResult) {
                              if (isCorrect) {
                                bgColor = 'bg-green-50 dark:bg-green-900/20';
                                borderColor = 'border-green-500';
                                textColor = 'text-green-600 dark:text-green-400';
                              } else if (isSelected && !isCorrect) {
                                bgColor = 'bg-red-50 dark:bg-red-900/20';
                                borderColor = 'border-red-500';
                                textColor = 'text-red-600 dark:text-red-400';
                              }
                            } else if (isSelected) {
                              borderColor = 'border-[#2B4F6E]';
                              textColor = 'text-[#2B4F6E]';
                            } else {
                              borderColor = 'border-transparent hover:border-[#E9ECEF] dark:hover:border-[#3A3A3A]';
                            }

                            return (
                              <button 
                                key={opt.id}
                                disabled={!!testResult}
                                onClick={() => {
                                  const filtered = currentVotes.filter(v => v.question_id !== q.id);
                                  setCurrentVotes([...filtered, { question_id: q.id, option_id: opt.id }]);
                                }}
                                className={`w-full text-left p-4 rounded-2xl ${bgColor} transition-all relative overflow-hidden border ${borderColor}`}
                              >
                                <div className="minimal-progress-bg absolute inset-0 opacity-10 w-0 transition-all duration-500" style={{ width: `${percentage}%` }} />
                                <div className="relative flex justify-between items-center">
                                  <span className={`text-sm font-medium transition-colors ${textColor}`}>
                                    {opt.text}
                                  </span>
                                  {testResult ? (
                                    isCorrect ? (
                                      <CheckCircle2 size={18} className="text-green-500" />
                                    ) : isSelected ? (
                                      <X size={18} className="text-red-500" />
                                    ) : null
                                  ) : isSelected ? (
                                    <CheckCircle2 size={18} className="text-[#2B4F6E]" />
                                  ) : (
                                    totalQVotes > 0 && <span className="text-xs font-bold text-[#868E96] dark:text-[#B0B0B0]">{percentage}%</span>
                                  )}
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {selectedSurvey.survey_type !== 'google' && selectedSurvey.is_google_linked !== 1 && (
                <div className="mt-12 pt-6 border-t border-[#E9ECEF] dark:border-[#2A2A2A] flex items-center justify-between">
                  <div className="text-[10px] font-semibold uppercase tracking-widest text-[#868E96] dark:text-[#B0B0B0]">
                    {currentVotes.length} / {selectedSurvey.questions.length} {t.question}
                  </div>
                  <button 
                    onClick={() => handleVote(selectedSurvey.id)}
                    disabled={currentVotes.length < selectedSurvey.questions.length}
                    className="minimal-button !w-auto px-10"
                  >
                    {t.vote.toUpperCase()}
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
        {showGoogleScript && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="minimal-card w-full max-w-2xl p-8 max-h-[80vh] overflow-hidden flex flex-col"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold">{t.googleFormIntegration}</h3>
                <button onClick={() => setShowGoogleScript(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="space-y-4 overflow-y-auto pr-2">
                <p className="text-sm text-[#868E96] dark:text-[#B0B0B0]">
                  {t.scriptInstructions}
                </p>
                
                <pre className="p-4 rounded-xl bg-gray-900 text-green-400 text-xs font-mono overflow-x-auto whitespace-pre-wrap">
                  {googleScript}
                </pre>
                
                <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-xs">
                  <strong>Qo'llanma:</strong><br/>
                  1. script.google.com saytiga kiring.<br/>
                  2. Yangi loyiha yarating.<br/>
                  3. Yuqoridagi kodni joylang.<br/>
                  4. 'Run' tugmasini bosing.<br/>
                  5. Loglarda chiqqan linklarni nusxalab, yuqoridagi maydonlarga joylang.
                </div>
              </div>
              
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(googleScript);
                  alert("Skript nusxalandi!");
                }}
                className="minimal-button w-full mt-6"
              >
                {t.save}
              </button>
            </motion.div>
          </div>
        )}

        {isAccessCodeModalOpen && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAccessCodeModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="minimal-card w-full max-w-sm relative z-10 p-8 text-center"
            >
              <div className="w-16 h-16 rounded-3xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center mx-auto mb-6">
                <Lock className="text-orange-500" size={32} />
              </div>
              <h2 className="text-xl font-bold text-[#212529] dark:text-white mb-2">{t.enterCode}</h2>
              <p className="text-[#868E96] dark:text-[#B0B0B0] text-sm mb-8">{t.fiveDigitCode}</p>
              
              <div className="space-y-6">
                <input 
                  type="text"
                  value={accessCodeInput}
                  onChange={(e) => {
                    const val = e.target.value.replace(/\D/g, '').slice(0, 5);
                    setAccessCodeInput(val);
                  }}
                  className="minimal-input w-full !py-4 !text-2xl tracking-[0.5em] font-mono text-center" 
                  placeholder="00000"
                  autoFocus
                />
                <button 
                  onClick={() => {
                    if (accessCodeInput === pendingSurvey?.access_code) {
                      showResults(pendingSurvey.id);
                      setIsAccessCodeModalOpen(false);
                      setAccessCodeInput('');
                    } else {
                      alert(t.invalidCode);
                    }
                  }}
                  className="minimal-button w-full py-4"
                >
                  {t.login}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function NavButton({ active, icon, onClick }: { active: boolean, icon: React.ReactNode, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className="relative p-2 sm:p-3.5 outline-none group"
    >
      <motion.div
        animate={active ? { 
          y: -4, 
          scale: 1.15,
          color: '#2B4F6E'
        } : { 
          y: 0, 
          scale: 1,
          color: '#868E96'
        }}
        whileTap={{ y: -8, scale: 1.25 }}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        className="relative z-10"
      >
        {React.cloneElement(icon as React.ReactElement, { 
          size: 24,
          strokeWidth: active ? 2.5 : 2,
          fill: active ? 'rgba(43, 79, 110, 0.15)' : 'transparent'
        })}
      </motion.div>

      {active && (
        <motion.div
          layoutId="nav-pulse"
          initial={{ scale: 0, opacity: 0.5 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 bg-[#2B4F6E]/20 rounded-full pointer-events-none"
        />
      )}

      {active && (
        <motion.div 
          layoutId="nav-active"
          transition={{ 
            type: "spring", 
            stiffness: 300, 
            damping: 30,
            mass: 1.2
          }}
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 rounded-full bg-[#2B4F6E] neon-glow z-20"
        />
      )}
    </button>
  );
}

function ProfileItem({ label, value }: { label: string, value: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[9px] font-bold uppercase tracking-widest text-[#ADB5BD] dark:text-[#B0B0B0]/40 ml-1">{label}</p>
      <div className="px-4 py-3 rounded-[16px] bg-[#F8F9FA] dark:bg-[#2A2A2A] border border-[#F1F3F5] dark:border-[#3A3A3A] text-[#212529] dark:text-white font-semibold text-sm">
        {value}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon, suffix = "" }: { label: string, value: number, icon?: React.ReactNode, suffix?: string }) {
  return (
    <motion.div 
      whileHover={{ y: -2 }}
      className="bg-white dark:bg-[#1E1E1E] rounded-[24px] p-5 flex flex-col items-center text-center shadow-[0_4px_20px_rgba(0,0,0,0.03)] dark:shadow-[0_15px_40px_rgba(0,0,0,0.25)] border border-[#F1F3F5] dark:border-white/5"
    >
      {icon && <div className="mb-3 text-[#ADB5BD] dark:text-[#B0B0B0]/60">{icon}</div>}
      <p className="text-2xl font-bold text-[#212529] dark:text-white mb-0.5 tracking-tight">{value}{suffix}</p>
      <p className="text-[10px] font-bold text-[#868E96] dark:text-[#B0B0B0] uppercase tracking-widest">{label}</p>
    </motion.div>
  );
}
