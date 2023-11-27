import {
    AccessoryConfig,
    AccessoryPlugin,
    API,
    CharacteristicEventTypes,
    CharacteristicGetCallback,
    CharacteristicSetCallback,
    CharacteristicValue,
    HAP,
    Logging,
    Service
  } from "homebridge";
  import axios from "axios";
  
  class GiraLightAccessory implements AccessoryPlugin {
  
    private readonly log: Logging;
    private readonly name: string;
    private readonly id: string;
    private lightOn = false;
  
    private readonly lightService: Service;
    private readonly informationService: Service;
  
    constructor(log: Logging, config: AccessoryConfig, api: API) {
      this.log = log;
      this.name = config.name;
      this.id = config.id;
  
      this.lightService = new api.hap.Service.Lightbulb(this.name);
      this.lightService.getCharacteristic(api.hap.Characteristic.On)
        .on(CharacteristicEventTypes.GET, (callback: CharacteristicGetCallback) => {
          this.refreshState();
          callback(undefined, this.lightOn);
        })
        .on(CharacteristicEventTypes.SET, (value: CharacteristicValue, callback: CharacteristicSetCallback) => {
          this.toggleLight(value as boolean, callback);
        });
  
      this.informationService = new api.hap.Service.AccessoryInformation()
        .setCharacteristic(api.hap.Characteristic.Manufacturer, "Gira")
        .setCharacteristic(api.hap.Characteristic.Model, "Light Switch");
  
      log.info("Gira Light finished initializing!");
    }
  
    identify(): void {
      this.log("Identify!");
    }
  
    getServices(): Service[] {
      return [
        this.informationService,
        this.lightService,
      ];
    }
  
    refreshState(): void {
      const getEndpoint = `http://your-gira-server/endpoints/call?key=${this.id}&method=get`;
      
      axios.get(getEndpoint)
        .then(response => {
          this.log.debug('Refresh light state response:', response.data);
          const currentState = this.parseResponseToState(response.data);
          this.lightService.getCharacteristic(this.hap.Characteristic.On).updateValue(currentState);
        })
        .catch(error => {
          this.log.error('Error refreshing light state:', error.message);
        });
    }
  
    toggleLight(on: boolean, callback: CharacteristicSetCallback): void {
      const toggleEndpoint = `http://your-gira-server/endpoints/call?key=${this.id}&method=toggle&value=${on ? 1 : 0}`;
      
      axios.get(toggleEndpoint)
        .then(response => {
          this.log.debug('Toggle light response:', response.data);
          this.refreshState();
          callback(null);
        })
        .catch(error => {
          this.log.error('Error toggling light:', error.message);
          callback(error);
        });
    }
  
    parseResponseToState(response: any): boolean {
      try {
        const parsedResponse = JSON.parse(response);
        return parsedResponse.status === 'on';
      } catch (error) {
        return false;
      }
    }
  }
  
  export = (api: API) => {
    api.registerAccessory("GiraLightAccessory", GiraLightAccessory);
  };