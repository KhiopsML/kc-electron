import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ElectronService } from './electron.service';
import { FileSystemService } from './file-system.service';
import { LibVersionService } from './lib-version.service';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private currentChannel =
    localStorage.getItem('KHIOPS_COVISUALIZATION_CHANNEL') || 'latest';

  private updateInProgress = false;

  constructor(
    private electronService: ElectronService,
    private configService: ConfigService,
    private translate: TranslateService,
    private fileSystemService: FileSystemService
  ) {}

  setUpdateInProgress(value = false) {
    this.updateInProgress = value;
  }

  setMenu(
    btnUpdate = '',
    btnUpdateText = '',
    refreshCb = undefined,
    updateCb = undefined
  ) {
    const opendFiles = this.fileSystemService.getFileHistory();

    const menu1 = {
      label: this.translate.instant('GLOBAL_MENU_FILE'),
      submenu: [
        {
          label: this.translate.instant('GLOBAL_MENU_OPEN'),
          click: () => {
            // this.khiopsLibraryService.trackEvent('click', 'open_file');
            this.openFileDialog(refreshCb);
          },
        },
        {
          type: 'separator',
        },
        {
          type: 'separator',
        },
        {
          label: this.translate.instant('GLOBAL_MENU_CLOSE_FILE'),
          click: () => {
            // this.khiopsLibraryService.trackEvent('click', 'close_file');
            this.closeFile();
          },
        },
        {
          type: 'separator',
        },
        {
          label: this.translate.instant('GLOBAL_MENU_SAVE'),
          click: () => {
            // this.khiopsLibraryService.trackEvent('click', 'save');
            this.save();
          },
        },
        {
          label: this.translate.instant('GLOBAL_MENU_SAVE_AS'),
          click: () => {
            // this.khiopsLibraryService.trackEvent('click', 'save_as');
            this.saveAs();
          },
        },
        {
          label: this.translate.instant('GLOBAL_MENU_SAVE_CURRENT_HIERARCHY_AS'),
          click: () => {
            // this.khiopsLibraryService.trackEvent('click', 'save_current_hierarchy');
            this.saveCurrentHierarchyAs();
          },
        },
        {
          type: 'separator',
        },
        {
          label: this.translate.instant('GLOBAL_MENU_RESTART_APP'),
          click: () => {
            // this.khiopsLibraryService.trackEvent('click', 'restart_app');
            this.electronService.remote.app.relaunch();
            this.electronService.remote.app.exit(0);
          },
        },
        {
          label: this.translate.instant('GLOBAL_MENU_EXIT'),
          click: () => {
            // this.khiopsLibraryService.trackEvent('click', 'exit_app');
            this.electronService.remote.app.quit();
          },
        },
      ],
    };

    // insert history files
    if (opendFiles.files.length > 0) {
      // in reverse order
      for (let i = opendFiles.files.length - 1; i >= 0; i--) {
        if (typeof opendFiles.files[i] === 'string') {
          menu1.submenu.splice(2, 0, {
            label: this.fileSystemService.getFileHistory().files[i],
            click: () => {
              // this.khiopsLibraryService.trackEvent('click', 'open_file');
              this.openFile(
                this.fileSystemService.getFileHistory().files[i],
                refreshCb
              );
            },
          });
        }
      }
    }

    const menu2 = {
      label: this.translate.instant('GLOBAL_MENU_HELP'),
      submenu: [
        {
          role: 'toggleDevTools',
          click: () => {
            // this.khiopsLibraryService.trackEvent('page_view', 'debugger');
          },
        },
        {
          type: 'separator',
        },
        {
          label:
            this.translate.instant('GLOBAL_MENU_VERSION') +
            ' ' +
            LibVersionService.getAppVersion(),
          click: () => {
            this.configService.openReleaseNotesDialog();
          },
        },
        // {
        //   label:
        //     this.translate.instant('GLOBAL_MENU_LIB_VERSION') +
        //     ' ' +
        //     LibVersionService.getAppVersion(),
        // },
        {
          label: this.translate.instant('GLOBAL_MENU_RELEASE_NOTES'),
          click: () => {
            // this.khiopsLibraryService.trackEvent('page_view', 'release_notes');
            this.configService.openReleaseNotesDialog();
          },
        },
        {
          label: this.translate.instant('GLOBAL_MENU_CHANNELS'),
          submenu: [
            {
              label: this.translate.instant('GLOBAL_MENU_LATEST'),
              type: 'radio',
              click: () => {
                if (this.currentChannel !== 'latest') {
                  // this.khiopsLibraryService.trackEvent('click', 'release', 'latest');
                  this.setChannel('latest');
                }
              },
              checked: this.currentChannel === 'latest',
            },
            {
              label: this.translate.instant('GLOBAL_MENU_BETA'),
              type: 'radio',
              click: () => {
                if (this.currentChannel !== 'beta') {
                  this.configService.openChannelDialog((e) => {
                    if (e === 'confirm') {
                      // User confirm
                      this.setChannel('beta');
                    } else if (e === 'cancel') {
                      this.setChannel('latest');
                      // re construct the menu to set channel to latest
                      refreshCb();
                    }
                  });
                  // this.khiopsLibraryService.trackEvent('click', 'release', 'beta');
                  // this.dialogRef.closeAll();
                  // this.ngzone.run(() => {
                  //   const config = new MatDialogConfig();
                  //   const dialogRef: MatDialogRef<ConfirmDialogComponent> =
                  //     this.dialog.open(ConfirmDialogComponent, config);
                  //   dialogRef.componentInstance.title = this.translate.instant(
                  //     'GLOBAL.ENABLE_BETA_VERSIONS'
                  //   );
                  //   dialogRef.componentInstance.message = this.translate.instant(
                  //     'GLOBAL.BETA_VERSIONS_WARNING'
                  //   );
                  //   dialogRef
                  //     .afterClosed()
                  //     .toPromise()
                  //     .then((e) => {
                  //       if (e === 'confirm') {
                  //         // User confirm
                  //         this.setChannel('beta');
                  //       } else if (e === 'cancel') {
                  //         this.setChannel('latest');
                  //         // re construct the menu to set channel to latest
                  //         this.constructMenu();
                  //       }
                  //     });
                  // });
                }
              },
              checked: this.currentChannel === 'beta',
            },
          ],
        },
      ],
    };

    const menu3 = {
      label: this.translate.instant('GLOBAL_MENU_VIEW'),
      submenu: [
        {
          role: 'togglefullscreen',
          click: () => {
            // this.khiopsLibraryService.trackEvent('click', 'full_screen');
          },
        },
        {
          type: 'separator',
        },
        {
          role: 'resetZoom',
          accelerator: 'CommandOrControl+nummult',
          click: () => {
            // this.khiopsLibraryService.trackEvent('click', 'zoom', 'reset');
          },
        },
        {
          role: 'zoomIn',
          accelerator: 'CommandOrControl+numadd',
          click: () => {
            // this.khiopsLibraryService.trackEvent('click', 'zoom', 'in');
          },
        },
        {
          role: 'zoomOut',
          accelerator: 'CommandOrControl+numsub',
          click: () => {
            // this.khiopsLibraryService.trackEvent('click', 'zoom', 'out');
          },
        },
      ],
    };

    const menu4 = {
      label: this.translate.instant('GLOBAL_MENU_REPORT_A_BUG'),

      click: () => {
        // this.khiopsLibraryService.trackEvent('page_view', 'report_issue');
        const emailId = 'bug.khiopsvisualization@orange.com';
        const subject =
          LibVersionService.getAppTitle() +
          ': ' +
          this.translate.instant('GLOBAL_MENU_REPORT_A_BUG');
        const message =
          '\n\n--------------------------------------------------\n' +
          this.translate.instant('GLOBAL_MENU_VERSION') +
          ': ' +
          LibVersionService.getAppVersion() +
          '\n';
        // this.translate.instant('GLOBAL_MENU_LIB_VERSION') +
        // ': ' +
        // LibVersionService.getAppVersion() +
        // '\n';
        this.electronService.shell.openExternal(
          'mailto:' +
            emailId +
            '?subject=' +
            subject +
            '&body=' +
            encodeURIComponent(message),
          // @ts-ignore
          '_self'
        );
      },
    };

    const menuTemplate = [];
    menuTemplate.push(menu1);
    menuTemplate.push(menu3);
    menuTemplate.push(menu2);
    menuTemplate.push(menu4);
    if (btnUpdate) {
      const menu5 = {
        label: btnUpdateText,
        click: () => {
          // this.khiopsLibraryService.trackEvent('click', 'update_version');
          if (btnUpdate === 'update-available' && !this.updateInProgress) {
            updateCb();
          }
        },
      };

      menuTemplate.push(menu5);
    }

    return menuTemplate;
  }

  openFileDialog(cb: any = undefined) {
    this.fileSystemService.openFileDialog(() => {
      cb();
    });
  }

  openFile(filename, callbackDone) {
    // this.dialogRef.closeAll();
    this.fileSystemService.openFile(filename, () => {
      callbackDone();
    });
  }

  closeFile() {
    this.fileSystemService.closeFile();
  }

  setChannel(channel) {
    localStorage.setItem('KHIOPS_COVISUALIZATION_CHANNEL', channel);
    this.currentChannel = channel;

    (async () => {
      try {
        await this.electronService.ipcRenderer.invoke(
          'launch-check-for-update'
        );
      } catch (error) {
        console.log('error', error);
      }
    })();
  }

  save() {
    const datasToSave = this.configService.getConfig().constructDatasToSave();
    this.fileSystemService.save(datasToSave);
  }

  saveAs() {
    const datasToSave = this.configService.getConfig().constructDatasToSave();
    this.fileSystemService.saveAs(datasToSave);
  }

  saveCurrentHierarchyAs() {
    document.body.style.cursor = 'wait';
    setTimeout(() => {
      const datasToSave = this.configService.getConfig().constructSavedJson();
      this.fileSystemService.saveAs(datasToSave);
			document.body.style.cursor = 'default';
		}, 1000);
  }
}
