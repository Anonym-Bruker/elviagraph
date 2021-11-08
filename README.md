
## Purpose
This is a project for showing power metering values from the Elvia API
https://elvia.portal.azure-api.net/docs/services/metervalueapi/operations/get-api-v1-metervalues

Using Chart.js for showing the data

## Configuration needed after code is downloaded

Need to create directory called: 

    config

With 1 file called common.json:

    {
        "authkey": "AUTHKEY",
        "meteringpointId" : "ID of the meetering point",
        "port": 8081,
        "subkey": "SUBSCRIPTION KEY",
        "tariffkey": "private_flatrate_house"
        }
    }

AUTHKEY is the token key you can get from:
https://www.elvia.no/minside/ "select you user" -> "tilganger" -> "Opprett token"

SUBSCRIPTION KEY is the subscription key for the tariff service.
(Ocp-Apim-Subscription-Header in the API)


## How to start?
Check out this code.
Create common.json in a the config-folder, according to above.

Run the following command once to download modules:
npm install

Run one of the following command to star application/server:
node server.js or npm start

## Known limitations/bugs
- Quite large delay on data, sometimes several hours.
- Only possible to show data with a "resolution" of 60 minutes
