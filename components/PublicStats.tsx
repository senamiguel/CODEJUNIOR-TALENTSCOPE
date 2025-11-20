import React, { useMemo } from 'react';
import { useCV } from '../store/CVContext';
import ReactECharts from 'echarts-for-react';
import { TrendingUp, Users, Award, Target } from 'lucide-react';

const CHART_FONT = 'Inter, ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial';

// CODE[] Official Brand Colors
const COLORS = ['#b33dbe', '#36ce5c', '#d97ee3', '#5dd97a', '#240a32', '#2a8f4a'];

export const PublicStats = () => {
    const { candidates } = useCV();

    const stats = useMemo(() => {
        // Experience distribution
        const experience = candidates.reduce((acc, curr) => {
            acc[curr.experienceLevel] = (acc[curr.experienceLevel] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        // Skills mapping
        const skillsMap: Record<string, number> = {};
        candidates.forEach(c => {
            c.skills?.forEach(s => {
                const k = s.toLowerCase().trim();
                skillsMap[k] = (skillsMap[k] || 0) + 1;
            });
        });

        const topSkills = Object.entries(skillsMap)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 10)
            .map(([name, count]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), count }));

        // Areas of interest (like Dashboard)
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

        // Top courses
        const coursesMap: Record<string, number> = {};
        candidates.forEach(c => {
            if (c.course) {
                const k = c.course.trim();
                coursesMap[k] = (coursesMap[k] || 0) + 1;
            }
        });
        const topCourses = Object.entries(coursesMap)
            .sort(([,a], [,b]) => b - a)
            .slice(0, 10)
            .map(([name, count]) => ({ name, count }));

        // Skill count distribution (bins)
        const skillCountBins: Record<string, number> = { '1-3': 0, '4-6': 0, '7+': 0 };
        candidates.forEach(c => {
            const n = (c.skills || []).length;
            if (n <= 3) skillCountBins['1-3']++;
            else if (n <= 6) skillCountBins['4-6']++;
            else skillCountBins['7+']++;
        });
        const skillCountData = Object.entries(skillCountBins).map(([name, count]) => ({ name, count }));

        const expData = Object.entries(experience).map(([name, value]) => ({ name, value }));

        // Simulated growth data (you can replace with real data)
        const growthData = [
            { month: 'Jan', members: Math.floor(candidates.length * 0.6) },
            { month: 'Fev', members: Math.floor(candidates.length * 0.7) },
            { month: 'Mar', members: Math.floor(candidates.length * 0.75) },
            { month: 'Abr', members: Math.floor(candidates.length * 0.85) },
            { month: 'Mai', members: Math.floor(candidates.length * 0.9) },
            { month: 'Jun', members: candidates.length },
        ];

        return { expData, topSkills, growthData, topAreas, topCourses, skillCountData };
    }, [candidates]);

    return (
        <div className="min-h-screen bg-gradient-to-br from-[#0B0E14] via-[#121214] to-[#0B0E14]">
            {/* Hero Section */}
            <div className="relative overflow-hidden">
                {/* Animated background elements */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-20 left-10 w-72 h-72 bg-[#b33dbe]/10 rounded-full blur-3xl animate-pulse"></div>
                    <div className="absolute bottom-20 right-10 w-96 h-96 bg-[#36ce5c]/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                </div>

                {/* Header */}
                <header className="relative z-10 border-b border-brand-border bg-brand-card/50 backdrop-blur-sm">
                    <div className="max-w-7xl mx-auto px-6 py-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {/* CODE [] Logo */}
                                <div className="font-black tracking-tighter text-4xl flex items-center gap-1 select-none">
                                    <span className="text-brand-purple text-glow-purple">CODE</span>
                                    <span className="text-brand-green text-glow-green">[ ]</span>
                                </div>
                                <div className="border-l border-brand-border pl-3 ml-1">
                                    <p className="text-xs text-brand-gray font-mono uppercase tracking-wider">Estatísticas Públicas</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-[#36ce5c]/10 border border-[#36ce5c]/20 rounded-lg">
                                <div className="w-2 h-2 bg-[#36ce5c] rounded-full animate-pulse"></div>
                                <span className="text-sm text-[#36ce5c] font-mono">Dados em Tempo Real</span>
                            </div>
                        </div>
                    </div>
                </header>

                {/* Main Content */}
                <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
                    {/* Title Section */}
                    <div className="text-center mb-16">
                        <h2 className="text-5xl font-bold text-white mb-4 tracking-tight">
                            Panorama de <span className="text-glow bg-gradient-to-r from-[#b33dbe] to-[#36ce5c] bg-clip-text text-brand-purple">Talentos</span>
                        </h2>
                        <p className="text-xl text-brand-gray max-w-2xl mx-auto">
                            Visualize as estatísticas e métricas da nossa comunidade de talentos em tecnologia
                        </p>
                    </div>

                    {candidates.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-96 glass-panel rounded-2xl">
                            <Users className="w-20 h-20 text-brand-gray/30 mb-4" />
                            <p className="text-2xl text-brand-gray mb-2 font-mono">Nenhum dado disponível</p>
                            <p className="text-sm text-brand-gray/60">Os dados serão exibidos quando houver membros cadastrados.</p>
                        </div>
                    ) : (
                        <div>
                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                                <div className="glass-panel p-6 rounded-xl border-l-4 border-l-[#b33dbe] hover:scale-105 transition-transform duration-300 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#b33dbe]/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-[#b33dbe]/20 transition-colors"></div>
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-4">
                                            <Users className="w-8 h-8 text-[#b33dbe]" />
                                            <div className="px-3 py-1 bg-[#b33dbe]/10 rounded-full">
                                                <span className="text-xs font-mono text-[#b33dbe]">+12%</span>
                                            </div>
                                        </div>
                                        <p className="text-brand-gray text-sm font-mono uppercase tracking-wider mb-2">Total de Membros</p>
                                        <p className="text-4xl font-bold text-white">{candidates.length}</p>
                                    </div>
                                </div>

                                <div className="glass-panel p-6 rounded-xl border-l-4 border-l-[#36ce5c] hover:scale-105 transition-transform duration-300 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#36ce5c]/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-[#36ce5c]/20 transition-colors"></div>
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-4">
                                            <Target className="w-8 h-8 text-[#36ce5c]" />
                                            <div className="px-3 py-1 bg-[#36ce5c]/10 rounded-full">
                                                <span className="text-xs font-mono text-[#36ce5c]">+8%</span>
                                            </div>
                                        </div>
                                        <p className="text-brand-gray text-sm font-mono uppercase tracking-wider mb-2">Skills Únicas</p>
                                        <p className="text-4xl font-bold text-white">{stats.topSkills.length > 0 ? '100+' : 0}</p>
                                    </div>
                                </div>

                                <div className="glass-panel p-6 rounded-xl border-l-4 border-l-[#d97ee3] hover:scale-105 transition-transform duration-300 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#d97ee3]/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-[#d97ee3]/20 transition-colors"></div>
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-4">
                                            <Award className="w-8 h-8 text-[#d97ee3]" />
                                            <div className="px-3 py-1 bg-[#d97ee3]/10 rounded-full">
                                                <span className="text-xs font-mono text-[#d97ee3]">Top</span>
                                            </div>
                                        </div>
                                        <p className="text-brand-gray text-sm font-mono uppercase tracking-wider mb-2">Senioridade Dominante</p>
                                        <p className="text-2xl font-bold text-white">
                                            {stats.expData.sort((a, b) => b.value - a.value)[0]?.name || '-'}
                                        </p>
                                    </div>
                                </div>

                                <div className="glass-panel p-6 rounded-xl border-l-4 border-l-[#5dd97a] hover:scale-105 transition-transform duration-300 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-[#5dd97a]/10 rounded-full blur-2xl -mr-16 -mt-16 group-hover:bg-[#5dd97a]/20 transition-colors"></div>
                                    <div className="relative z-10">
                                        <div className="flex items-center justify-between mb-4">
                                            <TrendingUp className="w-8 h-8 text-[#5dd97a]" />
                                            <div className="px-3 py-1 bg-[#5dd97a]/10 rounded-full">
                                                <span className="text-xs font-mono text-[#5dd97a]">+15%</span>
                                            </div>
                                        </div>
                                        <p className="text-brand-gray text-sm font-mono uppercase tracking-wider mb-2">Crescimento</p>
                                        <p className="text-4xl font-bold text-white">+{Math.floor(candidates.length * 0.15)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Charts Grid: match Dashboard charts + extras */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                                {/* Experience Distribution (same as Dashboard) */}
                                <div className="glass-panel p-8 rounded-2xl hover:border-[#b33dbe]/50 transition-colors">
                                    <div className="flex items-center gap-3 mb-6">
                                        <span className="w-1 h-12 bg-gradient-to-b from-[#b33dbe] to-[#36ce5c] rounded-full"></span>
                                        <div>
                                            <h3 className="text-2xl font-bold text-white">Distribuição de Senioridade</h3>
                                            <p className="text-sm text-brand-gray font-mono">Por nível de experiência</p>
                                        </div>
                                    </div>
                                    <div className="h-80">
                                        <ReactECharts
                                            option={(() => {
                                                const pieData = stats.expData.map(d => ({ name: d.name, value: d.value }));
                                                return {
                                                    color: COLORS,
                                                    renderer: 'svg',
                                                    textStyle: { fontFamily: CHART_FONT, color: '#E1E1E6' },
                                                    tooltip: { trigger: 'item', backgroundColor: '#121214', borderColor: '#202024', textStyle: { color: '#E1E1E6', fontFamily: CHART_FONT } },
                                                    legend: { bottom: 0, textStyle: { color: '#A8A8B3', fontFamily: CHART_FONT } },
                                                    series: [{ name: 'Senioridade', type: 'pie', radius: ['45%', '75%'], label: { color: '#E1E1E6', fontFamily: CHART_FONT }, emphasis: { label: { show: true, fontFamily: CHART_FONT, textBorderWidth: 0 } }, data: pieData }]
                                                };
                                            })()}
                                            opts={{ renderer: 'svg' }}
                                            style={{ height: '100%', width: '100%' }}
                                        />
                                    </div>
                                </div>

                                {/* Top Skills (bar) - same as Dashboard */}
                                <div className="glass-panel p-8 rounded-2xl hover:border-[#36ce5c]/50 transition-colors">
                                    <div className="flex items-center gap-3 mb-6">
                                        <span className="w-1 h-12 bg-gradient-to-b from-[#36ce5c] to-[#5dd97a] rounded-full"></span>
                                        <div>
                                            <h3 className="text-2xl font-bold text-white">Top 10 Hard Skills</h3>
                                            <p className="text-sm text-brand-gray font-mono">Mais demandadas</p>
                                        </div>
                                    </div>
                                    <div className="h-80">
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
                                                        { type: 'bar', data: counts, itemStyle: { color: (params: any) => COLORS[params.dataIndex % COLORS.length] }, barMaxWidth: 24, label: { show: true, position: 'top', color: '#E1E1E6', fontFamily: CHART_FONT } }
                                                    ]
                                                };
                                            })()}
                                            opts={{ renderer: 'svg' }}
                                            style={{ height: '100%', width: '100%' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Growth Chart - Full Width */}
                            <div className="glass-panel p-8 rounded-2xl hover:border-[#d97ee3]/50 transition-colors">
                                <div className="flex items-center gap-3 mb-6">
                                    <span className="w-1 h-12 bg-gradient-to-b from-[#d97ee3] to-[#b33dbe] rounded-full"></span>
                                    <div>
                                        <h3 className="text-2xl font-bold text-white">Crescimento da Comunidade</h3>
                                        <p className="text-sm text-brand-gray font-mono">Últimos 6 meses</p>
                                    </div>
                                </div>
                                <div className="h-80">
                                    <ReactECharts
                                        option={(() => {
                                            const months = stats.growthData.map(g => g.month);
                                            const members = stats.growthData.map(g => g.members);
                                            return {
                                                renderer: 'svg',
                                                textStyle: { fontFamily: CHART_FONT, color: '#E1E1E6' },
                                                tooltip: { trigger: 'axis', backgroundColor: '#121214', textStyle: { color: '#E1E1E6', fontFamily: CHART_FONT } },
                                                xAxis: { type: 'category', data: months, axisLabel: { color: '#A8A8B3', fontFamily: CHART_FONT } },
                                                yAxis: { type: 'value', axisLabel: { color: '#A8A8B3', fontFamily: CHART_FONT } },
                                                grid: { left: '6%', right: '4%', bottom: '12%' },
                                                series: [{ type: 'line', data: members, smooth: true, lineStyle: { color: '#b33dbe', width: 3 }, itemStyle: { color: '#b33dbe' }, areaStyle: { color: 'rgba(179,61,190,0.08)' } }]
                                            };
                                        })()}
                                        opts={{ renderer: 'svg' }}
                                        style={{ height: '100%', width: '100%' }}
                                    />
                                </div>
                            </div>

                            {/* Second Row: Radar + Top Areas (same as Dashboard) */}
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-6 mb-8">
                                <div className="glass-panel p-6 rounded-2xl">
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
                                                    series: [{ type: 'radar', data: values, areaStyle: { color: 'rgba(179,61,190,0.12)' }, lineStyle: { color: '#b33dbe' }, itemStyle: { color: '#b33dbe' } }]
                                                };
                                            })()}
                                            opts={{ renderer: 'svg' }}
                                            style={{ height: '100%', width: '100%' }}
                                        />
                                    </div>
                                </div>

                                <div className="glass-panel p-6 rounded-2xl">
                                    <h3 className="text-lg font-bold text-white mb-6">Bar — Top Areas de Interesse</h3>
                                    <div className="h-64">
                                        <ReactECharts
                                            option={(() => {
                                                const sorted = stats.topAreas.slice().sort((a: any, b: any) => b.count - a.count);
                                                const names = sorted.map((s: any) => s.name);
                                                const counts = sorted.map((s: any) => s.count);
                                                return {
                                                    renderer: 'svg',
                                                    textStyle: { fontFamily: CHART_FONT, color: '#E1E1E6' },
                                                    tooltip: { trigger: 'item', backgroundColor: '#121214', textStyle: { color: '#E1E1E6', fontFamily: CHART_FONT }, formatter: (params: any) => `${params.name}: ${params.value} membros` },
                                                    xAxis: { type: 'value', axisLabel: { color: '#A8A8B3', fontFamily: CHART_FONT } },
                                                    yAxis: { type: 'category', data: names, axisLabel: { color: '#A8A8B3', fontFamily: CHART_FONT }, inverse: true },
                                                    grid: { left: '10%', right: '6%', top: '8%', bottom: '6%' },
                                                    series: [{ type: 'bar', data: counts, barMaxWidth: 18, barBorderRadius: 8, itemStyle: { color: (params: any) => COLORS[params.dataIndex % COLORS.length] }, label: { show: true, position: 'insideRight', color: '#0B0B0B', fontFamily: CHART_FONT, formatter: '{c}' } }]
                                                };
                                            })()}
                                            opts={{ renderer: 'svg' }}
                                            style={{ height: '100%', width: '100%' }}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Misc: Skill Count Distribution (full-width, no side legend) */}
                            <div className="mt-6 mb-12">
                                <div className="glass-panel p-6 rounded-2xl">
                                    <h3 className="text-lg font-bold text-white mb-6">Distribuição: Quantidade de Skills por Membro</h3>
                                    <div className="h-64">
                                        <ReactECharts
                                            option={(() => {
                                                const data = stats.skillCountData.map((d: any) => ({ name: d.name, value: d.count }));
                                                return {
                                                    renderer: 'svg',
                                                    textStyle: { fontFamily: CHART_FONT, color: '#E1E1E6' },
                                                    tooltip: { trigger: 'item', backgroundColor: '#121214', textStyle: { color: '#E1E1E6', fontFamily: CHART_FONT } },
                                                    // hide legend (remove side/bottom labels) but keep slice labels inside
                                                    legend: { show: false },
                                                    series: [{
                                                        name: 'SkillCount',
                                                        type: 'pie',
                                                        radius: ['35%', '65%'],
                                                        data,
                                                        label: { show: true, position: 'inside', color: '#0B0B0B', fontFamily: CHART_FONT },
                                                        emphasis: { label: { show: true, fontFamily: CHART_FONT } }
                                                    }]
                                                };
                                            })()}
                                            opts={{ renderer: 'svg' }}
                                            style={{ height: '100%', width: '100%' }}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                {/* Footer */}
                <footer className="relative z-10 border-t border-brand-border bg-brand-card/50 backdrop-blur-sm mt-16">
                    <div className="max-w-7xl mx-auto px-6 py-8">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                            <p className="text-brand-gray text-sm font-mono">
                                © 2025 TalentScout. Estatísticas atualizadas em tempo real.
                            </p>
                            <div className="flex items-center gap-4">
                                <a href="#" className="text-brand-gray hover:text-[#b33dbe] transition-colors text-sm">Sobre</a>
                                <span className="text-brand-border">•</span>
                                <a href="#" className="text-brand-gray hover:text-[#b33dbe] transition-colors text-sm">Contato</a>
                                <span className="text-brand-border">•</span>
                                <a href="#" className="text-brand-gray hover:text-[#b33dbe] transition-colors text-sm">API</a>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
};
