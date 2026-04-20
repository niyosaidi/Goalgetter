import { GoogleGenAI } from "@google/genai";
import { UserProfile, Goal, Saving, Spending } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY as string });

export const getFinancialAdvice = async (
  profile: UserProfile | null,
  goals: Goal[],
  savings: Saving[],
  spending: Spending[],
  language: 'en' | 'rw' = 'en'
): Promise<string> => {
  if (!profile) return language === 'en' ? "Please log in to get personalized advice." : "Binzira mu kwinjira kugira ngo ubone inama zihariye.";

  const totalSaved = savings.reduce((acc, s) => acc + s.amount, 0);
  const totalSpent = spending.reduce((acc, s) => acc + s.amount, 0);
  
  const goalSummary = goals.map(g => {
    const goalSavings = savings.filter(s => s.goalId === g.id).reduce((acc, s) => acc + s.amount, 0);
    return `${g.concreteGoal} (Dream: ${g.dream}): Cost ${g.cost}, Saved ${goalSavings}, Deadline ${g.deadline}, Priority ${g.priority}`;
  }).join('\n');

  const spendingSummary = spending.slice(0, 10).map(s => {
    return `${s.date}: ${s.amount} on ${s.category} (${s.isNeed ? 'Need' : 'Want'})`;
  }).join('\n');

  const systemInstruction = language === 'en' 
    ? "You are a friendly financial education assistant for youth, following the ILO framework (Dream -> Goal -> Specific/Measurable). Provide concise, encouraging, and actionable advice (max 3 sentences) based on their data. Focus on 'Needs' vs 'Wants' and priority goal progress. Use a supportive tone."
    : "Uri umufasha mu bijyanye n'uburezi mu by'imari mu rubyiruko, ukurikiza amabwiriza ya ILO (Inzozi -> Intego -> Ibifatika/Ibipimika). Tanga inama ngufi, itera imbere, kandi ikora (interuro 3 gusa) hashingiwe ku mibare yabo. Wibande ku 'Ibyo nkeneye' n''Ibyo nifuza' n'iterambere ry'intego y'ibanze. Koresha ijwi ritera akanyabugane.";

  const prompt = `
    User Profile: Monthly Budget ${profile.monthlyBudget}, Currency ${profile.currency}
    Total Saved: ${totalSaved}
    Total Spent: ${totalSpent}
    
    Goals:
    ${goalSummary || "No goals yet."}
    
    Recent Spending:
    ${spendingSummary || "No spending logged yet."}
    
    Please provide advice in ${language === 'en' ? 'English' : 'Kinyarwanda'}.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    return response.text || (language === 'en' ? "Keep going! You're doing great on your financial journey." : "Komeza imbere! Uri gukora neza mu rugendo rwawe rw'imari.");
  } catch (error) {
    console.error("Gemini API Error:", error);
    return language === 'en' 
      ? "I'm having trouble thinking right now, but remember: prioritize your needs over your wants!" 
      : "Mfite ikibazo cyo gutekereza ubu, ariko wibuke: shyira imbere ibyo ukeneye kurusha ibyo wifuza!";
  }
};
