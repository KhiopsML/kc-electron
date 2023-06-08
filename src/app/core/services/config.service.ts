import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ConfigService {
  private config: any;

  setConfig(config: any) {
    this.config = config;
  }

  getConfig(): any {
    return this.config;
  }

  setDatas(datas = undefined) {
    this.config.setDatas(datas);
  }

  openReleaseNotesDialog() {
    this.config.openReleaseNotesDialog();
  }

  openChannelDialog(cb) {
    this.config.openChannelDialog(cb);
  }
}
