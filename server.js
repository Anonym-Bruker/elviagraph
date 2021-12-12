var express = require('express');
const config = require('./config/common.json');
const https = require('https');

var app = express();

app.use(express.static('public'));

var port = config.port;

var values = [1];
var labels = ['Init...'];

app.set('view engine', 'ejs');

var meteringpoints = {};
var tariffPrice = {};
var maxtime = {};

var darkmode = "off";

var firstDayInMonth = setFirstDay(new Date());
var firstDayInPrevMonth = setfirstPrevMonth(new Date());

app.get('/noreload', function (req, res) {
   res.render('index',
       {
          values,
          labels,
          meteringpoints,
          tariffPrice,
          maxtime,
          firstDayInMonth,
          darkmode
       })
})

app.get('/mode/:mode', function (req, res) {
    if (req.params.mode != null) {
        if (req.params.mode == "1") {
            logging("Changing to nightmode")
            darkmode = "on";
            res.redirect('/noreload')
        } else if (req.params.mode == "daymode") {
            logging("Changing to daymode")
            darkmode = "off";
            res.redirect('/noreload')
        } else if (req.params.mode == "reload") {
            logging("Reloading, running normal get")
            res.redirect('/')
        } else {
            logging("NO action , not reloading")
            res.redirect('/noreload')
        }
    }
})


app.get('/', function (req, res) {
    var currentdate = new Date();
    var toDate = addHours(3, currentdate);
    toDate = toDate.toISOString();

    var startDate = firstDayInPrevMonth.toISOString();
    //var startDate = removeDays(30, currentdate);
    //startDate = startDate.toISOString();
    logging("StartDate:" + startDate + ", " + "ToDate:" + toDate);

    var auth = "Bearer " + config.authkey;
    var url = "https://elvia.azure-api.net/customer/metervalues/api/v1/metervalues?startTime="+startDate+"&endTime="+toDate+"&meteringPointIds="+config.meteringpointId+"&includeProduction=false";

    (async () => {
        https.get(url, {headers : {"Authorization" : auth}} , (resp) => {
            let data = '';

            // A chunk of data has been received.
            resp.on('data', (chunk) => {
                data += chunk;
            });

            // The whole response has been received. Print out the result.
            resp.on('end', () => {
                if(JSON.parse(data).meteringpoints != undefined){
                    meteringpoints = JSON.parse(data).meteringpoints[0].metervalue.timeSeries;
                } else {
                    logging("Metering data not found...." + JSON.stringify(data));
                }

                //logging("Done with getting metering data...." + JSON.stringify(meteringpoints));
            });

            (async () => {

                url = "https://elvia.azure-api.net/customer/metervalues/api/v1/maxhours"

                https.get(url, {headers : {"Authorization" : auth}} , (resp) => {
                    let data = '';

                    // A chunk of data has been received.
                    resp.on('data', (chunk) => {
                        data += chunk;
                    });

                    // The whole response has been received. Print out the result.
                    resp.on('end', () => {
                        if(JSON.parse(data).meteringpoints != undefined){
                            maxtime = JSON.parse(data).meteringpoints[0].maxHours;
                        } else {
                            logging("Metering data not found...." + JSON.stringify(data));
                        }
                        //logging("Done with getting maxtime data...." + JSON.stringify(maxtime));
                    });

                    (async () => {
                        // private_tou_daynight1 eller private_flatrate_house
                        var subkey = config.subkey;
                        var tariffkey = config.tariffkey;
                        url = "https://elvia.azure-api.net/grid-tariff/api/1/tariffquery?TariffKey="+tariffkey+"&StartTime="+startDate+"&EndTime="+toDate;
                        https.get(url, {headers : {"Ocp-Apim-Subscription-Key" : subkey}} , (resp) => {
                            let data = '';

                            // A chunk of data has been received.
                            resp.on('data', (chunk) => {
                                data += chunk;
                            });

                            // The whole response has been received. Print out the result.
                            resp.on('end', () => {
                                tariffPrice = JSON.parse(data).gridTariff.tariffPrice.priceInfo;
                                //logging("Done with getting price data...." + JSON.stringify(tariffPrice));
                                logging("Done with getting all data. Rendering page....");
                                res.render('index',
                                    {
                                        values,
                                        labels,
                                        meteringpoints,
                                        tariffPrice,
                                        maxtime,
                                        firstDayInMonth,
                                        darkmode
                                    })
                            });
                        }).on("error", (err) => {
                            console.log("Error: " + err.message);
                        });
                    })();
                }).on("error", (err) => {
                    console.log("Error: " + err.message);
                });
            })();
        }).on("error", (err) => {
            console.log("Error: " + err.message);
        });
    })();
})


function removeDays(days, date) {
    //var date = new Date(this.valueOf());
    date.setDate(date.getDate() - days);
    return date;
}

function setFirstDay(date) {
    //var date = new Date(this.valueOf());
    date.setMonth(date.getMonth());
    date.setDate(1);
    date.setHours(1)
    date.setMinutes(0)
    date.setSeconds(0)
    date.setMilliseconds(0)
    return date;
}

function setfirstPrevMonth(date) {
    //var date = new Date(this.valueOf());
    date.setMonth(date.getMonth()-1);
    date.setDate(1);
    date.setHours(0)
    date.setMinutes(0)
    date.setSeconds(0)
    date.setMilliseconds(0)
    return date;
}


function addHours(hours, date) {
    //var date = new Date(this.valueOf());
    date.setHours(date.getHours() + hours);
    return date;
}

function logging(logtext)
{
    //const options = { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'};
    console.log(port + ":" + new Date().toISOString() + " : " + logtext);
}

var server = app.listen(port, function () {
    logging( "Server started, listening at port")
})