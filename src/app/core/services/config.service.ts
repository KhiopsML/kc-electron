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

  constructDatasToSave() {
    this.config.constructDatasToSave();
  }

  constructSavedHierarchyToSave() {
    this.config.constructSavedHierarchyToSave();
  }

  openChannelDialog(cb) {
    this.config.openChannelDialog(cb);
  }

  openSaveBeforeQuitDialog(cb) {
    this.config.openSaveBeforeQuitDialog(cb);
  }

  snack(text, duration, panelClass) {
    this.config.snack(text, duration, panelClass);
  }

}
