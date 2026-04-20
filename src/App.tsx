import React, { useState } from 'react';
import { FirebaseProvider, useFirebase } from './components/FirebaseProvider';
import { LanguageProvider, useTranslation } from './components/LanguageProvider';
import { Button } from './components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Target, PiggyBank, ShoppingCart, BookOpen, LayoutDashboard, LogOut, LogIn, Languages } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Dashboard from './components/Dashboard';
import DreamToGoal from './components/DreamToGoal';
import SavingsPlan from './components/SavingsPlan';
import SpendingTracker from './components/SpendingTracker';
import Quiz from './components/Quiz';
import ErrorBoundary from './components/ErrorBoundary';

const AppContent = () => {
  const { user, loading, login, logout, profile, authLoading } = useFirebase();
  const { language, setLanguage, t } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard');

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-stone-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-8 w-8 border-4 border-stone-900 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-stone-50 p-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md space-y-6"
        >
          <div className="flex justify-center">
            <div className="rounded-2xl bg-stone-900 p-4 text-white">
              <Target size={48} />
            </div>
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-stone-900">{t('appName')}</h1>
          <p className="text-lg text-stone-600">
            {t('tagline')}
          </p>
          <Button 
            onClick={login} 
            disabled={authLoading}
            className="w-full bg-stone-900 py-6 text-lg hover:bg-stone-800 disabled:opacity-70"
          >
            {authLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="h-5 w-5 border-2 border-white border-t-transparent rounded-full"
              />
            ) : (
              <><LogIn className="mr-2" /> {t('startJourney')}</>
            )}
          </Button>
          <div className="flex justify-center gap-2">
            <Button variant="outline" size="sm" onClick={() => setLanguage('en')} className={language === 'en' ? 'bg-stone-100' : ''}>EN</Button>
            <Button variant="outline" size="sm" onClick={() => setLanguage('rw')} className={language === 'rw' ? 'bg-stone-100' : ''}>RW</Button>
          </div>
          <p className="text-sm text-stone-400">
            {t('participatory')}
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-stone-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-white/80 px-6 py-4 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Target className="text-stone-900" size={24} />
          <span className="text-xl font-bold tracking-tight">{t('appName')}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => setLanguage(language === 'en' ? 'rw' : 'en')}
            className="text-stone-500 font-bold"
          >
            <Languages size={20} className="mr-1" />
            {language === 'en' ? 'RW' : 'EN'}
          </Button>
          <Button variant="ghost" size="icon" onClick={logout} className="text-stone-500">
            <LogOut size={20} />
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === 'dashboard' && <Dashboard />}
            {activeTab === 'goals' && <DreamToGoal />}
            {activeTab === 'savings' && <SavingsPlan />}
            {activeTab === 'spending' && <SpendingTracker />}
            {activeTab === 'quiz' && <Quiz />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-20 border-t bg-white px-2 py-2">
        <div className="mx-auto flex max-w-md justify-around">
          <NavButton 
            active={activeTab === 'dashboard'} 
            onClick={() => setActiveTab('dashboard')} 
            icon={<LayoutDashboard size={20} />} 
            label={t('dashboard')} 
          />
          <NavButton 
            active={activeTab === 'goals'} 
            onClick={() => setActiveTab('goals')} 
            icon={<Target size={20} />} 
            label={t('goals')} 
          />
          <NavButton 
            active={activeTab === 'savings'} 
            onClick={() => setActiveTab('savings')} 
            icon={<PiggyBank size={20} />} 
            label={t('savings')} 
          />
          <NavButton 
            active={activeTab === 'spending'} 
            onClick={() => setActiveTab('spending')} 
            icon={<ShoppingCart size={20} />} 
            label={t('spend')} 
          />
          <NavButton 
            active={activeTab === 'quiz'} 
            onClick={() => setActiveTab('quiz')} 
            icon={<BookOpen size={20} />} 
            label={t('learn')} 
          />
        </div>
      </nav>
    </div>
  );
};

const NavButton = ({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center gap-1 px-3 py-1 transition-colors ${
      active ? 'text-stone-900' : 'text-stone-400 hover:text-stone-600'
    }`}
  >
    <div className={`rounded-full p-1 ${active ? 'bg-stone-100' : ''}`}>
      {icon}
    </div>
    <span className="text-[10px] font-medium uppercase tracking-wider">{label}</span>
  </button>
);

export default function App() {
  return (
    <ErrorBoundary>
      <LanguageProvider>
        <FirebaseProvider>
          <AppContent />
        </FirebaseProvider>
      </LanguageProvider>
    </ErrorBoundary>
  );
}
