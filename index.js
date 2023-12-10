const { toggleLight, getLightStatus } = require('./light');

module.exports = (homebridge) => {
    const Accessory = homebridge.hap.Accessory;
    const Service = homebridge.hap.Service;
    const Characteristic = homebridge.hap.Characteristic;

    class LightAccessory {
        constructor(log, config) {
            this.log = log;
            this.name = config.name;
            this.ip = config.ip;
            this.lightId = config.lightId;
            this.username = config.username;
            this.password = config.password;

            this.service = new Service.Lightbulb(this.name);
            this.lastKnownState = 0; // Speichern Sie den letzten bekannten Zustand

            this.service
                .getCharacteristic(Characteristic.On)
                .on('get', this.getLightState.bind(this));

            this.service
                .getCharacteristic(Characteristic.On)
                .on('set', this.setLightState.bind(this));

            // Abrufen des aktuellen Zustands beim Start
            this.getLightState((err, state) => {
                if (!err) {
                    this.service
                        .getCharacteristic(Characteristic.On)
                        .updateValue(state);
                    this.lastKnownState = state;
                }
            });

            // Aktualisieren Sie den Zustand alle 5 Sekunden
            this.statusUpdateInterval = setInterval(() => {
                this.getLightState((err, state) => {
                    if (!err && this.lastKnownState !== state) {
                        this.service
                            .getCharacteristic(Characteristic.On)
                            .updateValue(state);
                        this.lastKnownState = state;
                    }
                });
            }, 5000);
        }

        getLightState(callback) {
            getLightStatus(this.ip, this.lightId, this.username, this.password)
                .then((status) => {
                    const state = status === 1 ? true : false;
                    callback(null, state);
                })
                .catch((error) => {
                    this.log('Error getting light status:', error);
                    callback(error);
                });
        }

        setLightState(value, callback) {
            if (value !== this.lastKnownState) {
                toggleLight(this.ip, this.lightId, this.username, this.password)
                    .then(() => {
                        setTimeout(() => {
                            this.getLightState((err, newState) => {
                                if (!err) {
                                    this.service
                                        .getCharacteristic(Characteristic.On)
                                        .updateValue(newState);
                                    this.lastKnownState = newState;
                                }
                            });
                        }, 1000);
                        callback(null);
                    })
                    .catch((error) => {
                        this.log('Error setting light state:', error);
                        callback(error);
                    });
            } else {
                callback(null);
            }
        }

        getServices() {
            return [this.service];
        }
    }

    homebridge.registerAccessory('homebridge-light', 'LightV1', LightAccessory);
};
