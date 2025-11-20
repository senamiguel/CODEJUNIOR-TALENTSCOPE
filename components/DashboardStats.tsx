import React, { useMemo } from 'react';
import { useCV } from '../store/CVContext';
import ReactECharts from 'echarts-for-react';
const COLORS = ['#8257E5', '#04D361', '#996DFF', '#00B352', '#E1E1E6', '#202024'];
const CHART_FONT = 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial';
 
export const DashboardStats = () => {
  const { candidates } = useCV();
  // debug toggle removed per UX request
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

    // Areas of interest (derived from candidate.areasOfInterest)
    const areasMap: Record<string, number> = {};
    candidates.forEach(c => {
      c.areasOfInterest?.forEach(a => {
        const k = a.toLowerCase().trim();
        areasMap[k] = (areasMap[k] || 0) + 1;
      });
    });
    const topAreas = Object.entries(areasMap)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), count }));

    const expData = Object.entries(experience).map(([name, value]) => ({ name, value }));

    return { expData, topSkills, topAreas };
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
    <>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Debug UI removed */}
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
          <ReactECharts
            option={(() => {
              const pieData = stats.expData.map(d => ({ name: d.name, value: d.value }));
              return {
                color: COLORS,
                renderer: 'svg',
                textStyle: { fontFamily: CHART_FONT, color: '#E1E1E6' },
                tooltip: { trigger: 'item', backgroundColor: '#121214', borderColor: '#202024', textStyle: { color: '#E1E1E6', fontFamily: CHART_FONT } },
                legend: { orient: 'horizontal', bottom: 0, textStyle: { color: '#A8A8B3', fontFamily: CHART_FONT } },
                series: [
                  {
                    name: 'Senioridade',
                    type: 'pie',
                    radius: ['40%', '70%'],
                    avoidLabelOverlap: false,
                    label: { show: false, color: '#E1E1E6', fontFamily: CHART_FONT },
                    emphasis: { label: { show: true, fontSize: 14, fontWeight: '700', color: '#E1E1E6', fontFamily: CHART_FONT, textBorderWidth: 0, textBorderColor: 'transparent' } },
                    data: pieData
                  }
                ]
              };
            })()}
            opts={{ renderer: 'svg' }}
            style={{ height: '100%', width: '100%' }}
          />
        </div>
      </div>

      {/* Skills Chart (Top 10 Hard Skills) */}
      <div className="glass-panel p-6 rounded-lg">
        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
          <span className="w-2 h-8 bg-brand-accent rounded-sm"></span>
          Top 10 Hard Skills
        </h3>
        <div className="h-64">
          <ReactECharts
            option={(() => {
              const names = stats.topSkills.map(s => s.name);
              const counts = stats.topSkills.map(s => s.count);
              return {
                renderer: 'svg',
                textStyle: { fontFamily: CHART_FONT, color: '#E1E1E6' },
                tooltip: { trigger: 'axis', backgroundColor: '#121214', textStyle: { color: '#E1E1E6', fontFamily: CHART_FONT } },
                xAxis: { type: 'category', data: names, axisLabel: { color: '#A8A8B3', fontFamily: CHART_FONT, rotate: 25 } },
                yAxis: { type: 'value', axisLabel: { color: '#A8A8B3', fontFamily: CHART_FONT } },
                grid: { left: '6%', right: '4%', bottom: '18%' },
                series: [
                  {
                    type: 'bar',
                    data: counts,
                    itemStyle: { color: (params: any) => COLORS[params.dataIndex % COLORS.length] },
                    barMaxWidth: 24,
                    label: { show: true, position: 'top', color: '#E1E1E6', fontFamily: CHART_FONT }
                  }
                ]
              };
            })()}
            opts={{ renderer: 'svg' }}
            style={{ height: '100%', width: '100%' }}
          />
        </div>
      </div>
  </div>
  {/* Additional chart row: radar of top skills (vários gráficos) */}
  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
    <div className="glass-panel p-6 rounded-lg">
      <h3 className="text-lg font-bold text-white mb-6">Radar — Principais Skills</h3>
      <div className="h-64">
        <ReactECharts
          option={(() => {
            const indicators = stats.topSkills.slice(0, 5).map(s => ({ name: s.name, max: Math.max(5, s.count) }));
            const values = [stats.topSkills.slice(0, 5).map(s => s.count)];
            return {
              renderer: 'svg',
              textStyle: { fontFamily: CHART_FONT, color: '#E1E1E6' },
              tooltip: { backgroundColor: '#121214', textStyle: { color: '#E1E1E6', fontFamily: CHART_FONT } },
              radar: { indicator: indicators, name: { color: '#A8A8B3', textStyle: { fontFamily: CHART_FONT } }, splitLine: { lineStyle: { color: '#202024' } } },
              series: [{ type: 'radar', data: values, areaStyle: { color: 'rgba(130,87,229,0.15)' }, lineStyle: { color: '#8257E5' }, itemStyle: { color: '#8257E5' } }]
            };
          })()}
          opts={{ renderer: 'svg' }}
          style={{ height: '100%', width: '100%' }}
        />
      </div>
    </div>

    <div className="glass-panel p-6 rounded-lg">
      <h3 className="text-lg font-bold text-white mb-6">Bar — Top Areas de Interesse</h3>
      <div className="h-64">
        <ReactECharts
          option={(() => {
            // sort descending so the biggest area appears on top
            const sorted = stats.topAreas.slice().sort((a, b) => b.count - a.count);
            const names = sorted.map(s => s.name);
            const counts = sorted.map(s => s.count);
            return {
              renderer: 'svg',
              textStyle: { fontFamily: CHART_FONT, color: '#E1E1E6' },
              tooltip: {
                trigger: 'item',
                backgroundColor: '#121214',
                textStyle: { color: '#E1E1E6', fontFamily: CHART_FONT },
                formatter: (params: any) => `${params.name}: ${params.value} membros`
              },
              xAxis: { type: 'value', axisLabel: { color: '#A8A8B3', fontFamily: CHART_FONT } },
              yAxis: { type: 'category', data: names, axisLabel: { color: '#A8A8B3', fontFamily: CHART_FONT }, inverse: true },
              grid: { left: '10%', right: '6%', top: '8%', bottom: '12%' }, // increased bottom for legend
              legend: { bottom: 0, textStyle: { color: '#A8A8B3', fontFamily: CHART_FONT } },
              series: [
                {
                  type: 'bar',
                  data: counts,
                  barMaxWidth: 18,
                  barBorderRadius: 8,
                  itemStyle: { color: (params: any) => COLORS[params.dataIndex % COLORS.length] },
            
                }
              ]
            };
          })()}
          opts={{ renderer: 'svg' }}
          style={{ height: '100%', width: '100%' }}
        />
      </div>
    </div>
  </div>
    </>
  );
};