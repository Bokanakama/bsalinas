# CidadeBoró

Banco imobiliário Brasileiro

Compre terrenos, cobre aluguel e administre seu dinheiro em um tabuleiro menor.

Os jogos são criados por salas

Um celular é o tabuleiro e mestre, que gerencia tudo

Tem os nomes e saldo de cada participante

Os celulares dos participantes são como uma carteira individual

Na hora de jogar os dados, cada celular mostra o nome de quem é a vez, e os dados. No celular do jogador ele tem a opção de jogar os dados ao clicar.

Cada celular tem opção de transferir dinheiro, mas para o jogo ficar interessante, vamos simular uma transferência de pix, onde o celular de quem deve pagar mostra a câmera, e o celular de quem vai receber mostra o QR code com o valor. O celular mestre gerencia isso automaticamente, sabe onde o jogador caiu e o que ele tem que pagar.

O celular mestre é como um banco central: Nos pontos de pedágio e em qualquer tipo de multa, é retirado automaticamente da conta do jogador. Assim como os bônus são transferidos automaticamente pro player (só as transferências banco-jogador)

O celular mestre simula os movimentos de acordo com os dados jogados no celular de cada jogador.

Sons e animações simuladas.

Implemente tudo do seu jeito. Sugira mais nomes pro dinheiro do jogo. O mestre vai ser ou em celular ou na TV, para isso adote a horizontal responsiva. Estilo visual 1: Feira e cidade (cores quentes, azulejos, notas de cédula, tipografia bold).

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://cidadeboro.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/20e2e7f5-2a40-44f4-9a0e-cc07d9a80d5a).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
