# Regras de Produto — App Calendário Sanitário VPC

## Propósito

Substituir o fluxo atual (Google Forms → análise manual → PowerPoint → PDF) por um sistema integrado: onboarding → admin → editor → publicação.

**O sistema NÃO gera o calendário automaticamente.** O admin (Léo) continua sendo o decisor técnico — o sistema apenas organiza, agiliza e padroniza.

---

## Atores

### `user` (criador / cliente)
Avicultor que solicita o calendário sanitário para sua propriedade.

### `admin` (Léo / equipe técnica)
Profissional veterinário que analisa os dados e produz o calendário.

---

## Fluxos

### Fluxo do criador

1. Faz onboarding (formulário multi-step com identificação, propriedade, rebanho, sanitário)
2. Sistema gera uma **solicitação** (`calendar_request`) com status `pending`
3. Aguarda produção pelo admin
4. Recebe acesso ao calendário publicado (visualização + PDF)

### Fluxo do admin

1. Visualiza lista de solicitações com filtros (status, prazo, rebanho)
2. Abre o detalhe da solicitação com todas as respostas
3. Cria um calendário a partir do **template fixo**
4. Edita: ativa/desativa linhas, adiciona/edita/remove barras, configura blocos de orientação
5. Publica → solicitação muda para `delivered`, log é registrado, criador recebe acesso

---

## Calendário

### Template fixo

O calendário tem uma estrutura **imutável** de blocos, sempre nesta ordem:

1. **Distribuição**
2. **Programação reprodutiva**
3. **Vacinação**
4. **Manejo neonato**
5. **Vermifugação**

Cada bloco contém um conjunto pré-definido de **linhas**.

### Linhas

- Cada linha do template pode ser **ativada** ou **desativada** por calendário
- Linhas desativadas não aparecem no calendário publicado
- O admin não pode adicionar linhas fora do template (regra do produto: padronização)

### Barras

Cada barra representa um intervalo de meses dentro de uma linha:

| Campo | Tipo | Regra |
|---|---|---|
| `start_month` | int (1–12) | obrigatório |
| `end_month` | int (1–12) | obrigatório, `start ≤ end` |
| `label` | string | descrição livre |
| `color` | hex | cor da barra |
| `alert` | bool | se `true`, indica criticidade |

**Múltiplas barras por linha são permitidas** (ex.: vacinação em janeiro e em junho na mesma linha).

### Blocos de orientação (`note_blocks`)

Textos auxiliares (procedimentos, observações técnicas) que podem ser anexados ao calendário. Cada calendário pode incluir N blocos, cada um podendo ser ativado/desativado e ter seu conteúdo editado.

---

## Estados

### `calendar_request.status`

- `pending` — aguardando análise
- `in_progress` — admin começou a editar
- `delivered` — publicado para o criador
- `archived` — arquivado (sem ação pendente)

### `calendar.status`

- `draft` — em edição
- `published` — visível ao criador

---

## Permissões

| Ação | user | admin |
|---|---|---|
| Criar solicitação | sim | não |
| Ver suas próprias solicitações | sim | — |
| Ver todas as solicitações | não | sim |
| Editar calendário | não | sim |
| Publicar calendário | não | sim |
| Visualizar calendário publicado | sim (apenas o seu) | sim |
| Baixar PDF | sim (apenas o seu) | sim |

---

## Entrega

- O calendário publicado é visualizável na área do criador
- Versão imprimível em PDF disponível para download
- Cada publicação gera um `delivery_log` com timestamp e admin responsável

---

## Regras invioláveis

- Template fixo nunca é alterado por código de aplicação (apenas por migration)
- Não existe lógica automática de geração de calendário — o admin sempre decide
- `start_month ≤ end_month` é validado em DB (CHECK constraint) e em UI
- Calendários publicados não podem ser despublicados (apenas arquivados)
