# Detecção de Currículos Duplicados

## Visão Geral

O sistema TalentScout-JE agora possui proteção contra currículos duplicados. Quando você tenta fazer upload de um currículo que já existe no sistema, ele será automaticamente detectado e ignorado, com uma mensagem de aviso clara.

## Como Funciona

### Critérios de Detecção

O sistema usa uma abordagem de **dois níveis** para detectar duplicatas:

1. **Verificação Primária - Por Email**
   - Se ambos os currículos (novo e existente) possuem email
   - Os emails são comparados de forma normalizada (sem distinção de maiúsculas/minúsculas, sem espaços extras)
   - Se os emails forem iguais, é considerado duplicata

2. **Verificação Secundária - Por Nome + Curso**
   - Se a verificação por email não for possível (email ausente)
   - Compara a combinação de Nome + Curso
   - Ambos são normalizados (sem acentos, sem distinção de maiúsculas, sem espaços extras)
   - Se ambos forem iguais, é considerado duplicata

### Normalização de Strings

Para garantir detecção robusta, todas as comparações passam por normalização:

- **Lowercase**: "João" = "joão"
- **Sem acentos**: "José" = "Jose"
- **Sem espaços extras**: "Maria  Silva" = "Maria Silva"
- **Trim**: "  Pedro  " = "Pedro"

## Feedback Visual

### Avisos de Duplicata

Quando um duplicado é detectado:
- ⚠️ **Ícone de aviso amarelo** (não é um erro crítico)
- **Mensagem clara** indicando qual candidato foi ignorado
- **Identificador**: Mostra o email ou nome+curso do candidato
- **Nome do arquivo**: Indica qual arquivo foi ignorado

Exemplo:
```
⚠️ Duplicado ignorado: joao.silva@email.com - curriculo_joao_v2.pdf
```

### Diferenciação de Erros

O painel de avisos agora distingue entre:
- **Duplicatas** (texto amarelo): Avisos de currículos já existentes
- **Erros reais** (texto vermelho): Falhas no processamento de arquivos

## Arquivos Modificados

### `/store/CVContext.tsx`
- Adicionada lógica de detecção de duplicatas antes de salvar no banco
- Integração com funções utilitárias
- Mensagens de erro melhoradas com emojis

### `/utils/duplicateDetection.ts` (NOVO)
- `normalizeString()`: Normaliza strings para comparação
- `checkDuplicate()`: Verifica se um candidato é duplicado
- `getCandidateIdentifier()`: Gera identificador amigável

### `/components/UploadArea.tsx`
- Painel de erros atualizado para diferenciar avisos e erros
- Cores diferentes: amarelo para duplicatas, vermelho para erros
- Altura aumentada para melhor visualização

## Casos de Uso

### Cenário 1: Upload do mesmo arquivo duas vezes
```
1º Upload: ✅ João Silva processado com sucesso
2º Upload: ⚠️ Duplicado ignorado: joao.silva@email.com - curriculo_joao.pdf
```

### Cenário 2: Mesmo candidato, arquivos diferentes
```
1º Upload: ✅ Maria Santos (Engenharia) processada
2º Upload: ⚠️ Duplicado ignorado: Maria Santos (Engenharia) - maria_atualizado.pdf
```

### Cenário 3: Nomes similares com acentos
```
Existente: José da Silva
Novo: Jose da Silva
Resultado: ⚠️ Detectado como duplicata (normalização remove acentos)
```

## Benefícios

✅ **Evita dados redundantes** no banco de dados
✅ **Economiza processamento** da API Gemini
✅ **Feedback claro** para o usuário
✅ **Detecção robusta** com normalização de strings
✅ **Não bloqueia o processo** - continua processando outros arquivos

## Limitações

⚠️ **Variações de nome**: "João Silva" vs "João P. Silva" não são detectados como duplicatas
⚠️ **Emails diferentes**: Se o mesmo candidato usar emails diferentes, não será detectado
⚠️ **Mudança de curso**: Se o candidato mudar de curso, pode ser adicionado novamente

## Melhorias Futuras

- [ ] Detecção por similaridade de nome (fuzzy matching)
- [ ] Verificação por CPF/documento
- [ ] Opção de "forçar atualização" de currículo existente
- [ ] Histórico de versões de currículos
