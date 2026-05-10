# MIGRACAO_v1_v2_CARD_ASSETS.md

**Versão:** 1.1
**Status:** aguardando criação do arquivo em `docs/` — aprovado como base
**Escopo:** arquitetura e migração — sem código de UI, sem upload, sem viewer

---

## 1. Objetivo

A migração v1 → v2 do banco `vrvs-nova` adiciona suporte estrutural a imagens de Cards,
criando o store `cardAssets` com campos e índices adequados.

Nenhum dado existente é alterado. Nenhuma funcionalidade de upload é implementada nesta etapa.
O objetivo é apenas garantir que a estrutura de dados suporte imagem de forma limpa antes de
qualquer código de UI ou processamento.

---

## 2. Por que a migração é necessária

O schema v1 tem 11 stores — nenhum para blob ou asset de mídia.

As alternativas proibidas e por quê:

| Alternativa | Motivo da proibição |
|---|---|
| Salvar base64 em `card.front` ou `card.back` | Quebra índices, campo gigante, impossibilita backup estruturado, viola schema |
| Usar `localStorage` | Limite de ~5MB, síncrono, sem suporte a blob |
| Copiar `vrvs_images` do legado (banco IDB separado) | Dois bancos desconectados: impossível transação atômica. Blobs órfãos. Chaves opacas. Backup sem imagem. Problema documentado na auditoria. |
| Guardar blob em campo extra de `cards` | Viola princípio de "um store por entidade lógica" do schema. Campo não indexável. |

A única solução limpa é um store dedicado no mesmo banco `vrvs-nova`, com vínculo estrutural
a `profileId` e `cardId`, permitindo transação atômica e GC controlado.

---

## 3. Escopo da migração v1 → v2

### Entra nesta migração

- `DB_VERSION` sobe de `1` para `2`
- Criação do store `cardAssets` com keyPath `assetId`
- Criação dos índices de `cardAssets`
- Todos os dados v1 permanecem intactos e inalterados

### Não entra nesta migração

- Upload de imagem
- UI de imagem (botão, preview, indicador)
- Compressão ou redimensionamento
- Geração de thumbnail
- Viewer ou zoom
- Backup de blobs
- Edição de Card existente
- Remoção de imagem
- Migração de dados do legado (`vrvs_images`)
- Qualquer alteração em `cards` existentes

---

## 4. Store novo: `cardAssets`

### Estrutura do objeto

```javascript
{
  assetId:    'asset_<uuid>',    // keyPath — gerado com `asset_${crypto.randomUUID()}`
  profileId:  '<profileId>',     // isolamento por perfil — obrigatório
  cardId:     '<cardId>',        // vínculo com o card — obrigatório
  side:       'front' | 'back',  // qual lado do card
  kind:       'image',           // tipo de asset — extensível futuramente
  mimeType:   'image/jpeg',      // saída processada sempre em JPEG (ver §4.1)
  blob:       Blob,              // imagem full comprimida (≤ 2MB)
  thumbBlob:  Blob,              // thumbnail 200×200 px, JPEG 0.8 — mesmo objeto (ver §4.2)
  width:      Number,            // largura da imagem original em pixels
  height:     Number,            // altura da imagem original em pixels
  size:       Number,            // tamanho em bytes do blob full
  createdAt:  '<ISO timestamp>',
  updatedAt:  '<ISO timestamp>',
  archivedAt: null,              // null = ativo; ISO timestamp = soft-deleted
}
```

### 4.1 Formato de saída: sempre JPEG

A imagem de entrada pode ser JPEG, PNG ou HEIC (câmera do iPhone).
A saída processada é **sempre `image/jpeg`**, independente do formato de entrada.

Motivo: JPEG tem compressão adaptativa via Canvas no browser, tamanho controlável,
e é universalmente suportado. PNG de entrada será convertido. HEIC é decodificado
pelo sistema antes de chegar ao `FileReader`.

`mimeType` no objeto reflete sempre `'image/jpeg'` após processamento.

### 4.2 `thumbBlob` no mesmo objeto

`thumbBlob` e `blob` vivem no mesmo registro `cardAssets`.

Motivo: 1 asset = 1 full + 1 thumbnail elimina o risco de thumb órfão
(que existia no legado quando full e thumb tinham chaves separadas).
Para o MVP, a simplicidade e a atomicidade valem mais do que a separação de stores.

### Prefixo do ID

`asset_` — legível, sem conflito com prefixos existentes
(`card_`, `tema_`, `cardrev_`, `area_`, `capt_`, `session_`, `agenda_`, `backup_`, `profile_`).

### Valores permitidos

| Campo | Valores válidos |
|---|---|
| `side` | `'front'` ou `'back'` |
| `kind` | `'image'` (Fase 1). Futuramente: `'audio'`, `'pdf'` |
| `mimeType` | `'image/jpeg'` (sempre, após processamento) |
| `archivedAt` | `null` (ativo) ou ISO timestamp (soft-deleted) |

---

## 5. Índices do `cardAssets`

| Nome do índice | Campos indexados | Único? | Uso principal |
|---|---|---|---|
| `by_profileId` | `profileId` | não | base de isolamento |
| `by_cardId` | `cardId` | não | listar todos os assets de um card |
| `by_profile_cardId` | `[profileId, cardId]` | não | query isolada por profile + card |
| `by_profile_card_side` | `[profileId, cardId, side]` | não | **crítico** — buscar/substituir imagem por lado |
| `by_profile_archived` | `[profileId, archivedAt]` | não | GC e limpeza de assets soft-deleted |

### Por que `by_profile_card_side` é obrigatório já na v2

Ao exibir imagem na revisão, a query será:

```
cardAssets
  .index('by_profile_card_side')
  .get([profileId, cardId, 'front'])
```

Sem esse índice, a query exige varredura de todos os assets do card e filtragem em memória.
Com volume futuro de cards com imagem, isso seria inaceitável.

### Por que `by_profile_side` foi removido

Não há caso de uso real na Fase 1 para listar todas as imagens `front` ou `back` de um perfil.
Índice desnecessário removido para manter o schema enxuto.

---

## 6. Regra de cardinalidade (MVP)

No MVP da Fase 1:

- **Máximo 1 imagem ativa na frente** (`side = 'front'`, `archivedAt = null`)
- **Máximo 1 imagem ativa no verso** (`side = 'back'`, `archivedAt = null`)

O IndexedDB não permite índice `unique` parcial baseado em `archivedAt === null`.
Por isso, a regra de "1 imagem ativa por lado" é garantida pela **camada de serviço**,
não pelo índice.

Fluxo de substituição de imagem (futuramente, em edição):
1. Buscar asset ativo com `[profileId, cardId, side]`
2. Se existir, definir `archivedAt = now` — em memória
3. Criar novo asset com `archivedAt = null`
4. Tudo em única transação `['cards', 'cardAssets']`

Múltiplas imagens por lado ficam fora da Fase 1.

---

## 7. Atomicidade

Toda operação que envolve imagem e card deve usar uma única transação `readwrite`
com os dois stores: `['cards', 'cardAssets']`.

Segue o mesmo princípio do R12 do schema doc, que já rege `cards` + `cardReviews`.

### Criação de Card com imagem

```
tx = db.transaction(['cards', 'cardAssets'], 'readwrite')
  cards.add(newCard)
  cardAssets.add(frontAsset)    // se houver imagem na frente
  cardAssets.add(backAsset)     // se houver imagem no verso
await txDone(tx)
```

Se qualquer escrita falhar: a transação inteira aborta.
Resultado: nem o card, nem os assets persistem. Sem dado inconsistente. Sem blob órfão.

### Arquivamento de Card

```
tx = db.transaction(['cards', 'cardAssets'], 'readwrite')
  cards.put({ ...card, archivedAt: now })
  // Para cada asset ativo do card:
  cardAssets.put({ ...asset, archivedAt: now })
await txDone(tx)
```

---

## 8. Estratégia de migração (`onupgradeneeded`)

A função `createSchema` em `src/db/db.js` usa blocos condicionais por versão.
A migração v1 → v2 adiciona um bloco `if (oldVersion < 2)`.

### Estrutura conceitual

```javascript
// DB_VERSION sobe de 1 para 2

function createSchema(db, oldVersion) {

  // --- v1: stores originais — NÃO MODIFICAR ---
  if (oldVersion < 1) {
    // ... código existente intocado ...
  }

  // --- v2: adiciona cardAssets ---
  if (oldVersion < 2) {
    // Verificação defensiva — idempotente
    if (!db.objectStoreNames.contains('cardAssets')) {
      const assets = db.createObjectStore('cardAssets', { keyPath: 'assetId' });
      assets.createIndex('by_profileId',         'profileId');
      assets.createIndex('by_cardId',            'cardId');
      assets.createIndex('by_profile_cardId',    ['profileId', 'cardId']);
      assets.createIndex('by_profile_card_side', ['profileId', 'cardId', 'side']);
      assets.createIndex('by_profile_archived',  ['profileId', 'archivedAt']);
    }
  }
}
```

### Regras de ouro da migração

1. **Nunca modificar stores existentes dentro do bloco `oldVersion < 2`.** O bloco v2 só cria.
2. **Nunca ler ou escrever dados dentro de `onupgradeneeded`.** Apenas schema.
3. **`DB_VERSION` sobe de 1 para 2** na constante no topo de `db.js`.
4. **A verificação `!db.objectStoreNames.contains('cardAssets')`** garante idempotência.

---

## 9. Compatibilidade com dados existentes

| Entidade | Situação após migração |
|---|---|
| Profiles | Intactos. Não tocados. |
| Areas | Intactas. Não tocadas. |
| Temas | Intactos. Não tocados. |
| Cards | Intactos. Continuam sem imagem. |
| CardReviews | Intactos. |
| Sessions | Intactos. |
| AgendaItems | Intactos. |
| Captures | Intactos. |
| `cardAssets` | Store novo, vazio. Nenhum dado pré-existente. |

O app deve funcionar normalmente imediatamente após a atualização do banco:
- revisão continua funcionando;
- Hoje continua recalculando;
- Temas e Cards existentes continuam visíveis.

---

## 10. Riscos

| Risco | Gravidade | Mitigação |
|---|---|---|
| Erro em `onupgradeneeded` aborta upgrade e deixa banco em estado parcial | Alta | Verificação defensiva com `objectStoreNames.contains`. Testar com banco v1 já populado antes de push. |
| Safari iOS pode ter comportamento diferente em upgrade | Média | Testar no iPhone real com PWA já instalada antes de push. |
| Upgrade interrompido (app fechado durante `onupgradeneeded`) | Alta | IDB garante atomicidade do upgrade — próxima abertura retenta a partir do `oldVersion` correto. |
| Quota do IDB no Safari iOS esgotada por blobs | Alta | Limite de 2MB por imagem após compressão. Feedback claro ao usuário se quota exceder. Não é problema desta migração. |
| Blobs grandes tornam backup futuro pesado | Média | Backup com imagens pode gerar JSON de dezenas de MB. Problema de Fase 2. |
| `URL.createObjectURL` não revogado → vazamento de memória | Média | Responsabilidade do código de UI futuro. Revogar no `onload` ou ao desmontar. |
| Índice triplo `by_profile_card_side` — suporte no Safari | Baixa | Índices compostos com 3 campos são suportados pela spec IDB Level 2, presente no Safari desde iOS 10. |

---

## 11. Checklist de validação obrigatória (pós-implementação)

A executar **antes** de qualquer commit de DB_VERSION 2:

- [ ] Abrir app com banco v1 já existente e populado
- [ ] App abre sem erro no console
- [ ] Banco atualiza para v2 sem perda de dados
- [ ] Tema existente aparece na lista
- [ ] Card existente aparece no detalhe do Tema
- [ ] Revisão de Card existente funciona normalmente
- [ ] Hoje recalcula pendências normalmente
- [ ] Store `cardAssets` existe e está vazio
- [ ] 11 stores v1 continuam presentes (total agora: 12)
- [ ] Nenhum store duplicado
- [ ] App abre após reload no Safari iOS (iPhone)
- [ ] App abre após instalar como PWA e reabrir

---

## 12. Fora do escopo desta migração

Explicitamente excluído:

- UI de upload de imagem
- Botão "Adicionar imagem" em qualquer tela
- Compressão ou redimensionamento
- Geração de thumbnail
- Exibição de imagem na revisão
- Viewer ou zoom
- Backup de blobs
- Edição de Card existente
- Remoção de imagem existente
- Importação de dados do `vrvs_images` legado
- Qualquer alteração no algoritmo VRVS 3P
- Qualquer alteração nos stores v1

---

## 13. Próximas etapas após aprovação

| Etapa | Conteúdo |
|---|---|
| **7B.1** | Implementar migração v1 → v2 em `db.js`. Validar store vazio no iPhone com banco já existente. Commit + push apenas da migração. |
| **7B.2** | Upload e exibição simples em criação de novo Card. Pipeline: `FileReader` → Canvas → compressão adaptativa → thumbnail → `tx(['cards','cardAssets'])`. |
| **7B.3** | Exibir imagem na tela de revisão: frente antes de revelar, verso após revelar. |
| **7B.4** | Viewer simples: toque na imagem abre fullscreen com `URL.createObjectURL`. |
| **Fase futura** | Edição de imagem em Card existente, múltiplas imagens por lado, anotação, backup em ZIP. |

---

## 14. Decisão recomendada

| Decisão | Recomendação |
|---|---|
| Criar store `cardAssets` | **Aprovado** — único caminho limpo para imagem |
| `DB_VERSION` 1 → 2 | **Aprovado** — migração mínima, sem tocar dados existentes |
| Prefixo `asset_` | **Aprovado** — legível, sem conflito |
| `thumbBlob` no mesmo objeto | **Aprovado** — MVP, elimina risco de thumb órfão |
| Saída sempre `image/jpeg` | **Aprovado** — controle de tamanho e compatibilidade |
| `by_profile_side` removido | **Aprovado** — sem caso de uso real na Fase 1 |
| Implementar upload antes da migração validada | **Vetado** — upload só após checklist §11 completo no iPhone |
| Múltiplas imagens por lado (Fase 1) | **Vetado** — Fase 2 |
| Copiar arquitetura `vrvs_images` do legado | **Vetado permanentemente** |
