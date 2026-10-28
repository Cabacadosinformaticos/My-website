---
title: mimir, um desktop que fica em casa
desc: Um ThinkCentre Tiny que fica em casa, acessível pela rede privada. Hardware, acesso ao Windows e as escolhas para manter uma segunda máquina de trabalho disponível.
category: [Homelab, Windows, Redes]
date: Out 2026
readTime: 5 min
cover: https://res.cloudinary.com/ddmoo3e4n/image/upload/f_auto,q_auto/v1794513989/cabacatech/2026-11/covers/posts/mimir-desktop-remoto-dc5fbbd8da.webp
related: [project:homelab-proxmox-servidorzinho, post:chega-o-bifrost]
---

O mimir é um Lenovo ThinkCentre M90q Gen 6 que fica ligado em casa. Uso-o como desktop e como segunda máquina de trabalho, acessível pela rede privada Tailscale. O portátil continua a acompanhar-me. O desktop fica no mesmo sítio, com os seus programas e o trabalho que lhe deixei.

Esta separação resolveu uma confusão no meu homelab. A máquina de secretária e os servidores têm necessidades diferentes. Um desktop precisa de uma sessão Windows, aplicações e um ecrã. Os servidores precisam de correr serviços sem depender dessa sessão. O mimir tem o primeiro papel.

## A máquina que acabou por ficar

A escolha final foi um ThinkCentre Tiny com um Intel Core Ultra 5 235T, 32 GB de RAM DDR5 e dois SSD NVMe de 2 TB. Substituiu o M90q Gen 5 que tinha previsto usar com o nome MediaBox. O Gen 5 foi vendido e o mimir ficou com o lugar de desktop.

O formato pequeno ajuda a deixá-lo num canto com Ethernet e alimentação. A gráfica é integrada e há um monitor físico ligado.

Os dois SSD dão-me espaço para separar o sistema e as aplicações dos restantes dados. O Windows 11 Pro mantém o ambiente de trabalho a que estou habituado. Ativei o Secure Boot e os dois discos têm BitLocker, para que a proteção dos dados acompanhe a preparação do acesso remoto.

## Primeiro, conseguir voltar a entrar

Preparei duas formas de acesso: SSH para administração por terminal e RDP para o ambiente de trabalho. Ambas ficam limitadas à rede privada. Não abri uma porta no router para entrar no Windows.

O SSH permite verificar serviços, consultar a configuração e fazer operações que não precisam de interface gráfica. Está configurado com autenticação por chave. A firewall permite esse acesso no perfil privado usado pelo Tailscale. A ligação Ethernet de casa tem outro perfil, pelo que estar na mesma rede local não dá automaticamente o mesmo acesso.

O RDP está ativado com Network Level Authentication. A regra da firewall restringe as origens à rede Tailscale. É o acesso previsto para abrir o ambiente de trabalho quando preciso de uma aplicação gráfica. O SSH fica disponível para as tarefas de administração que resolvo mais depressa no terminal.

## Uma sessão remota também depende da energia

Configurei o Windows para não suspender nem hibernar automaticamente quando está ligado à corrente. O ecrã pode desligar-se ao fim de cinco minutos. Deixar o ecrã apagado não deve tornar o computador inacessível.

Ativei também o Wake-on-LAN do lado do Windows e desliguei o arranque rápido. A placa de rede está autorizada a acordar a máquina por magic packet. Isso prepara a possibilidade de a ligar à distância quando estiver desligada, além de manter o acesso enquanto está acordada.

Por enquanto, o uso habitual é deixá-la ligada. O plano de energia equilibrado mantém a gestão do Windows e o monitor apaga-se sozinho. Posso deixar um trabalho na máquina sem depender de manter um ecrã aceso em casa.

## Preparar o streaming do desktop

Instalei o Sunshine como opção para transmitir o desktop. A ideia é poder trabalhar sobre a imagem da sessão e explorar a interação com as aplicações a partir de outro dispositivo. O RDP continua a ser a outra via preparada para acesso gráfico.

Como há um monitor físico ligado, essa será a imagem disponível para transmitir. Um ecrã virtual permitiria trabalhar com uma resolução independente do monitor, mas decidi adiar essa peça até confirmar o percurso básico.

## As dependências menos visíveis

Uma ligação SSH ao Windows não reproduz tudo o que existe na sessão interativa. Encontrei isso na autenticação do GitHub: a credencial disponível no ambiente de trabalho não estava acessível da mesma forma numa sessão SSH por chave. Um comando remoto a rejeitar a autenticação não significava que a conta estivesse desligada na sessão local.

Há ainda uma cautela vinda do portátil: o Proton VPN já interferiu com o Tailscale nessa máquina. Não transformei essa experiência numa conclusão sobre o mimir. Serve como motivo para testar alterações de rede com uma forma de recuperar o acesso disponível.

## Próximos passos

Falta validar a sessão RDP a partir de outro dispositivo, configurar e emparelhar o Sunshine e confirmar o Wake-on-LAN também na BIOS e depois de um encerramento completo. São os próximos passos para fechar o acesso diário à máquina que já ficou preparada em casa.
