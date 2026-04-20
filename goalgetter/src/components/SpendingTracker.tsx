import React, { useState } from 'react';
import { useFirebase } from './FirebaseProvider';
import { useTranslation } from './LanguageProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { Plus, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const SpendingTracker = () => {
  const { user, spending, goals } = useFirebase();
  const { t } = useTranslation();
  const [isAdding, setIsAdding] = useState(false);
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [isNeed, setIsNeed] = useState<string>('want');
  const [description, setDescription] = useState('');

  const handleAddSpending = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !amount || !category) return;

    try {
      await addDoc(collection(db, 'spending'), {
        userId: user.uid,
        amount: parseFloat(amount),
        category,
        isNeed: isNeed === 'need',
        description,
        date: Timestamp.now()
      });
      setIsAdding(false);
      setAmount('');
      setCategory('');
      setDescription('');
    } catch (error) {
      console.error("Error adding spending:", error);
    }
  };

  const totalWants = spending.filter(s => !s.isNeed).reduce((acc, s) => acc + s.amount, 0);
  const totalNeeds = spending.filter(s => s.isNeed).reduce((acc, s) => acc + s.amount, 0);

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-stone-900">{t('smartSpender')}</h1>
          <p className="text-stone-500">{t('trackDecisions')}</p>
        </div>
        <Button 
          onClick={() => setIsAdding(!isAdding)} 
          className="rounded-full bg-stone-900 px-4"
        >
          {isAdding ? t('cancel') : <><Plus className="mr-2" size={18} /> {t('logExpense')}</>}
        </Button>
      </header>

      {/* Needs vs Wants Summary */}
      <div className="grid grid-cols-2 gap-4">
        <Card className="border-none bg-green-50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-green-600">
              <CheckCircle2 size={16} />
              <span className="text-xs font-medium uppercase tracking-wider">{t('needs')}</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-green-900">${totalNeeds.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="border-none bg-amber-50 shadow-sm">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-amber-600">
              <XCircle size={16} />
              <span className="text-xs font-medium uppercase tracking-wider">{t('wants')}</span>
            </div>
            <div className="mt-2 text-2xl font-bold text-amber-900">${totalWants.toLocaleString()}</div>
          </CardContent>
        </Card>
      </div>

      <AnimatePresence>
        {isAdding && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <Card className="border-stone-200 shadow-sm">
              <CardHeader>
                <CardTitle>{t('logSpending')}</CardTitle>
                <CardDescription>{t('needOrWant')}</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddSpending} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="amount">{t('amount')}</Label>
                      <Input 
                        id="amount" 
                        type="number" 
                        placeholder="0.00" 
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="category">{t('category')}</Label>
                      <Select value={category} onValueChange={setCategory}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="food">{t('food')}</SelectItem>
                          <SelectItem value="transport">{t('transport')}</SelectItem>
                          <SelectItem value="entertainment">{t('entertainment')}</SelectItem>
                          <SelectItem value="education">{t('education')}</SelectItem>
                          <SelectItem value="other">{t('other')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label>{t('classification')}</Label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setIsNeed('need')}
                        className={`flex items-center justify-center gap-2 rounded-lg border py-3 text-sm font-medium transition-all ${
                          isNeed === 'need' ? 'border-green-600 bg-green-50 text-green-700' : 'border-stone-200 text-stone-500'
                        }`}
                      >
                        <CheckCircle2 size={18} /> {t('need')}
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsNeed('want')}
                        className={`flex items-center justify-center gap-2 rounded-lg border py-3 text-sm font-medium transition-all ${
                          isNeed === 'want' ? 'border-amber-600 bg-amber-50 text-amber-700' : 'border-stone-200 text-stone-500'
                        }`}
                      >
                        <XCircle size={18} /> {t('want')}
                      </button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">{t('description')}</Label>
                    <Input 
                      id="description" 
                      placeholder={t('trackDecisions')} 
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                    />
                  </div>

                  {isNeed === 'want' && goals.length > 0 && (
                    <div className="rounded-lg bg-amber-50 p-3 text-xs text-amber-800 flex gap-2">
                      <AlertCircle size={16} className="shrink-0" />
                      <p>{t('spendingWarning')}</p>
                    </div>
                  )}

                  <Button type="submit" className="w-full bg-stone-900">{t('logDecision')}</Button>
                </form>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="space-y-4">
        <h2 className="text-lg font-bold text-stone-900">{t('recentDecisions')}</h2>
        {spending.length === 0 ? (
          <div className="py-12 text-center text-stone-400">
            <p>{t('noSpendingLogged')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {spending.map((item) => (
              <div key={item.id} className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className={`rounded-full p-2 ${item.isNeed ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'}`}>
                    {item.isNeed ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-900">${item.amount.toLocaleString()}</h4>
                    <p className="text-xs text-stone-400 capitalize">{t(item.category as any)} • {item.description || t('other')}</p>
                  </div>
                </div>
                <Badge variant="outline" className={`text-[10px] uppercase tracking-tighter ${item.isNeed ? 'border-green-200 text-green-600' : 'border-amber-200 text-amber-600'}`}>
                  {item.isNeed ? t('need') : t('want')}
                </Badge>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SpendingTracker;
