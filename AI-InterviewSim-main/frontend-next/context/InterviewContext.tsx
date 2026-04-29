'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface Question {
  question: string;
  answer: string;
  followup?: string;
  followup_answer?: string;
}

interface InterviewState {
  session: any;
  role: string;
  rounds: number;
  currentRound: number;
  questions: Question[];
  currentQuestion: string;
  isComplete: boolean;
  feedback: any;
}

interface InterviewContextType {
  state: InterviewState;
  setRole: (role: string) => void;
  setRounds: (rounds: number) => void;
  startInterview: () => Promise<void>;
  submitAnswer: (answer: string) => Promise<void>;
  generateFeedback: () => Promise<void>;
  resetInterview: () => void;
}

const InterviewContext = createContext<InterviewContextType | undefined>(undefined);

export function InterviewProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<InterviewState>({
    session: null,
    role: '',
    rounds: 5,
    currentRound: 0,
    questions: [],
    currentQuestion: '',
    isComplete: false,
    feedback: null,
  });

  const setRole = (role: string) => {
    setState(prev => ({ ...prev, role }));
  };

  const setRounds = (rounds: number) => {
    setState(prev => ({ ...prev, rounds }));
  };

  const startInterview = async () => {
    try {
      const response = await fetch('/api/interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: state.role, rounds: state.rounds }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setState(prev => ({
          ...prev,
          session: data.session,
          currentQuestion: data.question,
          currentRound: 1,
        }));
      }
    } catch (error) {
      console.error('Failed to start interview:', error);
    }
  };

  const submitAnswer = async (answer: string) => {
    try {
      const response = await fetch('/api/interview/answer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answer }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setState(prev => ({
          ...prev,
          questions: [
            ...prev.questions,
            {
              question: prev.currentQuestion,
              answer,
              followup: data.followup,
            },
          ],
          currentQuestion: data.nextQuestion || '',
          currentRound: prev.currentRound + 1,
          isComplete: !data.nextQuestion,
        }));
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
    }
  };

  const generateFeedback = async () => {
    try {
      const response = await fetch('/api/interview/feedback', {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (data.success) {
        setState(prev => ({ ...prev, feedback: data.feedback }));
      }
    } catch (error) {
      console.error('Failed to generate feedback:', error);
    }
  };

  const resetInterview = () => {
    setState({
      session: null,
      role: '',
      rounds: 5,
      currentRound: 0,
      questions: [],
      currentQuestion: '',
      isComplete: false,
      feedback: null,
    });
  };

  return (
    <InterviewContext.Provider value={{ state, setRole, setRounds, startInterview, submitAnswer, generateFeedback, resetInterview }}>
      {children}
    </InterviewContext.Provider>
  );
}

export function useInterview() {
  const context = useContext(InterviewContext);
  if (context === undefined) {
    throw new Error('useInterview must be used within an InterviewProvider');
  }
  return context;
}
