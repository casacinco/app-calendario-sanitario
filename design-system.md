# Design System — App Calendário Sanitário VPC

## Tema

**Dark Premium** — visual técnico, denso em informação, sem aparência genérica de SaaS.

---

## Paleta

| Token | Valor | Uso |
|---|---|---|
| `--bg` | `#0B0B0B` | Fundo da página |
| `--card` | `#1A1A1A` | Cards, modais, painéis |
| `--border` | `#2A2A2A` | Divisórias, bordas |
| `--text` | `#F5F5F5` | Texto principal |
| `--text-muted` | `#9A9A9A` | Texto secundário |
| `--red` | `#FF2B2B` | Alertas, ações destrutivas, barras críticas |
| `--green` | `#2BA152` | Sucesso, confirmação, status ativo |

### Cores de barras do calendário

As barras são livres em cor (definidas pelo admin no editor), mas devem usar tons saturados sobre o fundo escuro para alto contraste.

---

## Tipografia

- **Fonte:** Inter (system fallback: `ui-sans-serif`, `system-ui`)
- **Pesos usados:** 400 (regular), 500 (medium), 600 (semibold), 700 (bold)
- **Escala:**
  - `text-xs` (12px) — labels técnicos, metadados
  - `text-sm` (14px) — corpo de tabelas, texto secundário
  - `text-base` (16px) — corpo padrão
  - `text-lg` (18px) — títulos de seção
  - `text-xl` (20px) — títulos de página
  - `text-2xl` (24px) — títulos primários

---

## Espaçamento

Sistema baseado em múltiplos de 4px (Tailwind padrão):
- `space-1` (4px), `space-2` (8px), `space-4` (16px), `space-6` (24px), `space-8` (32px)

Cards têm padding interno mínimo de `space-6`.

---

## Componentes (shadcn/ui)

Todos os componentes seguem shadcn/ui customizado para o tema dark premium:

- **Button** — `bg-card`, borda `border`, hover muda para `--text` opacidade 5%
- **Card** — `bg-card`, borda 1px `--border`, radius `8px`
- **Input / Textarea** — `bg-bg`, borda 1px `--border`, focus borda `--text-muted`
- **Table** — header `bg-card`, linhas alternadas com tom 2% mais claro
- **Badge** — pills compactos para status (verde para ativo, vermelho para alerta)
- **Dialog / Sheet** — fundo `bg-card`, overlay `rgba(0,0,0,0.7)`

---

## Layout

### Mobile first

- Breakpoints: `sm` (640px), `md` (768px), `lg` (1024px), `xl` (1280px)
- Calendário: scroll horizontal em mobile, grid completo em desktop
- Admin tables: card-based em mobile, tabela em desktop

### Densidade

Visual técnico = mais informação por tela. Evitar espaços vazios desnecessários, mas manter respiro entre seções.

---

## Iconografia

**Lucide icons** (compatível com shadcn/ui). Tamanho padrão 16px, stroke 2.

---

## Anti-patterns

- Sem gradientes coloridos genéricos
- Sem ilustrações 3D
- Sem cores pastéis
- Sem sombras grandes (max `shadow-sm`)
- Sem cantos muito arredondados (max `rounded-lg`)
