import React, { useMemo } from 'react';
import { useCV } from '../store/CVContext';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
const COLORS = ['#8257E5', '#04D361', '#996DFF', '#00B352', '#E1E1E6', '#202024'];

export const DashboardStats = () => {
  const { candidates } = useCV();
  const stats = useMemo(() => {
    const experience = candidates.reduce((acc, curr) => {
      acc[curr.experienceLevel] = (acc[curr.experienceLevel] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const skillsMap: Record<string, number> = {};
    candidates.forEach(c => {
      c.skills?.forEach(s => {
        const k = s.toLowerCase().trim();
        skillsMap[k] = (skillsMap[k] || 0) + 1;
      });
    });
    const topSkills = Object.entries(skillsMap)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), count }));

    const expData = Object.entries(experience).map(([name, value]) => ({ name, value }));

    return { expData, topSkills };
  }, [candidates]);

  if (candidates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-slate-500">
        <p className="text-xl mb-2 font-mono">Nenhum dado disponível</p>
        <p className="text-sm">Vá para a aba "Importar CVs" para começar.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Overview Cards */}
      <div className="col-span-1 lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-panel p-6 rounded-lg border-l-2 border-l-brand-purple hover:border-brand-purple transition-colors relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-brand-purple/5 rounded-full blur-xl -mr-10 -mt-10"></div>
          <p className="text-brand-gray text-sm font-mono uppercase tracking-wider">Total de Membros</p>
          <p className="text-4xl font-bold text-white mt-2">{candidates.length}</p>
        </div>
        <div className="glass-panel p-6 rounded-lg border-l-2 border-l-brand-accent hover:border-brand-accent transition-colors relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-brand-accent/5 rounded-full blur-xl -mr-10 -mt-10"></div>
          <p className="text-brand-gray text-sm font-mono uppercase tracking-wider">Skills Únicas</p>
          <p className="text-4xl font-bold text-white mt-2">{stats.topSkills.length > 0 ? '100+' : 0}</p>
        </div>
        <div className="glass-panel p-6 rounded-lg border-l-2 border-l-white hover:border-white transition-colors relative overflow-hidden">
           <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full blur-xl -mr-10 -mt-10"></div>
          <p className="text-brand-gray text-sm font-mono uppercase tracking-wider">Senioridade Dominante</p>
          <p className="text-4xl font-bold text-brand-purple mt-2">
             {stats.expData.sort((a,b) => b.value - a.value)[0]?.name || '-'}
          </p>
        </div>
      </div>

      {/* Experience Chart */}
      <div className="glass-panel p-6 rounded-lg">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <span className="w-2 h-8 bg-brand-purple rounded-sm"></span>
          Distribuição de Senioridade
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={stats.expData}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
                stroke="none"
              >
                {stats.expData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ backgroundColor: '#121214', borderColor: '#202024', color: '#E1E1E6', borderRadius: '8px' }} 
                itemStyle={{ color: '#E1E1E6' }}
              />
              <Legend iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Skills Chart */}
      <div className="glass-panel p-6 rounded-lg">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <span className="w-2 h-8 bg-brand-accent rounded-sm"></span>
          Top 10 Hard Skills
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats.topSkills} layout="vertical" margin={{ left: 40 }}>
              <XAxis type="number" hide />
              <YAxis 
                dataKey="name" 
                type="category" 
                width={100} 
                tick={{ fill: '#A8A8B3', fontSize: 12, fontFamily: 'Inter' }} 
                interval={0}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip 
                cursor={{fill: 'rgba(130, 87, 229, 0.1)'}}
                contentStyle={{ backgroundColor: '#121214', borderColor: '#202024', color: '#E1E1E6', borderRadius: '8px' }} 
              />
              <Bar dataKey="count" fill="#8257E5" radius={[0, 4, 4, 0]}>
                {stats.topSkills.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#8257E5' : '#04D361'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};