- [x] Mostrar bônus vigente do Início e limitar notícias a dois minutos.
- [x] Narrar recebimento do cartão Saia Livre.
- [x] Separar avatares dos donos de nomes e aluguéis, sem fundo colorido.
- [x] Verificar regras e telas (33 testes; TV e abertura mobile; áudio não ouvido).

## Setup do remix

- [x] Migrations: conjunto vazio confirmado — nenhum arquivo copiado, histórico do banco vazio e coerente.
- [x] Rota de limpeza do cron movida para /api/public/cleanup (o app abria com erro 500).
- [x] Limpeza automática de salas paradas há 48 h, todo dia às 01:17 (Brasília).

## Refatoração da partida (prompt-11)

- [x] Vender chalé/resort (50% da obra), construção e demolição niveladas.
- [x] Tempo de 60 s por vez (banco joga/recusa/paga sozinho) + Passar a vez e Falir jogador no tabuleiro.
- [x] Carta da Van não paga mais o bônus do Início.
- [x] Reconectar ao lugar na partida; aviso de bichinho já escolhido; fechar câmera do Pix; troca limpa os Borós pedidos.
- [x] Tabuleiro não para em segundo plano; avatares sem atraso; passos 2× mais rápidos; limpeza das ações antigas.
- [x] Rodada + últimos 3 acontecimentos na lateral; anel de foco para controle de TV; aviso de virar a tela; vibração; mapa no celular.
- [x] Tabuleiro estica até 4:3 — sem faixas vazias em telas 16:10 / 4:3.

## Página inicial de cidades

- [x] Redesenhar somente / com capas leves e identidade de portal.
- [x] Verificar celular, teclado, destinos dos dois cartões e preservação de /salinas.

## Segurança das salas

- [x] Fechar leitura pública de salas e ações; permitir gravação do estado e leitura de ações apenas ao mestre com credencial da sala.
- [x] Verificar negação de acesso indevido, criação, entrada de jogador e recarregamento do mestre; salas antigas precisam ser recriadas.

## Pagamentos no jogo Salinas

- [x] Remover geração e leitura de QR de pagamento, mantendo confirmação e dados existentes; preservar QR de entrada na sala.
- [x] Verificar pagamentos, transferências e saldos nas carteiras e no tabuleiro.

## Cidade Boró no portal

- [x] Destino interno /boro e salas com cidade persistida.
- [x] Tabuleiro original, cartas, nomes de construções e notícias próprios, sem alterar Salinas.
- [x] Mesma voz e notícias próprias; verificar duas cidades e pagamentos numa partida.

## Selva dos Tambores

- [x] Mapa /selva com 56 casas, cartas, notícias, Onça, relíquias e mesma voz.

## Cidade dos Esquecidos

- [x] Criar mapa separado, capa e entrada pelo portal, preservando a geometria da TV.
- [x] Integrar despertar da maldição, banco fechado, névoa, sanidade, tochas e ritual cooperativo.
- [x] Adicionar regras visuais, narração e novidades exclusivas; verificar fuga em sala real com dois celulares e isolamento dos mapas por testes.

## Esquecidos: crise com continuidade

- [x] Reabrir banco após ritual, penalidades proporcionais e compatibilidade com partidas antigas.
- [x] Selos guiados, névoa, distorções aleatórias e fantasma com estado compartilhado.
- [x] Testar continuidade, penalidades, sincronização TV/celulares e isolamento dos mapas.

## Esquecidos: visual e distorções por voltas
- [x] Melhorar contraste e distinguir personagens sem mudar a geometria.
- [x] Ocultar missão concluída e trocar pares após todos passarem no Início, com retorno animado.
- [x] Narrar Gazeta de B$400 e verificar regras e partida (120 testes; TV e celular; reprodução de áudio confirmada).

## Otimização de desempenho (prompt-28)
- [x] Analisar navegação, sincronização, imagens, animações, código e medições reais antes de alterar a aplicação.
- [x] Reduzir consultas e renderizações redundantes sem mudar regras ou permissões.
- [x] Otimizar capas, carregamento e trabalho visual recorrente preservando o design.
- [x] Verificar testes, navegação e partida real em TV/celular; registrar resultados e limites (130 testes; uma consulta/6 s contra quatro; revisão em .lovable/reviews/performance.md).

## Esquecidos: ações rápidas e tensão TV/celular (prompt-29)
- [x] Simplificar oferendas e resgate por avatares sem alterar regras.
- [x] Animar o fantasma no perímetro e iluminar altares purificados sem mudar a geometria.
- [x] Adicionar batimento háptico, baixa sanidade e sussurros opcionais com redução de efeitos.
- [x] Verificar regras e fluxo compartilhado em TV e quatro celulares (134 testes; crise preparada pelo criador, resgate 0→30 e quatro selos pela UI; áudio reproduzido; chamada de vibração verificada, sensação física não verificável; preferências e tela de 320px).

## Esquecidos: cooperação e tensão restantes (prompt-30)
- [x] Altares livres nas novas crises, preservando sequência das crises antigas.
- [x] Vaquinha de dez segundos com contribuições de B$20/B$50, restituição e prêmio para quem ajuda.
- [x] Sintonia de três segundos com alternativa sem timing e sem punição por erro.
- [x] Ecos privados, impacto do fantasma na TV e peões perdidos nas sombras.
- [x] Verificar regras, TV e quatro celulares (146 testes; vaquinha 120+50+30, sintonia errada/certa, quatro selos, bônus, ecos e ataque; prazo final com restituição e pacto, sem pagamento duplicado).
- [x] Pacto secreto opcional por sala: oferta e escolha privadas, mestre resolve benefícios sem expor papéis aos participantes; acesso cruzado e identidade alegada negados em sala de teste.
