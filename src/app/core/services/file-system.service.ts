import { Injectable, NgZone } from '@angular/core';
import { ElectronService } from './electron.service';
import { TranslateService } from '@ngx-translate/core';
import { ConfigService } from './config.service';

let es: any;
try {
  es = require('event-stream');
} catch (e) {
  console.warn(e);
}
let jsonStream: any;
try {
  jsonStream = require('JSONStream');
} catch (e) {
  console.warn(e);
}

@Injectable({
  providedIn: 'root',
})
export class FileSystemService {
  fileLoaderDatas: {
    isLoadingDatas: any;
    datas: any;
    isBigJsonFile: boolean;
    loadingInfo: string;
  };
  currentFilePath = '';

  constructor(
    private ngzone: NgZone,
    private configService: ConfigService,
    private electronService: ElectronService,
    private translate: TranslateService
  ) {
    this.initialize();
  }

  initialize() {
    this.fileLoaderDatas = {
      isLoadingDatas: false,
      datas: undefined,
      isBigJsonFile: false,
      loadingInfo: '',
    };
  }

  openFileDialog(callbackDone) {
    // this.trackerService.trackEvent('click', 'open_file');

    const associationFiles = ['json'];
    associationFiles.push('khj');

    this.electronService.dialog
      .showOpenDialog(null, {
        properties: ['openFile'],
        filters: [
          {
            name: this.translate.get('GLOBAL.FILES'),
            extensions: associationFiles,
          },
        ],
      })
      .then((result) => {
        if (result && !result.canceled && result.filePaths) {
          this.openFile(result.filePaths[0], callbackDone);
          return;
        }
      })
      .catch((err) => {
        console.log(err);
      });
  }

  setTitleBar(filepath) {
    // Set the filename to the title bar
    if (filepath) {
      this.currentFilePath = filepath;
      (async () => {
        try {
          await this.electronService.ipcRenderer.invoke('set-title-bar-name', {
            title: 'Khiops Covisualization ' + filepath,
          });
        } catch (error) {
          console.log('error', error);
        }
      })();
    }
  }

  openFile(filename, callbackDone?) {
    if (filename) {
      // Important to reset datas before loading a new file
      this.configService.setDatas();

      this.readFile(filename)
        .then((datas) => {
          this.setTitleBar(filename);
          this.setFileHistory(filename);
          this.configService.setDatas(datas);
          if (callbackDone) {
            callbackDone();
          }
        })
        .catch((error) => {
          console.warn(this.translate.get('SNACKS.OPEN_FILE_ERROR'), error);
          this.fileLoaderDatas.isLoadingDatas = false;
        });
    }
  }
  readFile(filename): any {
    this.fileLoaderDatas.datas = undefined;
    this.fileLoaderDatas.isLoadingDatas = true;
    this.fileLoaderDatas.isBigJsonFile = false;

    return new Promise((resolve, reject) => {
      this.electronService.fs.stat(filename, (err, stats) => {
        if (err) {
          reject();
        } else {
          this.electronService.fs.readFile(
            filename,
            'utf-8',
            (errReadFile, datas) => {
              if (errReadFile) {
                if (
                  errReadFile
                    .toString()
                    .startsWith('Error: Cannot create a string longer')
                ) {
                  this.fileLoaderDatas.isBigJsonFile = true;
                  this.fileLoaderDatas.loadingInfo = '';
                  const currentDatas = {};
                  const stream = this.electronService.fs.createReadStream(
                    filename,
                    {
                      encoding: 'utf8',
                    }
                  );
                  const getStream = stream.pipe(
                    jsonStream.parse([
                      {
                        emitKey: true,
                      },
                    ])
                  );
                  getStream.pipe(
                    es.map((pipeDatas) => {
                      this.fileLoaderDatas.loadingInfo = pipeDatas.key;
                      currentDatas[pipeDatas.key] = pipeDatas.value;
                    })
                  );

                  getStream
                    .on('end', () => {
                      this.fileLoaderDatas.datas = currentDatas;
                      this.fileLoaderDatas.datas.filename = filename;
                      resolve(this.fileLoaderDatas.datas);
                    })
                    .on('error', () => {
                      reject();
                    });
                } else {
                  this.fileLoaderDatas.isLoadingDatas = false;
                  reject(errReadFile);
                }
              } else {
                this.fileLoaderDatas.isLoadingDatas = false;
                this.fileLoaderDatas.datas = JSON.parse(datas);
                this.fileLoaderDatas.datas.filename = filename;
                resolve(this.fileLoaderDatas.datas);
              }
            }
          );
        }
      });
    });
  }

  closeFile() {
    this.initialize();
    this.ngzone.run(() => {
      this.configService.setDatas(undefined);
    });
  }

  setFileHistory(filename) {
    const currentLs = localStorage.getItem('KHIOPS_COVISUALIZATION_OPEN_FILE');
    let parsedLs = {
      files: [],
    };
    if (currentLs) {
      parsedLs = JSON.parse(currentLs);
      const isExistingHistoryIndex = parsedLs.files.indexOf(filename);

      if (isExistingHistoryIndex !== -1) {
        // remove at index
        parsedLs.files.splice(isExistingHistoryIndex, 1);
      } else {
        // remove last item
        if (parsedLs.files.length >= 5) {
          parsedLs.files.splice(-1, 1);
        }
      }
    }

    // add to the top of the list
    parsedLs.files.unshift(filename);
    localStorage.setItem(
      'KHIOPS_COVISUALIZATION_OPEN_FILE',
      JSON.stringify(parsedLs)
    );
  }

  getFileHistory() {
    const currentLs = localStorage.getItem('KHIOPS_COVISUALIZATION_OPEN_FILE');
    if (currentLs) {
      return JSON.parse(currentLs);
    } else {
      return {
        files: [],
      };
    }
  }

  save(datas) {
    this.saveFile(this.currentFilePath, datas);
  }

  saveAs(datas) {
    const dialogOpts: any = {
      defaultPath: '',
      filters: [
        {
          name: 'json',
          extensions: ['khcj', 'json'],
        },
      ],
    };
    this.electronService.dialog.showSaveDialog(dialogOpts).then((result) => {
      const filename = result.filePath;
      if (filename) {
        this.saveFile(filename, datas);
      }
    });
  }

  saveFile(filename, datas) {
    this.electronService.fs.writeFileSync(
      filename,
      JSON.stringify(datas, null, 2), // spacing level = 2
      'utf-8'
    );
    this.configService.snack(
      this.translate.instant('GLOBAL_SNACKS_SAVE_FILE_SUCCESS'),
      4000,
      'success'
    );
  }
}
