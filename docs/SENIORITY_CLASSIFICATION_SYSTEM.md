# 🎯 Sistema de Classificação de Senioridade - Versão Final

## Lógica de Classificação Balanceada

O sistema agora usa uma abordagem **multi-camadas** para classificar candidatos com precisão:

### 📊 Fluxograma de Decisão

```
┌─────────────────────────────────────────────────────────────┐
│ 1. DETECTAR ANOS EXPLÍCITOS DE EXPERIÊNCIA                 │
│    Regex: "X anos de experiência/atuação"                  │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ├─ SIM ──┬─ >= 5 anos ──> SENIOR
                 │        ├─ >= 2 anos ──> PLENO
                 │        ├─ < 2 anos + (estágio OU cargo profissional) ──> JUNIOR
                 │        └─ < 2 anos (sem evidência) ──> TRAINEE
                 │
                 └─ NÃO ──┐
                          │
┌─────────────────────────┴───────────────────────────────────┐
│ 2. DETECTAR TÍTULOS PROFISSIONAIS                          │
│    (Desenvolvedor, Analista, Engenheiro, etc.)             │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ├─ SIM + NÃO é estágio ──> Confiar no modelo Gemini
                 │                           (mínimo: JUNIOR)
                 │
                 └─ NÃO ──┐
                          │
┌─────────────────────────┴───────────────────────────────────┐
│ 3. DETECTAR INDICADORES DE ESTÁGIO                         │
│    (Estagiário, Intern, Freelancer)                        │
└────────────────┬────────────────────────────────────────────┘
                 │
                 ├─ SIM ──> JUNIOR
                 │
                 └─ NÃO ──> TRAINEE
```

## 🛡️ Proteções Implementadas

### ✅ Contra Falsos Positivos (Trainee → Senior)

| Padrão Detectado | Antes | Depois |
|------------------|-------|--------|
| "2025" (ano atual) | ❌ 2025 anos de exp. | ✅ Ignorado |
| "19 anos" (idade) | ❌ 19 anos de exp. | ✅ Ignorado |
| "trabalho em equipe" | ❌ Experiência prof. | ✅ Ignorado |
| "resumo profissional" | ❌ Experiência prof. | ✅ Ignorado |

**Solução:** Regex específico que requer contexto explícito:
```typescript
/(\\d+)\\s*\\+?\\s*(?:anos?|years?)\\s+(?:de\\s+)?(?:experiência|experiencia|experience|atuação|atuacao)/i
```

### ✅ Contra Falsos Negativos (Pleno → Trainee)

| Padrão Detectado | Antes | Depois |
|------------------|-------|--------|
| "Desenvolvedor FullStack" | ❌ Não detectado | ✅ Cargo profissional |
| "Analista de TI" | ❌ Não detectado | ✅ Cargo profissional |
| Múltiplos empregos formais | ❌ Não detectado | ✅ Experiência real |

**Solução:** Lista de títulos profissionais comuns:
```typescript
const jobTitleIndicators = [
  'desenvolvedor', 'developer', 'programador', 'programmer',
  'analista', 'analyst', 'engenheiro', 'engineer',
  'tecnico', 'técnico', 'technician',
  'coordenador', 'coordinator', 'gerente', 'manager',
  'consultor', 'consultant', 'especialista', 'specialist'
];
```

## 📝 Casos de Teste

### ✅ Caso 1: Estudante Sem Experiência (Trainee)

**Perfil:**
- 19 anos, 2º período
- Procurando primeira oportunidade de estágio
- Apenas projetos acadêmicos

**Detecção:**
- ❌ Sem anos explícitos de experiência
- ❌ Sem títulos profissionais
- ❌ Sem estágios
- ✅ Contém "procurando primeira oportunidade"

**Resultado:** **TRAINEE** ✅

---

### ✅ Caso 2: Desenvolvedor com 2 Anos (Pleno/Junior)

**Perfil:**
- Desenvolvedor FullStack PHP (atual)
- Estagiário Full Stack (6 meses)
- Analista de Infraestrutura (6 meses)
- Técnico de Informática (1+ ano)

**Detecção:**
- ❌ Sem menção explícita de "X anos de experiência"
- ✅ Títulos profissionais detectados: "Desenvolvedor", "Analista", "Técnico"
- ✅ Múltiplas experiências formais
- ❌ Não contém "procurando primeira oportunidade"

**Resultado:** **PLENO/JUNIOR** ✅ (depende da avaliação do Gemini)

---

### ✅ Caso 3: Estagiário (Junior)

**Perfil:**
- Estagiário em desenvolvimento
- 6 meses de experiência
- Projetos acadêmicos

**Detecção:**
- ❌ Sem anos explícitos
- ✅ Indicador de estágio detectado
- ✅ Título "Estagiário"

**Resultado:** **JUNIOR** ✅

---

### ✅ Caso 4: Senior Experiente (Senior)

**Perfil:**
- "5+ anos de experiência em desenvolvimento"
- Múltiplos projetos complexos

**Detecção:**
- ✅ Regex captura: "5 anos de experiência"
- ✅ yearsMatch = 5
- ✅ >= 5 anos

**Resultado:** **SENIOR** ✅

## 🔧 Configuração Atual

```typescript
// Critérios de anos
SENIOR: >= 5 anos de experiência explícita
PLENO:  >= 2 anos de experiência explícita
JUNIOR: < 2 anos OU estágio OU cargo profissional sem anos
TRAINEE: Sem evidência de experiência profissional

// Prioridade de detecção
1. Anos explícitos (mais confiável)
2. Títulos profissionais + avaliação do Gemini
3. Indicadores de estágio
4. Padrão: Trainee
```

## 🎓 Aprendizados

1. **Regex muito permissivo** = Falsos positivos (Trainee → Senior)
2. **Regex muito restritivo** = Falsos negativos (Pleno → Trainee)
3. **Solução:** Abordagem multi-camadas com validação cruzada
4. **Importante:** Confiar no modelo Gemini quando há títulos profissionais mas sem anos explícitos

## 🚀 Próximas Melhorias Sugeridas

1. **Análise de datas:** Calcular anos de experiência a partir de datas de início/fim
2. **Machine Learning:** Treinar modelo específico para classificação
3. **Feedback do usuário:** Permitir correção manual e aprender com os ajustes
4. **Pesos por tipo de experiência:** Estágio = 0.5x, Freelance = 0.75x, CLT = 1x

---

**Versão:** 2.0  
**Data:** 2025-11-20  
**Status:** ✅ Produção
