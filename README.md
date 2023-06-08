
# Introduction

Based on https://github.com/maximegris/angular-electron.git

## Getting Started

Install dependencies with yarn :

``` bash
yarn install
```

If you want to generate Angular components with Angular-cli , you **MUST** install `@angular/cli` in npm global context.  
Please follow [Angular-cli documentation](https://github.com/angular/angular-cli) if you had installed a previous version of `angular-cli`.

``` bash
yarn install -g @angular/cli
```

## To build for development

- **in a terminal window** -> yarn start  

Voila! You can use your Angular + Electron app in a local development environment with hot reload !

The application code is managed by `main.ts`. In this sample, the app runs with a simple Angular App (http://127.0.0.1:4201) and an Electron window.  
The Angular component contains an example of Electron and NodeJS native lib import.  
You can desactivate "Developer Tools" by commenting `win.webContents.openDevTools();` in `main.ts`.

## Included Commands

|Command|Description|
|--|--|
|`npm run ng:serve:web`| Execute the app in the browser |
|`npm run build`| Build the app. Your built files are in the /dist folder. |
|`npm run build:prod`| Build the app with Angular aot. Your built files are in the /dist folder. |
|`npm run electron:local`| Builds your application and start electron
|`npm run electron:linux`| Builds your application and creates an app consumable on linux system AppImage |
|`npm run electron:windows`| On a Windows OS, builds your application and creates an app consumable in windows 32/64 bit systems |
|`npm run electron:mac`|  On a MAC OS, builds your application and generates a `.app` file of your application that can be run on Mac |

**application is optimised. Only /dist folder and node dependencies are included in the executable.**

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
