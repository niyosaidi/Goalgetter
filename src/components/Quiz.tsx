import React, { useState } from 'react';
import { useFirebase } from './FirebaseProvider';
import { useTranslation } from './LanguageProvider';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Label } from './ui/label';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { CheckCircle2, XCircle, Trophy, ArrowRight, RotateCcw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const Quiz = () => {
  const { user } = useFirebase();
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  const QUIZ_QUESTIONS = [
    {
      id: 1,
      question: t('quizQ1'),
      options: [
        t('quizQ1O1'),
        t('quizQ1O2'),
        t('quizQ1O3'),
        t('quizQ1O4')
      ],
      correct: 1,
      explanation: t('quizQ1E')
    },
    {
      id: 2,
      question: t('quizQ2'),
      options: [
        t('quizQ2O1'),
        t('quizQ2O2'),
        t('quizQ2O3'),
        t('quizQ2O4')
      ],
      correct: 1,
      explanation: t('quizQ2E')
    },
    {
      id: 3,
      question: t('quizQ3'),
      options: [
        t('quizQ3O1'),
        t('quizQ3O2'),
        t('quizQ3O3'),
        t('quizQ3O4')
      ],
      correct: 2,
      explanation: t('quizQ3E')
    },
    {
      id: 4,
      question: t('quizQ4'),
      options: [
        t('quizQ4O1'),
        t('quizQ4O2'),
        t('quizQ4O3'),
        t('quizQ4O4')
      ],
      correct: 2,
      explanation: t('quizQ4E')
    }
  ];

  const handleNext = async () => {
    if (selectedOption === QUIZ_QUESTIONS[currentStep].correct) {
      setScore(score + 1);
    }

    if (currentStep < QUIZ_QUESTIONS.length - 1) {
      setCurrentStep(currentStep + 1);
      setSelectedOption(null);
      setShowResult(false);
    } else {
      setIsFinished(true);
      if (user) {
        await addDoc(collection(db, 'quizResults'), {
          userId: user.uid,
          score: score + (selectedOption === QUIZ_QUESTIONS[currentStep].correct ? 1 : 0),
          date: Timestamp.now()
        });
      }
    }
  };

  const resetQuiz = () => {
    setCurrentStep(0);
    setSelectedOption(null);
    setShowResult(false);
    setScore(0);
    setIsFinished(false);
  };

  if (isFinished) {
    return (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 text-center">
        <Card className="border-none shadow-sm">
          <CardContent className="py-12">
            <div className="flex justify-center">
              <div className="rounded-full bg-amber-100 p-6 text-amber-600">
                <Trophy size={64} />
              </div>
            </div>
            <h2 className="mt-6 text-3xl font-bold text-stone-900">{t('quizComplete')}</h2>
            <p className="mt-2 text-lg text-stone-500">{t('score')} {score} / {QUIZ_QUESTIONS.length}</p>
            <div className="mt-8 flex justify-center gap-4">
              <Button onClick={resetQuiz} variant="outline" className="border-stone-900 text-stone-900">
                <RotateCcw className="mr-2" size={18} /> {t('tryAgain')}
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  const question = QUIZ_QUESTIONS[currentStep];

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-stone-900">{t('whatIKnow')}</h1>
        <p className="text-stone-500">{t('testKnowledge')}</p>
      </header>

      <div className="relative h-2 w-full rounded-full bg-stone-100">
        <motion.div 
          className="absolute h-full rounded-full bg-stone-900"
          initial={{ width: 0 }}
          animate={{ width: `${((currentStep + 1) / QUIZ_QUESTIONS.length) * 100}%` }}
        />
      </div>

      <Card className="border-none shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Question {currentStep + 1}</CardTitle>
          <CardDescription>{question.question}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <RadioGroup 
            value={selectedOption?.toString()} 
            onValueChange={(v) => {
              setSelectedOption(parseInt(v));
              setShowResult(true);
            }}
            className="space-y-3"
          >
            {question.options.map((option, idx) => (
              <div key={idx} className="flex items-center space-x-2">
                <RadioGroupItem value={idx.toString()} id={`q${idx}`} className="sr-only" />
                <Label
                  htmlFor={`q${idx}`}
                  className={`flex w-full cursor-pointer items-center justify-between rounded-xl border p-4 transition-all ${
                    selectedOption === idx 
                      ? 'border-stone-900 bg-stone-50' 
                      : 'border-stone-100 hover:border-stone-300'
                  }`}
                >
                  <span>{option}</span>
                  {showResult && idx === question.correct && <CheckCircle2 className="text-green-600" size={20} />}
                  {showResult && selectedOption === idx && idx !== question.correct && <XCircle className="text-red-600" size={20} />}
                </Label>
              </div>
            ))}
          </RadioGroup>

          <AnimatePresence>
            {showResult && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="rounded-xl bg-stone-50 p-4 text-sm text-stone-600"
              >
                <p className="font-bold text-stone-900">Why?</p>
                <p>{question.explanation}</p>
              </motion.div>
            )}
          </AnimatePresence>

          <Button 
            disabled={selectedOption === null} 
            onClick={handleNext} 
            className="w-full bg-stone-900 py-6 text-lg"
          >
            {currentStep === QUIZ_QUESTIONS.length - 1 ? t('finishQuiz') : t('nextQuestion')} <ArrowRight className="ml-2" size={20} />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Quiz;
