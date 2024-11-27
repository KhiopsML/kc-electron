/* eslint-disable no-console */
import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  ViewChild,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ElectronService } from './core/services/electron.service';
import { ConfigService } from './core/services/config.service';
import { MenuService } from './core/services/menu.service';
import { FileSystemService } from './core/services/file-system.service';
import { MatomoTracker } from 'ngx-matomo-client';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements AfterViewInit {
  @ViewChild('covisualizationComponent', {
    static: false,
  })
  covisualizationComponent?: ElementRef<HTMLElement>;

  config: any;
  btnUpdateText?: string;
  btnUpdate?: string;

  constructor(
    public ngzone: NgZone,
    private electronService: ElectronService,
    private fileSystemService: FileSystemService,
    private configService: ConfigService,
    private translate: TranslateService,
    private menuService: MenuService,
    private matomoTracker: MatomoTracker
  ) {
    this.translate.setDefaultLang('en');

    // Disable cookies to prevent coookie consent
    this.matomoTracker.disableCookies();
    this.matomoTracker.setDoNotTrack(true);

    if (this.electronService.isElectron) {
      this.matomoTracker.trackPageView();
      this.matomoTracker.enableFileTracking();

      // Get machine ID via IPC
      this.electronService.ipcRenderer
        ?.invoke('get-machine-id')
        .then((machineId: string) => {
          this.matomoTracker.setVisitorId(machineId);
        })
        .catch((error: any) => {
          console.error('Error getting machine ID:', error);
        });
    }
  }

  ngAfterViewInit() {
    this.setAppConfig();
    if (this.electronService.isElectron) {
      this.addIpcRendererEvents();
    }
  }

  setAppConfig() {
    this.config = this.covisualizationComponent?.nativeElement;

    //@ts-ignore
    this.config.setConfig({
      appSource: 'ELECTRON',
      showProjectTab: true,
      onFileOpen: () => {
        console.log('fileOpen');
        this.menuService.openFileDialog(() => {
          this.constructMenu();
        });
      },
      onCopyImage: (base64data: any) => {
        const natImage =
          this.electronService.nativeImage.createFromDataURL(base64data);
        this.electronService.clipboard.writeImage(natImage);
      },
      onThemeChanged: (data: string) => {
        console.log('onThemeChanged', data);
        this.setTheme(data);
      },
      readLocalFile: (file: File | any, cb: Function) => {
        return this.readLocalFile(file, cb);
      },
      onSendEvent: (event: any) => {
        if (event.message === 'trackEvent') {
          this.matomoTracker.trackEvent(
            event.data?.category,
            event.data?.action,
            event.data?.name,
            event.data?.value
          );
        }
      },
    });
    this.configService.setConfig(this.config);
  }

  setTheme(theme = 'light') {
    (async () => {
      try {
        if (this.electronService.isElectron) {
          await this.electronService.ipcRenderer?.invoke(
            'set-' + theme + '-mode'
          );
        }
      } catch (error) {
        console.log('error', error);
      }
    })();
  }

  readLocalFile(input: File | any, cb: Function) {
    (async () => {
      try {
        if (this.electronService.isElectron) {
          let path: string = '';

          if (input?.path) {
            // If command is called by saved json datas
            path = input?.path;
          } else {
            // If command is called by user
            path = this.electronService.electron.webUtils.getPathForFile(input);
          }

          const content = await this.electronService.ipcRenderer?.invoke(
            'read-local-file',
            path
          );
          cb(content, path);
        }
      } catch (error) {
        console.log('error', error);
      }
    })();
  }

  addIpcRendererEvents() {
    this.electronService.ipcRenderer?.on('update-available', (event, arg) => {
      console.info('update-available', event, arg);
      this.btnUpdate = 'update-available';
      this.btnUpdateText =
        '🔁 ' + this.translate.instant('GLOBAL_UPDATE_UPDATE_AVAILABLE');
      this.constructMenu();
    });
    this.electronService.ipcRenderer?.on(
      'update-not-available',
      (event, arg) => {
        console.info('update-not-available', event, arg);
        this.menuService.setUpdateInProgress(false);
      }
    );
    this.electronService.ipcRenderer?.on('update-error', (event, arg) => {
      console.info('update-error', event, arg);
      this.menuService.setUpdateInProgress(false);
      // this.btnUpdate = 'update-error';
      // this.btnUpdateText = '⚠ ' + this.translate.instant('GLOBAL_UPDATE_UPDATE_ERROR');
      this.constructMenu();
    });
    this.electronService.ipcRenderer?.on(
      'download-progress-info',
      (event, arg) => {
        console.info('download-progress-info', arg && arg.percent);
        if (arg.percent === 100) {
          this.btnUpdate = 'download-complete';
          this.btnUpdateText =
            '✅ ' + this.translate.instant('GLOBAL_UPDATE_DOWNLOAD_COMPLETE');
        } else {
          this.btnUpdate = 'downloading';
          this.btnUpdateText =
            '🔁 ' +
            this.translate.instant('GLOBAL_UPDATE_DOWNLOADING') +
            ' ' +
            parseInt(arg && arg.percent, 10) +
            '%';
        }
        this.constructMenu();
      }
    );
    this.electronService.ipcRenderer?.on('before-quit', (event, arg) => {
      console.info('before-quit', event, arg);
      this.saveBeforeQuit();
    });

    this.constructMenu();

    (async () => {
      try {
        await this.electronService.ipcRenderer?.invoke(
          'launch-check-for-update'
        );
      } catch (error) {
        console.log('error', error);
      }
    })();

    // Get input file on windows
    const inputFile =
      this.electronService.ipcRenderer?.sendSync('get-input-file');
    if (inputFile && inputFile !== '.') {
      setTimeout(() => {
        this.fileSystemService.openFile(inputFile);
      });
    }
    // Get input files on Mac or Linux
    this.electronService.ipcRenderer?.on('file-open-system', (event, arg) => {
      if (arg) {
        setTimeout(() => {
          this.fileSystemService.openFile(arg);
        });
      }
    });
  }

  saveBeforeQuit(mustRestart: boolean = false) {
    this.configService.openSaveBeforeQuitDialog((e: string) => {
      if (e === 'confirm') {
        const datasToSave = this.configService
          .getConfig()
          .constructDatasToSave();
        this.fileSystemService.save(datasToSave);
        if (mustRestart) {
          this.electronService.remote.app.relaunch();
        }
        this.electronService.remote.app.exit(0);
      } else if (e === 'cancel') {
        // Do nothing
      } else if (e === 'reject') {
        if (mustRestart) {
          this.electronService.remote.app.relaunch();
        }
        this.electronService.remote.app.exit(0);
      }
    });
  }

  constructMenu() {
    const menuTemplate = this.menuService.setMenu(
      this.btnUpdate,
      this.btnUpdateText,
      () => {
        // Refresh
        this.constructMenu();
      },
      () => {
        // launch-update-available
        (async () => {
          this.menuService.setUpdateInProgress(true);

          this.btnUpdateText =
            '🔁 ' +
            this.translate.instant('GLOBAL_UPDATE_WAITING_FOR_DOWNLOAD') +
            ' ...';
          await this.electronService.ipcRenderer?.invoke(
            'launch-update-available'
          );
          this.constructMenu();
        })();
      }
    );
    const menu =
      this.electronService.remote.Menu.buildFromTemplate(menuTemplate);
    this.electronService.remote.Menu.setApplicationMenu(menu);
  }
}
