import React, { useState } from 'react';
import { DokumenKerjasama, UserRole } from '../types';
import {
  MessageSquareCode,
  Send,
  Sparkles,
  Bot,
  User,
  Quote,
  FileText,
  HelpCircle,
  RefreshCw,
  Lightbulb,
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  time: string;
}

interface AskDocumentViewProps {
  documents: DokumenKerjasama[];
  activeRole: UserRole;
}

export const AskDocumentView: React.FC<AskDocumentViewProps> = ({
  documents,
  activeRole,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'assistant',
      text:
        'Halo! Saya asisten arsip kerja sama BPT Komdigi. Anda dapat bertanya mengenai klausul hak dan kewajiban, masa berlaku, nomor surat, mitra, atau ruang lingkup dari dokumen yang tersimpan di arsip.\n\nCatatan: Jawaban disusun secara ketat HANYA dari data arsip terdaftar dengan rujukan pasal resmi.',
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Suggested Questions
  const presetQuestions = [
    'Apa saja kewajiban mitra dalam PKS Lab 5G dengan PT Telekomunikasi Selular?',
    'Kapan MoU dengan Universitas Indonesia berakhir dan apa ruang lingkupnya?',
    'Daftar kerja sama yang berada di bawah kategori Perguruan Tinggi?',
    'Bagaimana ketentuan pembiayaan pada PKS standardisasi BRIN?',
  ];

  const handleSendMessage = async (queryText?: string) => {
    const textToSend = queryText || inputQuery;
    if (!textToSend.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: 'usr-' + Date.now(),
      sender: 'user',
      text: textToSend.trim(),
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: textToSend.trim(),
          documentsArchive: documents,
        }),
      });

      const data = await response.json();
      const botReply =
        data.answer || 'Informasi tidak ditemukan di arsip.';

      const botMsg: ChatMessage = {
        id: 'bot-' + Date.now(),
        sender: 'assistant',
        text: botReply,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: 'bot-err-' + Date.now(),
        sender: 'assistant',
        text: 'Terjadi gangguan saat memproses jawaban. Silakan coba kembali.',
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-indigo-50 border border-indigo-200 rounded-xl text-indigo-600">
            <MessageSquareCode className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="text-base font-bold text-slate-900">
                Tanya Dokumen Arsip BPT Komdigi
              </h2>
              <span className="text-[10px] font-bold bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded">
                Grounded Q&A
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Konsultasikan isi perjanjian langsung ke basis data arsip ({documents.length} dokumen terindeks).
            </p>
          </div>
        </div>

        <div className="text-[11px] text-slate-400 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          Aturan: Jawaban strictly berdasar dokumen terdaftar dengan rujukan pasal.
        </div>
      </div>

      {/* Suggested Questions */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-2">
        <div className="flex items-center space-x-1.5 text-xs font-bold text-slate-700">
          <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
          <span>Contoh Pertanyaan Umum:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {presetQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q)}
              className="text-left text-xs bg-slate-50 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 px-3 py-1.5 rounded-lg text-slate-700 transition cursor-pointer"
            >
              &ldquo;{q}&rdquo;
            </button>
          ))}
        </div>
      </div>

      {/* Chat Messages Container */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col h-[520px] overflow-hidden">
        {/* Messages List */}
        <div className="flex-1 p-5 overflow-y-auto space-y-4">
          {messages.map((m) => {
            const isBot = m.sender === 'assistant';
            return (
              <div
                key={m.id}
                className={`flex items-start space-x-3 ${isBot ? '' : 'flex-row-reverse space-x-reverse'}`}
              >
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${
                    isBot ? 'bg-indigo-600 text-white shadow-xs' : 'bg-slate-800 text-white'
                  }`}
                >
                  {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                <div
                  className={`max-w-2xl rounded-2xl p-4 text-xs leading-relaxed shadow-xs ${
                    isBot
                      ? 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-none'
                      : 'bg-blue-600 text-white rounded-tr-none font-medium'
                  }`}
                >
                  <div className="whitespace-pre-wrap">{m.text}</div>
                  <div
                    className={`mt-2 text-[10px] font-mono text-right ${
                      isBot ? 'text-slate-400' : 'text-blue-200'
                    }`}
                  >
                    {m.time}
                  </div>
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center flex-shrink-0 text-xs shadow-xs">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-none p-4 text-xs text-slate-600 flex items-center space-x-2">
                <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
                <span>Menelusuri arsip dokumen dan merumuskan jawaban...</span>
              </div>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-100 bg-slate-50/50">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center space-x-2"
          >
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              placeholder="Ketik pertanyaan tentang arsip (misal: ruang lingkup PKS Telkomsel, masa berlaku MoU UI)..."
              className="flex-1 bg-white border border-slate-300 rounded-xl px-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-blue-500 shadow-inner"
            />
            <button
              type="submit"
              disabled={!inputQuery.trim() || isLoading}
              className="flex items-center space-x-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer"
            >
              <span>Kirim</span>
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
