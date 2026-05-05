import { useState, useRef } from 'react'
import axios from 'axios'
import { UploadCloud, File, Send, Trash2, Bot, User, CheckCircle2, AlertCircle, Loader2, Database, Activity, RefreshCw, Square } from 'lucide-react'

function App() {
  // Configuration State
  const uploadEndpoint = 'http://127.0.0.1:8000/upload'
  const queryEndpoint = 'http://127.0.0.1:8000/query'

  // Upload State
  const [files, setFiles] = useState([])
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState(null) // { type: 'success' | 'error', message: '' }
  const fileInputRef = useRef(null)

  // Chat State
  const [messages, setMessages] = useState([
    { role: 'bot', content: 'Hello! I am your RAG assistant. Upload some documents and ask me anything.' }
  ])
  const [inputValue, setInputValue] = useState('')
  const [isQuerying, setIsQuerying] = useState(false)
  const messagesEndRef = useRef(null)
  const abortControllerRef = useRef(null)

  const handleStopSearch = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      setIsQuerying(false)
      setMessages((prev) => [...prev, { 
        role: 'bot', 
        content: 'Execution cancelled', 
        type: 'stopped' 
      }])
    }
  }

  // Database State
  const [dbStats, setDbStats] = useState([])
  const [isRefreshingStats, setIsRefreshingStats] = useState(false)

  // -- Database Logic --
  const fetchStats = async () => {
    setIsRefreshingStats(true)
    try {
      const res = await axios.get('http://127.0.0.1:8000/stats')
      setDbStats(res.data.stats || [])
    } catch (err) {
      console.error('Failed to fetch DB stats:', err)
    } finally {
      setIsRefreshingStats(false)
    }
  }

  // Initial fetch
  useState(() => {
    fetchStats()
  }, [])

  // -- Upload Logic --
  const handleFileChange = (e) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).map(f => ({ file: f, status: 'idle' }))
      setFiles((prev) => [...prev, ...newFiles])
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    if (e.dataTransfer.files) {
      const newFiles = Array.from(e.dataTransfer.files).map(f => ({ file: f, status: 'idle' }))
      setFiles((prev) => [...prev, ...newFiles])
    }
  }

  const handleDragOver = (e) => {
    e.preventDefault()
  }

  const removeFile = (index) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleUpload = async () => {
    if (files.length === 0) {
      setUploadStatus({ type: 'error', message: 'Please select files to upload' })
      return
    }

    setIsUploading(true)
    setUploadStatus(null)

    // Mark all current idle files as uploading
    setFiles(prev => prev.map(f => f.status === 'idle' ? { ...f, status: 'uploading' } : f))

    const formData = new FormData()
    let hasFiles = false
    files.forEach((fileObj) => {
      if (fileObj.status === 'idle' || fileObj.status === 'error') {
        formData.append('files', fileObj.file)
        hasFiles = true
      }
    })

    if (!hasFiles) {
      setUploadStatus({ type: 'error', message: 'No new files to upload' })
      setIsUploading(false)
      return
    }

    try {
      await axios.post(uploadEndpoint, formData)
      // Mark as success
      setFiles(prev => prev.map(f => f.status === 'uploading' ? { ...f, status: 'success' } : f))
      setTimeout(fetchStats, 2000) // Refresh stats after a short delay for background processing
    } catch (err) {
      setFiles(prev => prev.map(f => f.status === 'uploading' ? { ...f, status: 'error' } : f))
      setUploadStatus({ type: 'error', message: err.response?.data?.detail || err.message || 'Failed to upload files' })
    } finally {
      setIsUploading(false)
    }
  }

  // -- Chat Logic --
  const handleSendMessage = async (e) => {
    if (e) e.preventDefault()
    if (!inputValue.trim()) return

    const queryText = inputValue
    const userMessage = { role: 'user', content: queryText }
    setMessages((prev) => [...prev, userMessage])
    setInputValue('')
    setIsQuerying(true)

    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, 100)

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const res = await axios.post(queryEndpoint, {
        query: queryText
      }, { signal: controller.signal })
      
      const botMessage = { 
        role: 'bot', 
        content: res.data.answer,
        sources: res.data.sources
      }
      setMessages((prev) => [...prev, botMessage])
      fetchStats()
    } catch (err) {
      if (axios.isCancel(err) || err.message === 'canceled' || err.name === 'CanceledError') return
      // setMessages((prev) => [...prev, { role: 'bot', content: `Error: ${err.response?.data?.detail || err.message}` }])
    } finally {
      setIsQuerying(false)
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    }
  }


  const clearChat = () => {
    setMessages([{ role: 'bot', content: 'Chat history cleared. How can I help you?' }])
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      {/* Header & Settings */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 shadow-sm flex flex-col gap-4">
        <div className="flex justify-between items-center">
          <h1 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
            <Bot className="w-6 h-6 text-blue-600" />
            RAG Assistant UI
          </h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col md:flex-row p-6 gap-6 max-w-[1600px] mx-auto w-full">
        
        {/* Left Side: Upload Panel */}
        <section className="w-full md:w-1/3 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-slate-800">Upload Documents</h2>
            <span className="text-xs font-semibold bg-slate-100 text-slate-500 py-1 px-2 rounded-full">
              PDF, TXT, DOCX
            </span>
          </div>

          <div className="p-6 flex-1 flex flex-col gap-6">
            
            {/* Drag & Drop Zone */}
            <div 
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center text-center gap-3 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer"
              onClick={() => fileInputRef.current?.click()}
            >
              <UploadCloud className="w-10 h-10 text-blue-500 mb-1" />
              <div>
                <p className="font-medium text-slate-700">Click or drag files here</p>
                <p className="text-sm text-slate-500 mt-1">Supports PDF, DOCX, TXT</p>
              </div>
              <input 
                type="file" 
                multiple 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.txt,.docx,.doc"
              />
            </div>

            {/* File List */}
            {files.length > 0 && (
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="font-medium text-slate-700">Selected Files</span>
                  <span className="text-slate-500">{files.length} file(s)</span>
                </div>
                <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                  {files.map((fileObj, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-200">
                      <div className="flex items-center gap-3 overflow-hidden">
                        <File className="w-5 h-5 text-slate-400 flex-shrink-0" />
                        <span className="text-sm text-slate-700 truncate">{fileObj.file.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {fileObj.status === 'uploading' && (
                          <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />
                        )}
                        {fileObj.status === 'success' && (
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                        )}
                        {fileObj.status === 'error' && (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                        <button 
                          onClick={() => removeFile(idx)}
                          className="text-slate-400 hover:text-red-500 transition-colors p-1"
                          title="Remove file"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Upload Status (Only show errors here) */}
            {uploadStatus && uploadStatus.type === 'error' && (
              <div className="p-4 rounded-xl flex items-start gap-3 text-sm bg-red-50 text-red-700 border border-red-200">
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span className="leading-relaxed">{uploadStatus.message}</span>
              </div>
            )}

            <div className="mt-auto pt-4">
              <button 
                onClick={handleUpload}
                disabled={isUploading || files.length === 0}
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-colors shadow-sm"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <UploadCloud className="w-5 h-5" />
                    Upload Documents
                  </>
                )}
              </button>
            </div>
          </div>
        </section>

        {/* Middle: Database Monitor (New) */}
        <section className="w-full md:w-1/4 flex flex-col gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col">
            <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-600" />
                DB Insights
              </h2>
              <div className="flex items-center gap-1">
                <a 
                  href="https://cloud.qdrant.io/" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
                  title="Open Qdrant Cloud"
                >
                  <Activity className="w-4 h-4" />
                </a>
                <button 
                  onClick={fetchStats}
                  disabled={isRefreshingStats}
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500"
                >
                  <RefreshCw className={`w-4 h-4 ${isRefreshingStats ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>
            
            <div className="p-5 flex flex-col gap-4">
              {dbStats.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-8 h-8 text-slate-200 mx-auto mb-2" />
                  <p className="text-sm text-slate-400">No collections found</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {dbStats.map((stat, idx) => (
                    <div key={idx} className="bg-slate-50 border border-slate-100 rounded-xl p-4 flex flex-col gap-2">
                      <div className="flex justify-between items-center">
                        <span className="font-semibold text-slate-700 truncate max-w-[120px]">{stat.name}</span>
                        <span className="text-[10px] font-bold bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full uppercase">Active</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-slate-500">Total Points</span>
                        <span className="font-mono font-medium text-slate-800">{stat.count}</span>
                      </div>
                      <div className="w-full bg-slate-200 h-1 rounded-full mt-1">
                        <div className="bg-indigo-500 h-1 rounded-full" style={{ width: `${Math.min(100, (stat.count / 1000) * 100)}%` }}></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="mt-auto p-4 bg-slate-50 border-t border-slate-100">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                Connected to Qdrant Cloud
              </div>
            </div>
          </div>
        </section>

        {/* Right Side: Query Panel */}
        <section className="w-full md:w-5/12 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-slate-100 flex justify-between items-center bg-white z-10">
            <h2 className="text-lg font-semibold text-slate-800">Ask Questions</h2>
            <button 
              onClick={clearChat}
              className="text-sm text-slate-500 hover:text-slate-800 transition-colors font-medium flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              Clear Chat
            </button>
          </div>

          {/* Chat History */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar bg-slate-50/50">
            {messages.map((msg, idx) => (
              <div 
                key={idx} 
                className={`flex gap-4 max-w-[85%] ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : ''}`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
                }`}>
                  {msg.role === 'user' ? <User className="w-5 h-5" /> : <Bot className="w-5 h-5" />}
                </div>
                
                <div className={`flex flex-col gap-2 ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  {msg.type === 'stopped' ? (
                    <div className="flex items-center gap-2 text-slate-400 text-[13px] px-1 py-1">
                      <Square className="w-2.5 h-2.5 fill-slate-300 text-slate-300" />
                      <span>Execution cancelled</span>
                    </div>
                  ) : (
                    <div className={`p-4 rounded-2xl shadow-sm whitespace-pre-wrap text-[15px] leading-relaxed ${
                      msg.role === 'user' 
                        ? 'bg-blue-600 text-white rounded-tr-sm' 
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-sm'
                    }`}>
                      {msg.content}
                    </div>
                  )}

                  {msg.sources && msg.sources.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-1">
                      {msg.sources.slice(0, 1).map((src, sIdx) => (
                        <div key={sIdx} className="text-[10px] px-2 py-1 bg-white border border-slate-200 text-slate-500 rounded-lg flex flex-col shadow-sm">
                          <div className="flex items-center gap-1 font-medium text-slate-700">
                            <File className="w-3 h-3 text-indigo-500" />
                            <span>{src.file_name}</span>
                          </div>
                          <div className="flex items-center gap-1 text-indigo-600 font-medium">
                            <span>Score: {(src.rerank_score || src.score || 0).toFixed(4)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  

                </div>
              </div>
            ))}
            
            {isQuerying && (
              <div className="flex gap-4 max-w-[85%]">
                <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center flex-shrink-0">
                  <Bot className="w-5 h-5" />
                </div>
                <div className="p-4 rounded-2xl rounded-tl-sm bg-white border border-slate-200 shadow-sm flex flex-col gap-3 min-w-[200px]">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                      <span className="text-sm font-medium text-slate-500">Searching...</span>
                    </div>
                    <button 
                      onClick={handleStopSearch}
                      className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-full transition-colors border border-red-200"
                      title="Stop Search"
                    >
                      <Square className="w-3 h-3 fill-current" />
                    </button>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="p-4 bg-white border-t border-slate-200">
            <form 
              onSubmit={handleSendMessage}
              className="flex items-end gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-2 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent transition-shadow"
            >
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                placeholder="Ask a question about your documents..."
                className="flex-1 max-h-32 min-h-[44px] bg-transparent border-none focus:ring-0 resize-none px-3 py-2.5 text-[15px] outline-none text-slate-800 placeholder-slate-400"
                rows={1}
              />
              <button
                type="submit"
                disabled={!inputValue.trim() || isQuerying}
                className="p-3 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:text-slate-500 text-white rounded-xl transition-colors mb-0.5 flex-shrink-0"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
            <div className="text-center mt-2">
              <span className="text-xs text-slate-400">Press Enter to send, Shift + Enter for new line</span>
            </div>
          </div>
        </section>
        
      </main>
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: #cbd5e1;
          border-radius: 20px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background-color: #94a3b8;
        }
      `}</style>
    </div>
  )
}

export default App
