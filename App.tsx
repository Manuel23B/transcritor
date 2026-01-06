import React, { useState, useRef, useEffect } from 'react';
import { UploadCloud, FileAudio, FileVideo, Globe2, AlertCircle, X, Mic } from 'lucide-react';
import { Button } from './components/Button';
import { TranscriptionOutput } from './components/TranscriptionOutput';
import { HistoryList } from './components/HistoryList';
import { transcribeMedia } from './services/geminiService';
import { Language, TranscriptionState, FileData, HistoryItem } from './types';

function App() {
  const [fileData, setFileData] = useState<FileData | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(Language.PT_BR);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [currentHistoryId, setCurrentHistoryId] = useState<string | null>(null);
  
  const [state, setState] = useState<TranscriptionState>({
    status: 'idle',
    text: null,
    error: null,
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load history from localStorage on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem('transcription_history');
    if (savedHistory) {
      try {
        setHistory(JSON.parse(savedHistory));
      } catch (e) {
        console.error("Failed to parse history", e);
      }
    }
  }, []);

  // Save history to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('transcription_history', JSON.stringify(history));
  }, [history]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    if (!file.type.startsWith('audio/') && !file.type.startsWith('video/')) {
      setState({ ...state, error: "Por favor, selecione apenas arquivos de áudio ou vídeo.", status: 'error' });
      return;
    }

    const MAX_SIZE_MB = 20;
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      setState({ ...state, error: `O arquivo é muito grande (${(file.size / (1024 * 1024)).toFixed(2)}MB). O limite para esta demo é ${MAX_SIZE_MB}MB para garantir estabilidade.`, status: 'error' });
      return;
    }

    const type = file.type.startsWith('video/') ? 'video' : 'audio';
    const previewUrl = URL.createObjectURL(file);
    
    setFileData({ file, previewUrl, type });
    setState({ status: 'idle', text: null, error: null });
    setCurrentHistoryId(null);
  };

  const handleTranscribe = async () => {
    if (!fileData) return;

    setState({ ...state, status: 'processing', error: null });

    try {
      const text = await transcribeMedia(fileData.file, selectedLanguage);
      
      // Save to history upon completion
      const newItem: HistoryItem = {
        id: crypto.randomUUID(),
        fileName: fileData.file.name,
        date: new Date().toISOString(),
        text: text,
        language: selectedLanguage
      };
      
      setHistory(prev => [newItem, ...prev]);
      setCurrentHistoryId(newItem.id);
      
      setState({ status: 'completed', text, error: null });
    } catch (error: any) {
      setState({ status: 'error', text: null, error: error.message });
    }
  };

  const resetAll = () => {
    setFileData(null);
    setState({ status: 'idle', text: null, error: null });
    setCurrentHistoryId(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // History Actions
  const handleSelectHistory = (item: HistoryItem) => {
    setFileData(null); // Clear current file upload if any
    setCurrentHistoryId(item.id);
    setState({
      status: 'completed',
      text: item.text,
      error: null
    });
    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteHistory = (id: string) => {
    setHistory(prev => prev.filter(item => item.id !== id));
    if (currentHistoryId === id) {
      resetAll();
    }
  };

  const handleSaveEdit = (newText: string) => {
    // Update local state
    setState(prev => ({ ...prev, text: newText }));

    // Update history
    if (currentHistoryId) {
      setHistory(prev => prev.map(item => 
        item.id === currentHistoryId 
          ? { ...item, text: newText } 
          : item
      ));
    } else if (fileData) {
      // If we are editing a fresh transcription that wasn't properly synced to history yet (edge case),
      // we just find the most recent one with this filename or update logic if we saved it in handleTranscribe.
      // Since we save in handleTranscribe, we should have a currentHistoryId.
    }
  };

  // Cleanup object URL
  useEffect(() => {
    return () => {
      if (fileData?.previewUrl) {
        URL.revokeObjectURL(fileData.previewUrl);
      }
    };
  }, [fileData]);

  // Determine the filename to display in the Output component
  const getCurrentFileName = () => {
    if (fileData) return fileData.file.name;
    if (currentHistoryId) {
      const item = history.find(h => h.id === currentHistoryId);
      return item?.fileName;
    }
    return undefined;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center gap-2 cursor-pointer" onClick={resetAll}>
              <div className="bg-indigo-600 p-2 rounded-lg">
                <Mic className="text-white h-5 w-5" />
              </div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
                VerbaFlow
              </h1>
            </div>
            <div className="text-sm text-slate-500 hidden sm:block">
              Powered by Gemini 2.5 Flash
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        
        {/* Intro Section */}
        {state.status !== 'completed' && (
          <div className="text-center mb-10 max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
              Transcrição de vídeo e áudio <br />
              <span className="text-indigo-600">inteligente e rápida</span>
            </h2>
            <p className="text-lg text-slate-600">
              Faça upload de arquivos ou acesse seu histórico abaixo.
            </p>
          </div>
        )}

        {/* Upload Area - Hide if viewing history or completed, unless explicitly resetting */}
        {state.status !== 'completed' && (
          <div className="max-w-2xl mx-auto">
            {!fileData ? (
              <div 
                className="relative border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center hover:border-indigo-500 hover:bg-slate-50 transition-colors cursor-pointer group bg-white shadow-sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="audio/*,video/*"
                  className="hidden"
                />
                <div className="mx-auto h-16 w-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <UploadCloud size={32} />
                </div>
                <h3 className="text-lg font-medium text-slate-900 mb-1">
                  Clique para selecionar um arquivo
                </h3>
                <p className="text-slate-500 text-sm mb-4">
                  MP4, MOV, MP3, WAV (Max 20MB)
                </p>
                <Button variant="primary" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}>
                  Selecionar Arquivo
                </Button>
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-lg border border-slate-200 p-6 animate-in fade-in zoom-in-95 duration-300">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
                      {fileData.type === 'video' ? <FileVideo size={24} /> : <FileAudio size={24} />}
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 truncate max-w-[200px] sm:max-w-xs">
                        {fileData.file.name}
                      </h3>
                      <p className="text-sm text-slate-500">
                        {(fileData.file.size / (1024 * 1024)).toFixed(2)} MB • {fileData.type === 'video' ? 'Vídeo' : 'Áudio'}
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={resetAll}
                    disabled={state.status === 'processing'}
                    className="text-slate-400 hover:text-red-500 transition-colors p-1"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Preview */}
                <div className="mb-6 bg-slate-900 rounded-lg overflow-hidden flex justify-center items-center min-h-[200px]">
                  {fileData.type === 'video' ? (
                    <video 
                      src={fileData.previewUrl!} 
                      controls 
                      className="max-h-[300px] w-full"
                    />
                  ) : (
                    <audio 
                      src={fileData.previewUrl!} 
                      controls 
                      className="w-full px-4"
                    />
                  )}
                </div>

                {/* Configuration */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1.5 flex items-center gap-2">
                      <Globe2 size={16} />
                      Idioma do Áudio
                    </label>
                    <div className="relative">
                      <select
                        value={selectedLanguage}
                        onChange={(e) => setSelectedLanguage(e.target.value as Language)}
                        disabled={state.status === 'processing'}
                        className="block w-full rounded-lg border-slate-300 border bg-white py-2.5 px-3 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 sm:text-sm appearance-none"
                      >
                        {Object.entries(Language).map(([key, value]) => (
                          <option key={key} value={value}>
                            {value}
                          </option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" fillRule="evenodd"></path>
                        </svg>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Area */}
                {state.error && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                    <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={18} />
                    <p className="text-sm text-red-700">{state.error}</p>
                  </div>
                )}

                <Button 
                  onClick={handleTranscribe} 
                  isLoading={state.status === 'processing'}
                  className="w-full py-3 text-lg shadow-md"
                >
                  {state.status === 'processing' ? 'Processando...' : 'Iniciar Transcrição'}
                </Button>
              </div>
            )}
          </div>
        )}

        {/* Results Area */}
        {state.status === 'completed' && state.text && (
          <TranscriptionOutput 
            text={state.text} 
            fileName={getCurrentFileName()}
            onReset={resetAll} 
            onSaveEdit={handleSaveEdit}
          />
        )}

        {/* History List - Only show when idle or uploading */}
        {state.status === 'idle' && (
          <HistoryList 
            history={history} 
            onSelect={handleSelectHistory} 
            onDelete={handleDeleteHistory} 
          />
        )}

      </main>
    </div>
  );
}

export default App;