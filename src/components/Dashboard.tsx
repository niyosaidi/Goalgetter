import React, { useEffect, useState } from 'react';
import { useFirebase } from './FirebaseProvider';
import { useTranslation } from './LanguageProvider';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Target, PiggyBank, TrendingUp, AlertCircle, Sparkles, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getFinancialAdvice } from '../services/geminiService';

const Dashboard = () => {
  const { profile, goals, savings, spending } = useFirebase();
  const { t, language } = useTranslation();
  const [advice, setAdvice] = useState<string | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);

  const totalSavings = savings.reduce((acc, s) => acc + s.amount, 0);
  const totalSpending = spending.reduce((acc, s) => acc + s.amount, 0);
  
  const activeGoals = goals.filter(g => {
    const goalSavings = savings.filter(s => s.goalId === g.id).reduce((acc, s) => acc + s.amount, 0);
    return goalSavings < g.cost;
  });

  const nextGoal = activeGoals[0];
  const nextGoalSavings = nextGoal ? savings.filter(s => s.goalId === nextGoal.id).reduce((acc, s) => acc + s.amount, 0) : 0;
  const nextGoalProgress = nextGoal ? (nextGoalSavings / nextGoal.cost) * 100 : 0;

  const fetchAdvice = async () => {
    setLoadingAdvice(true);
    try {
      const result = await getFinancialAdvice(profile, goals, savings, spending, language);
      setAdvice(result);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingAdvice(false);
    }
  };

  useEffect(() => {
    fetchAdvice();
  }, [profile, language]); // Fetch on mount or when language changes

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-stone-900">{t('hello')}, {profile?.displayName?.split(' ')[0] || 'GoalGetter'}!</h1>
        <p className="text-stone-500">{t('progressToday')}</p>
      </header>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-none bg-stone-900 text-white shadow-lg">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 opacity-70">
              <PiggyBank size={16} />
              <span className="text-xs font-medium uppercase tracking-wider">{t('totalSaved')}</span>
            </div>
            <div className="mt-2 text-2xl font-bold">${totalSavings.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="border-none bg-white shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-stone-400">
              <TrendingUp size={16} />
              <span className="text-xs font-medium uppercase tracking-wider">{t('spent')}</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-stone-900">${totalSpending.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      {/* Priority Goal */}
      {nextGoal ? (
        <Card className="overflow-hidden border-none shadow-sm">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium uppercase tracking-wider text-stone-500">{t('priorityGoal')}</CardTitle>
              <Badge variant="secondary" className="bg-stone-100 text-stone-600">
                {t(nextGoal.category as any)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h3 className="text-xl font-bold text-stone-900">{nextGoal.concreteGoal}</h3>
              <p className="text-sm text-stone-500">{t('whatIsDream')}: {nextGoal.dream}</p>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium">
                <span>{t('progress')}</span>
                <span>{Math.round(nextGoalProgress)}%</span>
              </div>
              <Progress value={nextGoalProgress} className="h-2 bg-stone-100" />
              <div className="flex justify-between text-xs text-stone-400">
                <span>${nextGoalSavings.toLocaleString()} {t('totalSaved').toLowerCase()}</span>
                <span>Target: ${nextGoal.cost.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="border-dashed border-stone-200 bg-transparent text-center">
          <CardContent className="py-10">
            <Target className="mx-auto mb-4 text-stone-300" size={48} />
            <h3 className="text-lg font-medium text-stone-900">{t('noActiveGoals')}</h3>
            <p className="mb-6 text-sm text-stone-500">{t('turnDreamsReality')}</p>
            <Button variant="outline" className="border-stone-900 text-stone-900">{t('createGoal')}</Button>
          </CardContent>
        </Card>
      )}

      {/* Insights */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-stone-900">{t('insights')}</h2>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={fetchAdvice} 
            disabled={loadingAdvice}
            className="text-stone-400 hover:text-stone-600"
          >
            <RefreshCw size={14} className={loadingAdvice ? "animate-spin" : ""} />
          </Button>
        </div>
        
        <div className="space-y-3">
          {/* AI Assistant Card */}
          <Card className="border-none bg-indigo-50 shadow-sm overflow-hidden relative">
            <div className="absolute top-0 right-0 p-1">
              <Sparkles className="text-indigo-200" size={40} />
            </div>
            <CardContent className="p-4 relative z-10">
              <div className="mb-2 flex items-center gap-2 text-indigo-700 font-bold text-xs uppercase tracking-wider">
                <Sparkles size={14} />
                <span>{t('smartAssistant')}</span>
              </div>
              <AnimatePresence mode="wait">
                {loadingAdvice ? (
                  <motion.div 
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="flex h-12 items-center gap-2"
                  >
                    <div className="flex gap-1">
                      {[0, 1, 2].map((i) => (
                        <motion.div
                          key={i}
                          animate={{ scale: [1, 1.5, 1] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.2 }}
                          className="h-1.5 w-1.5 rounded-full bg-indigo-300"
                        />
                      ))}
                    </div>
                    <span className="text-xs text-indigo-400 font-medium italic">{t('thinking')}</span>
                  </motion.div>
                ) : (
                  <motion.p 
                    key="advice"
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm leading-relaxed text-indigo-900 font-medium"
                  >
                    {advice}
                  </motion.p>
                )}
              </AnimatePresence>
            </CardContent>
          </Card>

          {totalSpending > (profile?.monthlyBudget || 0) && profile?.monthlyBudget !== 0 && (
            <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4 text-red-700 border border-red-100">
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-sm">{t('budgetExceeded')}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
