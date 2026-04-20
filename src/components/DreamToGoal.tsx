import React, { useState } from 'react';
import { useFirebase } from './FirebaseProvider';
import { useTranslation } from './LanguageProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { collection, addDoc, Timestamp, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import { GoalCategory } from '../types';
import { Plus, Trash2, ArrowRight, Sparkles, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from './ui/badge';

const DreamToGoal = () => {
  const { user, goals } = useFirebase();
  const { t } = useTranslation();
  const [isAdding, setIsAdding] = useState(false);
  const [dream, setDream] = useState('');
  const [concreteGoal, setConcreteGoal] = useState('');
  const [cost, setCost] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState('1');

  const handleAddGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !dream || !concreteGoal || !cost || !deadline) return;

    const costNum = parseFloat(cost);
    const deadlineDate = new Date(deadline);
    const now = new Date();
    const diffMonths = (deadlineDate.getFullYear() - now.getFullYear()) * 12 + (deadlineDate.getMonth() - now.getMonth());

    let category: GoalCategory = 'short-term';
    if (diffMonths > 36) category = 'long-term';
    else if (diffMonths > 12) category = 'medium-term';

    try {
      await addDoc(collection(db, 'goals'), {
        userId: user.uid,
        dream,
        concreteGoal,
        cost: costNum,
        category,
        priority: parseInt(priority),
        deadline: Timestamp.fromDate(deadlineDate),
        createdAt: Timestamp.now()
      });
      setIsAdding(false);
      resetForm();
    } catch (error) {
      console.error("Error adding goal:", error);
    }
  };

  const resetForm = () => {
    setDream('');
    setConcreteGoal('');
    setCost('');
    setDeadline('');
    setPriority('1');
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'goals', id));
    } catch (error) {
      console.error("Error deleting goal:", error);
    }
  };

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">{t('myGoals')}</h1>
          <p className="text-stone-500">{t('turnDreamsReality')}</p>
        </div>
        <Button 
          onClick={() => setIsAdding(!isAdding)} 
          className="rounded-full bg-stone-900 px-4"
        >
          {isAdding ? t('cancel') : <><Plus className="mr-2" size={18} /> {t('newGoal')}</>}
        </Button>
      </header>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <Card className="border-stone-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="text-amber-500" size={20} />
                  {t('dreamToGoalConverter')}
                </CardTitle>
                <CardDescription>{t('iloFramework')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddGoal} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="dream">{t('whatIsDream')}</Label>
                    <Input 
                      id="dream" 
                      placeholder={t('dreamPlaceholder')} 
                      value={dream}
                      onChange={(e) => setDream(e.target.value)}
                      required
                    />
                    <p className="text-[10px] text-stone-400 uppercase tracking-wider">{t('step1')}</p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="concreteGoal">{t('whatIsConcreteGoal')}</Label>
                    <Input 
                      id="concreteGoal" 
                      placeholder={t('goalPlaceholder')} 
                      value={concreteGoal}
                      onChange={(e) => setConcreteGoal(e.target.value)}
                      required
                    />
                    <p className="text-[10px] text-stone-400 uppercase tracking-wider">{t('step2')}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="cost">{t('cost')}</Label>
                      <Input 
                        id="cost" 
                        type="number" 
                        placeholder="0.00" 
                        value={cost}
                        onChange={(e) => setCost(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="deadline">{t('deadline')}</Label>
                      <Input 
                        id="deadline" 
                        type="date" 
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="priority">{t('priority')}</Label>
                    <Select value={priority} onValueChange={setPriority}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 - {t('topPriority')}</SelectItem>
                        <SelectItem value="2">2 - {t('high')}</SelectItem>
                        <SelectItem value="3">3 - {t('medium')}</SelectItem>
                        <SelectItem value="4">4 - {t('low')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="rounded-lg bg-stone-50 p-3 text-xs text-stone-600 flex gap-2">
                    <Info size={16} className="shrink-0 text-stone-400" />
                    <p>{t('costTip')}</p>
                  </div>

                  <Button type="submit" className="w-full bg-stone-900">
                    {t('convertToGoal')} <ArrowRight className="ml-2" size={16} />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        {goals.length === 0 && !isAdding ? (
          <div className="py-12 text-center text-stone-400">
            <p>{t('noGoalsYet')}</p>
          </div>
        ) : (
          goals.map((goal) => (
            <Card key={goal.id} className="group relative border-none shadow-sm transition-shadow hover:shadow-md">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="border-stone-200 text-[10px] uppercase tracking-tighter text-stone-500">
                        {t(goal.category as any)}
                      </Badge>
                      <Badge className="bg-stone-900 text-[10px] uppercase tracking-tighter">
                        {t('priority').split(' ')[0]} {goal.priority}
                      </Badge>
                    </div>
                    <h3 className="text-lg font-bold text-stone-900">{goal.concreteGoal}</h3>
                    <p className="text-xs italic text-stone-400">{t('whatIsDream')}: {goal.dream}</p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={() => handleDelete(goal.id)}
                    className="text-stone-300 hover:text-red-500"
                  >
                    <Trash2 size={18} />
                  </Button>
                </div>
                
                <div className="mt-4 flex items-center justify-between border-t border-stone-50 pt-4">
                  <div className="text-sm">
                    <span className="text-stone-400">{t('cost').split('?')[0]}: </span>
                    <span className="font-bold text-stone-900">${goal.cost.toLocaleString()}</span>
                  </div>
                  <div className="text-sm">
                    <span className="text-stone-400">{t('deadline').split('?')[0]}: </span>
                    <span className="font-medium text-stone-700">
                      {goal.deadline.toDate().toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

export default DreamToGoal;
