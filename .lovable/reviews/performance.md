# Revisão de desempenho

## Medições antes das alterações

- Semana de 21 a 28 de novembro de 2026: nenhuma página teve 30 medições por indicador. Não há amostra suficiente para classificar páginas como lentas ou afirmar uma melhoria de Core Web Vitals em produção.
- Página inicial: LCP p75 de 3,534 s (19 leituras; referência boa até 2,5 s), FCP p75 de 3,692 s (20; referência 1,8 s), INP p75 de 280 ms (17; referência 200 ms) e CLS p75 de 0,503 (22; referência 0,1). Indicadores distintos têm amostras distintas.
- Carteira aberta, sem ações: quatro consultas em seis segundos no navegador de teste.
- As consultas principais do banco tinham médias inferiores a 1 ms; o acesso às ações já tem índice por sala e data. Não há evidência para aumentar a capacidade do backend.

## Prioridades implementadas

1. **Consultas repetidas e renderizações:** leitura inicial reaproveitada; atualizações com a mesma data não redesenham a carteira; sincronização imediata preservada e consultas de segurança menos frequentes quando a conexão está saudável. Eventos durante uma consulta geram uma leitura posterior, sem perder o aviso.
2. **Gravação e filas:** cada sala tem uma fila de gravação independente, três tentativas e retenção do estado que ainda não foi confirmado; ações já enfileiradas não são enfileiradas novamente. Ações do anfitrião não aumentam o conjunto permanente de identificadores. Movimentos interrompidos por saída da página não continuam gravando depois da troca de sala.
3. **Capas pesadas:** versões WebP de 640 e 1280 pixels e escolha pelo tamanho da tela. Selva: 938.360 bytes originais, 278.016 na versão maior (~70% menor) e 90.658 na menor (~90% menor). Esquecidos: cerca de 2,61 MiB originais, 171.854 na maior (~94% menor) e 55.832 na menor (~98% menor). Arte original preservada; arquivos antigos mantidos para não quebrar versões publicadas.
4. **Trabalho recorrente da TV:** relógio de leilão isolado, sem redesenhar as 56 casas quatro vezes por segundo; fechamento agendado pelo prazo absoluto, na mesma fila do mestre. Posições idênticas não criam outro redesenho; layouts imutáveis resolvidos uma vez e descartáveis automaticamente.
5. **Carregamento opcional:** mapa, negociação, detalhes de imóvel e raspadinha carregados quando necessários; mapa e negociação antecipados na intenção de abertura. Separação automática das páginas já existia e foi preservada.
6. **Animações e áudio:** medições das propriedades agrupadas antes de alterar a tela; preferência por movimento reduzido checada antes das cópias; leitura da raspadinha limitada; relógio da Gazeta parado quando não necessário; sons desconectam seus nós após acabar; narrador reutiliza um reprodutor e para ao sair da TV. Conexão antecipada ao servidor de fontes.

## Verificação

- 130 testes passaram, incluindo abertura com uma única leitura, resposta inalterada, reconexão, leitura posterior, falha de gravação e isolamento de salas/layouts.
- Partida criada pela interface com dois jogadores; dados processados, mapa e negociação abertos/fechados; compra por B$60 confirmada, aluguel de B$10 confirmado pelo celular e saldos de B$1.450/B$1.490 conferidos após recarregar.
- Carteira parada: uma consulta em seis segundos após a mudança, contra quatro antes (75% menos nesse intervalo observado).
- As cinco páginas principais foram abertas em desktop e celular; capas carregadas e sem largura excedente. O prazo do leilão passou a vez para o próximo participante e o resultado foi persistido.
- TV 1280×800 e celular 390×844 verificados; sem erros de execução no fluxo. Geometria e design preservados.
- Compilação automática sem erros. Não foi publicada uma nova versão.

## Limites e recomendações futuras

- Não há medição comparável do pacote JavaScript de produção, FPS ou nota Lighthouse; não foi executado um build manual nem inventada pontuação.
- Não foram alteradas permissões, estrutura de tabelas, regra de turnos ou políticas de limpeza nesta otimização. O banco tem dois índices equivalentes nas ações, mas remover um sem análise operacional não foi necessário.
- A arquitetura ainda admite conflito entre duas TVs mestres autorizadas simultaneamente. Um bloqueio renovável e revisões transacionais precisam de projeto e testes dedicados.
- Recuperação de mais de 200 ações, empates nos horários, confirmação durável para limpeza e limpeza transacional são riscos identificados na auditoria, não resolvidos por esta rodada de desempenho.
- Conjunto de ações reais processadas permanece retido durante a sessão para não perder deduplicação; sua compactação depende de confirmação durável. Publicações antigas das tabelas e quotas de ações precisam de revisão separada antes de alterações.
- Não foi removido CSS ou dependências por parecerem ociosos: isso pode quebrar telas ou ferramentas existentes. Efeitos de névoa permanecem sem alteração visual; perfil de pintura em aparelhos fracos é necessário para justificar outra abordagem.
