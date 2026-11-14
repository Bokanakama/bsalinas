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
- [ ] Verificar pagamentos, transferências e saldos nas carteiras e no tabuleiro.
