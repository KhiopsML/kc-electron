
# Introduction

Based on https://github.com/maximegris/angular-electron.git

## Dev mode with Electron AND visualization component
- run #yarn start into visualization-component
- run #yarn start electron project AND DO NOT CHANGE PORT !

## Browser mode

`yarn ng:serve:web`
Uncomment line 229 into homeLayout.component
Also set isWebDebug = true
and launch http://localhost:4200/#/khiops-covisualization

### Deploy web mode
Run `yarn build:web` or `yarn build:web:prod` and get dist content folder
put it into web server (like wamp) and launch http://127.0.0.1/khiops-covisualization/#/khiops-covisualization

## Boilerplate change log

https://github.com/maximegris/angular-electron/blob/master/CHANGELOG.md

## certificates and github secrets

- Generate Personal access tokens into USER settings with repo perms (named for instance khiops_token)
- To access private lib repo, khiops-covisualization and khiops-cocovisualization must have this khiops_token into repos secrets (the secret is displayed only one time)
- For certificates : repos must have WINDOWS_CERTS and WINDOWS_CERTS and WINDOWS_CERTS_PASSWORD repo secrets,
with base 64 encoded certificate, (generation with : https://blog.techfabric.com/convert-pfx-certificate-to-base64-string/) and certificate password
- Win certificate Orange contact : olivier.hoachuck@orange.com
- MAC certificate Orange contact : fehmi.toumi@orange.com
- MAC notarizing : https://kilianvalkhof.com/2019/electron/notarizing-your-electron-application/

## ci, publish and auto update
