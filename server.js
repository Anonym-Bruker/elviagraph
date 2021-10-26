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

app.get('/', function (req, res) {
   fetchData().then(result => {
      if(result == "OK"){
         res.render('index',
             {
                values,
                labels,
                meteringpoints
             })
      }
      else{
         logging("Return nok OK....");
         res.render('index',
             {
                values,
                labels,
                meteringpoints
             })
      }
   })
   .finally()
})


fetchData();


function addDays(days, date) {
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

   var startDate = addDays(2, currentdate);
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
   } );

   logging("Done with getting data....");
   return "OK";
}

var server = app.listen(port, function () {
   logging( "Server started, listening at port")
})