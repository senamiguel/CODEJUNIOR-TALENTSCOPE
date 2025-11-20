import React, { useRef, useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Trash2 } from 'lucide-react';
import { useCV } from '../store/CVContext';

export const UploadArea = () => {
  const { processFiles, status, deleteAllCandidates } = useCV();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(Array.from(e.target.files));
      // clear the input so same file can be selected again if needed
      e.currentTarget.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (status.isProcessing) return;
    e.dataTransfer.dropEffect = 'copy';
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (status.isProcessing) return;
    const dt = e.dataTransfer;
    if (dt?.files && dt.files.length > 0) {
      processFiles(Array.from(dt.files));
    }
  };

  const progressPercentage = status.total > 0 ? Math.round((status.processed / status.total) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-end mb-4">
        <button
          onClick={async (e) => {
            e.stopPropagation();
            if (!confirm('Confirma remover TODOS os CVs? Esta ação não pode ser desfeita.')) return;
            try {
              await deleteAllCandidates();
              alert('Todos os CVs foram removidos.');
            } catch (err) {
              console.error(err);
              alert('Falha ao remover CVs. Veja console.');
            }
          }}
          className="text-sm inline-flex items-center gap-2 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded"
        >
          <Trash2 size={16} /> Remover todos os CVs
        </button>
      </div>
      <div
        className={
          `glass-panel rounded-xl p-10 text-center border-dashed border-2 transition-colors cursor-pointer relative overflow-hidden group ` +
          (isDragging ? 'border-brand-accent/80 bg-white/3' : 'border-brand-border hover:border-brand-accent/50')
        }
        onClick={() => !status.isProcessing && fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragEnter={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >

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

  <h2 className="text-2xl font-bold text-white mb-2">Arraste seus currículos aqui</h2>
        <p className="text-slate-400 mb-6">Suporta PDF e DOCX. Analise em lote de até 70 arquivos.</p>

        <button
          onClick={(e) => {
            e.stopPropagation();
            if (!status.isProcessing) fileInputRef.current?.click();
          }}
          disabled={status.isProcessing}
          className="px-6 py-3 bg-brand-secondary hover:bg-blue-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
        >
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
          <div className="glass-panel p-4 rounded-lg border-yellow-500/30 bg-yellow-500/5">
            <div className="flex items-center gap-3 mb-2">
              <AlertCircle className="text-yellow-500" />
              <p className="text-yellow-400 font-bold">Avisos e Erros ({status.errors.length})</p>
            </div>
            <ul className="text-xs max-h-32 overflow-y-auto space-y-1">
              {status.errors.map((err, i) => {
                const isDuplicateWarning = err.includes('⚠️ Duplicado');
                return (
                  <li
                    key={i}
                    className={isDuplicateWarning ? 'text-yellow-300' : 'text-red-300'}
                  >
                    {err}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};
