# ARQUITETURA_FASE_1.md — Nova VRVS

**Versão:** 1.1  
**Status:** documento arquitetural para revisão  
**Fase:** Fase 1 — primeira versão funcional da reconstrução  
**Base:** `MODELO_DE_DADOS.md v1.1`, `DECISOES_FASE_0.md`, `SCHEMA_INDEXEDDB_v2.md`  
**Escopo:** definir como a primeira versão reconstruída da nova VRVS deve funcionar como app real de uso diário, sem entrar em código.

---

# 1. Objetivo da Fase 1

A Fase 1 tem como objetivo construir a primeira versão funcional, estável e segura da nova VRVS.

A Fase 1 não busca ter todas as funcionalidades futuras. Busca entregar o núcleo correto:

- dados bem estruturados;
- uso diário simples;
- Agenda como base operacional;
- tela inicial clara;
- estudo por Temas;
- revisão por Cards/VRVS 3P;
- Capture sem fricção;
- Sessões registráveis;
- backup e restore seguro;
- isolamento real entre Profiles;
- estabilidade no iPhone Safari/PWA.

A Fase 1 deve permitir que Vini abra o app e saiba rapidamente:

> "O que eu faço agora?"

---

# 2. Escopo da Fase 1

## 2.1 Entra na Fase 1

Entram na Fase 1:

- IndexedDB como persistência principal;
- stores definidos no `SCHEMA_INDEXEDDB_v2.md`;
- Profiles;
- AppSettings;
- Areas;
- Temas;
- Cards;
- CardReviews;
- Sessões;
- AgendaItems;
- Captures;
- BackupMetadata;
- tela inicial **Hoje**;
- Agenda como módulo técnico por trás da tela Hoje;
- Hub Diário incorporado como bloco derivado dentro da tela Hoje;
- navegação mobile-first com:
  - Hoje;
  - Temas;
  - Mais;
  - botão flutuante Capture;
- revisão de Cards pelo VRVS 3P;
- Sessão de estudo;
- Sessão Livre como exceção controlada;
- Capture Inbox;
- backup global;
- backup por Profile;
- restore como novo Profile por padrão;
- substituição de Profile apenas com confirmação forte;
- soft delete;
- métricas básicas derivadas.

---

## 2.2 Não entra na Fase 1

Não entram na Fase 1:

- backend;
- API externa;
- Python;
- servidor obrigatório;
- sync automático entre dispositivos;
- Note como entidade própria;
- Reminder como entidade própria;
- tags/labels transversais;
- merge inteligente de backups;
- split de Capture;
- undo de Capture;
- autoarquivamento de Captures antigas;
- notificações locais;
- batch actions;
- métricas avançadas;
- gráficos avançados;
- onboarding/tour;
- configurações finas do VRVS 3P;
- importação automática do legado;
- integração ativa com Planner;
- qualquer dependência de TEOT/R3 como centro do produto.

---

# 3. Princípios arquiteturais da Fase 1

## 3.1 Estabilidade acima de novidade

Toda decisão da Fase 1 deve favorecer:

- previsibilidade;
- segurança de dados;
- clareza de uso;
- menor risco de perda;
- menor risco de regressão;
- menor fricção no uso diário.

Se houver conflito entre uma feature nova e o núcleo estável, vence o núcleo estável.

---

## 3.2 Profile é fronteira absoluta

Toda entidade de dados do usuário respeita `profileId`.

A UI sempre opera sobre o `activeProfileId`.

Nenhuma tela deve misturar dados entre Profiles.

Exceções globais:

- `AppSettings`;
- `BackupMetadata`;
- `_meta`.

---

## 3.3 Tema é centro, mas não prisão

Tema é a unidade principal de organização.

Mas a Fase 1 aceita duas exceções controladas:

- Capture nasce sem Tema;
- Sessão tipo `study` pode ser Livre, sem Tema, com `pendingAssociation = true`.

Card continua exigindo Tema.

---

## 3.4 Histórico é sagrado

A Fase 1 não deve reescrever histórico.

Regras:

- CardReviews são imutáveis;
- mover Card de Tema não altera Reviews antigas;
- reverter Sessão não apaga CardReviews;
- métricas históricas derivam de eventos reais;
- restore destrutivo exige salvaguarda.

---

## 3.5 UX não pode virar risco técnico

Melhorias de produto são bem-vindas, mas não podem:

- reabrir schema sem motivo forte;
- criar entidade nova sem decisão explícita;
- duplicar fonte de verdade;
- aumentar risco de perda de dados;
- transformar Fase 1 em Fase 2;
- gerar dependência de backend/API/servidor.

---

# 4. Navegação principal da Fase 1

A navegação da Fase 1 será mobile-first para iPhone.

## 4.1 Abas principais

A navegação principal terá três destinos:

1. **Hoje**
2. **Temas**
3. **Mais**

Além disso, haverá um botão flutuante global:

- **Capture**

---

## 4.2 Por que essa navegação

## Hoje

É a tela inicial.

Serve para:

- mostrar o que fazer agora;
- iniciar revisão;
- iniciar Sessão;
- ver pendências;
- ver alertas leves do estado do app.

## Temas

É a área de organização e exploração.

Serve para:

- navegar por Areas;
- abrir Temas;
- criar Temas;
- criar Cards;
- estudar um Tema específico;
- acessar notas e histórico daquele Tema.

## Mais

É a área de sistema e itens secundários.

Serve para:

- Profiles;
- backup;
- restore;
- configurações;
- Sessões;
- Capture Inbox;
- manutenção futura;
- informações do app.

## Capture flutuante

Capture é gesto rápido, não tela principal.

Por isso não vira aba.

O botão flutuante deve estar disponível globalmente para capturar algo sem interromper o fluxo.

---

# 5. Tela inicial: Hoje

## 5.1 Papel da tela Hoje

A tela **Hoje** é a home operacional da nova VRVS.

Ela substitui a ideia de Agenda como "lista de tarefas" e organiza o dia em torno da pergunta:

> "O que faz sentido fazer agora?"

Tecnicamente, o módulo Agenda continua existindo.

Na experiência do usuário, a tela inicial se chama **Hoje**.

---

## 5.2 Relação entre Hoje, Agenda e Hub Diário

## Agenda

Agenda é o conceito/módulo técnico que combina:

- Cards vencendo;
- Cards atrasados;
- AgendaItems;
- itens adiados;
- compromissos materializados.

## Hoje

Hoje é a tela que apresenta isso ao usuário.

## Hub Diário

Hub Diário não será tela separada na Fase 1.

Sua função derivada será incorporada dentro da tela Hoje, principalmente no bloco **Estado**.

Regra congelada:

- Hub Diário não tem store próprio;
- não duplica dados;
- não vira fonte de verdade;
- apenas reorganiza dados derivados.

---

## 5.3 Estrutura da tela Hoje

A tela Hoje terá três blocos principais:

1. **Pra agora**
2. **Pendências**
3. **Estado**

---

## 5.4 Bloco 1 — Pra agora

É o bloco principal da tela.

Deve mostrar uma ação dominante.

Ordem sugerida:

1. Se há Cards vencendo ou atrasados:
   - mostrar ação principal de revisão.
   - exemplo: "Revisar 8 cards".

2. Se não há Cards vencendo, mas há AgendaItems do dia:
   - mostrar ação para começar o item mais relevante.

3. Se não há revisão nem AgendaItem relevante:
   - mostrar ação para "Começar Sessão".

Esse bloco deve sempre permitir alternativa:

- "começar outra coisa";
- "escolher Tema";
- "Sessão Livre".

O bloco **Pra agora** sugere, mas não força.

---

## 5.5 Bloco 2 — Pendências

Mostra a lista compacta do que está pendente.

Pode incluir:

- Cards atrasados;
- Cards vencendo hoje;
- AgendaItems do dia;
- AgendaItems atrasados;
- AgendaItems `snoozed` que chegaram à nova data.

Ações possíveis:

- iniciar;
- concluir;
- pular;
- adiar;
- abrir detalhe.

Refino de UX posterior:

- uso de swipe em listas;
- hierarquia visual entre atrasados, hoje e adiados;
- agrupamento por urgência.

---

## 5.6 Bloco 3 — Estado

Mostra alertas leves e derivados.

Exemplos:

- Captures pendentes;
- último backup há muitos dias;
- Sessões Livres pendentes de associação;
- resumo discreto de atividade recente.

Esse bloco não deve virar painel poluído.

Regra:

- se não houver nada relevante, o bloco pode ficar discreto ou não aparecer.

---

# 6. Módulos principais

## 6.1 Módulo Profile

Responsável por:

- criar Profile;
- listar Profiles ativos;
- trocar `activeProfileId`;
- arquivar Profile;
- impedir Profile arquivado de ser ativo;
- garantir Area "Geral" automática por Profile;
- guardar `Profile.preferences`.

Regras:

- troca de Profile é gesto consciente;
- nenhuma troca ocorre implicitamente;
- ao trocar Profile, todas as telas refletem apenas o Profile ativo;
- Profile arquivado permanece recuperável;
- restore como novo Profile não deve ativar automaticamente sem decisão do usuário.

---

## 6.2 Módulo AppSettings

Responsável por:

- guardar `activeProfileId`;
- guardar configuração global da instalação;
- registrar estado técnico global;
- não guardar conteúdo de estudo.

Regras:

- AppSettings não tem `profileId`;
- AppSettings não guarda preferência específica de Profile;
- preferências específicas vivem em `Profile.preferences`.

---

## 6.3 Módulo Areas e Temas

Responsável por:

- criar Areas;
- criar Temas;
- organizar Temas por Area;
- editar Tema;
- arquivar Tema;
- alterar status do Tema;
- exibir `Tema.notes`.

Status oficiais:

- `not_started`;
- `in_study`;
- `paused`;
- `mastered`.

Regras:

- todo Tema tem Area;
- Area "Geral" existe sempre;
- Tema pode existir sem Cards;
- Tema pode existir com Sessões;
- Tema arquivado suspende revisões;
- Tema pausado ou dominado não entra na Agenda virtual ativa;
- status não é arquivamento.

---

## 6.4 Transições de status do Tema

Na Fase 1, os status não devem depender apenas de mudança manual.

Regra prática:

- Tema recém-criado nasce como `not_started`;
- ao criar o primeiro Card no Tema, muda para `in_study`;
- ao criar a primeira Sessão no Tema, muda para `in_study`;
- `paused` é ação manual;
- `mastered` é ação manual;
- se um Tema `paused` voltar a receber Card ou Sessão, pode voltar para `in_study`;
- se um Tema `mastered` voltar a receber Card ou Sessão, pode voltar para `in_study`.

Justificativa:

- evita Temas eternamente presos em `not_started`;
- reduz burocracia;
- transforma status em informação útil.

Refino de UX posterior:

- confirmar ou não a saída automática de `paused`/`mastered`;
- linguagem visual para "retomado".

---

## 6.5 Módulo Cards e VRVS 3P

Responsável por:

- criar Cards dentro de Tema;
- editar Cards;
- arquivar Cards;
- mover Card entre Temas;
- calcular estado VRVS 3P;
- atualizar cache do Card após revisão;
- gerar CardReviews.

Regras:

- Card sem Tema não existe;
- pergunta solta vira Capture;
- `cardId` nunca muda;
- mover Card não reescreve histórico;
- Card arquivado não gera revisão;
- algoritmo VRVS 3P opera sobre Cards, não sobre Temas.

---

## 6.6 Módulo CardReviews

Responsável por:

- registrar cada revisão de Card;
- preservar histórico;
- alimentar métricas;
- permitir reconstrução futura do estado do Card.

Regras:

- CardReview é imutável;
- CardReview não tem soft delete;
- CardReview guarda snapshot do `temaId`;
- CardReview pode estar vinculado a uma Sessão tipo `review`;
- não existe edição normal de CardReview.

---

## 6.7 Módulo Sessões

Responsável por:

- iniciar Sessão;
- finalizar Sessão;
- registrar duração;
- associar Sessão a Tema quando aplicável;
- registrar Sessão Livre;
- reverter Sessão por soft delete.

Tipos:

- `study`;
- `review`.

Regras:

- Sessão `review` exige Tema;
- Sessão `review` contém CardReviews;
- Sessão `study` pode ser Livre;
- Sessão Livre nasce com `pendingAssociation = true`;
- Sessão Livre deve poder ser associada depois;
- reverter Sessão não apaga CardReviews.

---

## 6.8 Sessão Livre

Sessão Livre é permitida, mas deve continuar sendo exceção controlada.

Regras:

- aparece como pendente de associação;
- não conta em métricas específicas de Tema antes de ser associada;
- pode contar em métricas globais de tempo investido;
- deve ter caminho claro para associação posterior;
- não deve ser escondida;
- não deve ser tratada como erro.

Refino de UX posterior:

- badge "associar a Tema";
- aviso discreto se houver muitas Sessões Livres pendentes;
- posição exata na tela Sessões ou no bloco Estado da tela Hoje.

---

## 6.9 Módulo Agenda

Responsável por:

- montar a base da tela Hoje;
- identificar Cards vencendo;
- identificar Cards atrasados;
- listar AgendaItems;
- tratar adiamentos;
- permitir iniciar revisão;
- permitir iniciar estudo;
- permitir concluir, pular ou adiar AgendaItems.

Regras:

- Cards vencendo não são materializados automaticamente como AgendaItems;
- Cards atrasados acumulam;
- AgendaItems são persistidos;
- AgendaItem `snoozed` aparece na nova data;
- AgendaItem ativo sem alvo válido deve ser cancelado/removido;
- Agenda não duplica fonte de verdade.

---

## 6.10 Módulo AgendaItems

Responsável por:

- criar compromisso materializado;
- concluir compromisso;
- pular compromisso;
- adiar compromisso;
- vincular item a Tema, Card ou nenhum alvo.

Estados oficiais:

- `pending`;
- `done`;
- `skipped`;
- `snoozed`.

Regras:

- termo técnico é `snoozed`;
- label de interface é "adiado";
- não usar `postponed`;
- adiar altera `scheduledDate` no mesmo registro;
- um Card não deve ter mais de um AgendaItem ativo apontando para ele;
- AgendaItem livre pode existir sem target.

Refino de UX posterior:

- linguagem dos botões;
- badges de "adiado";
- indicação de atraso recorrente.

---

## 6.11 Módulo Capture

Responsável por:

- criar Capture rapidamente;
- listar Captures pendentes;
- converter Capture;
- arquivar Capture;
- preservar histórico de Capture convertida.

Regras:

- Capture nasce sem Tema;
- Capture não gera revisão;
- Capture não tem `nextReviewDate`;
- Capture pode virar Tema, Card ou AgendaItem;
- Capture convertida não é deletada;
- na Fase 1 não há split;
- na Fase 1 não há undo.

---

## 6.12 Capture Inbox

A Inbox é o local de organização posterior das Captures.

Direção da Fase 1:

- Capture continua livre;
- conversão não é automática;
- o usuário decide o destino;
- o fluxo deve favorecer o destino mais comum: Card;
- Card deve aparecer como opção principal, não obrigatória;
- conversão para Card exige escolha de Tema;
- conversão para Tema cria novo Tema;
- conversão para AgendaItem exige data;
- arquivar mantém histórico.

Refino de UX posterior:

- ordem visual das opções;
- bottom sheet de escolha rápida;
- pré-seleção de Tema recente;
- filtros na Inbox.

---

## 6.13 Módulo Backup e Restore

Responsável por:

- gerar backup global;
- gerar backup por Profile;
- registrar BackupMetadata;
- restaurar backup como novo Profile;
- permitir substituição destrutiva apenas com confirmação forte;
- evitar sobrescrita acidental.

Regras:

- backup entra na Fase 1;
- restore padrão cria novo Profile;
- Profiles existentes ficam intocados no restore padrão;
- substituição exige confirmação forte;
- antes de substituir, gerar backup automático pré-substituição;
- merge fica fora da Fase 1.

Refino de UX posterior:

- linguagem exata das telas de risco;
- confirmação forte;
- checklist visual para o usuário.

---

# 7. Telas mínimas da Fase 1

A Fase 1 deve ter telas suficientes para uso real, sem excesso.

## 7.1 Hoje

Tela inicial.

Contém:

- Pra agora;
- Pendências;
- Estado.

Ações principais:

- iniciar revisão;
- começar Sessão;
- abrir item pendente;
- acessar Captures pendentes;
- acessar backup quando necessário.

---

## 7.2 Temas

Tela para navegar por Areas e Temas.

Permite:

- listar Temas do Profile ativo;
- filtrar por Area;
- filtrar por status;
- criar Tema;
- editar Tema;
- arquivar Tema;
- acessar Tema Detalhe.

---

## 7.3 Tema Detalhe

Tela de um Tema específico.

Mostra:

- nome;
- Area;
- status;
- notes;
- Cards do Tema;
- Sessões do Tema;
- ações principais.

Permite:

- criar Card;
- iniciar Sessão de estudo;
- iniciar revisão;
- editar Tema;
- pausar Tema;
- marcar como mastered;
- arquivar Tema.

Na UI, preferir verbos claros:

- "Pausar";
- "Retomar";
- "Marcar como dominado";
- "Arquivar".

Evitar expor "status" como linguagem principal para o usuário.

---

## 7.4 Cards / Revisão

Pode existir dentro do Tema Detalhe ou como fluxo/modal próprio.

Permite:

- listar Cards do Tema;
- criar Card;
- editar Card;
- arquivar Card;
- revisar Cards vencidos;
- registrar resposta;
- gerar CardReview;
- atualizar estado atual do Card.

---

## 7.5 Sessões

Tela secundária, acessível por Mais ou contexto.

Foco:

- Sessões Livres pendentes;
- histórico geral de Sessões;
- associação de Sessão Livre a Tema;
- reversão de Sessão.

Importante:

- iniciar Sessão não depende exclusivamente dessa tela;
- início rápido deve existir pela tela Hoje;
- início contextual deve existir no Tema Detalhe.

---

## 7.6 Capture / Inbox

Pode ser acessada por:

- botão flutuante para criar Capture;
- bloco Estado da tela Hoje;
- tela Mais.

Permite:

- criar Capture;
- listar Captures pendentes;
- converter Capture;
- arquivar Capture.

---

## 7.7 Mais / Sistema

Tela de sistema.

Contém:

- Profile;
- backup;
- restore;
- configurações;
- Sessões;
- Capture Inbox;
- informações do app;
- área avançada, se necessária.

Deve ser organizada em seções, para não virar gaveta confusa:

- Perfil;
- Conteúdo;
- Sistema.

---

# 8. Fluxos principais

## 8.1 Abrir app

Fluxo:

1. app inicia;
2. IndexedDB abre;
3. AppSettings é carregado;
4. `activeProfileId` é identificado;
5. dados do Profile ativo são consultados;
6. tela Hoje é montada;
7. usuário vê a ação principal em "Pra agora".

Se não houver Profile:

- criar Profile inicial;
- criar Area "Geral" automática;
- definir `activeProfileId`;
- abrir Hoje.

---

## 8.2 Criar Tema

Fluxo:

1. usuário entra em Temas;
2. toca em criar Tema;
3. escolhe nome;
4. escolhe Area ou usa "Geral";
5. Tema nasce como `not_started`;
6. Tema fica disponível no Profile ativo.

---

## 8.3 Criar Card

Fluxo:

1. usuário entra em um Tema;
2. toca em criar Card;
3. preenche pergunta/resposta;
4. Card nasce vinculado ao Tema;
5. se Tema estava `not_started`, muda para `in_study`;
6. Card recebe estado inicial VRVS 3P;
7. Card passa a poder aparecer na Agenda virtual quando tiver `nextReviewDate`.

Regra:

- se o usuário não quiser escolher Tema, deve criar Capture, não Card.

---

## 8.4 Revisar Cards pela Hoje

Fluxo:

1. usuário abre Hoje;
2. bloco Pra agora mostra revisão disponível;
3. usuário toca em revisar;
4. inicia Sessão `review`;
5. responde Cards;
6. cada resposta gera CardReview;
7. estado atual do Card é atualizado;
8. Sessão é finalizada;
9. usuário retorna para Hoje ou vê resumo simples.

---

## 8.5 Começar Sessão pela Hoje

Fluxo:

1. usuário abre Hoje;
2. toca em "Começar Sessão";
3. escolhe:
   - Tema recente;
   - outro Tema;
   - Sessão Livre;
4. Sessão começa;
5. ao finalizar, Sessão é registrada.

Se a Sessão estiver associada a Tema `not_started`, o Tema vira `in_study`.

---

## 8.6 Registrar Sessão pelo Tema

Fluxo:

1. usuário abre Tema Detalhe;
2. toca em iniciar Sessão;
3. estuda;
4. finaliza;
5. Sessão fica associada ao Tema.

---

## 8.7 Sessão Livre

Fluxo:

1. usuário escolhe Sessão Livre;
2. Sessão começa sem Tema;
3. ao finalizar, fica com `pendingAssociation = true`;
4. aparece como pendente de associação;
5. depois pode ser associada a Tema.

---

## 8.8 Criar Capture

Fluxo:

1. usuário toca botão flutuante;
2. escreve rapidamente;
3. salva;
4. Capture vai para Inbox;
5. usuário segue o uso sem organizar agora.

---

## 8.9 Processar Capture

Fluxo:

1. usuário abre Inbox;
2. escolhe Capture;
3. decide destino:
   - Card;
   - AgendaItem;
   - Tema;
   - arquivar;
4. se virar Card, escolhe Tema;
5. Capture muda de status;
6. destino criado é registrado.

---

## 8.10 Criar AgendaItem

Fluxo:

1. usuário cria compromisso;
2. define data;
3. define alvo, se houver;
4. AgendaItem nasce como `pending`;
5. aparece na tela Hoje na data adequada.

---

## 8.11 Adiar AgendaItem

Fluxo:

1. usuário toca em adiar;
2. escolhe nova data;
3. o mesmo AgendaItem muda para `snoozed`;
4. `scheduledDate` é atualizada;
5. item reaparece na nova data.

Não criar novo registro.

---

## 8.12 Backup

Fluxo:

1. usuário abre Mais;
2. escolhe Backup;
3. escolhe global ou Profile;
4. arquivo é gerado;
5. usuário salva/exporta;
6. BackupMetadata registra o evento.

---

## 8.13 Restore como novo Profile

Fluxo padrão:

1. usuário escolhe arquivo de backup;
2. app valida estrutura;
3. app mostra resumo;
4. app cria novo Profile;
5. dados são importados para esse novo Profile;
6. Profiles existentes permanecem intactos;
7. usuário decide se troca para o novo Profile.

---

## 8.14 Substituir Profile por backup

Fluxo destrutivo:

1. usuário escolhe restaurar substituindo Profile;
2. app mostra aviso forte;
3. app gera backup automático pré-substituição;
4. usuário confirma de forma forte;
5. Profile escolhido é substituído;
6. BackupMetadata registra operação.

Este fluxo não é padrão.

---

# 9. Regras práticas por módulo

## 9.1 Profile

- Sempre validar `activeProfileId`.
- Nunca listar dados sem filtro de Profile.
- Ao arquivar Profile ativo, exigir troca prévia para outro Profile.
- Ao restaurar backup como novo Profile, não ativar automaticamente sem decisão do usuário.

---

## 9.2 Tema

- Tema arquivado não aparece em listas padrão.
- Tema `paused` aparece em filtro próprio.
- Tema `mastered` aparece em filtro próprio.
- Cards de Tema `paused`, `mastered` ou arquivado não entram na Agenda virtual.
- Tema com Cards, Reviews ou Sessões não deve sofrer hard delete na Fase 1.

---

## 9.3 Card

- Card exige Tema.
- Card arquivado não entra na Agenda.
- Card movido de Tema mantém `cardId`.
- Reviews antigas não mudam.
- Card sem Reviews pode eventualmente ser hard deleted em área avançada, mas isso não é prioridade da Fase 1.

---

## 9.4 Sessão

- Sessão `review` exige Tema.
- Sessão `study` pode não ter Tema.
- Sessão Livre deve ficar localizável.
- Sessão Livre não conta em métricas específicas de Tema antes de associação.
- Sessão Livre pode contar em métricas globais.
- Sessão revertida some das métricas e listagens padrão.
- Reverter Sessão não reverte CardReviews.

---

## 9.5 Agenda / Hoje

- Hoje deve ser rápida.
- Cards vencendo são calculados por índice de `nextReviewDate`.
- Cards atrasados acumulam.
- AgendaItems são persistidos.
- AgendaItems `done` e `skipped` são históricos.
- AgendaItems `pending` e `snoozed` são ativos.
- Target arquivado cancela intenção futura.
- Hoje não duplica dados.

---

## 9.6 Capture

- Capture deve ser o caminho de menor fricção.
- Capture não exige Tema.
- Capture não exige data.
- Capture não exige tipo final.
- Conversão é decisão posterior.
- Fase 1 não tenta resolver casos complexos de Capture.

---

## 9.7 Backup/Restore

- Backup precisa ser fácil de gerar.
- Restore precisa ser difícil de fazer errado.
- Caminho padrão é novo Profile.
- Caminho destrutivo exige confirmação forte.
- Merge não existe na Fase 1.
- Antes de qualquer substituição, backup automático pré-substituição.

---

# 10. Comportamentos delicados

## 10.1 Hoje vs Agenda vs Hub Diário

Risco:

- confusão de nomes;
- duplicação de telas;
- duplicação de dados.

Decisão da Fase 1:

- Agenda permanece como módulo técnico;
- Hoje é a tela inicial;
- Hub Diário vira bloco derivado dentro de Hoje;
- não há store próprio para Hub;
- não há duplicação de dados.

---

## 10.2 Agenda virtual + AgendaItems

Risco:

- duplicar compromissos;
- materializar Cards vencendo desnecessariamente;
- confundir revisão automática com compromisso manual.

Regra:

- Cards vencendo continuam derivados;
- AgendaItems continuam materializados;
- a tela Hoje combina os dois.

---

## 10.3 Sessão Livre

Risco:

- virar bagunça permanente;
- distorcer métricas por Tema;
- virar caminho principal por preguiça de escolher Tema.

Regra:

- permitir;
- marcar como pendente;
- manter fora de métricas específicas de Tema até associação;
- oferecer associação posterior;
- não colocar Sessão Livre como opção mais destacada que Temas recentes.

---

## 10.4 Status do Tema

Risco:

- status virar decoração;
- Vini esquecer de trocar manualmente;
- confundir `paused` com arquivado.

Regra:

- entrada em uso vira `in_study` automaticamente;
- `paused` e `mastered` são declarações manuais;
- UI deve falar em verbos simples, não em status técnico.

---

## 10.5 Capture Inbox

Risco:

- Inbox virar cemitério;
- processamento ser chato;
- Captures acumularem sem destino.

Regra:

- Capture continua rápida;
- Inbox deve favorecer conversão comum para Card;
- bloco Estado pode mostrar Captures pendentes de forma discreta;
- sem automações agressivas na Fase 1.

---

## 10.6 Restore destrutivo

Risco:

- perda de dados;
- sobrescrever Profile errado;
- confundir backup global e profile_only.

Regra:

- default sempre novo Profile;
- substituição sempre avançada;
- confirmação forte;
- backup automático antes.

---

## 10.7 CardReview imutável

Risco:

- usuário querer corrigir clique errado;
- tentação de editar histórico.

Regra:

- não editar CardReview;
- novo evento corrige rumo do algoritmo;
- histórico permanece como aconteceu.

---

## 10.8 Soft delete

Risco:

- usuário achar que apagou definitivamente;
- dados arquivados voltarem em filtros errados;
- hard delete quebrar referências.

Regra:

- arquivar é padrão;
- hard delete é exceção avançada;
- listagens padrão escondem arquivados;
- referências históricas permanecem válidas.

---

## 10.9 iPhone Safari / PWA

Risco:

- problemas de storage;
- lentidão em IndexedDB;
- gestos quebrados;
- cache agressivo;
- scroll/modal problemático.

Regra:

- design mobile-first;
- evitar fluxos frágeis;
- validação por checklist e prints;
- nada que dependa de console no iPhone;
- nada que exija reinstalar PWA.

---

# 11. Critérios de estabilidade

## 11.1 Dados

- cada entidade tem store definido;
- cada entidade de usuário tem `profileId`;
- cada query crítica tem índice adequado;
- não há dependência de localStorage para dados principais;
- dados históricos não são reescritos;
- soft delete está claro.

---

## 11.2 Perfis

- Profile ativo é único;
- troca de Profile não mistura dados;
- Profile arquivado não pode ser ativo;
- restore como novo Profile não altera Profiles existentes;
- backup por Profile preserva fronteira do Profile.

---

## 11.3 Hoje / Agenda

- Hoje diferencia derivado de persistido;
- Cards vencendo não viram AgendaItems automaticamente;
- atrasados acumulam;
- AgendaItem `snoozed` usa nova data;
- item concluído/pulado vira histórico;
- Hub Diário não duplica dados.

---

## 11.4 Revisão

- toda revisão gera CardReview;
- CardReview não é editado;
- estado do Card é cache;
- histórico permite reconstrução futura;
- VRVS 3P continua operando sobre Cards.

---

## 11.5 Backup/Restore

- backup global definido;
- backup por Profile definido;
- restore padrão seguro definido;
- substituição destrutiva protegida;
- merge excluído da Fase 1.

---

## 11.6 UX operacional

- o app abre em Hoje;
- o usuário entende o que fazer agora;
- Capture é rápido;
- começar Sessão não é burocrático;
- Sessão Livre é permitida sem virar bagunça;
- operações destrutivas não ficam no caminho principal.

---

# 12. O que fica fora da Fase 1

Fica fora:

- Note como store próprio;
- Reminder;
- tags;
- sync;
- merge;
- backend;
- API externa;
- Python;
- servidor;
- importação automática do legado;
- refatoração do legado;
- integração ativa com Planner;
- split de Capture;
- undo de Capture;
- autoarquivamento de Capture;
- notificações locais;
- batch actions;
- dashboard avançado;
- manutenção avançada;
- analytics complexos;
- edição de CardReview;
- algoritmo novo de repetição;
- configurações finas do VRVS 3P;
- múltiplas camadas de hierarquia além de Area → Tema → Card.

---

# 13. Critérios de aceite da Fase 1

A Fase 1 será considerada arquiteturalmente aceita quando:

## 13.1 Núcleo de dados

- IndexedDB segue `SCHEMA_INDEXEDDB_v2.md`;
- stores da Fase 1 existem conforme schema;
- nenhum store de Fase 2 é antecipado sem decisão;
- entidades respeitam `profileId`.

---

## 13.2 Uso mínimo real

O usuário consegue:

- criar Profile;
- trocar Profile;
- criar Area;
- criar Tema;
- criar Card;
- revisar Card;
- gerar CardReview;
- registrar Sessão;
- iniciar Sessão rapidamente pela Hoje;
- criar Capture;
- processar Capture;
- criar AgendaItem;
- ver Hoje;
- fazer backup;
- restaurar backup como novo Profile.

---

## 13.3 Segurança

- não há operação destrutiva como padrão;
- soft delete é usado;
- restore destrutivo exige confirmação forte;
- Profile não mistura dados;
- CardReviews não são apagados;
- Hoje não duplica fonte de verdade.

---

## 13.4 Clareza de escopo

- Fase 2 está separada;
- apostas provisórias estão identificadas;
- pontos de UX podem ser refinados sem reabrir arquitetura;
- Cursor ainda não entra sem protocolo.

---

# 14. Refino de UX posterior

Sem bloquear este documento, os seguintes pontos podem receber revisão criativa posterior:

- hierarquia visual da tela Hoje;
- composição do bloco Pra agora;
- organização visual de Pendências;
- linguagem do bloco Estado;
- bottom sheets;
- swipe em listas;
- microcopy de Capture;
- badges de Sessão Livre;
- linguagem de backup/restore;
- linguagem de Pausar/Arquivar/Dominar Tema;
- cap visual de Cards por sessão.

Esses refinamentos não devem reabrir:

- entidades;
- schema;
- decisões congeladas;
- fronteiras de dados;
- regras de segurança.

---

# 15. Próximo passo após aprovação

Após aprovação deste `ARQUITETURA_FASE_1.md v1.1`, o próximo documento é:

## `PROTOCOLO_RECONSTRUCAO.md`

Objetivo:

Definir como a reconstrução será conduzida antes da entrada do Cursor.

---

# 16. Estado final após este documento

Com este documento aprovado, a nova VRVS terá:

- `SCHEMA_INDEXEDDB_v2.md` — base técnica;
- `MODELO_DE_DADOS.md v1.1` — base conceitual;
- `DECISOES_FASE_0.md` — consolidação decisória;
- `ARQUITETURA_FASE_1.md v1.1` — arquitetura prática da primeira versão funcional.

Ainda falta:

- `PROTOCOLO_RECONSTRUCAO.md`.

Cursor continua fora até o protocolo estar fechado.

---

# Fim do documento
