# Easy Content Post no iPhone, sem Mac

Base iOS preparada para compilar no macOS do Codemagic. Identificador:
`br.com.easycontentpost.app`. O painel e os recursos são incluídos no app;
atualizações do código exigem outro build. A API e as integrações de IA
continuam no Railway.

## Estado desta versão

- Capacitor 8 com Swift Package Manager, ícone e abertura com a marca.
- Painel local com a mesma API e os mesmos fluxos de geração da versão web.
- Imagens, vídeos e ZIPs salvos pelo compartilhamento nativo do iPhone.
- Links externos abrem no navegador com opção de voltar ao aplicativo.
- Fluxos de compilação sem assinatura e de envio ao TestFlight interno.

Os testes de JavaScript e o empacotamento foram executados em Linux. A
compilação com Xcode e os testes reais em iPhone precisam ser executados no
Codemagic/TestFlight após a configuração da conta.

A branch `mobile/ios-cloud` parte do painel publicado, sem as mudanças de
fontes/blocos que aguardam a API. O site publicado permanece em `main`.

## 1. Cadastro na Apple

Em [Apple Developer](https://developer.apple.com/account/), crie um App ID
explícito `br.com.easycontentpost.app`, descrição `Easy Content Post`.

Em [App Store Connect](https://appstoreconnect.apple.com/apps), crie um novo app
iOS com esse Bundle ID, idioma Português (Brasil), SKU `easycontentpost-ios` e
nome público `Easy Content Post`, sujeito à disponibilidade.

## 2. GitHub e Codemagic

1. Entre em [codemagic.io](https://codemagic.io/) e conecte sua conta GitHub.
2. Adicione `gabsh12guimaraes-web/content-post` como aplicação.
3. Escolha configuração por `codemagic.yaml`, na raiz do repositório.
4. Selecione a branch `mobile/ios-cloud` e confira a configuração.
5. Execute **Easy Content Post · validar iOS** (`ios-simulator`).

Esse fluxo verifica o JavaScript, sincroniza o projeto e compila com Xcode sem
credenciais Apple. `EasyContentPost-simulator.zip` serve para simulador/serviços
de prévia; para instalar no iPhone, use TestFlight. Confira a franquia e os
custos de minutos na sua conta Codemagic antes do build.

## 3. API no Railway

No serviço da API, acrescente `capacitor://localhost` à variável `ORIGENS`,
separado por vírgula, **preservando todos os endereços que já estão lá**.
Exemplo apenas do novo item: `...,capacitor://localhost`.

A API atualmente não devolve `Access-Control-Allow-Origin` para essa origem;
sem essa configuração, o app exibirá erro ao entrar. Aplique a variável e
confira o deploy. Nenhuma chave de IA precisa mudar.

## 4. Apple no Codemagic

Em App Store Connect → **Users and Access / Usuários e acesso → Integrations →
App Store Connect API**, gere uma chave de equipe para Codemagic, função
**App Manager**. Baixe o `.p8` e guarde-o: só pode ser baixado uma vez.

Em Codemagic → **Team settings → Team integrations → Developer Portal → Manage
keys**, cadastre essa chave com o nome exato `easycontentpost-appstore`.
Informe **Issuer ID**, **Key ID** e `.p8` diretamente no Codemagic. Não envie
a chave pelo chat nem a adicione ao GitHub.

Em **Code signing identities → iOS certificates**, gere um certificado
**Apple Distribution** com essa integração. Guarde-o no Codemagic seguindo
as etapas de download/importação que a interface mostrar. Se já houver um
certificado válido, reutilize-o com sua chave privada; preserve certificados
ativos usados por outros apps.

Em Apple Developer → **Profiles → +**, crie um perfil **App Store Connect**,
selecione `br.com.easycontentpost.app` e o certificado correspondente. Em
Codemagic → **Code signing identities → iOS provisioning profiles**, importe
ou busque esse perfil.

## 5. TestFlight

Execute **Easy Content Post · TestFlight interno** (`ios-testflight`) na branch
`mobile/ios-cloud`. O fluxo configura a assinatura, atribui um número de build
e envia o `.ipa` ao App Store Connect.

O build é marcado como **somente teste interno**. `submit_to_testflight: false`
evita solicitar revisão de beta externo; o upload ainda ocorre. Após o
processamento da Apple, adicione o build a um grupo de testes internos em
App Store Connect → app → TestFlight. Testadores internos precisam ser usuários
elegíveis do App Store Connect. Instale TestFlight no iPhone e aceite o convite.

O fluxo não solicita revisão pública nem publica automaticamente na loja.
Novos builds desta aplicação no Codemagic usam `PROJECT_BUILD_NUMBER`.

## Antes da revisão pública

Ainda precisamos concluir e testar no iPhone:

- Compra de planos no iOS: escolher o enquadramento permitido pela Apple e
  implementar o fluxo correspondente. Os links de checkout atuais não devem
  seguir para revisão pública sem adequação. A Nasten pode continuar no site.
- Exclusão de conta no app, tratando organizações e dados compartilhados.
- Retorno das conexões de redes sociais ao app. Hoje o painel usa um
  redirecionamento HTTPS; o OAuth no WKWebView precisa de adaptação e teste.
  O navegador nativo trata links e downloads, não configura o retorno OAuth.
- Upload da biblioteca/câmera, permissões e múltiplos arquivos; exportação
  de imagens, ZIPs e vídeo MP4 real no WKWebView. Testar em Chromium não
  substitui validar a renderização de vídeo no iPhone.
- Política de privacidade, suporte, declarações de dados/IA, classificação
  etária, screenshots e conta de demonstração para a revisão.

Depois das adequações, gere outro build sem `testFlightInternalTestingOnly`.
A aprovação depende da revisão da Apple.

## Desenvolvimento

```sh
npm ci
npm run mobile:check
npm run mobile:sync
```

`mobile/www` e `ios/App/App/public` são gerados, fora do Git. Não use
`server.url` para carregar a landing dentro do app. Ao atualizar o painel,
revise `mobile/build.mjs`; ele falha se a função de download mudar.

Referências: [Capacitor iOS](https://capacitorjs.com/docs/ios),
[Codemagic para Capacitor](https://docs.codemagic.io/yaml-quick-start/building-an-ionic-app/),
[assinatura iOS](https://docs.codemagic.io/yaml-code-signing/signing-ios/),
[envio ao App Store Connect](https://docs.codemagic.io/yaml-publishing/app-store-connect/).
