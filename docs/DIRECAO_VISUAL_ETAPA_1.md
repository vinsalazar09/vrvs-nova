# DIRECAO_VISUAL_ETAPA_1.md — Nova VRVS

**Versão:** 1.0
**Escopo:** direção visual da Etapa 1 (shell mínimo). Não é código. É referência para implementação.

---

# 1. Conceito visual

Visual escuro, sóbrio e funcional.

Sem decoração desnecessária.
Sem chamar atenção para si mesmo.
A interface serve o conteúdo — não o contrário.

---

# 2. Paleta de cores

## Fundo e superfícies

| Token | Hex | Uso |
|---|---|---|
| `--bg` | `#111318` | fundo geral da tela |
| `--surface-1` | `#1c1f26` | cards, tab bar, superfícies primárias |
| `--surface-2` | `#252830` | superfícies secundárias, hover state futuro |
| `--border` | `#2e3138` | bordas sutis entre elementos |

## Texto

| Token | Hex | Uso |
|---|---|---|
| `--text-primary` | `#e4e6ea` | texto principal — título, label ativa |
| `--text-secondary` | `#8d929e` | texto de apoio — subtítulo, descrição |
| `--text-tertiary` | `#5c6170` | texto fraco — labels de seção, data |

## Acento

| Token | Hex | Uso |
|---|---|---|
| `--accent` | `#0d9488` | turquesa repaginado — único acento da UI |
| `--accent-dim` | `rgba(13, 148, 136, 0.12)` | fundo de elemento ativo ou destacado |

## O que não usar

- Cobre, âmbar, laranja: fora.
- Neon, glow, brilho colorido: fora.
- Gradiente de cor: fora.
- Sombra colorida: fora.
- Múltiplos acentos: fora.
- Branco puro como fundo: fora.

---

# 3. Tipografia

**Fonte:** system font do iOS/macOS.

```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif;
```

**Pesos:** apenas dois.

- `400` (regular) — texto corrente, subtítulos, itens de lista.
- `500` (medium) — títulos de tela, ações primárias, tab ativa.

Não usar `bold` (700) nem `light` (300).

**Tamanhos mínimos:**

- Mínimo absoluto: 11px (labels de seção em uppercase).
- Texto corrente: 16px.
- Subtítulo/apoio: 14px.
- Título de tela: 24px.
- Label de aba: 11px.

**Case:**

- Sentence case em todos os textos de interface.
- Uppercase apenas em labels de seção com letter-spacing (tamanho 11px).
- Não usar ALL CAPS em títulos.

---

# 4. Layout e espaçamento

**Unidade base:** múltiplos de 4px.

| Contexto | Valor |
|---|---|
| Padding interno de card | 20px |
| Gap entre blocos | 12px |
| Padding lateral de tela | 16px |
| Gap interno entre label e conteúdo | 8–12px |
| Espaço entre seções na tela Mais | 24px |

---

# 5. Safe area — obrigatório

A UI deve respeitar a área segura do iPhone em todas as bordas.

```css
:root {
  --safe-t: env(safe-area-inset-top);
  --safe-b: env(safe-area-inset-bottom);
}
```

**Topo:** conteúdo começa após `env(safe-area-inset-top)`.
Com `apple-mobile-web-app-status-bar-style: black-translucent` e `viewport-fit=cover`,
o app renderiza sob a barra de status. A padding deve empurrar o conteúdo para baixo dela.

**Base:** a tab bar inclui `padding-bottom: env(safe-area-inset-bottom)` para não
ficar sob o home indicator. O conteúdo da tela inclui padding equivalente à tab bar total.

---

# 6. Tab bar inferior

- Posição: `fixed`, `bottom: 0`.
- Altura total: `56px + env(safe-area-inset-bottom)`.
- Fundo: `--surface-1`.
- Borda superior: `1px solid --border`.
- Três abas: Hoje, Temas, Mais.
- Aba ativa: acento (`--accent`) em ícone e label.
- Aba inativa: `--text-tertiary`.
- Ícone: 24×24px, SVG inline.
- Label: 11px, `font-weight: 400`.
- Área mínima de toque: 44×44px por aba.
- `touch-action: manipulation` em todas as abas.

---

# 7. Botão Capture flutuante

- Forma: círculo.
- Tamanho: 52×52px.
- Posição: `fixed`, canto inferior direito.
- Bottom: `calc(56px + env(safe-area-inset-bottom) + 16px)`.
  Garante 16px acima da tab bar, independente do dispositivo.
- Right: `20px`.
- Cor de fundo: `--accent`.
- Ícone: `+` centralizado, branco, 24px, `font-weight: 400`.
- Sem texto ao lado.
- Sem sombra colorida.
- Sem animação customizada.
- `touch-action: manipulation`.
- `z-index` acima de todo conteúdo, abaixo de modais futuros.

---

# 8. Cards e blocos de conteúdo

- Fundo: `--surface-1`.
- Borda: `1px solid --border`.
- Border-radius: `12px`.
- Padding: `20px`.
- Sem sombra.
- Sem gradiente.

---

# 9. Botões

## Primário

- Fundo: `--accent`.
- Texto: branco, 15px, `font-weight: 500`.
- Padding: `12px 20px`.
- Border-radius: `8px`.
- Largura: 100% (dentro do card).
- Sem gradiente.
- Sem sombra.
- `touch-action: manipulation`.
- Altura mínima: `44px`.

## Outline / secundário

- Fundo: transparente.
- Borda: `1px solid --accent`.
- Texto: `--accent`, 15px, `font-weight: 500`.
- Mesmos padding e border-radius do primário.

---

# 10. Itens de lista (tela Mais)

- Fundo: `--surface-1`.
- Borda entre itens: `1px solid --border`.
- Altura mínima: `52px`.
- Padding horizontal: `16px`.
- Texto: `--text-primary`, 16px.
- Chevron `›` à direita: `--text-tertiary`.
- `touch-action: manipulation`.
- Sem sombra, sem gradiente.

---

# 11. Estados vazios (empty states)

Estados vazios devem ser honestos — não tentar parecer que há conteúdo.

- Texto principal: `--text-secondary`, 17px, `font-weight: 500`.
- Texto secundário: `--text-tertiary`, 14px.
- Alinhamento: centrado.
- Padding vertical: `40px`.
- Sem ilustração complexa na Etapa 1.
- Sem ícone decorativo na Etapa 1.

Exemplo:
```
Nenhum tema criado.
Crie um tema pra começar.
[Criar tema]  ← botão outline
```

---

# 12. O que está explicitamente excluído da Etapa 1

- Liquid Glass.
- Gradiente de qualquer tipo.
- Sombra colorida.
- Glow.
- Neon.
- Cobre / âmbar.
- Bottom sheet.
- Modal.
- Animação customizada (transitions simples de opacity são permitidas).
- Skeleton loading.
- Tooltip.
- Hover states (plataforma é touch).
- Lorem Ipsum.
- Dados mockados falsos (nomes de temas, usuários, cards inventados).
- Fonte externa (Google Fonts, etc.).
- Bold pesado (font-weight 700+).
- Fonte menor que 11px.

---

# 13. Placeholder arquitetural autorizado

O texto abaixo é placeholder arquitetural explicitamente autorizado na Etapa 1.
Não é dado calculado. Não é dado real. É comunicação de decisão visual ao desenvolvedor.

```
Pra agora
Revisar 10 agora
80 pendentes no total — exemplo visual sem dados reais
```

O número 10 representa o cap visual definido em `ADENDO_FASE_1_ACUMULO_CARDS.md`.
O número 80 é exemplo ilustrativo de acúmulo.

---

# Fim do documento
