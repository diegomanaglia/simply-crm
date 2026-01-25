# Simply CRM

<div align="center">

**Sistema de CRM completo com Kanban, integrações e analytics**

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38B2AC?style=flat-square&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?style=flat-square&logo=supabase)](https://supabase.com/)

</div>

---

## 📋 Sobre o Projeto

Simply CRM é uma aplicação web moderna e completa para gestão de relacionamento com clientes, desenvolvida com foco em usabilidade, performance e escalabilidade. O sistema oferece uma interface intuitiva estilo Kanban para gerenciamento de leads e negócios, com integrações poderosas para automação de marketing.

### 🎯 Objetivo

Este projeto foi desenvolvido como demonstração de habilidades em desenvolvimento full-stack, abrangendo desde a arquitetura de frontend com React até a implementação de backend serverless com Supabase Edge Functions.

---

## ✨ Funcionalidades Principais

### 🗂️ Gestão de Pipelines e Kanban

- **Múltiplos Pipelines**: Crie e gerencie diferentes pipelines de vendas
- **Drag & Drop**: Interface Kanban com arrastar e soltar usando @dnd-kit
- **Fases Personalizáveis**: Adicione, edite e reordene fases do pipeline
- **Fases Obrigatórias**: Sistema com fases "Entrada", "Ganho" e "Perdido" integradas

### 💼 Gestão de Negócios (Deals)

- **CRUD Completo**: Criação, edição, duplicação e arquivamento de negócios
- **Temperatura de Lead**: Classificação visual (Frio, Morno, Quente)
- **Tags Personalizadas**: Sistema de etiquetas com cores customizáveis
- **Histórico de Atividades**: Registro completo de todas as interações
- **Dados de Origem**: Rastreamento de UTM, referrer, dispositivo e mais
- **Arquivamento**: Sistema de arquivo com possibilidade de restauração

### 📊 Dashboard e Relatórios

- **KPIs em Tempo Real**: Total de leads, taxa de conversão, valor em negociação
- **Gráficos Interativos**: Visualizações com Recharts (Pizza, Barras, Funil)
- **Filtros Avançados**: Por período, pipeline, temperatura e origem
- **Exportação de Dados**: Suporte para Excel (.xlsx), CSV e PDF

### 🔐 Autenticação e Segurança

- **Sistema de Auth Completo**: Login, registro, recuperação de senha
- **Perfis de Usuário**: Gerenciamento de dados pessoais e avatar
- **Multi-tenancy**: Isolamento de dados por usuário com RLS
- **Row Level Security**: Políticas de segurança no nível do banco de dados

### 🔗 Integrações

#### Facebook Lead Ads
- Conexão OAuth com Facebook Business
- Mapeamento de formulários para pipelines
- Sincronização automática de leads
- Auto-tags e temperatura padrão por formulário

#### Google Ads
- Integração com Google Ads API
- Mapeamento de campanhas para pipelines
- Métricas de performance (impressões, cliques, custo)
- Envio de conversões offline (Offline Conversion Tracking)

#### Google Analytics 4
- Rastreamento de eventos customizados
- Eventos: lead_captured, deal_won, deal_moved
- Configuração de metas de conversão

#### Webhooks
- **Outbound**: Disparo de eventos para sistemas externos
- **Inbound**: Recebimento de leads via webhook
- Mapeamento flexível de campos
- HMAC signatures para segurança
- Rate limiting e IP whitelist
- Logs detalhados de requisições

### 📝 Formulários de Captura

- **Páginas Públicas**: Landing pages para captura de leads
- **Personalização por Pipeline**: Ativar/desativar por pipeline
- **Rastreamento UTM**: Captura automática de parâmetros de campanha
- **Script de Tracking**: Código JavaScript para embed em sites externos

### 🎨 Interface e UX

- **Design System**: Componentes shadcn/ui customizados
- **Tema Claro/Escuro**: Alternância com persistência
- **Sidebar Responsiva**: Colapsa para modo mini em telas menores
- **Atalhos de Teclado**: N (novo deal), P (pipelines), / (busca)
- **Loading States**: Feedback visual em todas as operações
- **Validações**: Máscaras e validação para telefone, email, CPF/CNPJ

### 🚀 Onboarding

- **Tour Guiado**: Introdução em 3 etapas para novos usuários
- **Pipeline Padrão**: Criação automática do pipeline "Vendas"
- **Persistência**: Marca conclusão no perfil do usuário

---

## 🛠️ Tecnologias Utilizadas

### Frontend
| Tecnologia | Uso |
|------------|-----|
| **React 18** | Biblioteca principal de UI |
| **TypeScript** | Tipagem estática |
| **Vite** | Build tool e dev server |
| **Tailwind CSS** | Estilização utility-first |
| **shadcn/ui** | Componentes de UI |
| **Radix UI** | Primitivos acessíveis |
| **React Router** | Roteamento SPA |
| **TanStack Query** | Gerenciamento de estado servidor |
| **Zustand** | Gerenciamento de estado local |
| **React Hook Form** | Formulários performáticos |
| **Zod** | Validação de schemas |
| **@dnd-kit** | Drag and drop |
| **Recharts** | Gráficos e visualizações |
| **Framer Motion** | Animações |
| **date-fns** | Manipulação de datas |
| **Lucide React** | Ícones |

### Backend (Supabase)
| Tecnologia | Uso |
|------------|-----|
| **PostgreSQL** | Banco de dados relacional |
| **Row Level Security** | Segurança no nível de dados |
| **Edge Functions** | Lógica serverless (Deno) |
| **Auth** | Autenticação e autorização |
| **Realtime** | Sincronização em tempo real |

### Integrações Externas
| Serviço | Funcionalidade |
|---------|----------------|
| **Facebook Graph API** | Lead Ads sync |
| **Google Ads API** | Métricas e conversões |
| **Google Analytics 4** | Rastreamento de eventos |

---

## 📁 Estrutura do Projeto

```
src/
├── components/
│   ├── auth/           # Componentes de autenticação
│   ├── deals/          # Cards e modais de negócios
│   ├── export/         # Importação e exportação
│   ├── integrations/   # Cards de integrações
│   ├── kanban/         # Board e colunas Kanban
│   ├── layout/         # Layout principal e sidebar
│   ├── onboarding/     # Tour de boas-vindas
│   ├── ui/             # Componentes shadcn/ui
│   └── webhooks/       # Gestão de webhooks
├── contexts/
│   ├── AuthContext.tsx    # Estado de autenticação
│   └── SidebarContext.tsx # Estado da sidebar
├── hooks/
│   ├── use-analytics-*.ts # Hooks de analytics
│   ├── use-facebook-*.ts  # Hooks do Facebook
│   ├── use-google-*.ts    # Hooks do Google
│   ├── use-webhooks.ts    # Hooks de webhooks
│   └── use-*.ts           # Outros hooks utilitários
├── lib/
│   ├── analytics.ts    # Funções de analytics
│   ├── csv-export.ts   # Exportação CSV
│   ├── pdf-export.ts   # Exportação PDF
│   └── validators.ts   # Validadores
├── pages/              # Páginas da aplicação
├── store/
│   └── crmStore.ts     # Estado global Zustand
├── types/              # Definições TypeScript
└── integrations/
    └── supabase/       # Cliente e tipos Supabase

supabase/
├── functions/          # Edge Functions
│   ├── facebook-sync/
│   ├── google-ads-sync/
│   ├── google-offline-conversion/
│   ├── webhook-receive/
│   └── webhook-trigger/
└── migrations/         # Migrações SQL
```

---

## 🗄️ Modelo de Dados

```
┌─────────────────┐     ┌──────────────────────┐
│    profiles     │     │  analytics_settings  │
├─────────────────┤     ├──────────────────────┤
│ id (FK auth)    │     │ user_id              │
│ full_name       │     │ ga4_measurement_id   │
│ email           │     │ tracking_enabled     │
│ avatar_url      │     └──────────────────────┘
│ onboarding_done │
└─────────────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────────────┐
│    webhooks     │────▶│    webhook_logs      │
├─────────────────┤     ├──────────────────────┤
│ user_id         │     │ webhook_id           │
│ name, url       │     │ status, payload      │
│ events[]        │     │ response_status      │
│ is_active       │     └──────────────────────┘
└─────────────────┘

┌─────────────────────┐     ┌────────────────────────┐
│ facebook_integrations│────▶│ facebook_form_mappings │
├─────────────────────┤     ├────────────────────────┤
│ owner_id            │     │ integration_id         │
│ access_token        │     │ form_id, page_id       │
│ user_name           │     │ pipeline_id, phase_id  │
│ pages[]             │     │ auto_tags[]            │
└─────────────────────┘     └────────────────────────┘
         │
         ▼
┌─────────────────────┐
│  facebook_sync_logs │
├─────────────────────┤
│ integration_id      │
│ leads_imported      │
│ status              │
└─────────────────────┘

┌─────────────────────┐     ┌────────────────────────┐
│ google_integrations │────▶│ google_campaign_mappings│
├─────────────────────┤     ├────────────────────────┤
│ user_id             │     │ integration_id         │
│ access_token        │     │ campaign_id            │
│ refresh_token       │     │ pipeline_id            │
│ ads_accounts[]      │     └────────────────────────┘
└─────────────────────┘
         │
         ├────▶ google_ads_metrics
         ├────▶ google_offline_conversions
         └────▶ google_sync_logs
```

---

## 🔒 Segurança

O projeto implementa múltiplas camadas de segurança:

1. **Autenticação**: Sistema completo com Supabase Auth
2. **Row Level Security**: Todas as tabelas protegidas por RLS
3. **Multi-tenancy**: Isolamento de dados por `user_id`/`owner_id`
4. **HMAC Signatures**: Webhooks assinados para integridade
5. **Rate Limiting**: Proteção contra abuso em webhooks
6. **IP Whitelist**: Restrição de IPs para endpoints sensíveis

---

## 🚀 Como Executar

### Pré-requisitos

- Node.js 18+
- npm ou bun

### Instalação

```bash
# Clone o repositório
git clone <url-do-repositorio>

# Instale as dependências
npm install

# Execute em modo desenvolvimento
npm run dev
```

### Variáveis de Ambiente

O projeto utiliza Lovable Cloud (Supabase) para backend. As variáveis são configuradas automaticamente:

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`

---

## 📸 Screenshots

> *Screenshots da aplicação podem ser adicionados aqui*

---

## 👨‍💻 Autor

Desenvolvido como projeto de portfólio demonstrando habilidades em:

- ✅ Arquitetura de aplicações React escaláveis
- ✅ TypeScript avançado com tipagem forte
- ✅ Design systems e componentes reutilizáveis
- ✅ Integração com APIs externas (OAuth, REST)
- ✅ Backend serverless com Edge Functions
- ✅ Segurança de dados com RLS e multi-tenancy
- ✅ UX/UI moderno com acessibilidade

---

## 📄 Licença

Este projeto é apenas para demonstração de portfólio.

---

<div align="center">

**[⬆ Voltar ao topo](#simply-crm)**

</div>
