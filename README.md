# LTM Automação — Gestão de Viagens e Montagens

SaaS para organizar viagens de montadores, acompanhar a montagem de
equipamentos industriais em clientes (cerâmicas) e dar visibilidade em tempo
real a gestores.

Identidade visual baseada no logo oficial da LTM Automação (verde `#01AB4D`,
grafite `#2E2B2C`).

## Status do projeto

Construído em fases. Build validado (`npm run build`) e fluxo de
autenticação/permissões testado ponta a ponta em navegador real a cada fase.

- [x] **Fase 1** — arquitetura, banco, Prisma, autenticação, papéis de
      usuário (Administrador / Montador / Espectador), identidade visual, logo.
- [x] **Fase 2** — clientes, viagens (com equipe e dados de deslocamento/
      hospedagem), montadores, usuários, equipamentos e cálculo automático
      de progresso (%) por viagem.
- [x] **Fase 3** — observação por equipamento, fotos (upload real, disco
      local ou Supabase Storage), pendências (abrir/resolver) e timeline
      automática da viagem.
- [ ] Fase 4 — dashboard, tela do montador, tela do espectador
- [ ] Fase 5 — localização e clima
- [ ] Fase 6 — notificações (push) e tempo real
- [ ] Fase 7 — PWA, responsividade final, segurança, testes

## Stack

- **Frontend/Backend:** Next.js 15 (App Router) + TypeScript
- **UI:** Tailwind CSS v4
- **Banco:** PostgreSQL + Prisma ORM
- **Autenticação:** Auth.js (NextAuth v5), credenciais (e-mail/senha) com
  sessão JWT e senha com hash `bcrypt`
- **Locais próximos** (Fase 5): OpenStreetMap (Nominatim + Overpass) —
  **sem chave paga**, ao contrário do Google Places pedido originalmente
- **Clima** (Fase 5): Open-Meteo — **sem chave**, ao contrário do OpenWeather
  pedido originalmente
- **Notificações push** (Fase 6): Web Push com chaves VAPID geradas
  localmente — sem depender de conta de terceiro
- **Fotos** (Fase 3): Supabase Storage/S3 se configurado; senão, disco local
  em `/public/uploads` (funcional, mas não recomendado em produção)

> Por que trocar Google Places/OpenWeather por OpenStreetMap/Open-Meteo? O
> projeto não tinha chaves de API configuradas. Essas alternativas são
> gratuitas, não exigem cadastro nem cartão, e entregam dados reais — em vez
> de exibir "não configurado" em duas das telas mais visíveis do app.

## Papéis de usuário

| Papel | Área | Acesso |
|---|---|---|
| ADMIN | `/admin` | completo |
| MONTADOR | `/app` | próprias viagens |
| ESPECTADOR | `/espectador` | somente leitura, viagens autorizadas |

O middleware (`src/middleware.ts`) bloqueia cada área para quem não tem o
papel correspondente e redireciona para a área correta.

## Instalação

### 1. Pré-requisitos

- Node.js 20+
- PostgreSQL 14+ rodando localmente (ou uma URL de conexão remota)

### 2. Instalar dependências

```bash
npm install --legacy-peer-deps
```

(`--legacy-peer-deps` é necessário por causa do NextAuth v5 ainda estar em
beta; não indica um problema no projeto.)

### 3. Configurar variáveis de ambiente

```bash
cp .env.example .env
```

Edite `.env`:

- `DATABASE_URL`: string de conexão do seu Postgres
- `AUTH_SECRET`: gere com `openssl rand -base64 32`
- Demais chaves (`GOOGLE_MAPS_API_KEY`, `WEATHER_API_KEY`, `VAPID_*`,
  `SUPABASE_*`) só serão necessárias a partir das Fases 5 e 6 — pode deixar
  em branco por enquanto.

### 4. Criar o banco e rodar as migrations

```bash
npx prisma migrate dev
```

### 5. Popular com dados de teste

```bash
npm run db:seed
```

Cria três usuários de teste:

| Papel | E-mail | Senha |
|---|---|---|
| Administrador | `admin@ltmautomacao.com` | `admin123` |
| Montador | `joao@ltmautomacao.com` | `montador123` |
| Espectador | `gestor@ltmautomacao.com` | `gestor123` |

**Troque essas senhas antes de qualquer uso fora do ambiente de desenvolvimento.**

### 6. Rodar em desenvolvimento

```bash
npm run dev
```

Acesse `http://localhost:3000/login`.

### 7. Build de produção

```bash
npm run build
npm run start
```

## Scripts úteis

```bash
npm run db:migrate   # aplica novas migrations em desenvolvimento
npm run db:seed      # roda o seed novamente (idempotente)
npm run db:studio    # abre o Prisma Studio para inspecionar o banco
npm run lint          # ESLint
```

## Estrutura

```
prisma/schema.prisma   modelos do banco (cresce a cada fase)
prisma/seed.ts          dados de teste
src/lib/auth.ts         config completa do NextAuth (Node runtime)
src/lib/auth.config.ts  config enxuta usada pelo middleware (Edge runtime)
src/middleware.ts        proteção de rotas por papel
src/app/(login|admin|app|espectador)  telas por papel
src/components/          Logo, DashboardShell, etc.
public/brand/            logo e ícones gerados a partir da arte oficial
```

## Deploy

Ainda não configurado — chega na Fase 7, junto com PWA e checklist de
segurança final. Qualquer host que rode Next.js 15 + Postgres serve (Vercel
+ banco gerenciado, Railway, um VPS com Node, etc.).
