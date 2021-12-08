var express = require('express');
var app = express();

var Request = require('request');

const config = require('./config/common.json');

const Chart = require('chart.js');

var port = config.port;

var values = [1];
var labels = ['Init...'];

app.set('view engine', 'ejs');

var meteringpoints = {};
var tariffPrice = {};
var maxtime = {};

app.get('/', function (req, res) {
   fetchData().then(result => {
      if(result == "OK"){
         res.render('index',
             {
                values,
                labels,
                meteringpoints,
                tariffPrice,
                maxtime
             })
      }
      else{
         logging("Return nok OK....");
         res.render('index',
             {
                values,
                labels,
                meteringpoints,
                tariffPrice,
                maxtime
             })
      }
   })
   .finally()
})


fetchData();


function removeDays(days, date) {
   //var date = new Date(this.valueOf());
   date.setDate(date.getDate() - days);
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


async function fetchData(){


   var currentdate = new Date();
   var toDate = addHours(3, currentdate);
   toDate = toDate.toISOString();

   var startDate = removeDays(3, currentdate);
   startDate = startDate.toISOString();
   logging("StartDate:" + startDate + ", " + "ToDate:" + toDate);

   var auth = "Bearer " + config.authkey;
   var url = "https://elvia.azure-api.net/customer/metervalues/api/v1/metervalues?startTime="+startDate+"&endTime="+toDate+"&meteringPointIds="+config.meteringpointId+"&includeProduction=false";

   Request.get( {
      url : url,
      headers : {
         "Authorization" : auth
      },
      rejectUnauthorized: true,
      requestCert: false,
      agent: false
   }, function(error, response, body) {
      var response = JSON.parse(body);
      error != null ? logging('***** ERROR ***** : ', error) : null;
      meteringpoints = response.meteringpoints[0].metervalue.timeSeries;
      //logging(JSON.stringify(meteringpoints))
   } );

   url = "https://elvia.azure-api.net/customer/metervalues/api/v1/maxhours"
   Request.get( {
      url : url,
      headers : {
         "Authorization" : auth
      },
      rejectUnauthorized: true,
      requestCert: false,
      agent: false
   }, function(error, response, body) {
      var response = JSON.parse(body);
      error != null ? logging('***** ERROR ***** : ', error) : null;
      maxtime = response.meteringpoints[0].maxHours;
      logging(JSON.stringify(maxtime))
   } );



   var subkey = config.subkey;
   var tariffkey = config.tariffkey;
   url = "https://elvia.azure-api.net/grid-tariff/api/1/tariffquery?TariffKey="+tariffkey+"&StartTime="+startDate+"&EndTime="+toDate;

   Request.get( {
      url : url,
      headers : {
         "Ocp-Apim-Subscription-Key" : subkey
      },
      rejectUnauthorized: true,
      requestCert: false,
      agent: false
   }, function(error, response, body) {
      var response = JSON.parse(body);
      error != null ? logging('***** ERROR ***** : ', error) : null;
      tariffPrice = response.gridTariff.tariffPrice.priceInfo;
      //logging(tariffPrice.length);
      //logging(JSON.stringify(tariffPrice));
   } );



   logging("Done with getting data....");
   return "OK";
}

var server = app.listen(port, function () {
   logging( "Server started, listening at port")
})