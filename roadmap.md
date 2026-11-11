- [x] Mostrar bônus vigente do Início e limitar notícias a dois minutos.
- [x] Narrar recebimento do cartão Saia Livre.
- [x] Separar avatares dos donos de nomes e aluguéis, sem fundo colorido.
- [x] Verificar regras e telas (33 testes; TV e abertura mobile; áudio não ouvido).

## Setup do remix

- [x] Migrations: conjunto vazio confirmado — nenhum arquivo copiado, histórico do banco vazio e coerente.
- [x] Rota de limpeza do cron movida para /api/public/cleanup (o app abria com erro 500).
- [ ] Agendar a limpeza automática de salas paradas (ainda não há nada agendado).

## Refatoração da partida (prompt-11)

- [x] Vender chalé/resort (50% da obra), construção e demolição niveladas.
- [x] Tempo de 60 s por vez (banco joga/recusa/paga sozinho) + Passar a vez e Falir jogador no tabuleiro.
- [x] Carta da Van não paga mais o bônus do Início.
- [x] Reconectar ao lugar na partida; aviso de bichinho já escolhido; fechar câmera do Pix; troca limpa os Borós pedidos.
- [x] Tabuleiro não para em segundo plano; avatares sem atraso; passos 2× mais rápidos; limpeza das ações antigas.
- [x] Rodada + últimos 3 acontecimentos na lateral; anel de foco para controle de TV; aviso de virar a tela; vibração; mapa no celular.
- [ ] Reduzir as faixas vazias em telas 4:3 / 16:10 (tabuleiro continua em 16:9).
