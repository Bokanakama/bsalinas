# Corrigir apenas os dois problemas de acesso selecionados

## Resultado
- Impedir que visitantes consultem todas as salas e todas as ações dos jogadores.
- Permitir alterações de uma sala somente ao aparelho que criou seu tabuleiro.
- Preservar o acesso por código dos jogadores, sem exigir cadastro, e manter as regras e o visual dos jogos.
- Não corrigir, ignorar nem alterar o status de outros apontamentos.

## Mudança que precisa de confirmação
As salas atuais não têm uma identificação segura de quem criou o tabuleiro. A marca salva no navegador pode ser falsificada e não serve como autorização.

Para não conceder controle a um visitante indevido, as salas existentes não poderão ser retomadas como mestre após a correção. Será necessário criar novas salas. Nas novas salas, o aparelho criador guardará uma credencial exclusiva; outro aparelho não poderá assumir o tabuleiro apenas conhecendo o código.

## Implementação técnica
- Criar credenciais aleatórias de acesso, armazenando somente seus hashes no banco; separar acesso de participante e de mestre.
- Substituir as políticas irrestritas por acesso fechado aos dados originais, com operações mediadas por funções do servidor que validam a credencial e a sala a cada chamada.
- Disponibilizar ao participante apenas o estado da sua sala; disponibilizar o histórico de ações apenas ao mestre autorizado.
- Adaptar criação, leitura e gravação para essas verificações, sem alterar as funções puras de regras do jogo.
- Preservar a atualização rápida com um canal por sala cuja identificação não seja derivada apenas do código público; manter a persistência autorizada como fonte confiável.
- Não retornar credenciais do mestre em leituras de participantes.

## Verificação
- Testar criação e entrada por código, envio de ações e atualização do tabuleiro.
- Confirmar que consultas sem credencial não listam dados e que participantes não conseguem gravar o estado nem ler ações.
- Executar os testes relevantes e verificar novamente os dois apontamentos.
- Marcar apenas os dois apontamentos selecionados como corrigidos depois da implementação e das verificações.