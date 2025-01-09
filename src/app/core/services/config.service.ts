/*
 * Copyright (c) 2023-2025 Orange. All rights reserved.
 * This software is distributed under the BSD 3-Clause-clear License, the text of which is available
 * at https://spdx.org/licenses/BSD-3-Clause-Clear.html or see the "LICENSE" file for more details.
 */

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

  constructDatasToSave() {
    this.config.constructDatasToSave();
  }

  constructPrunedDatasToSave() {
    this.config.constructPrunedDatasToSave();
  }

  openChannelDialog(cb: Function) {
    this.config.openChannelDialog(cb);
  }

  openSaveBeforeQuitDialog(cb: Function) {
    this.config.openSaveBeforeQuitDialog(cb);
  }

  snack(text: string, duration: number, panelClass: string) {
    this.config.snack(text, duration, panelClass);
  }
}
