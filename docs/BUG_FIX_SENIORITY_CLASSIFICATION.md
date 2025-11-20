# 🐛 Bug Fix: Classificação Incorreta de Senioridade

## Problema Identificado

Um candidato de **19 anos**, estudante do **2º período** de Ciência da Computação, procurando sua **primeira oportunidade de estágio**, foi incorretamente classificado como **Senior**.

### Exemplo Real

**Candidato:** Luiz Felipe Schuvarz Eleutério
- **Idade:** 19 anos
- **Período:** 2º semestre de Ciência da Computação
- **Experiência:** Departamento comercial da Code[] (Abril 2025 - atual)
- **Classificação Incorreta:** Senior ❌
- **Classificação Correta:** Trainee ✅

## Causa Raiz

O sistema de classificação tinha **dois problemas críticos**:

### 1. Regex Muito Permissivo para Anos de Experiência

**Código Antigo:**
```typescript
const re = /(\\d+)\\s*(?:\\+)?\\s*(years?|anos?)/i;
```

Este regex capturava **qualquer número seguido de "anos" ou "years"**, incluindo:
- ❌ Datas: "**2025** até o momento" → interpretado como 2025 anos de experiência
- ❌ Idade: "19 **anos**" → interpretado como 19 anos de experiência
- ❌ Contextos irrelevantes: "nos últimos 2 **anos**"

**Código Novo:**
```typescript
const re = /(\\d+)\\s*\\+?\\s*(?:anos?|years?)\\s+(?:de\\s+)?(?:experiência|experiencia|experience|atuação|atuacao)/i;
```

Agora só captura menções **explícitas** de experiência:
- ✅ "5 anos de experiência"
- ✅ "3+ anos de atuação"
- ✅ "2 years of experience"

### 2. Indicadores Profissionais Muito Genéricos

**Código Antigo:**
```typescript
const professionalIndicators = [
  'trabalhou', 'contrat', 'emprego', 'empresa', 
  'profissional', 'contrata', 'contratado', 'cargo', 
  'experiencia', 'experiência', 'anos', 'year', 'years'
];
```

Palavras como "**profissional**" e "**anos**" apareciam em contextos não relacionados:
- ❌ "resumo **profissional**"
- ❌ "19 **anos**"
- ❌ "**trabalho** em equipe" (soft skill)

**Código Novo:**
```typescript
const professionalIndicators = [
  'trabalhou em', 'trabalhou na', 'trabalhou no',
  'contratad', 'empregad', 'cargo de', 'cargo:',
  'experiencia profissional', 'experiência profissional',
  'professional experience', 'atuou como', 'atuou em'
];
```

Agora requer **contexto específico** de trabalho formal.

## Lógica de Classificação Corrigida

```typescript
if (yearsMatch !== null) {
  if (yearsMatch >= 5) {
    finalLevel = 'Senior';    // 5+ anos de experiência explícita
  } else if (yearsMatch >= 2) {
    finalLevel = 'Pleno';     // 2-4 anos de experiência
  } else if (hasInternship) {
    finalLevel = 'Junior';    // Menos de 2 anos + estágio
  } else {
    finalLevel = 'Trainee';   // Menos de 2 anos sem estágio
  }
} else if (hasInternship) {
  finalLevel = 'Junior';      // Tem estágio mas sem anos mencionados
} else {
  finalLevel = 'Trainee';     // Sem evidência de experiência profissional
}
```

## Critérios de Classificação

| Nível | Critérios |
|-------|-----------|
| **Trainee** | Sem experiência profissional (apenas projetos acadêmicos) |
| **Junior** | Pelo menos 1 estágio/freelance OU menos de 2 anos de experiência |
| **Pleno** | 2-4 anos de experiência profissional comprovada |
| **Senior** | 5+ anos de experiência profissional comprovada |

## Impacto da Correção

✅ **Antes:** Estudantes eram classificados como Senior por mencionarem:
- Ano atual (2025)
- Idade
- Soft skills como "trabalho em equipe"

✅ **Depois:** Classificação conservadora e precisa:
- Requer menção **explícita** de anos de experiência
- Contexto profissional **específico**
- Evita falsos positivos

## Teste com o Caso Real

**Currículo do Luiz Felipe:**
- ❌ Não menciona "X anos de experiência"
- ❌ Não tem indicadores de trabalho formal
- ✅ Menciona que está "procurando primeira oportunidade de estágio"
- ✅ Tem experiência em departamento comercial (não técnico)

**Classificação Correta:** **Trainee** ✅

## Próximos Passos

Para aplicar a correção aos currículos já importados:
1. Re-importar os currículos afetados
2. Ou implementar um botão de "Reclassificar Todos" que reprocessa os CVs existentes

---

## 🔄 Segunda Iteração: Corrigindo Falsos Negativos

### Problema Identificado

Após a primeira correção, um candidato **com experiência profissional real** foi classificado como **Trainee**:

**Candidato:** César F. T. Oliveira
- **Desenvolvedor FullStack PHP** na Zievo (11/2024 - Presente)
- **Estagiário Full Stack** na Alpha Lumen (06/2024 - 11/2024)
- **Analista de Infraestrutura** na Pasi Seguros (01/2024 - 06/2024)
- **Técnico de Informática** (09/2022 - 01/2024)
- **Total:** ~2 anos de experiência profissional

**Classificação Incorreta:** Trainee ❌  
**Classificação Correta:** Pleno/Junior ✅

### Causa

A primeira correção foi **muito restritiva**. O currículo não mencionava explicitamente "X anos de experiência", então o sistema não detectava a experiência profissional.

### Solução: Detecção de Títulos de Cargo

Adicionamos detecção de **títulos profissionais comuns**:

```typescript
const jobTitleIndicators = [
  'desenvolvedor', 'developer', 'programador', 'programmer',
  'analista', 'analyst', 'engenheiro', 'engineer',
  'tecnico', 'técnico', 'technician',
  'coordenador', 'coordinator', 'gerente', 'manager',
  'consultor', 'consultant', 'especialista', 'specialist'
];

const hasRealProfessionalExperience = (hasJobTitle || hasProfessional) 
  && !searchText.toLowerCase().includes('procurando primeira oportunidade');
```

### Nova Lógica

```typescript
if (yearsMatch !== null) {
  // Tem menção explícita de anos
  if (yearsMatch >= 5) finalLevel = 'Senior';
  else if (yearsMatch >= 2) finalLevel = 'Pleno';
  else if (hasInternship || hasRealProfessionalExperience) finalLevel = 'Junior';
  else finalLevel = 'Trainee';
} else if (hasRealProfessionalExperience && !hasInternship) {
  // Tem título profissional mas sem anos explícitos
  // Confia mais na avaliação do modelo Gemini
  finalLevel = modelLevel === 'Trainee' ? 'Junior' : modelLevel;
} else if (hasInternship) {
  finalLevel = 'Junior';
} else {
  finalLevel = 'Trainee';
}
```

### Proteção Contra Falsos Positivos

✅ **Mantém** a proteção contra:
- Datas (2025)
- Idade (19 anos)
- Contextos irrelevantes

✅ **Adiciona** detecção de:
- Títulos de cargo profissionais
- Indicadores de trabalho formal
- Verificação de "procurando primeira oportunidade" (para Trainees reais)

### Resultado

| Candidato | Experiência | Antes | Depois |
|-----------|-------------|-------|--------|
| Luiz Felipe | Estudante, 2º período, procurando estágio | Senior ❌ | Trainee ✅ |
| César | Desenvolvedor com 2 anos de experiência | Trainee ❌ | Pleno/Junior ✅ |

---

**Data da Correção:** 2025-11-20  
**Iteração 2:** 2025-11-20 15:08  
**Arquivos Modificados:** `services/geminiService.ts`

