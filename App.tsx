
import React, { useState, useEffect } from 'react';
import Layout from './components/Layout';
import GradeInput from './components/GradeInput';
import StudyDashboard from './components/StudyDashboard';
import LearningSpace from './components/LearningSpace';
import WrongAnswerManager from './components/WrongAnswerManager';
import Auth from './components/Auth';
import { AppSection, TextbookInfo, Unit, Language, User } from './types';
import { generateUnits } from './services/geminiService';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [lang, setLang] = useState<Language>('ko');
  const [section, setSection] = useState<AppSection>(AppSection.SETUP);
  const [textbook, setTextbook] = useState<TextbookInfo | null>(null);
  const [units, setUnits] = useState<Unit[]>([]);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('ai_study_user');
    const savedTextbook = localStorage.getItem('ai_study_textbook');
    const savedLang = localStorage.getItem('ai_study_lang');
    
    if (savedUser) setUser(JSON.parse(savedUser));
    if (savedTextbook) {
      const tb = JSON.parse(savedTextbook);
      setTextbook(tb);
      setSection(AppSection.DASHBOARD);
      fetchUnits(tb, (savedLang as Language) || 'ko');
    }
    if (savedLang) setLang(savedLang as Language);
  }, []);

  const fetchUnits = async (info: TextbookInfo, currentLang: Language) => {
    setLoading(true);
    setError(null);
    try {
      const unitList = await generateUnits(info.grade, info.publisher, info.subject, currentLang);
      setUnits(unitList);
    } catch (err: any) {
      console.error(err);
      if (err.message === "API_KEY_MISSING") {
        setError("API Key is missing. Please check your deployment settings (GitHub Secrets).");
      } else {
        setError("Something went wrong while generating content. Please check your API key or try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (newUser: User) => {
    setUser(newUser);
    localStorage.setItem('ai_study_user', JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('ai_study_user');
    localStorage.removeItem('ai_study_textbook');
    setSection(AppSection.SETUP);
    setTextbook(null);
    setUnits([]);
  };

  const handleSetup = async (info: TextbookInfo) => {
    setTextbook(info);
    localStorage.setItem('ai_study_textbook', JSON.stringify(info));
    setSection(AppSection.DASHBOARD);
    await fetchUnits(info, lang);
  };

  const handleLangChange = (newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('ai_study_lang', newLang);
    if (textbook) fetchUnits(textbook, newLang);
  };

  const renderContent = () => {
    if (!user) return <Auth onLogin={handleLogin} lang={lang} />;
    
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
          <div className="text-6xl mb-6">⚠️</div>
          <h2 className="text-2xl font-black text-slate-800 mb-4">Error Detected</h2>
          <p className="text-slate-500 max-w-md mb-8">{error}</p>
          <button 
            onClick={() => textbook && fetchUnits(textbook, lang)}
            className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-xl shadow-lg hover:bg-indigo-700 transition-all"
          >
            Retry
          </button>
        </div>
      );
    }

    if (!textbook || section === AppSection.SETUP) return <GradeInput onSubmit={handleSetup} lang={lang} />;

    switch (section) {
      case AppSection.DASHBOARD:
        return <StudyDashboard units={units} onSelectUnit={(u) => { setSelectedUnit(u); setSection(AppSection.LEARNING); }} loading={loading} />;
      case AppSection.LEARNING:
        return selectedUnit ? <LearningSpace unit={selectedUnit} textbook={textbook} lang={lang} /> : null;
      case AppSection.WRONG_ANSWERS:
        return <WrongAnswerManager lang={lang} />;
      default:
        return <div className="text-center py-20 font-bold text-slate-400">Preparing Learning Data...</div>;
    }
  };

  return (
    <Layout 
      activeSection={section} 
      onNavigate={setSection}
      hasTextbook={!!textbook && !!user && section !== AppSection.SETUP}
      lang={lang}
      onLangChange={handleLangChange}
      user={user}
      onLogout={handleLogout}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
