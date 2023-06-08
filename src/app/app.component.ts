/* eslint-disable no-console */
import {
  AfterViewInit,
  Component,
  ElementRef,
  NgZone,
  OnDestroy,
  OnInit,
  ViewChild,
} from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ElectronService } from './core/services/electron.service';
import { ConfigService } from './core/services/config.service';
import { MenuService } from './core/services/menu.service';
import { FileSystemService } from './core/services/file-system.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit {
  @ViewChild('covisualizationComponent', {
    static: false,
  })
  covisualizationComponent: ElementRef<HTMLElement>;

  config: any;
  btnUpdateText: string;
  btnUpdate: string;

  constructor(
    public ngzone: NgZone,
    private electronService: ElectronService,
    private fileSystemService: FileSystemService,
    private configService: ConfigService,
    private translate: TranslateService,
    private menuService: MenuService
  ) {
    this.translate.setDefaultLang('en');
  }

  ngOnDestroy(): void {}

  ngOnInit(): void {}
  ngAfterViewInit() {
    this.setAppConfig();
    if (this.electronService.isElectron) {
      this.addIpcRendererEvents();
    }
  }

  setAppConfig() {
    this.config = this.covisualizationComponent.nativeElement;

    //@ts-ignore
    this.config.setConfig({
      appSource: 'ELECTRON',
      onFileOpen: () => {
        console.log('fileOpen');
        this.menuService.openFileDialog(() => {
          this.constructMenu();
        });
      },
      onCopyImage: (base64data) => {
        const natImage =
          this.electronService.nativeImage.createFromDataURL(base64data);
        this.electronService.clipboard.writeImage(natImage);
      },
      onThemeChanged: (data) => {
        console.log('onThemeChanged', data);
        this.setTheme(data);
      },
    });
    this.configService.setConfig(this.config);
  }

  setTheme(theme = 'light') {
    (async () => {
      try {
        if (this.electronService.isElectron) {
          await this.electronService.ipcRenderer.invoke(
            'set-' + theme + '-mode'
          );
        }
      } catch (error) {
        console.log('error', error);
      }
    })();
  }

  addIpcRendererEvents() {
    this.electronService.ipcRenderer.on('update-available', (event, arg) => {
      console.info('update-available', event, arg);
      this.btnUpdate = 'update-available';
      this.btnUpdateText =
        '🔁 ' + this.translate.instant('UPDATE.UPDATE_AVAILABLE');
      this.constructMenu();
    });
    this.electronService.ipcRenderer.on(
      'update-not-available',
      (event, arg) => {
        console.info('update-not-available', event, arg);
        this.menuService.setUpdateInProgress(false);
      }
    );
    this.electronService.ipcRenderer.on('update-error', (event, arg) => {
      console.info('update-error', event, arg);
      this.menuService.setUpdateInProgress(false);
      // this.btnUpdate = 'update-error';
      // this.btnUpdateText = '⚠ ' + this.translate.instant('UPDATE.UPDATE_ERROR');
      this.constructMenu();
    });
    this.electronService.ipcRenderer.on(
      'download-progress-info',
      (event, arg) => {
        console.info('download-progress-info', arg && arg.percent);
        if (arg.percent === 100) {
          this.btnUpdate = 'download-complete';
          this.btnUpdateText =
            '✅ ' + this.translate.instant('UPDATE.DOWNLOAD_COMPLETE');
        } else {
          this.btnUpdate = 'downloading';
          this.btnUpdateText =
            '🔁 ' +
            this.translate.instant('UPDATE.DOWNLOADING') +
            ' ' +
            parseInt(arg && arg.percent, 10) +
            '%';
        }
        this.constructMenu();
      }
    );

    this.constructMenu();

    (async () => {
      try {
        await this.electronService.ipcRenderer.invoke(
          'launch-check-for-update'
        );
      } catch (error) {
        console.log('error', error);
      }
    })();

    // Get input file on windows
    const inputFile =
      this.electronService.ipcRenderer.sendSync('get-input-file');
    if (inputFile && inputFile !== '.') {
      setTimeout(() => {
        this.fileSystemService.openFile(inputFile);
      });
    }
    // Get input files on Mac or Linux
    this.electronService.ipcRenderer.on('file-open-system', (event, arg) => {
      if (arg) {
        setTimeout(() => {
          this.fileSystemService.openFile(arg);
        });
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
            this.translate.instant('UPDATE.WAITING_FOR_DOWNLOAD') +
            ' ...';
          await this.electronService.ipcRenderer.invoke(
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
