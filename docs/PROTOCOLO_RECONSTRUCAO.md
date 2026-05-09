# PROTOCOLO_RECONSTRUCAO.md — Nova VRVS

**Versão:** 1.0  
**Status:** documento técnico-operacional para revisão  
**Fase:** preparação final antes da entrada do Cursor  
**Base:** `MODELO_DE_DADOS.md v1.1`, `DECISOES_FASE_0.md`, `ARQUITETURA_FASE_1.md v1.1`, `SCHEMA_INDEXEDDB_v2.md`, Modus Operandi VRVS  
**Escopo:** definir como a reconstrução será conduzida com segurança, preview, gates de execução, validação no iPhone e prevenção de regressão.

---

# 1. Objetivo do protocolo

Este protocolo define **como a nova VRVS será reconstruída** sem repetir o ciclo de remendos, bugs acumulados e perda de controle do legado.

Ele existe para garantir que:

- Cursor não decida arquitetura;
- Cursor não implemente sem plano;
- nenhuma mudança delicada entre direto em execução;
- dados, perfis, backup, restore, IndexedDB, Cards, Agenda e VRVS 3P sejam protegidos;
- validação funcione no iPhone sem console;
- cada etapa tenha preview, checklist e rollback;
- Vini mantenha poder de decisão;
- ChatGPT coordene tecnicamente;
- Opus critique produto/UX quando fizer sentido;
- estabilidade continue acima de velocidade.

Este documento não é código.  
Este documento não é prompt final para Cursor.  
Este documento é a regra operacional antes de qualquer implementação.

---

# 2. Papéis

## 2.1 Vini

Vini decide.

Responsável por:

- aprovar ou rejeitar direção;
- validar prints/checklists no iPhone;
- autorizar execução quando necessário;
- decidir quando uma proposta volta para Opus, ChatGPT ou Cursor.

Vini não deve precisar:

- abrir console no iPhone;
- apagar/reinstalar PWA;
- interpretar diff complexo sozinho;
- descobrir sozinho se o Cursor entendeu o escopo.

---

## 2.2 ChatGPT

ChatGPT é o coordenador técnico.

Responsável por:

- consolidar documentos;
- filtrar propostas do Opus;
- proteger decisões congeladas;
- preparar prompts futuros para Cursor;
- revisar planos e diffs;
- decidir se algo é PREVIEW ou EXECUÇÃO;
- separar Fase 1, refino de UX, Fase 2 e rejeitado;
- manter coerência entre Modelo, Decisões, Arquitetura e Schema.

ChatGPT não deve:

- afirmar que executou código;
- dizer que commitou;
- dizer que aplicou patch;
- reabrir decisão congelada sem motivo forte;
- transformar bug legado em direção da reconstrução;
- gerar prompt de implementação sem autorização explícita.

---

## 2.3 Opus

Opus é arquiteto criativo de produto, UX e experiência.

Responsável por:

- propor melhorias de jornada;
- criticar fricção;
- sugerir navegação;
- apontar redundância;
- melhorar hierarquia de telas;
- revisar onde regra técnica possa prejudicar experiência.

Opus não decide arquitetura final.

Opus não deve:

- produzir implementação;
- mudar schema;
- criar entidade sem motivo forte;
- propor perfumaria sem impacto real;
- transformar refino visual em expansão de escopo.

---

## 2.4 Cursor

Cursor será executor assistido.

Cursor só entra depois deste protocolo estar aprovado.

Cursor não decide:

- arquitetura;
- schema;
- modelo de dados;
- faseamento;
- escopo;
- UX principal;
- política de backup/restore.

Cursor deve:

- seguir prompt fechado;
- devolver plano antes de mexer quando for PREVIEW;
- mostrar arquivos afetados;
- mostrar diff;
- declarar riscos;
- declarar confiança;
- aguardar autorização quando exigido.

---

# 3. Fontes de verdade

## 3.1 Fontes oficiais da reconstrução

A implementação futura deve respeitar, nesta ordem:

1. `SCHEMA_INDEXEDDB_v2.md`
2. `MODELO_DE_DADOS.md v1.1`
3. `DECISOES_FASE_0.md`
4. `ARQUITETURA_FASE_1.md v1.1`
5. `PROTOCOLO_RECONSTRUCAO.md`

---

## 3.2 Papel do legado

O legado serve para:

- entender erros passados;
- mapear riscos;
- preservar aprendizados de UX;
- evitar repetição de bugs.

O legado não serve para:

- copiar arquitetura;
- preservar localStorage como base;
- manter monolito por inércia;
- justificar gambiarra;
- importar bugs antigos.

---

# 4. Travas absolutas

As travas abaixo não devem ser reabertas sem motivo forte.

- nova VRVS = reconstrução do zero;
- repo novo separado;
- IndexedDB como persistência principal;
- PWA client-side;
- sem backend obrigatório;
- sem API obrigatória;
- sem Python;
- mobile-first iPhone Safari;
- multi-perfil isolado por `profileId`;
- `activeProfileId` como perfil operacional;
- Tema como centro, mas não prisão;
- Capture como entrada flexível;
- Card exige Tema;
- CardReview é imutável;
- Sessão Livre é exceção controlada;
- Agenda técnica por trás da tela Hoje;
- Hub Diário incorporado como visão derivada dentro de Hoje;
- backup global e por Profile na Fase 1;
- restore padrão como novo Profile;
- soft delete como padrão;
- métricas derivadas sempre que possível;
- VRVS 3P preservado;
- estabilidade acima de novidade.

---

# 5. Tipos de trabalho

Toda tarefa futura deve ser classificada antes de ir para o Cursor.

## 5.1 Tipo A — Documentação

Exemplos:

- atualizar `.md`;
- consolidar decisão;
- registrar protocolo;
- ajustar texto técnico.

Risco: baixo, salvo se alterar decisão congelada.

Pode ir para execução mais simples, mas ainda com revisão se mexer em documento fonte de verdade.

---

## 5.2 Tipo B — UX/UI sem dados

Exemplos:

- layout;
- cores;
- espaçamento;
- navegação visual;
- componentes sem persistência.

Risco: baixo a moderado.

Exige preview visual se afetar experiência principal.

---

## 5.3 Tipo C — Fluxo funcional sem dado crítico

Exemplos:

- abrir modal;
- alternar aba;
- iniciar fluxo sem persistir ainda;
- navegação entre telas.

Risco: moderado.

Exige preview e checklist.

---

## 5.4 Tipo D — Dados e persistência

Exemplos:

- IndexedDB;
- stores;
- índices;
- migração;
- Profile;
- backup;
- restore;
- import/export;
- soft delete;
- Cards;
- CardReviews;
- Sessions;
- AgendaItems;
- Captures.

Risco: alto.

Sempre começa em:

`[PREVIEW — NÃO EXECUTAR]`

Nunca execução direta.

---

## 5.5 Tipo E — Operação destrutiva ou irreversível

Exemplos:

- substituir Profile por backup;
- hard delete;
- reset;
- migração destrutiva;
- limpeza em massa;
- alteração de histórico.

Risco: máximo.

Regras:

- sempre PREVIEW;
- exige plano textual;
- exige simulação;
- exige backup prévio;
- exige confirmação forte;
- exige checklist de rollback;
- execução só após aprovação explícita.

---

# 6. Estados de autorização

Todo prompt futuro ao Cursor deve começar com uma das duas linhas:

```text
[PREVIEW — NÃO EXECUTAR]
```

ou

```text
[EXECUÇÃO AUTORIZADA — EXECUTAR + COMMIT + PUSH]
```

Não existe terceiro modo.

---

# 7. Regra de PREVIEW

PREVIEW significa:

1. não alterar arquivos;
2. não aplicar patch;
3. não commitar;
4. não dar push;
5. apenas analisar, planejar e devolver relatório.

## 7.1 Todo PREVIEW deve devolver

Cursor deve devolver:

- entendimento da tarefa;
- arquivos que pretende alterar;
- plano de execução;
- trechos/áreas afetadas;
- riscos;
- dependências;
- o que não será mexido;
- estratégia de teste;
- checklist de validação;
- confiança estimada;
- se precisa voltar ao ChatGPT antes de executar.

---

## 7.2 PREVIEW obrigatório

Sempre usar PREVIEW para:

- IndexedDB;
- migração;
- schema;
- backup;
- restore;
- Profiles;
- `activeProfileId`;
- Cards;
- CardReviews;
- Sessions;
- Agenda;
- AgendaItems;
- Capture;
- VRVS 3P;
- soft delete;
- import/export;
- qualquer operação destrutiva;
- qualquer mudança que possa afetar dados reais.

---

# 8. Regra de execução autorizada

Execução autorizada só pode ocorrer quando:

- escopo está claro;
- risco é baixo ou já mitigado;
- preview foi aprovado quando necessário;
- Vini autorizou explicitamente;
- ChatGPT classificou como seguro para execução.

Mesmo em execução autorizada, Cursor deve:

- alterar apenas arquivos previstos;
- não ampliar escopo;
- não fazer refatoração oportunista;
- rodar checagens combinadas;
- devolver diff;
- informar commit/push somente se isso tiver sido pedido.

---

# 9. Gates de risco

## 9.1 Gate baixo risco

Pode ser execução direta se explicitamente autorizado.

Exemplos:

- texto de documentação;
- ajuste pequeno de UI sem dados;
- correção visual isolada;
- copy.

Ainda assim, se houver dúvida, vira PREVIEW.

---

## 9.2 Gate médio risco

Sempre exige PREVIEW inicial.

Exemplos:

- navegação;
- fluxo de tela;
- bottom sheet;
- criação de componentes;
- alteração na tela Hoje;
- alteração em Tema Detalhe;
- alteração em Capture Inbox sem persistência crítica.

---

## 9.3 Gate alto risco

Sempre exige PREVIEW + revisão do ChatGPT + aprovação do Vini.

Exemplos:

- IndexedDB;
- stores;
- escrita/leitura de dados;
- Profile;
- backup;
- restore;
- CardReviews;
- AgendaItems;
- Sessions;
- VRVS 3P.

---

## 9.4 Gate máximo

Sempre exige:

- PREVIEW;
- backup prévio;
- simulação;
- confirmação forte;
- plano de rollback;
- aprovação explícita.

Exemplos:

- substituir Profile;
- reset;
- hard delete;
- migração destrutiva;
- apagar histórico;
- alterar CardReviews antigos.

---

# 10. Estrutura obrigatória de prompt futuro ao Cursor

Todo prompt futuro ao Cursor deve conter:

1. linha de modo:
   - `[PREVIEW — NÃO EXECUTAR]`
   - ou `[EXECUÇÃO AUTORIZADA — EXECUTAR + COMMIT + PUSH]`
2. objetivo;
3. contexto mínimo;
4. arquivos alvo;
5. escopo exato;
6. fora de escopo;
7. regras de segurança;
8. saída obrigatória;
9. testes esperados;
10. gate de retorno.

---

# 11. Saída obrigatória do Cursor em PREVIEW

Em PREVIEW, Cursor deve responder com:

```text
1. ENTENDIMENTO
2. ARQUIVOS AFETADOS
3. PLANO DE ALTERAÇÃO
4. O QUE NÃO SERÁ MEXIDO
5. RISCOS
6. COMO TESTAR
7. CHECKLIST IPHONE
8. CONFIANÇA ESTIMADA
9. PRECISA VOLTAR AO CHATGPT? SIM/NÃO
```

Se a tarefa envolver UI, incluir também:

```text
10. DESCRIÇÃO DO PREVIEW VISUAL ESPERADO
```

Se a tarefa envolver dados, incluir também:

```text
10. IMPACTO EM DADOS
11. ESTRATÉGIA DE BACKUP/ROLLBACK
```

---

# 12. Validação sem console no iPhone

Vini não deve ser orientado a abrir console/devtools no iPhone.

Validação no iPhone deve usar:

- checklist visual;
- prints;
- comportamento observável;
- telas de diagnóstico internas quando necessárias;
- arquivos exportados;
- mensagens visíveis no app;
- contadores visíveis;
- fluxo de ida e volta.

---

# 13. Proibições práticas no iPhone

Não pedir:

- console remoto;
- devtools;
- apagar PWA;
- reinstalar PWA;
- limpar tudo como primeira solução;
- reset sem backup;
- teste destrutivo sem plano.

---

# 14. Checklists mínimos por área

## 14.1 Checklist geral iPhone

Para qualquer mudança visível:

- app abre;
- tela não trava no carregamento;
- toque responde;
- scroll funciona;
- não há overlay preso;
- não há texto cortado em ponto crítico;
- navegação volta corretamente;
- layout respeita área inferior do iPhone;
- não há regressão óbvia na tela Hoje, Temas e Mais.

---

## 14.2 Checklist Profile

- Profile ativo aparece correto;
- trocar Profile muda dados exibidos;
- dados do Profile anterior não aparecem;
- Profile arquivado não fica ativo;
- Area “Geral” existe no Profile novo;
- backup por Profile respeita o Profile selecionado.

---

## 14.3 Checklist Hoje/Agenda

- Hoje abre como home;
- bloco Pra agora aparece corretamente;
- Pendências não duplicam itens;
- Cards vencendo aparecem sem virar AgendaItems;
- AgendaItems aparecem na data correta;
- itens `snoozed` reaparecem na nova data;
- bloco Estado não vira poluição;
- Hub Diário não existe como fonte de dado duplicada.

---

## 14.4 Checklist Tema/Card

- Tema criado nasce `not_started`;
- criar primeiro Card muda Tema para `in_study`;
- Card exige Tema;
- Card arquivado não aparece para revisão;
- mover Card não muda `cardId`;
- Reviews antigas não mudam de Tema;
- Tema `paused`/`mastered` não entra na Agenda virtual ativa.

---

## 14.5 Checklist Sessões

- iniciar Sessão pela Hoje funciona;
- iniciar Sessão pelo Tema funciona;
- Sessão Livre nasce pendente;
- Sessão Livre não conta em métrica específica de Tema antes de associação;
- associar Sessão Livre a Tema funciona;
- reverter Sessão não apaga CardReviews.

---

## 14.6 Checklist Capture

- botão flutuante aparece;
- criar Capture é rápido;
- Capture vai para Inbox;
- Capture pode virar Card;
- Capture pode virar Tema;
- Capture pode virar AgendaItem;
- Capture pode ser arquivada;
- Capture convertida não é deletada.

---

## 14.7 Checklist Backup/Restore

- backup global gera arquivo;
- backup por Profile gera arquivo;
- BackupMetadata registra evento;
- restore padrão cria novo Profile;
- restore padrão não altera Profiles existentes;
- substituir Profile exige confirmação forte;
- antes de substituir, backup automático pré-substituição é gerado;
- merge não aparece como opção na Fase 1.

---

# 15. Anti-regressão obrigatória

Antes de qualquer execução ser considerada concluída, Cursor deve checar:

- conflito Git:
  - `<<<<<<<`
  - `=======`
  - `>>>>>>>`
- arquivos inesperados alterados;
- mudança fora de escopo;
- quebra de build/preview local, se aplicável;
- alteração acidental em documentos fonte de verdade;
- alteração acidental no schema.

---

# 16. Commits e pushes

Commit/push só acontecem quando o prompt permitir explicitamente.

Se o prompt for PREVIEW:

- não commit;
- não push;
- não alterar arquivo.

Se o prompt for EXECUÇÃO AUTORIZADA:

- pode alterar;
- pode testar;
- pode commit/push apenas se a primeira linha incluir isso claramente.

Formato esperado de commit futuro:

```text
fase1: descrição curta da mudança
```

ou, para documentação:

```text
docs: descrição curta da decisão
```

---

# 17. Rollback

Todo plano de execução deve dizer como voltar atrás.

## 17.1 Mudança de documentação

Rollback:

- reverter commit;
- restaurar versão anterior do arquivo.

## 17.2 Mudança visual

Rollback:

- reverter patch visual;
- manter dados intactos.

## 17.3 Mudança funcional

Rollback:

- reverter commit;
- confirmar que dados persistidos não foram alterados indevidamente.

## 17.4 Mudança de dados

Rollback exige:

- backup antes;
- plano de restauração;
- validação pós-restore;
- confirmação explícita.

## 17.5 Operação destrutiva

Rollback depende de backup.

Sem backup, operação destrutiva não deve executar.

---

# 18. Ordem recomendada de implementação futura

A ordem abaixo é proposta operacional para reduzir risco.

## Etapa 0 — Preparação do repo novo

Objetivo:

- criar base limpa;
- PWA mínima;
- estrutura inicial;
- sem dados complexos ainda.

Risco: baixo.

---

## Etapa 1 — Shell do app

Objetivo:

- navegação Hoje / Temas / Mais;
- botão Capture visível;
- layout mobile-first;
- sem persistência crítica ainda.

Risco: médio.

---

## Etapa 2 — IndexedDB base

Objetivo:

- abrir banco;
- criar stores do schema;
- inicializar `_meta`, AppSettings, Profile inicial, Area “Geral”.

Risco: alto.

Sempre PREVIEW antes.

---

## Etapa 3 — Profiles

Objetivo:

- criar Profile;
- trocar Profile;
- isolar dados por `profileId`.

Risco: alto.

---

## Etapa 4 — Areas e Temas

Objetivo:

- criar Areas;
- criar Temas;
- status do Tema;
- notas do Tema;
- arquivamento.

Risco: médio/alto.

---

## Etapa 5 — Cards

Objetivo:

- criar Cards;
- listar Cards por Tema;
- arquivar Cards;
- estado inicial VRVS 3P.

Risco: alto.

---

## Etapa 6 — Revisão e CardReviews

Objetivo:

- Sessão `review`;
- responder Cards;
- gerar CardReviews;
- atualizar estado cache do Card.

Risco: alto.

---

## Etapa 7 — Sessões study e Sessão Livre

Objetivo:

- iniciar/finalizar Sessão;
- Sessão associada a Tema;
- Sessão Livre;
- associação posterior.

Risco: alto.

---

## Etapa 8 — Hoje/Agenda

Objetivo:

- bloco Pra agora;
- Pendências;
- Estado;
- Cards vencendo derivados;
- AgendaItems.

Risco: alto.

---

## Etapa 9 — Capture e Inbox

Objetivo:

- criar Capture;
- Inbox;
- converter Capture.

Risco: médio/alto.

---

## Etapa 10 — Backup/Restore

Objetivo:

- backup global;
- backup por Profile;
- restore como novo Profile;
- substituição protegida.

Risco: máximo.

Sempre PREVIEW, backup e validação forte.

---

## Etapa 11 — Polimento e estabilização

Objetivo:

- checklist iPhone;
- correções UX;
- reduzir fricção;
- travar Fase 1.

Risco: variável.

---

# 19. Ordem proibida

Não começar por:

- migração do legado;
- backup/restore;
- VRVS 3P completo;
- import/export;
- hard delete;
- telas avançadas;
- analytics;
- refino visual fino antes do shell;
- features de Fase 2.

Justificativa:

Essas áreas aumentam risco antes de a base estar validada.

---

# 20. Critérios para chamar Opus novamente

Acionar Opus quando houver:

- fricção de UX;
- dúvida de jornada;
- redundância de telas;
- hierarquia visual da tela Hoje;
- linguagem de backup/restore;
- fluxo de Capture Inbox;
- sinalização de Sessão Livre;
- experiência mobile-first.

Não acionar Opus para:

- schema;
- índices;
- keyPaths;
- migração técnica;
- prompt de Cursor;
- rollback;
- commits;
- detalhe operacional de IndexedDB.

---

# 21. Critérios para chamar ChatGPT antes de executar

Voltar ao ChatGPT se:

- Cursor apontar confiança menor que 95%;
- Cursor sugerir mudar escopo;
- Cursor sugerir mudar schema;
- Cursor encontrar ambiguidade;
- Cursor propuser refatoração maior;
- houver risco de dados;
- houver impacto em Profile, backup, restore, Cards, CardReviews, Sessions ou Agenda;
- preview não bater com o pedido;
- diff vier grande demais;
- aparecer arquivo inesperado.

---

# 22. Critérios para Vini aprovar execução

Vini só deve aprovar execução quando estiver claro:

- o que será alterado;
- onde será alterado;
- o que não será alterado;
- qual risco existe;
- como testar;
- como voltar atrás;
- se mexe ou não em dados reais.

Se a resposta do Cursor vier confusa, não executar.

---

# 23. Linguagem operacional obrigatória

Evitar termos vagos como:

- “melhorar geral”;
- “ajustar arquitetura”;
- “refatorar um pouco”;
- “otimizar”;
- “limpar código”;
- “corrigir fluxo” sem dizer qual.

Preferir:

- “alterar somente X”;
- “não mexer em Y”;
- “validar com Z”;
- “se falhar, reverter W”.

---

# 24. Critérios de aceite do protocolo

Este protocolo estará aprovado quando:

- deixar claro quando Cursor pode ou não executar;
- proteger dados e Profile;
- proteger IndexedDB;
- proteger backup/restore;
- proteger CardReviews;
- permitir validação sem console no iPhone;
- definir rollback;
- definir anti-regressão;
- definir ordem futura de implementação;
- manter Opus como crítico criativo, não executor;
- manter Vini como decisor;
- manter ChatGPT como coordenador técnico.

---

# 25. Próximo passo após aprovação

Após aprovação deste protocolo:

1. consolidar pacote documental da Fase 0/Fase 1;
2. preparar prompt inicial para Cursor em modo:

```text
[PREVIEW — NÃO EXECUTAR]
```

3. Cursor deverá apenas propor plano inicial do repo novo;
4. ChatGPT revisará o plano;
5. Vini decidirá se autoriza a primeira execução.

---

# 26. Estado final antes do Cursor

Antes de Cursor entrar, devem estar aprovados:

- `SCHEMA_INDEXEDDB_v2.md`;
- `MODELO_DE_DADOS.md v1.1`;
- `DECISOES_FASE_0.md`;
- `ARQUITETURA_FASE_1.md v1.1`;
- `PROTOCOLO_RECONSTRUCAO.md`.

Com isso, Cursor entra apenas como executor assistido, começando obrigatoriamente por PREVIEW.

---

# Fim do documento
