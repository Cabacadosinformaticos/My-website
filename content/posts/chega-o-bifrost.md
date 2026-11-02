---
title: A MediaBox reformou-se. Chega o bifrost
desc: O homelab ganhou um segundo MS-A1, dedicado aos serviços abertos à Internet. Porque separar o público do privado, porque não fiz um cluster, como os dois servidores se ligam, e de onde vêm os nomes.
category: [Homelab, Proxmox, Infraestrutura]
date: Out 2026
readTime: 8 min
cover: https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794513977/cabacatech/2026-11/covers/posts/chega-o-bifrost-166828df5a.webp
series: Diário do Homelab
seriesPart: 7
related: [project:homelab-proxmox-servidorzinho, post:publicar-um-site-sem-abrir-portas, post:jellyfin-e-truenas-o-que-aprendi]
---

O homelab mudou de forma. A MediaBox, o mini PC que corria o Jellyfin e o TrueNAS, deixou de ser servidor e vai ser o meu computador de secretária. O lugar dela é ocupado por um segundo Minisforum MS-A1, igual por fora ao Servidorzinho, com um papel muito específico: correr tudo o que está aberto à Internet.

Chama-se **bifrost**.

:::image-placeholder title="Os dois MS-A1" desc="Foto do Servidorzinho e do bifrost lado a lado, ligados pelo cabo direto." ratio="16:9"
:::

## Porque um segundo servidor

Em setembro abri os primeiros serviços ao público: o [IADE Horários](project-detail.html?id=iade-horarios) e o site da AEIADE, cada um na sua VM isolada, com um túnel e regras de firewall (contei como na [parte 5](blog-post.html?id=publicar-um-site-sem-abrir-portas)). Funciona, mas essas VMs vivem no mesmo servidor que o meu DNS, os servidores de jogos, as bases de dados de desenvolvimento e a minha VPN.

A separação por firewall é boa. A separação física é melhor. Com o bifrost, a regra fica simples de explicar:

| Servidor | Papel |
|---|---|
| Servidorzinho | Tudo o que é privado: DNS da casa, servidores de jogos, VPN, a plataforma de desenvolvimento |
| bifrost | Tudo o que é público: IADE Horários, site da AEIADE, a VM do projeto Fieldnote |

Se alguma coisa exposta à Internet correr mal, fica num servidor que não tem nada de privado.

:::specs title="bifrost"
Máquina: Minisforum MS-A1
CPU: AMD Ryzen 7 8700G
RAM: 32 GB DDR5
Storage: 512 GB NVMe
Base: Proxmox VE
Papel: Serviços abertos à Internet
:::

## Porque não fiz um cluster

Com dois servidores Proxmox, a ideia óbvia é juntá-los num cluster: uma só consola, VMs que migram de um lado para o outro. Decidi não o fazer.

:::decision title="Dois servidores independentes"
Um cluster Proxmox decide quem manda por maioria (quórum). Com dois nós, se um cair, o outro fica sozinho, sem maioria, e por segurança bloqueia a gestão das VMs. Para resolver isto é preciso um terceiro voto, um QDevice, noutra máquina. É mais uma peça para manter, para ganhar uma funcionalidade de que não preciso: as minhas VMs podem passar de um servidor para o outro com backup e restauro, em minutos.
:::

## Um cabo entre os dois

Os dois servidores ligam-se por um cabo direto de 2,5 GbE, fora da rede de casa. Esse cabo serve para duas coisas:

- **Mover VMs** de um servidor para o outro, sem passar pelo router.
- **Backups cruzados**: cada servidor guarda cópias das VMs do outro. É o plano para resolver a falha que mais me preocupa hoje, a de não ter cópias fora da máquina onde os dados vivem.

```text title="a ligação"
Servidorzinho  <== 2,5 GbE direto ==>  bifrost
      |                                    |
   rede de casa                     túneis para a Internet
```

## E a MediaBox?

O M90q tem um i5 de 35 W, 32 GB de RAM e dois slots NVMe. É fraco para servidor de armazenamento, como contei no [post sobre o Jellyfin e o TrueNAS](blog-post.html?id=jellyfin-e-truenas-o-que-aprendi), e ótimo para computador de secretária sempre ligado, que uso à distância pela mesma rede privada Tailscale.

## Os nomes

Com mais máquinas, "servidor 2" deixou de chegar. Escolhi uma família de nomes da mitologia nórdica:

| Máquina | Nome | Porquê |
|---|---|---|
| MS-A1 novo | bifrost | A ponte entre o mundo dos deuses e o dos humanos: é a máquina virada para a Internet |
| M90q | mimir | O sábio que aconselha Odin, e que é só uma cabeça. Assenta bem numa máquina pequenina |
| Portátil | sleipnir | O cavalo de Odin, que viaja entre mundos |
| Desktop futuro | odin | O principal |

O Servidorzinho mantém o nome. No Proxmox, o nome do nó está gravado na estrutura de configuração do próprio Proxmox, onde vivem as definições de todas as VMs, e mudá-lo a sério implica praticamente reinstalar. O nome nórdico dele seria yggdrasil, a árvore que segura os nove mundos, como ele segura as VMs todas. Fica para quando houver uma reinstalação a sério.

:::tip title="Escolhe o nome antes de instalar"
No Proxmox, decide o nome do nó antes da instalação. Depois, mudar custa muito mais do que parece.
:::

## O que vem a seguir

1. Instalar o Proxmox no bifrost e configurar a firewall antes de qualquer VM.
2. Mover as VMs públicas do Servidorzinho para o bifrost, uma de cada vez.
3. Ligar os backups cruzados pelo cabo direto e testar um restauro completo.
4. Escrever aqui como correu.
