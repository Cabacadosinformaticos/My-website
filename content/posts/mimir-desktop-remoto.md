---
title: mimir, um desktop que fica em casa
desc: Um ThinkCentre Tiny sempre ligado em casa, com Windows 11, acesso por SSH e RDP só através do Tailscale. O hardware, a energia e o que correu menos bem.
category: [Homelab, Windows, Redes]
date: Out 2026
readTime: 5 min
cover: https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794654838/cabacatech/2026-11/covers/posts/mimir-desktop-remoto-d301066888.webp
related: [project:homelab-proxmox-servidorzinho, post:chega-o-bifrost]
---

O mimir é um Lenovo ThinkCentre M90q Gen 6 que está sempre ligado em casa. É o meu desktop e uma segunda máquina de trabalho. Só lhe chego pela rede privada Tailscale. O portátil continua a andar comigo. O mimir fica no mesmo sítio, com os programas abertos e o trabalho que lá deixei.

Não era esta a máquina que eu tinha planeado. Queria usar um M90q Gen 5 que estava parado, o antigo MediaBox. Entretanto apareceu um Gen 6 a bom preço, troquei um pelo outro e vendi o Gen 5. Em outubro de 2026 o Gen 6 ficou com o lugar de desktop e com o nome mimir, da lista de nomes nórdicos que estou a dar às máquinas.

:::specs title="mimir"
Modelo: Lenovo ThinkCentre M90q Gen 6 (Tiny)
CPU: Intel Core Ultra 5 235T, 14 núcleos
RAM: 32 GB DDR5 a 5600 MT/s (2 x 16 GB)
Discos: 2 x Samsung 990 EVO Plus 2 TB NVMe
Gráfica: integrada, com um monitor ligado
Rede: Ethernet 1 GbE
Sistema: Windows 11 Pro, instalado a 23 de outubro de 2026
Segurança: Secure Boot e BitLocker nos dois discos
:::

Os dois SSD separam o sistema e as aplicações (`C:`) dos restantes dados (`D:`). O `D:` ainda está vazio.

## Entrar sem abrir uma porta no router

Montei dois acessos: SSH para o terminal e RDP para o ambiente de trabalho. O router não tem nenhuma porta aberta para o mimir.

O SSH usa só chave. A chave pública está em `C:\ProgramData\ssh\administrators_authorized_keys`, que é onde o OpenSSH do Windows a procura para contas de administrador. No portátil, o `~/.ssh/config` tem uma entrada para a máquina. Chega isto:

```
ssh mimir
```

A regra da firewall do SSH só vale para o perfil Privado. O Tailscale aparece como Privado e a Ethernet de casa como Público, por isso estar na mesma rede local não dá acesso. Foi de propósito.

O RDP está ligado com Network Level Authentication. A regra da firewall limita as origens a `100.64.0.0/10`, o intervalo que o Tailscale usa. Ainda não o testei a partir de outro dispositivo.

## Energia

O plano de energia é o Equilibrado. Com a máquina ligada à corrente, o Windows nunca suspende nem hiberna sozinho. O ecrã apaga ao fim de cinco minutos. A hibernação continua ativa no sistema, só nunca é acionada automaticamente.

Do lado do Windows ativei o Wake-on-LAN, para a placa de rede poder acordar a máquina com um magic packet. Desliguei também o arranque rápido, porque sem isso o Wake-on-LAN não funciona a partir de um encerramento completo. Na BIOS, a opção de Wake on LAN está em "Boot Order", mas ainda não confirmei que acorda a máquina desligada. Por agora deixo-a ligada.

## O Secure Boot e o BitLocker

O Secure Boot veio desligado. Liguei-o na BIOS a 25 de outubro. Mudar a cadeia de arranque altera as medições que o BitLocker usa. Sem o suspender antes, o Windows pede a chave de recuperação no arranque seguinte. Este comando suspende-o durante dois reinícios:

```
manage-bde -protectors -disable C: -RebootCount 2
```

No dia seguinte o BitLocker estava outra vez ativo em `C:` e `D:`.

## O que o SSH não faz

Uma sessão SSH não é a sessão do ambiente de trabalho. O GitHub mostrou-me a diferença. Fiz `gh auth login` na minha sessão local e funcionou. Por SSH, o `gh auth status` diz que o token é inválido. O token está no armazenamento de credenciais do Windows, que um login por chave não consegue abrir. Para clonar repositórios privados no mimir tenho de estar na sessão dele.

O `winget` por SSH tem outra regra estranha: a primeira instalação de cada sessão corre bem e as seguintes falham com "Acesso negado" (`0xc0070005`). Abro uma ligação nova para cada instalação.

Instalei também o Proton VPN para uso ocasional. No portátil já me cortou o Tailscale. No mimir, ligá-lo pode cortar o acesso remoto.

## O que falta

Instalei o Sunshine para ver o desktop à distância, mas ainda não criei o utilizador na interface web nem o emparelhei. Como há um monitor ligado, é essa a imagem que vai ser transmitida. Adiei o ecrã virtual até o resto funcionar.

Falta testar o RDP a partir de outro dispositivo, emparelhar o Sunshine e confirmar o Wake-on-LAN na BIOS depois de um encerramento completo.
