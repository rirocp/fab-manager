import apiClient from './clients/api-client';
import { AxiosResponse } from 'axios';
import { Setting, SettingBulkResult, SettingError, SettingName } from '../models/setting';
import wrapPromise, { IWrapPromise } from '../lib/wrap-promise';

export default class SettingAPI {
  async get (name: SettingName): Promise<Setting> {
    const res: AxiosResponse<{setting: Setting}> = await apiClient.get(`/api/settings/${name}`);
    return res?.data?.setting;
  }

  async query (names: Array<SettingName>): Promise<Map<SettingName, any>> {
    const params = new URLSearchParams();
    params.append('names', `['${names.join("','")}']`);

    const res: AxiosResponse = await apiClient.get(`/api/settings?${params.toString()}`);
    return SettingAPI.toSettingsMap(names, res?.data);
  }

  async update (name: SettingName, value: any): Promise<Setting> {
    const res: AxiosResponse = await apiClient.patch(`/api/settings/${name}`, { setting: { value } });
    if (res.status === 304) { return { name, value }; }
    return  res?.data?.setting;
  }

  async bulkUpdate (settings: Map<SettingName, any>, transactional: boolean = false): Promise<Map<SettingName, SettingBulkResult>> {
    const res: AxiosResponse = await apiClient.patch(`/api/settings/bulk_update?transactional=${transactional}`, { settings: SettingAPI.toObjectArray(settings) });
    return SettingAPI.toBulkMap(res?.data?.settings);
  }

  async isPresent (name: SettingName): Promise<boolean> {
    const res: AxiosResponse = await apiClient.get(`/api/settings/is_present/${name}`);
    return res?.data?.isPresent;
  }

  static get (name: SettingName): IWrapPromise<Setting> {
    const api = new SettingAPI();
    return wrapPromise(api.get(name));
  }

  static query (names: Array<SettingName>): IWrapPromise<Map<SettingName, any>> {
    const api = new SettingAPI();
    return wrapPromise(api.query(names));
  }

  static isPresent (name: SettingName): IWrapPromise<boolean> {
    const api = new SettingAPI();
    return wrapPromise(api.isPresent(name));
  }

  private static toSettingsMap(names: Array<SettingName>, data: Object): Map<SettingName, any> {
    const map = new Map();
    names.forEach(name => {
      map.set(name, data[name] || '');
    });
    return map;
  }

  private static toBulkMap(data: Array<Setting|SettingError>): Map<SettingName, SettingBulkResult> {
    const map = new Map();
    data.forEach(item => {
      const itemData: SettingBulkResult = { status: true };
      if ('error' in item) {
        itemData.error = item.error;
        itemData.status = false;
      }
      if ('value' in item) {
        itemData.value = item.value;
      }
      if ('localized' in item) {
        itemData.localized = item.localized;
      }

      map.set(item.name as SettingName, itemData)
    });
    return map;
  }

  private static toObjectArray(data: Map<SettingName, any>): Array<Object> {
    const array = [];
    data.forEach((value, key) => {
      array.push({
        name: key,
        value
      })
    });
    return array;
  }
}

