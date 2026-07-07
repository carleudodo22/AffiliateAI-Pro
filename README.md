# AffiliateAI Pro

**AffiliateAI Pro** é um SaaS local de automação para marketing de afiliados, criado com foco em transformar ideias de produtos em campanhas completas usando agentes inteligentes.

O sistema ajuda a analisar oportunidades, gerar conteúdo, criar briefing visual, montar pacotes de campanha e organizar tudo em histórico por usuário.

---

## Status do Projeto

**MVP local funcional**

O projeto já possui autenticação, backend, banco de dados, frontend premium, histórico unificado e múltiplos agentes funcionando em ambiente local.

---

## Funcionalidades

### Autenticação

- Cadastro de usuário
- Login
- Token JWT
- Sessão persistente no navegador

### Dashboard

- Visão geral do sistema
- Total de campanhas criadas
- Total de análises de produto
- Total de conteúdos gerados
- Total de criativos visuais
- Score médio
- Melhor produto
- Últimas ações
- Status dos agentes

### Autopilot

Agente responsável por montar campanhas completas de afiliados.

Gera:

- Produto sugerido
- Marketplace
- Score da oportunidade
- Decisão estratégica
- Estratégia de campanha
- Headline
- Copy curta
- Roteiro de vídeo
- Briefing de imagem
- Narração
- Checklist de execução

### Product Hunter

Agente responsável por analisar produtos para afiliados.

Gera:

- Score do produto
- Análise de demanda
- Concorrência
- Risco
- Estratégia recomendada
- Ideias de conteúdo
- Histórico de análises

### Content Generator

Agente responsável por gerar conteúdo de campanha.

Gera:

- Headline
- Copy curta
- Legenda
- Roteiro de vídeo
- Texto para WhatsApp
- CTA
- Hashtags
- Variações de anúncio

### Creative Image Agent

Agente responsável por criar direção visual para artes de afiliados.

Gera:

- Título da arte
- Subtítulo
- CTA visual
- Briefing visual
- Prompt de imagem
- Negative prompt
- Direção de layout
- Estilo de fundo
- Direção de tipografia
- Paleta de cores
- Checklist visual

### Campaign Package

Central que junta os últimos dados gerados pelos agentes em um pacote completo.

Combina:

- Autopilot
- Product Hunter
- Content Generator
- Creative Image

Entrega:

- Estratégia
- Copy
- Legenda
- Roteiro
- Prompt visual
- Texto da arte
- Checklist
- Campanha completa pronta para copiar

### Histórico Geral

Histórico unificado com:

- Campanhas do Autopilot
- Análises do Product Hunter
- Conteúdos gerados
- Criativos visuais

### Configurações

Central de preferências do usuário com:

- Nicho padrão
- Canal padrão
- Estilo de campanha
- Orçamento padrão
- Marketplace padrão
- Idioma

As preferências salvas alimentam os agentes automaticamente.

---

## Stack Utilizada

### Backend

- Python
- FastAPI
- SQLAlchemy
- PostgreSQL
- Redis
- JWT
- Docker Compose

### Frontend

- Next.js
- React
- TypeScript
- CSS puro
- LocalStorage

### Banco e Infra

- PostgreSQL
- Redis
- Docker
- Docker Compose

---

## Estrutura do Projeto

```txt
AffiliateAI-Pro/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   ├── core/
│   │   ├── db/
│   │   ├── models/
│   │   ├── schemas/
│   │   ├── services/
│   │   └── main.py
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/app/
│   │   ├── components/
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── package.json
│   └── .env.local
├── docker-compose.yml
├── .env
└── README.md
```

---

## Como Rodar o Projeto

### 1. Clonar o repositório

```bash
git clone https://github.com/carleudodo22/AffiliateAI-Pro.git
cd AffiliateAI-Pro
```

---

## Backend

### Subir backend, banco e Redis

Na raiz do projeto:

```bash
docker compose up --build backend db redis
```

Backend:

```txt
http://localhost:8000
```

Documentação Swagger:

```txt
http://localhost:8000/docs
```

Health check:

```txt
http://localhost:8000/health
```

---

## Frontend

Em outro terminal:

```bash
cd frontend
npm install
npm.cmd run dev
```

Frontend:

```txt
http://localhost:3000
```

---

## Variáveis de Ambiente

### `.env`

```env
PROJECT_NAME=AffiliateAI Pro
ENVIRONMENT=development

BACKEND_PORT=8000
FRONTEND_PORT=3000

POSTGRES_USER=affiliate_user
POSTGRES_PASSWORD=affiliate_password
POSTGRES_DB=affiliate_ai_pro
POSTGRES_HOST=db
POSTGRES_PORT=5432
DATABASE_URL=postgresql+psycopg://affiliate_user:affiliate_password@db:5432/affiliate_ai_pro

REDIS_HOST=redis
REDIS_PORT=6379
REDIS_URL=redis://redis:6379/0

SECRET_KEY=change_this_later_affiliateai_pro_secret
ACCESS_TOKEN_EXPIRE_MINUTES=60
```

### `frontend/.env.local`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Principais Rotas da API

### Auth

```txt
POST /api/auth/register
POST /api/auth/login
GET  /api/auth/me
```

### Autopilot

```txt
POST /api/autopilot/run
GET  /api/autopilot/history
GET  /api/autopilot/{run_id}
```

### Product Hunter

```txt
POST /api/product-hunter/analyze
GET  /api/product-hunter/history
GET  /api/product-hunter/{id}
```

### Content Generator

```txt
POST /api/content-generator/generate
GET  /api/content-generator/history
GET  /api/content-generator/{content_id}
```

### Creative Image

```txt
POST /api/creative-image/generate
GET  /api/creative-image/history
GET  /api/creative-image/{creative_id}
```

---

## Fluxo Principal do Sistema

```txt
1. Usuário faz login
2. Define preferências nas Configurações
3. Roda o Autopilot
4. Analisa produto no Product Hunter
5. Gera conteúdo no Content Generator
6. Gera criativo visual no Creative Image
7. Junta tudo no Campaign Package
8. Consulta tudo no Histórico Geral
```

---

## Roadmap

### Próximas melhorias

- Integrar IA real para geração de conteúdo
- Salvar preferências no banco de dados
- Criar exportação em PDF
- Criar exportação em ZIP
- Criar planos Free, Pro e Premium
- Criar painel administrativo
- Melhorar responsividade mobile
- Adicionar busca e filtros no histórico
- Criar deploy online
- Criar landing page pública

---

## Observação

Este projeto está em fase de MVP local.  
A estrutura já simula o funcionamento de um SaaS real, mas ainda precisa de integrações externas e melhorias de produção antes de ser publicado para usuários finais.

---

## Autor

Projeto desenvolvido por **Kython** como parte da construção do AffiliateAI Pro.