import React, { useRef } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { useCV } from '../store/CVContext';

export const UploadArea = () => {
  const { processFiles, status } = useCV();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
    }
  };

  const progressPercentage = status.total > 0 ? Math.round((status.processed / status.total) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="glass-panel rounded-xl p-10 text-center border-dashed border-2 border-brand-border hover:border-brand-accent/50 transition-colors cursor-pointer relative overflow-hidden group"
           onClick={() => !status.isProcessing && fileInputRef.current?.click()}>
        
        {status.isProcessing && (
          <div className="absolute inset-0 bg-black/80 z-10 flex flex-col items-center justify-center backdrop-blur-sm">
            <div className="w-64 bg-slate-800 rounded-full h-2 mb-4 overflow-hidden">
              <div 
                className="bg-brand-accent h-full transition-all duration-300" 
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <p className="text-brand-accent font-mono animate-pulse">
              Processando {status.processed}/{status.total}
            </p>
            <p className="text-sm text-slate-400 mt-2">{status.currentFile}</p>
          </div>
        )}

        <div className="bg-brand-accent/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
          <Upload className="text-brand-accent" size={40} />
        </div>
        
        <h2 className="text-2xl font-bold text-white mb-2">Drop your CVs here</h2>
        <p className="text-slate-400 mb-6">Suporta PDF e DOCX. Analise em lote de até 70 arquivos.</p>
        
        <button className="px-6 py-3 bg-brand-secondary hover:bg-blue-600 text-white rounded-lg font-medium transition-colors">
          Selecionar Arquivos
        </button>
        
        <input 
          type="file" 
          multiple 
          accept=".pdf,.docx,.txt" 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileChange}
          disabled={status.isProcessing}
        />
      </div>

      {/* Stats / Errors */}
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        {status.processed > 0 && (
          <div className="glass-panel p-4 rounded-lg flex items-center gap-3">
            <CheckCircle className="text-green-500" />
            <div>
              <p className="text-sm text-slate-400">Sucesso</p>
              <p className="text-xl font-bold text-white">{status.processed} processados</p>
            </div>
          </div>
        )}
        
        {status.errors.length > 0 && (
          <div className="glass-panel p-4 rounded-lg border-red-500/30 bg-red-500/5">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="text-red-500" />
              <p className="text-red-400 font-bold">Erros ({status.errors.length})</p>
            </div>
            <ul className="text-xs text-red-300 max-h-20 overflow-y-auto">
              {status.errors.map((err, i) => <li key={i}>{err}</li>)}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
