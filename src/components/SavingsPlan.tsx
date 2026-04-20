import React, { useState } from 'react';
import { useFirebase } from './FirebaseProvider';
import { useTranslation } from './LanguageProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { PiggyBank, Plus, Calculator, AlertTriangle, TrendingUp } from 'lucide-react';
import { Badge } from './ui/badge';

const SavingsPlan = () => {
  const { user, goals, savings, profile, updateProfile } = useFirebase();
  const { t } = useTranslation();
  const [isLogging, setIsLogging] = useState(false);
  const [logAmount, setLogAmount] = useState('');
  const [logGoalId, setLogGoalId] = useState('general');
  const [budgetInput, setBudgetInput] = useState(profile?.monthlyBudget?.toString() || '0');

  const calculateMonthlyRequired = (cost: number, deadline: Date) => {
    const now = new Date();
    const diffMonths = (deadline.getFullYear() - now.getFullYear()) * 12 + (deadline.getMonth() - now.getMonth());
    const months = Math.max(1, diffMonths);
    return cost / months;
  };

  const totalMonthlyRequired = goals.reduce((acc, g) => {
    return acc + calculateMonthlyRequired(g.cost, g.deadline.toDate());
  }, 0);

  const handleLogSaving = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !logAmount) return;

    try {
      await addDoc(collection(db, 'savings'), {
        userId: user.uid,
        goalId: logGoalId === 'general' ? null : logGoalId,
        amount: parseFloat(logAmount),
        date: Timestamp.now()
      });
      setIsLogging(false);
      setLogAmount('');
    } catch (error) {
      console.error("Error logging saving:", error);
    }
  };

  const handleUpdateBudget = async () => {
    await updateProfile({ monthlyBudget: parseFloat(budgetInput) });
  };

  const isOverBudget = totalMonthlyRequired > (profile?.monthlyBudget || 0);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">{t('savingsPlan')}</h1>
          <p className="text-stone-500">{t('howMuchNeedSave')}</p>
        </div>
        <Dialog open={isLogging} onOpenChange={setIsLogging}>
          <DialogTrigger render={<Button className="rounded-full bg-stone-900 px-4" />}>
            <Plus className="mr-2" size={18} /> {t('logSaving')}
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>{t('logYourSavings')}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleLogSaving} className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label htmlFor="amount">{t('amountSaved')}</Label>
                <Input 
                  id="amount" 
                  type="number" 
                  placeholder="0.00" 
                  value={logAmount}
                  onChange={(e) => setLogAmount(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="goal">{t('allocateToGoal')}</Label>
                <Select value={logGoalId} onValueChange={setLogGoalId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a goal" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">{t('generalSavings')}</SelectItem>
                    {goals.map(g => (
                      <SelectItem key={g.id} value={g.id}>{g.concreteGoal}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button type="submit" className="w-full bg-stone-900">{t('saveEntry')}</Button>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      {/* Budget Configuration */}
      <Card className="border-none bg-white shadow-sm">
        <CardContent className="p-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="budget">{t('monthlySavingsBudget')}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400">$</span>
                <Input 
                  id="budget" 
                  type="number" 
                  className="pl-7" 
                  value={budgetInput}
                  onChange={(e) => setBudgetInput(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={handleUpdateBudget} variant="outline" className="border-stone-200">{t('update')}</Button>
          </div>
        </CardContent>
      </Card>

      {/* Savings Summary */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Card className={`border-none shadow-sm ${isOverBudget ? 'bg-amber-50' : 'bg-stone-900 text-white'}`}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className={`text-xs font-medium uppercase tracking-wider ${isOverBudget ? 'text-amber-700' : 'text-stone-400'}`}>
                  {t('totalMonthlyRequired')}
                </p>
                <h2 className={`text-3xl font-bold ${isOverBudget ? 'text-amber-900' : 'text-white'}`}>
                  ${totalMonthlyRequired.toFixed(2)}
                </h2>
              </div>
              <Calculator size={32} className={isOverBudget ? 'text-amber-500' : 'text-stone-700'} />
            </div>
            {isOverBudget && (
              <div className="mt-4 flex items-start gap-2 text-xs text-amber-800">
                <AlertTriangle size={14} className="shrink-0" />
                <p>{t('overBudgetWarning')}</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-none bg-white shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-stone-400">{t('budgetGap')}</p>
                <h2 className={`text-3xl font-bold ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                  ${((profile?.monthlyBudget || 0) - totalMonthlyRequired).toFixed(2)}
                </h2>
              </div>
              <TrendingUp size={32} className="text-stone-100" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals Table */}
      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-white">
          <CardTitle className="text-lg">{t('goalBreakdown')}</CardTitle>
          <CardDescription>{t('monthlyTargets')}</CardDescription>
        </CardHeader>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-stone-50">
              <TableRow>
                <TableHead className="w-[200px]">{t('goals')}</TableHead>
                <TableHead>{t('cost').split('?')[0]}</TableHead>
                <TableHead>{t('monthsLeft')}</TableHead>
                <TableHead className="text-right">{t('monthlyTarget')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {goals.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="h-24 text-center text-stone-400">
                    {t('noGoalsYet')}
                  </TableCell>
                </TableRow>
              ) : (
                goals.map((goal) => {
                  const deadline = goal.deadline.toDate();
                  const now = new Date();
                  const months = Math.max(1, (deadline.getFullYear() - now.getFullYear()) * 12 + (deadline.getMonth() - now.getMonth()));
                  const monthly = goal.cost / months;
                  
                  return (
                    <TableRow key={goal.id}>
                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <span>{goal.concreteGoal}</span>
                          <Badge variant="outline" className="mt-1 w-fit text-[8px] uppercase tracking-tighter">
                            {t(goal.category as any)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>${goal.cost.toLocaleString()}</TableCell>
                      <TableCell>{months}</TableCell>
                      <TableCell className="text-right font-bold text-stone-900">
                        ${monthly.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Card>
    </div>
  );
};

export default SavingsPlan;
