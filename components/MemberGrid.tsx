import { useState, useMemo } from 'react';
import { useCV } from '../store/CVContext';
import { Search, Filter, X, Mail, Phone, Briefcase, GraduationCap, FileText, Download, ChevronDown, Brain, Target } from 'lucide-react';
import { Candidate } from '../types';

interface CandidateCardProps {
  candidate: Candidate;
  onClick: () => void;
}

const CandidateCard: React.FC<CandidateCardProps> = ({ candidate, onClick }) => (
  <div 
    onClick={onClick}
    className="glass-panel rounded-lg p-5 hover:border-brand-accent/50 transition-all duration-300 group cursor-pointer relative overflow-hidden"
  >
      <div className="absolute top-0 right-0 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
      <span className="text-xs text-brand-accent font-mono">ABRIR {'>'}</span>
    </div>
    
    <div className="flex justify-between items-start mb-3">
      <div>
        <h4 className="text-lg font-bold text-white group-hover:text-brand-accent transition-colors">{candidate.name}</h4>
        <p className="text-xs text-slate-400 uppercase tracking-wider">{candidate.experienceLevel} • {candidate.course}</p>
      </div>
      <span className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded border border-slate-700">
        {candidate.currentPeriod}º Período
      </span>
    </div>
    
    <p className="text-sm text-slate-300 mb-4 line-clamp-2">{candidate.summary}</p>
    
    <div className="flex flex-wrap gap-2">
      {candidate.skills.slice(0, 3).map((skill, i) => (
        <span key={i} className="text-xs bg-brand-accent/10 text-brand-accent px-2 py-1 rounded border border-brand-accent/20">
          {skill}
        </span>
      ))}
      {candidate.skills.length > 3 && (
        <span className="text-xs text-slate-500 px-1 py-1">+{candidate.skills.length - 3}</span>
      )}
    </div>
  </div>
);

const CandidateModal: React.FC<{ candidate: Candidate; onClose: () => void }> = ({ candidate, onClose }) => {
  if (!candidate) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[#151A23] border border-brand-border w-full max-w-3xl max-h-[90vh] rounded-xl overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-6 border-b border-brand-border bg-gradient-to-r from-slate-900 to-[#0B0E14] flex justify-between items-start sticky top-0 z-10">
          <div className="flex gap-4 items-center">
            <div className="w-16 h-16 rounded-full bg-brand-accent/20 flex items-center justify-center text-brand-accent text-2xl font-bold border border-brand-accent/30">
              {candidate.name.charAt(0)}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{candidate.name}</h2>
              <div className="flex items-center gap-3 text-sm text-slate-400 mt-1">
                <span className="flex items-center gap-1"><GraduationCap size={14} /> {candidate.course}</span>
                <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                <span>{candidate.experienceLevel}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-slate-800 rounded-full">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto flex-1 p-8 space-y-8 custom-scrollbar">
          
          {/* Contact & Actions */}
          <div className="flex flex-wrap gap-4 pb-6 border-b border-slate-800">
            {candidate.email && (
              <div className="flex items-center gap-2 text-sm text-slate-300 bg-slate-800/50 px-3 py-2 rounded border border-slate-700">
                <Mail size={16} className="text-brand-secondary" /> {candidate.email}
              </div>
            )}
            {candidate.phone && (
              <div className="flex items-center gap-2 text-sm text-slate-300 bg-slate-800/50 px-3 py-2 rounded border border-slate-700">
                <Phone size={16} className="text-brand-secondary" /> {candidate.phone}
              </div>
            )}
            {candidate.fileUrl && (
              <a 
                href={candidate.fileUrl} 
                target="_blank" 
                rel="noreferrer"
                className="flex items-center gap-2 text-sm text-brand-dark bg-brand-accent hover:bg-brand-accent/80 px-3 py-2 rounded font-medium transition-colors ml-auto"
              >
                <Download size={16} /> Ver Curriculo Original
              </a>
            )}
          </div>

          {/* Summary */}
          <section>
            <h3 className="text-sm font-mono text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Briefcase size={16} /> Resumo Profissional
            </h3>
            <p className="text-slate-200 leading-relaxed bg-slate-900/30 p-4 rounded-lg border border-slate-800">
              {candidate.summary}
            </p>
          </section>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Hard Skills */}
            <section>
              <h3 className="text-sm font-mono text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Brain size={16} /> Hard Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {candidate.skills.map((skill, i) => (
                  <span key={i} className="px-3 py-1 rounded-md bg-blue-500/10 text-blue-400 border border-blue-500/20 text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </section>

            {/* Soft Skills */}
            <section>
              <h3 className="text-sm font-mono text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-2">
                <Target size={16} /> Soft Skills
              </h3>
              <div className="flex flex-wrap gap-2">
                {candidate.softSkills?.map((skill, i) => (
                  <span key={i} className="px-3 py-1 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20 text-sm">
                    {skill}
                  </span>
                ))}
              </div>
            </section>
          </div>

          {/* Areas of Interest */}
          {candidate.areasOfInterest && candidate.areasOfInterest.length > 0 && (
            <section>
              <h3 className="text-sm font-mono text-slate-500 uppercase tracking-wider mb-3">Áreas de Interesse</h3>
              <div className="flex gap-4 flex-wrap">
                {candidate.areasOfInterest.map((area, i) => (
                  <div key={i} className="flex items-center gap-2 text-slate-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-brand-accent"></span>
                    {area}
                  </div>
                ))}
              </div>
            </section>
          )}

        </div>
      </div>
    </div>
  );
};

export const MemberGrid = () => {
  const { candidates } = useCV();
  const [search, setSearch] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [filterLevel, setFilterLevel] = useState('Todos');
  const [filterCourse, setFilterCourse] = useState('Todos');
  const [filterPeriod, setFilterPeriod] = useState('Todos');
  const courses = useMemo(() => {
    const normalize = (s?: string) =>
      (s || '')
        .trim()
        .toLowerCase()
        .normalize('NFD')
        .replace(/[00-\u036f]/g, '')
        .replace(/[\s\-_,]+/g, ' ');

    const preferred: Record<string, string> = {
      'ciencia da computacao': 'Ciência da Computação',
      'computer science': 'Ciência da Computação',
      'bacharel em ciencia da computacao': 'Ciência da Computação',
      'bacharelado em ciencia da computacao': 'Ciência da Computação'
    };

    const map = new Map<string, Map<string, number>>();
    for (const c of candidates.map(c => c.course).filter(Boolean)) {
      const norm = normalize(c);
      if (!map.has(norm)) map.set(norm, new Map());
      const inner = map.get(norm)!;
      inner.set(c, (inner.get(c) || 0) + 1);
    }

    const displayLabels: string[] = [];
    for (const [norm, originals] of map.entries()) {
      if (preferred[norm]) {
        displayLabels.push(preferred[norm]);
        continue;
      }
      if (norm.includes('ciencia da computacao') || norm.includes('computacao') || norm.includes('computer science')) {
        displayLabels.push(preferred['ciencia da computacao']);
        continue;
      }
      let best = '';
      let bestCount = 0;
      for (const [orig, count] of originals.entries()) {
        if (count > bestCount) {
          best = orig;
          bestCount = count;
        }
      }
      const title = best
        ? best
        : norm.split(' ').map(w => w ? w[0].toUpperCase() + w.slice(1) : '').join(' ');
      displayLabels.push(title);
    }

    return ['Todos', ...displayLabels.sort((a, b) => a.localeCompare(b, 'pt-BR'))];
  }, [candidates]);

  const levels = ['Todos', 'Junior', 'Pleno', 'Senior', 'Trainee'];
  const periods = ['Todos', '1-4', '5-8', '9+'];
  const filtered = useMemo(() => {
    return candidates.filter(c => {
      const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                            c.skills.some(s => s.toLowerCase().includes(search.toLowerCase()));
      
      const matchesLevel = filterLevel === 'Todos' || c.experienceLevel === filterLevel;
      const matchesCourse = filterCourse === 'Todos' || c.course === filterCourse;
      
      let matchesPeriod = true;
      if (filterPeriod === '1-4') matchesPeriod = c.currentPeriod >= 1 && c.currentPeriod <= 4;
      if (filterPeriod === '5-8') matchesPeriod = c.currentPeriod >= 5 && c.currentPeriod <= 8;
      if (filterPeriod === '9+') matchesPeriod = c.currentPeriod >= 9;

      return matchesSearch && matchesLevel && matchesCourse && matchesPeriod;
    });
  }, [candidates, search, filterLevel, filterCourse, filterPeriod]);

  return (
    <div className="space-y-6 relative">
      {/* Advanced Filters Bar */}
      <div className="glass-panel p-4 rounded-xl flex flex-col gap-4">
        
        {/* Top Row: Search */}
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Buscar por nome, habilidade ou palavra-chave..." 
            className="w-full bg-black/40 border border-slate-700 rounded-lg pl-10 pr-4 py-3 text-white focus:outline-none focus:border-brand-accent transition-colors"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {/* Bottom Row: Dropdowns */}
        <div className="flex flex-col md:flex-row gap-3">
          
          {/* Level Filter */}
          <div className="relative flex-1">
             <select 
              value={filterLevel}
              onChange={(e) => setFilterLevel(e.target.value)}
              className="w-full appearance-none bg-slate-800/50 border border-slate-700 text-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-brand-accent cursor-pointer hover:bg-slate-800 transition-colors"
             >
               {levels.map(l => <option key={l} value={l}>{l === 'Todos' ? 'Nível (Todos)' : l}</option>)}
             </select>
             <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>

          {/* Course Filter */}
          <div className="relative flex-1">
             <select 
              value={filterCourse}
              onChange={(e) => setFilterCourse(e.target.value)}
              className="w-full appearance-none bg-slate-800/50 border border-slate-700 text-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-brand-accent cursor-pointer hover:bg-slate-800 transition-colors"
             >
               {courses.map(c => <option key={c} value={c}>{c === 'Todos' ? 'Curso (Todos)' : c}</option>)}
             </select>
             <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>

          {/* Period Filter */}
          <div className="relative flex-1">
             <select 
              value={filterPeriod}
              onChange={(e) => setFilterPeriod(e.target.value)}
              className="w-full appearance-none bg-slate-800/50 border border-slate-700 text-slate-300 rounded-lg px-4 py-2.5 focus:outline-none focus:border-brand-accent cursor-pointer hover:bg-slate-800 transition-colors"
             >
               {periods.map(p => <option key={p} value={p}>{p === 'Todos' ? 'Período (Todos)' : p}</option>)}
             </select>
             <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
          </div>

          <div className="flex items-center justify-end px-2 text-sm text-slate-400 whitespace-nowrap min-w-[120px]">
            <Filter size={16} className="mr-2" />
            <span>{filtered.length} resultados</span>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map(c => (
          <CandidateCard 
            key={c.id} 
            candidate={c} 
            onClick={() => setSelectedCandidate(c)}
          />
        ))}
      </div>

      {/* Empty States */}
      {filtered.length === 0 && candidates.length > 0 && (
        <div className="text-center py-20 text-slate-500 glass-panel rounded-xl border-dashed">
          <Search size={48} className="mx-auto mb-4 opacity-20" />
          <p>Nenhum membro encontrado com esses filtros.</p>
          <button 
            onClick={() => { setSearch(''); setFilterLevel('Todos'); setFilterCourse('Todos'); setFilterPeriod('Todos'); }}
            className="mt-4 text-brand-accent hover:underline"
          >
            Limpar Filtros
          </button>
        </div>
      )}
      
      {candidates.length === 0 && (
        <div className="text-center py-20 text-slate-500 glass-panel rounded-xl border-dashed">
           <FileText size={48} className="mx-auto mb-4 opacity-20" />
           <p>Vazio. Importe currículos para visualizar aqui.</p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedCandidate && (
        <CandidateModal 
          candidate={selectedCandidate} 
          onClose={() => setSelectedCandidate(null)} 
        />
      )}
    </div>
  );
};