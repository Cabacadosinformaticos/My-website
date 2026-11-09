---
title: Chega o bifrost, o segundo servidor do homelab
desc: O segundo MS-A1 já corre Proxmox e recebeu as VMs públicas. Como distribuí os serviços, porque mantive os servidores independentes e onde termina a separação entre eles.
category: [Homelab, Proxmox, Infraestrutura]
date: Nov 2026
readTime: 7 min
cover: https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794513977/cabacatech/2026-11/covers/posts/chega-o-bifrost-166828df5a.webp
series: Diário do Homelab
seriesPart: 7
related: [project:homelab-proxmox-servidorzinho, post:backups-do-homelab-com-pbs, post:publicar-um-site-sem-abrir-portas]
---

O bifrost já está a trabalhar. Instalei o Proxmox no segundo Minisforum MS-A1 a 9 de novembro e passei para lá as VMs do IADE Horários e do site da AEIADE. O Servidorzinho ficou com o DNS da casa, os servidores de jogos, a VPN e a plataforma privada CabacaLab.

Em outubro, esta mudança ainda era um plano. Entretanto, mudou também a história da MediaBox: vendi o Lenovo M90q Gen 5 onde tinha experimentado o Jellyfin e o TrueNAS. O meu computador de secretária é o mimir, outro Lenovo, um M90q Gen 6. São máquinas diferentes.

O bifrost entrou para tirar trabalho público do servidor principal. Acabou também por receber o armazenamento e os backups do homelab. A distribuição dos serviços segue o uso de cada máquina, com regras de acesso próprias para cada aplicação.

![Papéis das máquinas e ligação direta entre os hosts Proxmox.](https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794513995/cabacatech/2026-11/diagrams/homelab-overview-dffd84138c.webp)

## O que ficou em cada servidor

O Servidorzinho continua a ser o centro dos serviços de casa e do ambiente de desenvolvimento. A CabacaLab mantém as suas VMs de bases de dados, aplicações, staging e serviços geográficos. O DNS não mudou de máquina e os jogos também ficaram onde estavam.

No bifrost, cada aplicação pública mantém a sua VM. O IADE Horários e o site da AEIADE continuam a chegar à Internet através dos respetivos Cloudflare Tunnels. A mudança de máquina não juntou as duas aplicações num sistema operativo comum.

| Servidor | Serviços atuais |
|---|---|
| Servidorzinho | AdGuard Home, jogos, VPN e CabacaLab privada |
| bifrost | VMs públicas, Fieldnote privado, Proxmox Backup Server e NAS |

O Fieldnote corre numa VM própria no bifrost, com acesso através de Tailscale. O PBS e a NAS também vivem neste servidor. As VMs públicas têm a sua exposição controlada pelos túneis e pelas regras de rede. Os serviços privados mantêm os seus próprios caminhos de acesso.

Mover as VMs públicas para outro equipamento reduz a concentração de serviços no Servidorzinho. A separação por VM continua a definir onde corre cada aplicação e as regras de rede definem com que serviços ela pode comunicar.

## A capacidade que existe na prática

O segundo MS-A1 tem um Ryzen 7 8700G, 32 GB de RAM e um NVMe de 512 GB. O formato é igual ao do Servidorzinho, mas o interior e os recursos disponíveis são diferentes.

:::specs title="bifrost, instalado a 9 de novembro"
Máquina: Minisforum MS-A1
CPU: AMD Ryzen 7 8700G, 8 núcleos e 16 threads
RAM instalada: 32 GB DDR5
RAM visível no sistema: cerca de 28 GiB
Disco interno: NVMe de 512 GB
Rede: duas portas de 2,5 GbE
Base: Proxmox VE
:::

A diferença entre a memória instalada e a visível obrigou-me a olhar para o orçamento das VMs. A GPU integrada tem 2 GiB reservados e existem outras reservas do sistema. Somar as atribuições até chegar aos 32 GB da caixa seria uma má forma de planear.

Mantive a reserva da GPU para uma eventual utilização futura. Para já, os conteúdos da família são servidos por DLNA, uma solução mais pequena que explico no [artigo sobre a NAS](blog-post.html?id=nas-com-samba-e-cockpit).

## Dois Proxmox independentes

Os servidores não formam um cluster Proxmox. Cada um tem a sua gestão e as suas VMs. Para esta escala, prefiro conseguir explicar como recuperar um serviço sem depender de uma configuração de alta disponibilidade que ainda não preciso de manter.

Um cluster com apenas dois nós traz a questão do quórum quando um deles deixa de estar disponível. É possível acrescentar um terceiro voto com um QDevice, mas isso acrescentaria outro componente ao meu desenho. Ter duas máquinas também não dá automaticamente alta disponibilidade às aplicações ou aos discos.

:::decision title="Migração por backup e restauro"
Mantive os hosts independentes. A passagem das VMs usa backup e restauro, em vez de migração dentro de um cluster. Aceito uma intervenção manual e uma interrupção planeada quando preciso de mudar uma VM de máquina.
:::

Esta opção também torna as intervenções explícitas: escolho o destino, preparo o backup e acompanho o arranque da VM restaurada. Para os serviços que tenho em casa, essa operação manual é um custo que aceito.

## O cabo direto ganhou um uso concreto

Liguei as segundas portas de rede dos dois MS-A1 por um cabo direto de 2,5 GbE. Esta ligação dá ao Servidorzinho um caminho até ao PBS sem passar pelo router de casa.

O plano inicial falava em backups cruzados. A implementação ficou diferente: os dois servidores enviam os backups para um Proxmox Backup Server no bifrost. O datastore fica num disco USB de 10 TB, separado do NVMe que contém as VMs desse host.

```text title="O destino dos backups"
Servidorzinho ── ligação direta ──> PBS no bifrost
                                       ↑
                                VMs do bifrost
                                       |
                                disco USB de 10 TB
```

O disco USB também guarda as partilhas da NAS, em datasets separados do datastore de backups. Essa organização permite definir limites de espaço por função e acompanhar o crescimento dos ficheiros e dos pontos de recuperação.

## Nomes que ajudam a reconhecer as máquinas

O bifrost recebeu o nome da ponte da mitologia nórdica, por ser o servidor que passou a receber as aplicações expostas à Internet. O mimir ficou com o nome do sábio que aconselha Odin. O Servidorzinho mantém o nome antigo.

Escolher o nome antes de instalar o Proxmox evitou uma alteração posterior na identidade do nó. Neste caso, foi uma pequena decisão tomada a tempo, sem necessidade de transformar a reorganização do homelab numa renomeação de todas as máquinas.

## A recuperação ainda depende do mesmo local

As aplicações públicas saíram do Servidorzinho e os dois hosts têm um destino de backup configurado. O armazenamento do PBS continua ligado ao bifrost, na mesma casa. As partilhas da NAS ainda têm uma única cópia e o restauro completo de uma VM está por ensaiar.

A [parte seguinte](blog-post.html?id=backups-do-homelab-com-pbs) descreve a configuração do PBS, a retenção e a diferença entre guardar uma VM e recuperar os seus serviços.
