'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { interviewAPI } from '../../lib/api';

interface Message {
  id: number;
  sender: 'ai' | 'user';
  text: string;
  timestamp: Date;
}

function InterviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [round, setRound] = useState(0);
  const [totalRounds, setTotalRounds] = useState(5);
  const [isInterviewComplete, setIsInterviewComplete] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);

  const role = searchParams.get('role') || 'Software Engineer';
  const roundsParam = searchParams.get('rounds');

  // Set total rounds from params
  useEffect(() => {
    if (roundsParam) {
      setTotalRounds(parseInt(roundsParam));
    }
  }, [roundsParam]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus textarea on new question
  useEffect(() => {
    if (currentQuestion && !isSubmitting) {
      textareaRef.current?.focus();
    }
  }, [currentQuestion, isSubmitting]);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Start interview on mount
  useEffect(() => {
    startInterview();
  }, []);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startInterview = async () => {
    try {
      const response = await interviewAPI.startInterview(role, totalRounds);
      
      if (response.success) {
        setSessionId(response.session_id);
        setRound(response.round);
        setCurrentQuestion(response.question);
        
        setMessages([
          {
            id: 1,
            sender: 'ai',
            text: response.question,
            timestamp: new Date(),
          }
        ]);
      }
    } catch (error) {
      console.error('Failed to start interview:', error);
      // Demo mode
      setCurrentQuestion('Welcome to your text-based interview! Please introduce yourself and tell me about your background.');
      setMessages([
        {
          id: 1,
          sender: 'ai',
          text: 'Welcome to your text-based interview! Please introduce yourself and tell me about your background.',
          timestamp: new Date(),
        }
      ]);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim() || isSubmitting) return;

    setIsSubmitting(true);

    // Add user answer
    const userMessage: Message = {
      id: messages.length + 1,
      sender: 'user',
      text: currentAnswer,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentAnswer('');

    try {
      const response = await interviewAPI.submitAnswer(currentAnswer, sessionId || undefined);

      if (response.success) {
        if (response.isComplete) {
          setIsInterviewComplete(true);
        } else if (response.nextQuestion || response.followup) {
          const nextQuestion = response.followup || response.nextQuestion;
          setCurrentQuestion(nextQuestion);
          
          const aiMessage: Message = {
            id: messages.length + 2,
            sender: 'ai',
            text: nextQuestion,
            timestamp: new Date(),
          };

          setMessages(prev => [...prev, aiMessage]);
          setRound(response.round || round + 1);
        }
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
      // Demo mode
      if (round < totalRounds) {
        const demoQuestions = [
          'Can you elaborate on your experience with system design and scalability?',
          'How do you handle conflicts in a team environment?',
          'Tell me about a challenging project you worked on.',
          'What are your strengths and weaknesses as a developer?',
        ];
        
        const nextQuestion = demoQuestions[round % demoQuestions.length];
        setCurrentQuestion(nextQuestion);
        
        const aiMessage: Message = {
          id: messages.length + 2,
          sender: 'ai',
          text: nextQuestion,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, aiMessage]);
        setRound(prev => prev + 1);
      } else {
        setIsInterviewComplete(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEndSession = () => {
    router.push('/feedback');
  };

  if (isInterviewComplete) {
    return (
      <>
        <header className="fixed top-0 w-full z-50 bg-[#0b1326]/60 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
          <div className="flex justify-between items-center px-8 h-20 w-full max-w-7xl mx-auto">
            <Link href="/" className="font-headline text-2xl font-bold bg-gradient-to-r from-[#afc6ff] to-[#ddb7ff] bg-clip-text text-transparent">
              Luminal AI
            </Link>
          </div>
        </header>

        <div className="min-h-screen flex items-center justify-center px-6 pt-20 bg-surface">
          <div className="glass-panel rounded-2xl p-12 max-w-lg text-center">
            <span className="material-symbols-outlined text-6xl text-tertiary mb-4">check_circle</span>
            <h1 className="text-3xl font-headline font-bold text-on-surface mb-4">Interview Complete!</h1>
            <p className="text-on-surface-variant mb-2">
              You completed <span className="text-primary font-bold">{messages.filter(m => m.sender === 'user').length}</span> rounds.
            </p>
            <p className="text-on-surface-variant mb-8">
              Your feedback is being generated...
            </p>
            <button
              onClick={handleEndSession}
              className="bipolar-gradient px-8 py-4 rounded-xl text-on-primary font-headline font-bold text-lg hover:scale-105 active:scale-95 transition-all"
            >
              View Feedback
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      {/* Header */}
      <header className="fixed top-0 w-full z-50 bg-[#0b1326]/60 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
        <div className="flex justify-between items-center px-8 h-20 w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-headline text-2xl font-bold bg-gradient-to-r from-[#afc6ff] to-[#ddb7ff] bg-clip-text text-transparent">
              Luminal AI
            </Link>
            <div className="h-4 w-[1px] bg-outline-variant/30"></div>
            <span className="font-label text-sm uppercase tracking-widest text-tertiary">Text Interview: {role}</span>
          </div>
          <div className="flex items-center gap-6">
            {/* Round Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-high border border-outline-variant/10">
              <span className="material-symbols-outlined text-sm text-on-surface-variant">chat</span>
              <span className="font-label text-xs text-on-surface-variant">Round {round}/{totalRounds}</span>
            </div>
            {/* Timer */}
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-on-surface-variant text-sm">timer</span>
              <span className="font-label text-sm text-primary">{formatTime(elapsedTime)}</span>
            </div>
            {/* End Session Button */}
            <button
              onClick={handleEndSession}
              className="px-4 py-2 rounded-lg bg-error/10 border border-error/20 text-error font-label text-xs uppercase tracking-wider hover:bg-error/20 transition-all"
            >
              End Session
            </button>
          </div>
        </div>
      </header>

      {/* Main Chat Interface */}
      <main className="pt-20 h-screen flex flex-col bg-surface">
        {/* Chat Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-8">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-6 py-4 ${
                    message.sender === 'user'
                      ? 'bipolar-gradient text-on-primary'
                      : 'glass-panel text-on-surface-variant'
                  }`}
                >
                  {message.sender === 'ai' && (
                    <div className="flex items-center gap-2 mb-2 pb-2 border-b border-outline-variant/20">
                      <span className="material-symbols-outlined text-sm text-secondary">smart_toy</span>
                      <span className="font-label text-[10px] uppercase tracking-widest text-secondary font-bold">Luminal AI</span>
                    </div>
                  )}
                  <p className="leading-relaxed text-sm whitespace-pre-wrap">{message.text}</p>
                  <div className={`text-xs mt-2 ${
                    message.sender === 'user' ? 'text-on-primary/70' : 'text-on-surface-variant/50'
                  }`}>
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}

            {/* Typing Indicator */}
            {isSubmitting && (
              <div className="flex justify-start">
                <div className="glass-panel rounded-2xl px-6 py-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary/40 animate-pulse"></div>
                    <div className="w-2 h-2 rounded-full bg-primary/60 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                    <div className="w-2 h-2 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                    <span className="text-on-surface-variant text-xs ml-2">AI is thinking...</span>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Answer Input */}
        <div className="border-t border-outline-variant/20 bg-surface-container-low p-6">
          <div className="max-w-4xl mx-auto">
            <div className="glass-panel rounded-xl p-4">
              <textarea
                ref={textareaRef}
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Type your answer here... (Be detailed for better follow-up questions)"
                className="w-full bg-transparent text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none resize-none min-h-[100px] max-h-[200px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    handleSubmitAnswer();
                  }
                }}
              />
              <div className="flex justify-between items-center mt-4 pt-4 border-t border-outline-variant/20">
                <p className="text-on-surface-variant/50 text-xs">
                  Press <kbd className="px-2 py-1 bg-surface-container-high rounded text-on-surface-variant">Ctrl</kbd> + <kbd className="px-2 py-1 bg-surface-container-high rounded text-on-surface-variant">Enter</kbd> to submit
                </p>
                <button
                  onClick={handleSubmitAnswer}
                  disabled={isSubmitting || !currentAnswer.trim()}
                  className="bipolar-gradient px-6 py-3 rounded-lg text-on-primary font-headline font-bold disabled:opacity-50 transition-all hover:scale-105 active:scale-95 flex items-center gap-2"
                >
                  <span className="material-symbols-outlined text-sm">send</span>
                  Submit Answer
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

export default function TextInterviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-surface"><div className="text-on-surface-variant">Loading interview...</div></div>}>
      <InterviewContent />
    </Suspense>
  );
}
