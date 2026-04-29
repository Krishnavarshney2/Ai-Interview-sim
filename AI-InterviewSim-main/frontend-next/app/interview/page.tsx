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
  const videoRef = useRef<HTMLVideoElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOn, setIsVideoOn] = useState(true);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentAnswer, setCurrentAnswer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [round, setRound] = useState(0);
  const [totalRounds, setTotalRounds] = useState(5);
  const [isInterviewComplete, setIsInterviewComplete] = useState(false);
  const [micPermission, setMicPermission] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
  const [videoStream, setVideoStream] = useState<MediaStream | null>(null);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);

  const role = searchParams.get('role') || 'Software Engineer';

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Attach video stream to video element when available
  useEffect(() => {
    if (videoRef.current && videoStream) {
      console.log('Attaching video stream to video element');
      videoRef.current.srcObject = videoStream;
    }
  }, [videoStream]);

  // Timer
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Request permissions and start interview on mount
  useEffect(() => {
    startInterview();
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (videoStream) {
        videoStream.getTracks().forEach(track => track.stop());
      }
      if (audioStream) {
        audioStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [videoStream, audioStream]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const requestPermissions = async () => {
    // Request camera permission
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraPermission('granted');
      setVideoStream(stream);

      // Use useEffect to attach stream when ref is ready
      console.log('Camera permission granted, stream obtained');
    } catch (err: any) {
      console.error('Camera permission error:', err);
      setCameraPermission(err.name === 'NotAllowedError' ? 'denied' : 'prompt');
    }

    // Request microphone permission
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicPermission('granted');
      setAudioStream(audioStream);
      console.log('Microphone permission granted');
    } catch (err: any) {
      console.error('Mic permission error:', err);
      setMicPermission(err.name === 'NotAllowedError' ? 'denied' : 'prompt');
    }
  };

  const startInterview = async () => {
    // First request permissions
    await requestPermissions();

    try {
      // Start interview session
      const response = await interviewAPI.startInterview(role, totalRounds);
      
      if (response.success) {
        setSessionId(response.session_id);
        setRound(response.round);
        setCurrentQuestion(response.question);
        
        // Add AI question to messages
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
      // Fallback to demo mode
      setCurrentQuestion('Welcome to your interview! Please introduce yourself and tell me about your background.');
      setMessages([
        {
          id: 1,
          sender: 'ai',
          text: 'Welcome to your interview! Please introduce yourself and tell me about your background.',
          timestamp: new Date(),
        }
      ]);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!currentAnswer.trim() || isSubmitting) return;

    setIsSubmitting(true);

    // Add user answer to messages
    const userMessage: Message = {
      id: messages.length + 1,
      sender: 'user',
      text: currentAnswer,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentAnswer('');

    try {
      // Submit answer to backend with session_id
      const response = await interviewAPI.submitAnswer(currentAnswer, sessionId || undefined);

      if (response.success) {
        // Check if interview is complete
        if (response.isComplete) {
          setIsInterviewComplete(true);
        } else {
          // Add next question
          if (response.nextQuestion || response.followup) {
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
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
      // Demo mode - just move to next mock question
      const demoQuestions = [
        'Can you elaborate on your experience with system design and scalability?',
        'How do you handle conflicts in a team environment?',
        'Tell me about a challenging project you worked on.',
        'What are your strengths and weaknesses as a developer?',
      ];
      
      if (round < totalRounds) {
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
    // Stop media streams
    if (videoStream) {
      videoStream.getTracks().forEach(track => track.stop());
    }
    if (audioStream) {
      audioStream.getTracks().forEach(track => track.stop());
    }
    
    // Navigate to feedback
    router.push('/feedback');
  };

  const toggleMute = async () => {
    if (audioStream) {
      audioStream.getAudioTracks().forEach(track => {
        track.enabled = isMuted; // Enable if currently muted
      });
      setIsMuted(!isMuted);
    } else {
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = async () => {
    if (videoStream) {
      const videoTracks = videoStream.getVideoTracks();
      if (videoTracks.length > 0) {
        videoTracks[0].enabled = !isVideoOn; // Toggle the enabled state
        setIsVideoOn(!isVideoOn);
        console.log('Video toggled, now:', !isVideoOn ? 'on' : 'off');
      }
    } else {
      // Try to enable camera
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        setVideoStream(stream);
        setIsVideoOn(true);
        console.log('Camera enabled, new stream obtained');
      } catch (err) {
        console.error('Failed to enable camera:', err);
        setIsVideoOn(false);
      }
    }
  };

  if (isInterviewComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface">
        <div className="glass-panel rounded-2xl p-12 max-w-lg text-center">
          <span className="material-symbols-outlined text-6xl text-tertiary mb-4">check_circle</span>
          <h1 className="text-3xl font-headline font-bold text-on-surface mb-4">Interview Complete!</h1>
          <p className="text-on-surface-variant mb-8">
            Great job! You completed {messages.filter(m => m.sender === 'user').length} rounds.
            Your feedback is being generated...
          </p>
          <button
            onClick={handleEndSession}
            className="bipolar-gradient px-8 py-4 rounded-xl text-on-primary font-headline font-bold text-lg"
          >
            View Feedback
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Top Header */}
      <header className="fixed top-0 w-full z-50 bg-[#0b1326]/60 backdrop-blur-xl shadow-[0_8px_32px_0_rgba(0,0,0,0.3)]">
        <div className="flex justify-between items-center px-8 h-20 w-full max-w-7xl mx-auto">
          <div className="flex items-center gap-4">
            <Link href="/" className="font-headline text-2xl font-bold bg-gradient-to-r from-[#afc6ff] to-[#ddb7ff] bg-clip-text text-transparent">
              Luminal AI
            </Link>
            <div className="h-4 w-[1px] bg-outline-variant/30"></div>
            <span className="font-label text-sm uppercase tracking-widest text-tertiary">Live Session: {role}</span>
          </div>
          <div className="flex items-center gap-6">
            {/* Round Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-high border border-outline-variant/10">
              <span className="font-label text-xs text-on-surface-variant">Round {round}/{totalRounds}</span>
            </div>
            {/* Recording Indicator */}
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-surface-container-high border border-outline-variant/10">
              <div className="w-2 h-2 rounded-full bg-error animate-pulse"></div>
              <span className="font-label text-xs uppercase tracking-tighter text-on-surface-variant">Recording</span>
            </div>
            {/* Timer */}
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-on-surface-variant text-sm">timer</span>
              <span className="font-label text-sm text-primary">{formatTime(elapsedTime)}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Interview Layout */}
      <main className="pt-20 h-screen flex flex-col md:flex-row overflow-hidden">
        {/* Left: AI Representation */}
        <section className="flex-1 relative flex flex-col items-center justify-center bg-surface-container-lowest overflow-hidden">
          {/* Background Tonal Shifts */}
          <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-primary/5 blur-[120px] rounded-full"></div>
          <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-secondary/5 blur-[120px] rounded-full"></div>

          {/* The Ethereal Core - AI Avatar */}
          <div className="relative z-10 flex flex-col items-center gap-12">
            <div className="w-64 h-64 rounded-full bg-gradient-to-tr from-primary/20 via-secondary/10 to-tertiary/20 flex items-center justify-center relative">
              {/* Core Orb */}
              <div className="absolute inset-4 rounded-full bg-gradient-to-br from-primary to-secondary opacity-20 blur-xl"></div>
              <div className="w-48 h-48 rounded-full border border-primary/20 flex items-center justify-center p-8 bg-surface-container-high/40 backdrop-blur-3xl">
                <div className="w-full h-full rounded-full bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center">
                  <span className="material-symbols-outlined text-6xl text-primary/60">smart_toy</span>
                </div>
              </div>
            </div>

            {/* Live Question Display */}
            <div className="max-w-2xl px-8 text-center">
              <p className="font-headline text-2xl md:text-3xl font-medium text-on-surface tracking-tight leading-relaxed">
                &ldquo;{currentQuestion}&rdquo;
              </p>
            </div>
          </div>

          {/* Focus Status Indicator */}
          <div className="absolute bottom-12 left-12">
            <div className="flex items-center gap-3 font-label text-xs uppercase tracking-widest text-on-surface-variant/60">
              <span className="material-symbols-outlined text-sm">psychology</span>
              AI Analyzing Response
            </div>
          </div>
        </section>

        {/* Right: User Context & Engagement */}
        <aside className="w-full md:w-[450px] bg-surface-container-low border-l border-outline-variant/10 flex flex-col">
          {/* User Webcam Feed */}
          <div className="p-6">
            <div className="relative aspect-video rounded-xl overflow-hidden bg-surface-container-lowest ring-1 ring-outline-variant/20 shadow-2xl">
              {cameraPermission === 'granted' && videoStream ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                  style={{ display: isVideoOn ? 'block' : 'none' }}
                />
              ) : (
                <div className="w-full h-full bg-surface-container-high flex flex-col items-center justify-center gap-4">
                  <span className="material-symbols-outlined text-5xl text-on-surface-variant/30">videocam_off</span>
                  <p className="text-on-surface-variant text-sm">
                    {cameraPermission === 'denied' ? 'Camera access denied' : 'Camera off'}
                  </p>
                </div>
              )}
              
              {/* Attention Overlay */}
              <div className="absolute top-4 left-4 flex items-center gap-2 px-2.5 py-1 rounded-lg glass-panel ring-1 ring-white/5">
                <span className="material-symbols-outlined text-tertiary text-sm">visibility</span>
                <span className="font-label text-[10px] uppercase font-bold text-on-tertiary-container tracking-wider">
                  {cameraPermission === 'granted' ? 'Attention: Tracking' : 'Camera Off'}
                </span>
              </div>

              {/* Mic Status */}
              <div className="absolute bottom-4 right-4 flex gap-2">
                <div className="w-8 h-8 rounded-lg glass-panel flex items-center justify-center">
                  <span className={`material-symbols-outlined text-sm ${isMuted ? 'text-error' : 'text-on-surface'}`}>
                    {isMuted ? 'mic_off' : 'mic'}
                  </span>
                </div>
              </div>
            </div>

            {/* Permission Status */}
            <div className="mt-4 flex gap-4 text-xs">
              <div className={`flex items-center gap-2 ${micPermission === 'granted' ? 'text-tertiary' : 'text-error'}`}>
                <span className="material-symbols-outlined text-sm">{micPermission === 'granted' ? 'mic' : 'mic_off'}</span>
                <span className="font-label">Mic: {micPermission}</span>
              </div>
              <div className={`flex items-center gap-2 ${cameraPermission === 'granted' ? 'text-tertiary' : 'text-error'}`}>
                <span className="material-symbols-outlined text-sm">{cameraPermission === 'granted' ? 'videocam' : 'videocam_off'}</span>
                <span className="font-label">Camera: {cameraPermission}</span>
              </div>
            </div>
          </div>

          {/* Chat Log / Transcript */}
          <div className="flex-1 flex flex-col min-h-0 px-6 pb-6">
            <div className="flex items-center justify-between py-4 border-b border-outline-variant/10 mb-4">
              <h3 className="font-label text-xs uppercase tracking-widest text-on-surface-variant font-bold">Session Transcript</h3>
              <span className="font-label text-[10px] text-primary/60">{formatTime(elapsedTime)} ELAPSED</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-6 pr-2">
              {messages.map((message) => (
                <div key={message.id} className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className={`font-label text-[10px] uppercase font-bold tracking-widest ${
                      message.sender === 'ai' ? 'text-secondary' : 'text-primary'
                    }`}>
                      {message.sender === 'ai' ? 'Luminal AI' : 'Candidate (You)'}
                    </span>
                  </div>
                  <p className={`leading-relaxed text-sm ${
                    message.sender === 'user'
                      ? 'text-on-surface pl-4 border-l-2 border-primary/20'
                      : 'text-on-surface-variant'
                  }`}>
                    {message.text}
                  </p>
                </div>
              ))}

              {/* Typing Indicator */}
              {isSubmitting && (
                <div className="flex items-center gap-1.5 py-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/40 animate-pulse"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-primary/60 animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Answer Input */}
          <div className="p-6 border-t border-outline-variant/10 bg-surface-container-low">
            <div className="flex gap-3">
              <textarea
                value={currentAnswer}
                onChange={(e) => setCurrentAnswer(e.target.value)}
                placeholder="Type your answer here..."
                className="flex-1 bg-surface-container-high border border-outline-variant/30 rounded-lg px-4 py-3 text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none min-h-[80px]"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    handleSubmitAnswer();
                  }
                }}
              />
              <button
                onClick={handleSubmitAnswer}
                disabled={isSubmitting || !currentAnswer.trim()}
                className="bipolar-gradient px-6 rounded-lg text-on-primary font-headline font-bold disabled:opacity-50 transition-all hover:scale-105 active:scale-95"
              >
                <span className="material-symbols-outlined">send</span>
              </button>
            </div>
            <p className="text-on-surface-variant/50 text-xs mt-2">
              Press Ctrl+Enter to submit
            </p>
          </div>
        </aside>
      </main>

      {/* Floating Controls */}
      <nav className="fixed bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-4 px-8 py-4 glass-panel rounded-full ring-1 ring-white/10 shadow-2xl z-50">
        {/* Mute Button */}
        <button
          onClick={toggleMute}
          className={`group flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
            isMuted ? 'bg-error/20 hover:bg-error/30' : 'bg-surface-container-highest/60 hover:bg-surface-container-highest'
          }`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          <span className={`material-symbols-outlined ${isMuted ? 'text-error' : 'text-on-surface'}`}>
            {isMuted ? 'mic_off' : 'mic'}
          </span>
        </button>

        {/* Video Button */}
        <button
          onClick={toggleVideo}
          className={`group flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
            !isVideoOn ? 'bg-error/20 hover:bg-error/30' : 'bg-surface-container-highest/60 hover:bg-surface-container-highest'
          }`}
          title={isVideoOn ? 'Turn Off Camera' : 'Turn On Camera'}
        >
          <span className={`material-symbols-outlined ${!isVideoOn ? 'text-error' : 'text-on-surface'}`}>
            {isVideoOn ? 'videocam' : 'videocam_off'}
          </span>
        </button>

        {/* Separator */}
        <div className="h-8 w-[1px] bg-outline-variant/30 mx-2"></div>

        {/* Session Action - End Session */}
        <button
          onClick={handleEndSession}
          className="group flex items-center gap-3 px-6 h-12 rounded-full bg-gradient-to-r from-primary to-secondary text-on-primary font-headline font-bold text-sm hover:shadow-[0_0_20px_rgba(175,198,255,0.4)] transition-all active:scale-95"
        >
          <span className="material-symbols-outlined">logout</span>
          End Session
        </button>
      </nav>
    </>
  );
}

export default function InterviewPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-surface"><div className="text-on-surface-variant">Loading interview...</div></div>}>
      <InterviewContent />
    </Suspense>
  );
}
