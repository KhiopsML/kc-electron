/*
 * Copyright (c) 2023-2025 Orange. All rights reserved.
 * This software is distributed under the BSD 3-Clause-clear License, the text of which is available
 * at https://spdx.org/licenses/BSD-3-Clause-Clear.html or see the "LICENSE" file for more details.
 */

import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { ElectronService } from './electron.service';
import { FileSystemService } from './file-system.service';
import { LibVersionService } from './lib-version.service';
import { ConfigService } from './config.service';
import { StorageService } from './storage.service';

@Injectable({
  providedIn: 'root',
})
export class MenuService {
  private currentChannel: string = 'latest';

  private updateInProgress = false;

  constructor(
    private electronService: ElectronService,
    private configService: ConfigService,
    private translate: TranslateService,
    private fileSystemService: FileSystemService,
    private storageService: StorageService
  ) {
    this.currentChannel = this.storageService.getOne('CHANNEL');
  }

  setUpdateInProgress(value = false) {
    this.updateInProgress = value;
  }

  setMenu(
    btnUpdate: string = '',
    btnUpdateText: string = '',
    refreshCb: Function | undefined = undefined,
    updateCb: Function | undefined = undefined
  ) {
    const opendFiles = this.fileSystemService.getFileHistory();

    const menu1 = {
      label: this.translate.instant('GLOBAL_MENU_FILE'),
      submenu: [
        {
          label: this.translate.instant('GLOBAL_MENU_OPEN'),
          accelerator: 'CommandOrControl+O',
          click: () => {
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
            this.closeFile();
          },
        },
        {
          type: 'separator',
        },
        {
          label: this.translate.instant('GLOBAL_MENU_SAVE'),
          accelerator: 'CommandOrControl+S',
          click: () => {
            this.save();
          },
        },
        {
          label: this.translate.instant('GLOBAL_MENU_SAVE_AS'),
          accelerator: 'CommandOrControl+Shift+S',
          click: () => {
            this.saveAs();
          },
        },
        {
          label: this.translate.instant(
            'GLOBAL_MENU_SAVE_CURRENT_HIERARCHY_AS'
          ),
          accelerator: 'CommandOrControl+Shift+Alt+S',
          click: () => {
            this.saveCurrentHierarchyAs();
          },
        },
        {
          type: 'separator',
        },
        {
          label: this.translate.instant('GLOBAL_MENU_RESTART_APP'),
          accelerator: 'CommandOrControl+R',
          click: () => {
            this.storageService.saveAll(() => {
              this.electronService.remote.app.relaunch();
              this.electronService.remote.app.exit(0);
            });
          },
        },
        {
          label: this.translate.instant('GLOBAL_MENU_EXIT'),
          accelerator: 'CommandOrControl+Q',
          click: () => {
            this.storageService.saveAll(() => {
              this.electronService.remote.app.quit();
            });
          },
        },
      ],
    };

    menu1.submenu[3].accelerator = 'CommandOrControl+W';

    // insert history files
    if (opendFiles.files.length > 0) {
      // in reverse order
      for (let i = opendFiles.files.length - 1; i >= 0; i--) {
        if (typeof opendFiles.files[i] === 'string') {
          menu1.submenu.splice(2, 0, {
            label: this.fileSystemService.getFileHistory().files[i],
            click: () => {
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
            this.electronService.shell.openExternal(
              'https://github.com/KhiopsML/kc-electron/releases'
            );
          },
        },
        {
          label:
            this.translate.instant('GLOBAL_MENU_LIB_VERSION') +
            ' ' +
            LibVersionService.getLibVersion(),
          click: () => {
            this.electronService.shell.openExternal(
              'https://github.com/KhiopsML/khiops-visualization/releases'
            );
          },
        },
        {
          type: 'separator',
        },
        {
          label: this.translate.instant('GLOBAL_MENU_RELEASE_NOTES'),
          click: () => {
            this.electronService.shell.openExternal(
              'https://github.com/KhiopsML/kc-electron/releases'
            );
          },
        },
        {
          type: 'separator',
        },
        {
          label: this.translate.instant('GLOBAL_MENU_CHANNELS'),
          submenu: [
            {
              label: this.translate.instant('GLOBAL_MENU_LATEST'),
              type: 'radio',
              click: () => {
                if (this.currentChannel !== 'latest') {
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
                  this.configService.openChannelDialog((e: string) => {
                    if (e === 'confirm') {
                      // User confirm
                      this.setChannel('beta');
                    } else if (e === 'cancel') {
                      this.setChannel('latest');
                      // re construct the menu to set channel to latest
                      refreshCb && refreshCb();
                    }
                  });
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
        },
        {
          type: 'separator',
        },
        {
          role: 'resetZoom',
          accelerator: 'CommandOrControl+nummult',
        },
        {
          role: 'zoomIn',
          accelerator: 'CommandOrControl+numadd',
        },
        {
          role: 'zoomOut',
          accelerator: 'CommandOrControl+numsub',
        },
      ],
    };

    const menu4 = {
      label: this.translate.instant('GLOBAL_MENU_REPORT_A_BUG'),

      click: () => {
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
          '\n' +
          this.translate.instant('GLOBAL_MENU_LIB_VERSION') +
          ': ' +
          LibVersionService.getLibVersion() +
          '\n';

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
          if (btnUpdate === 'update-available' && !this.updateInProgress) {
            updateCb && updateCb();
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

  openFile(filename: string, callbackDone: Function | undefined) {
    this.fileSystemService.openFile(filename, () => {
      callbackDone && callbackDone();
    });
  }

  closeFile() {
    this.fileSystemService.closeFile();
  }

  setChannel(channel: string) {
    this.storageService.setOne('CHANNEL', channel);
    this.currentChannel = channel;

    (async () => {
      try {
        await this.electronService.ipcRenderer?.invoke(
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
      const datasToSave = this.configService
        .getConfig()
        .constructPrunedDatasToSave();
      this.fileSystemService.saveAs(datasToSave);
      document.body.style.cursor = 'default';
    }, 1000);
  }
}
