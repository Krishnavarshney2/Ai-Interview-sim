'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Navbar from '../../components/Navbar';
import Footer from '../../components/Footer';
import { interviewAPI } from '../../lib/api';

export default function SetupPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [role, setRole] = useState('Senior Software Engineer');
  const [difficulty, setDifficulty] = useState(4);
  const [mode, setMode] = useState<'text' | 'voice'>('voice');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');
  const [isDragOver, setIsDragOver] = useState(false);

  const difficultyLabels = ['Junior', 'Mid', 'Senior', 'Staff', 'Architect'];
  const difficultyLabel = difficultyLabels[difficulty - 1];

  // Navigate to interview based on mode
  const handleStartInterview = () => {
    console.log('Starting interview with mode:', mode);
    const interviewPath = mode === 'voice' ? '/interview' : '/interview-text';
    const url = `${interviewPath}?role=${encodeURIComponent(role)}&rounds=${difficulty}&mode=${mode}`;
    console.log('Navigating to:', url);
    router.push(url);
  };

  // Handle file selection
  const handleFileSelect = useCallback(async (file: File) => {
    // Validate file type
    if (file.type !== 'application/pdf') {
      setUploadError('Please upload a PDF file');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError('File size must be less than 10MB');
      return;
    }

    setUploadError('');
    setResumeFile(file);
    setUploading(true);

    try {
      // Create FormData and upload
      const formData = new FormData();
      formData.append('file', file);

      console.log('Uploading file:', file.name, 'Size:', file.size);
      
      const response = await interviewAPI.parseResume(formData);
      
      console.log('Upload response:', response);
      
      if (response.success) {
        setResumeUploaded(true);
        console.log('Resume parsed successfully:', response.data);
      } else {
        setUploadError('Upload failed: ' + (response.message || 'Unknown error'));
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      console.error('Error response:', error.response);
      console.error('Error data:', error.response?.data);
      
      const errorMsg = error.response?.data?.detail || error.message || 'Failed to upload resume';
      setUploadError(errorMsg);
    } finally {
      setUploading(false);
    }
  }, []);

  // Handle file input change
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  // Handle browse button click
  const handleBrowseClick = () => {
    fileInputRef.current?.click();
  };

  // Handle drag events
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    const files = e.dataTransfer.files;
    if (files && files[0]) {
      handleFileSelect(files[0]);
    }
  };

  // Remove uploaded file
  const handleRemoveFile = () => {
    setResumeFile(null);
    setResumeUploaded(false);
    setUploadError('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <Navbar />
      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto min-h-screen">
        {/* Hero Section */}
        <div className="mb-12">
          <h1 className="text-5xl font-headline font-extrabold tracking-tight mb-4 text-on-surface">
            Configure Your <span className="text-tertiary">Simulation</span>
          </h1>
          <p className="text-on-surface-variant max-w-2xl text-lg">
            Upload your credentials and calibrate the AI to match your target role. Our neural engines will synthesize a personalized interview experience.
          </p>
        </div>

        {/* Main Bento Grid Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: File Upload & Hardware */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Resume Upload Card */}
            <section className="glass-panel rounded-xl p-8 flex flex-col gap-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-primary">description</span>
                  <h2 className="font-headline text-xl font-bold">Resume Intelligence</h2>
                </div>
                {resumeUploaded && (
                  <span className="px-3 py-1 rounded-full bg-tertiary/20 text-tertiary text-xs font-label font-bold uppercase tracking-tighter">
                    <span className="material-symbols-outlined text-sm align-middle mr-1">check_circle</span>
                    Uploaded
                  </span>
                )}
              </div>

              {!resumeUploaded ? (
                <div
                  className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center text-center transition-all cursor-pointer ${
                    isDragOver
                      ? 'border-primary bg-primary/5'
                      : 'border-outline-variant/30 bg-surface-container-lowest/30 hover:border-primary/50'
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={handleBrowseClick}
                >
                  {/* Hidden file input */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />

                  {uploading ? (
                    <>
                      <div className="w-16 h-16 rounded-full bg-primary-container/20 flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-primary text-3xl animate-spin">progress_activity</span>
                      </div>
                      <p className="font-headline text-on-surface font-semibold mb-1">Uploading...</p>
                      <p className="text-on-surface-variant text-sm">Please wait while we process your resume</p>
                    </>
                  ) : (
                    <>
                      <div className="w-16 h-16 rounded-full bg-primary-container/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <span className="material-symbols-outlined text-primary text-3xl">cloud_upload</span>
                      </div>
                      <p className="font-headline text-on-surface font-semibold mb-1">Drop your PDF resume here</p>
                      <p className="text-on-surface-variant text-sm mb-4">Our AI will extract skills and experience automatically</p>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleBrowseClick();
                        }}
                        className="px-6 py-2 rounded-full bg-surface-container-highest text-primary text-sm font-label font-bold uppercase tracking-wider hover:bg-surface-container-high transition-colors"
                      >
                        Browse Files
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="bg-surface-container-lowest/50 border border-outline-variant/30 rounded-xl p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary">picture_as_pdf</span>
                    </div>
                    <div>
                      <p className="font-headline text-on-surface font-semibold text-sm">{resumeFile?.name}</p>
                      <p className="text-on-surface-variant text-xs">
                        {resumeFile ? (resumeFile.size / 1024).toFixed(2) : 0} KB • Ready to use
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleRemoveFile}
                    className="p-2 rounded-lg hover:bg-error/10 text-on-surface-variant hover:text-error transition-colors"
                    title="Remove file"
                  >
                    <span className="material-symbols-outlined">delete</span>
                  </button>
                </div>
              )}

              {/* Error Message */}
              {uploadError && (
                <div className="p-4 rounded-lg bg-error/10 border border-error/20 text-error text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">error</span>
                  {uploadError}
                </div>
              )}

              {/* Success Message */}
              {resumeUploaded && !uploadError && (
                <div className="p-4 rounded-lg bg-tertiary/10 border border-tertiary/20 text-tertiary text-sm flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  Resume uploaded successfully! AI will analyze your skills.
                </div>
              )}
            </section>

            {/* Hardware Check Card */}
            <section className="glass-panel rounded-xl p-8">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <svg className="w-6 h-6 text-tertiary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <h2 className="font-headline text-xl font-bold">Hardware Check</h2>
                </div>
                <span className="px-3 py-1 rounded-full bg-tertiary-container/20 text-tertiary text-[10px] font-label font-bold uppercase tracking-tighter">Ready to sync</span>
              </div>
              
              <div className="space-y-6">
                {/* Mic */}
                <div className="flex items-center justify-between p-4 bg-surface-container-lowest/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center">
                      <svg className="w-5 h-5 text-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Microphone</p>
                      <p className="text-xs text-on-surface-variant">Not detected</p>
                    </div>
                  </div>
                  <button className="px-4 py-1.5 rounded-full text-xs font-label font-bold bg-primary text-on-primary hover:opacity-90 transition-opacity">
                    Allow Access
                  </button>
                </div>

                {/* Camera */}
                <div className="flex items-center justify-between p-4 bg-surface-container-lowest/50 rounded-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center">
                      <svg className="w-5 h-5 text-on-surface-variant" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-sm font-semibold">Camera</p>
                      <p className="text-xs text-on-surface-variant">System default</p>
                    </div>
                  </div>
                  <button className="px-4 py-1.5 rounded-full text-xs font-label font-bold bg-surface-container-highest text-on-surface hover:bg-surface-container-high transition-colors">
                    Allow Access
                  </button>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Interview Settings */}
          <div className="lg:col-span-7">
            <section className="glass-panel rounded-xl p-8 h-full flex flex-col">
              <div className="flex items-center gap-3 mb-10">
                <svg className="w-6 h-6 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
                <h2 className="font-headline text-xl font-bold">Interview Parameters</h2>
              </div>

              <form className="flex-grow space-y-10">
                {/* Role Selection */}
                <div className="space-y-4">
                  <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant font-bold block">
                    Target Role
                  </label>
                  <div className="relative group">
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full bg-surface-container-lowest border-none rounded-lg p-4 text-on-surface appearance-none focus:ring-2 focus:ring-primary/50 transition-all cursor-pointer"
                    >
                      <option>Senior Software Engineer</option>
                      <option>Product Manager (Technical)</option>
                      <option>Data Scientist</option>
                      <option>UX Infrastructure Designer</option>
                      <option>DevOps Lead</option>
                    </select>
                    <svg className="w-5 h-5 text-on-surface-variant absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>

                {/* Difficulty Slider */}
                <div className="space-y-6">
                  <div className="flex justify-between items-end">
                    <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant font-bold block">
                      Simulation Difficulty
                    </label>
                    <span className="text-tertiary font-headline font-bold text-2xl">{difficultyLabel}</span>
                  </div>
                  <div className="relative py-4">
                    <input
                      type="range"
                      min="1"
                      max="5"
                      value={difficulty}
                      onChange={(e) => setDifficulty(Number(e.target.value))}
                      className="w-full h-1.5 bg-surface-container-high rounded-lg appearance-none cursor-pointer"
                    />
                    <div className="flex justify-between mt-4 px-1 text-[10px] font-label font-bold text-on-surface-variant uppercase tracking-tighter">
                      <span>Junior</span>
                      <span>Mid</span>
                      <span>Senior</span>
                      <span>Staff</span>
                      <span>Architect</span>
                    </div>
                  </div>
                </div>

                {/* Interview Mode Toggle */}
                <div className="space-y-4">
                  <label className="font-label text-xs uppercase tracking-widest text-on-surface-variant font-bold block">
                    Interaction Mode
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setMode('text')}
                      className={`flex flex-col items-center gap-3 p-6 rounded-xl border transition-all ${
                        mode === 'text'
                          ? 'border-primary bg-primary/5 shadow-[0_0_20px_rgba(175,198,255,0.1)]'
                          : 'border-outline-variant/20 hover:bg-surface-container-highest/30'
                      }`}
                    >
                      <svg className={`w-8 h-8 ${mode === 'text' ? 'text-primary' : 'text-on-surface-variant'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span className={`font-headline font-bold ${mode === 'text' ? 'text-primary' : 'text-on-surface'}`}>Text Chat</span>
                      <span className={`text-[10px] font-label uppercase tracking-widest ${mode === 'text' ? 'text-primary' : 'text-on-surface-variant'}`}>Async focus</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setMode('voice')}
                      className={`flex flex-col items-center gap-3 p-6 rounded-xl border transition-all ${
                        mode === 'voice'
                          ? 'border-primary bg-primary/5 shadow-[0_0_20px_rgba(175,198,255,0.1)]'
                          : 'border-outline-variant/20 hover:bg-surface-container-highest/30'
                      }`}
                    >
                      <svg className={`w-8 h-8 ${mode === 'voice' ? 'text-primary' : 'text-on-surface-variant'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                      <span className={`font-headline font-bold ${mode === 'voice' ? 'text-primary' : 'text-on-surface'}`}>Voice & Video</span>
                      <span className={`text-[10px] font-label uppercase tracking-widest ${mode === 'voice' ? 'text-primary' : 'text-on-surface-variant'}`}>Live Response</span>
                    </button>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="pt-6">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleStartInterview();
                    }}
                    className="w-full bipolar-gradient py-5 rounded-xl text-on-primary font-headline font-extrabold text-lg flex items-center justify-center gap-3 shadow-[0_10px_40px_-10px_rgba(175,198,255,0.4)] hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Initialize AI Interviewer
                    <span className="material-symbols-outlined">arrow_forward</span>
                  </button>
                </div>
              </form>
            </section>
          </div>
        </div>

        {/* Decorative Section */}
        <div className="mt-20 rounded-2xl h-64 w-full relative overflow-hidden">
          <div className="w-full h-full bg-gradient-to-br from-primary/10 via-secondary/5 to-tertiary/10"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent"></div>
          <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
            <div>
              <h3 className="font-headline text-2xl font-bold mb-1">Powered by Groq AI</h3>
              <p className="text-on-surface-variant font-label text-xs uppercase tracking-widest">Latency: 45ms • Neural Path: Optimized</p>
            </div>
            <div className="flex -space-x-4">
              <div className="w-10 h-10 rounded-full bg-surface-container-high border-2 border-background flex items-center justify-center text-xs font-bold">A</div>
              <div className="w-10 h-10 rounded-full bg-surface-container-high border-2 border-background flex items-center justify-center text-xs font-bold">B</div>
              <div className="w-10 h-10 rounded-full bg-surface-container-high border-2 border-background flex items-center justify-center text-xs font-bold">C</div>
              <div className="w-10 h-10 rounded-full bg-surface-container-highest border-2 border-background flex items-center justify-center text-[10px] font-bold">+12k</div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </>
  );
}
