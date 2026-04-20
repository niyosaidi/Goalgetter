import React from 'react';
import { useFirebase } from './FirebaseProvider';
import { useTranslation } from './LanguageProvider';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Target, PiggyBank, TrendingUp, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard = () => {
  const { profile, goals, savings, spending } = useFirebase();
  const { t } = useTranslation();

  const totalSavings = savings.reduce((acc, s) => acc + s.amount, 0);
  const totalSpending = spending.reduce((acc, s) => acc + s.amount, 0);
  
  const activeGoals = goals.filter(g => {
    const goalSavings = savings.filter(s => s.goalId === g.id).reduce((acc, s) => acc + s.amount, 0);
    return goalSavings < g.cost;
  });

  const nextGoal = activeGoals[0];
  const nextGoalSavings = nextGoal ? savings.filter(s => s.goalId === nextGoal.id).reduce((acc, s) => acc + s.amount, 0) : 0;
  const nextGoalProgress = nextGoal ? (nextGoalSavings / nextGoal.cost) * 100 : 0;

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
        <h2 className="text-lg font-bold text-stone-900">{t('insights')}</h2>
        <div className="space-y-3">
          {totalSpending > (profile?.monthlyBudget || 0) && profile?.monthlyBudget !== 0 && (
            <div className="flex items-start gap-3 rounded-xl bg-red-50 p-4 text-red-700">
              <AlertCircle size={20} className="shrink-0" />
              <p className="text-sm">{t('budgetExceeded')}</p>
            </div>
          )}
          <div className="flex items-start gap-3 rounded-xl bg-stone-100 p-4 text-stone-700">
            <TrendingUp size={20} className="shrink-0" />
            <p className="text-sm">{t('savingTip')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
