const axios = require('axios');
const https = require('https');

function toggleLight(ip, lightId, username, password) {
    const url = `https://${ip}/endpoints/call?key=CO@${lightId}&method=toggle&value=1&user=${username}&pw=${password}`;

    const agent = new https.Agent({
        rejectUnauthorized: false
    });

    return axios.get(url, { httpsAgent: agent })
        .then(response => response.data)
        .catch(error => {
            if (error.response) {
                return error.response.data;
            } else {
                throw error;
            }
        });
}

function getLightStatus(ip, lightId, username, password) {
    const url = `https://${ip}/endpoints/call?key=CO@${lightId}&method=get&user=${username}&pw=${password}`;
    const agent = new https.Agent({ rejectUnauthorized: false });

    return axios.get(url, { httpsAgent: agent })
        .then(response => {
            // Stellen Sie sicher, dass die Antwort das erwartete Objekt enthält
            if (response.data && response.data.data && typeof response.data.data.value !== 'undefined') {
                // Der Wert für Lichter könnte anders sein, z.B. 1 für an und 0 für aus
                const value = response.data.data.value;
                return value === 1.0 ? true : false; // true für an, false für aus
            } else {
                throw new Error('Invalid response structure');
            }
        })
        .catch(error => {
            throw error;
        });
}

module.exports = {
    toggleLight,
    getLightStatus
};
