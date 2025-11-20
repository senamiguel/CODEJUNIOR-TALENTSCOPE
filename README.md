<div align="center">
<img width="1200" height="475" alt="GHBanner" src="./public/images/code.png" />
</div>

---

# TalentScout — Junior Enterprise Member Finder

Este repositório é a interface e o serviço de apoio para um sistema interno de uma Junior Enterprise que facilita o upload, análise e busca por currículos (CVs). Ele combina um front-end em React + Vite com serviços de parsing e um cliente para APIs generativas (Gemini) e Firebase.

Principais pontos:
- Upload de CVs (DOCX, TXT, PDF).
- **Detecção automática de currículos duplicados** (por email ou nome+curso).
- Extração de texto (DOCX via mammoth). Para PDFs é recomendado extrair texto (podemos adicionar pdfjs-dist) para melhores heurísticas.
- Análise de currículo via Google GenAI (Gemini).
- Classificação conservadora de nível de experiência: por padrão um perfil sem evidência explícita de experiência profissional será classificado como `Trainee`. `Junior` só quando houver indicação de estágio/freelance; `Pleno`/`Senior` apenas quando houver indicação explícita de anos de experiência.

## Executando localmente

Requisitos: Node.js (versão compatível com o projeto), npm.

1. Instale dependências:

   npm install

2. Crie/edite `.env.local` (não comitar) e defina as variáveis necessárias com o prefixo `VITE_` para que o Vite as exponha ao cliente. Exemplo:

   VITE_GEMINI_API_KEY=your_gemini_api_key_here
   VITE_FIREBASE_API_KEY=your_firebase_api_key_here
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_PROJECT_ID=...

   Nota: variáveis sem `VITE_` não estarão disponíveis no bundle do cliente.

3. Rode o servidor de desenvolvimento:

   npm run dev

4. Abra http://localhost:5173 (ou a porta indicada pelo Vite).

## Comportamento relevante e observações

- O serviço de parsing usa o cliente GenAI e aplica heurísticas determinísticas adicionais para reduzir classificações incorretas (por exemplo, evitar marcar perfis sem experiência como `Junior` ou `Senior`).
- Para OCR/extração de texto de PDFs, é recomendado adicionar `pdfjs-dist` para incluir texto nos heurísticos antes de enviar ao modelo.
- Não comite chaves em repositórios públicos. `.env.local` deve estar no `.gitignore`.


## Testes e verificação

- O projeto é escrito em TypeScript. Para checar tipos localmente rode:

  npx tsc --noEmit

- Para validação rápida de lint/testes (se existirem), execute os scripts correspondentes no `package.json`.

## Detecção de Duplicatas

O sistema possui proteção automática contra currículos duplicados. Para mais detalhes sobre como funciona, consulte a [documentação completa de detecção de duplicatas](./docs/DUPLICATE_DETECTION.md).

