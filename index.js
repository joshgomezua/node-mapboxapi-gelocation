const fs = require("fs");
const axios = require("axios");
const csvtojsonV2 = require("csvtojson");


const createCsvWriter = require("csv-writer").createObjectCsvWriter;

const inputFilePath = "data/start.csv";
const outputPath = "data/out.csv";

const MAX_CALL_PER_MINUTE = 400;  // Please change the value


const mapboxToken =
  "pk.eyJ1Ijoia2V2aW4yMzQiLCJhIjoiY2p5OHI5eGwwMDNzaDNkbXg5MzNjbGF2ZiJ9.RJCep5CaFxoaxhsEIfF78g";

const csvFilePath = inputFilePath;
const csv = require("csvtojson");

var inputData = []; 
var totalLength = 0;
var csvData = [];
var promiseIndex = 0;
var blockCount = 0;
var arr =[];


csv()
  .fromFile(csvFilePath)
  .then(jsonObj => {

    console.log("The app is starting now .......");

    promiseIndex = -1;   // total number of calls

    inputData = jsonObj;  // input data
    totalLength = inputData.length; // the length of input data
    csvData = [];
    blockCount = 0;

    requestEveryMinute();

  });



 async function requestEveryMinute() {

  var startPoint = blockCount * MAX_CALL_PER_MINUTE;
  var endPoint = startPoint + MAX_CALL_PER_MINUTE;


  blockCount++;
  
  if(endPoint > totalLength)
    endPoint = totalLength;

  var requestInputArray = inputData.slice(startPoint, endPoint);

  console.log(`\nSending Request from ${startPoint} To ${endPoint}... `);


  var startTime = new Date();

  await workMyCollection(requestInputArray)

  console.log(`Received Response from ${startPoint} To ${endPoint}... `);

  var endTime = new Date();
  var interval = endTime - startTime;

  if(endPoint < totalLength) {
    var delayTime = 1000*60 - interval;
    if(delayTime > 0)
      setTimeout(requestEveryMinute, delayTime); // Every Minute
    else
      requestEveryMinute();
  } 

  csvWriter
    .writeRecords(csvData)
    .then(() => {
       
      console.log(`Block ${blockCount} is completed & the Result is added successfully`);
      if(endPoint == totalLength) {
        console.log("---------------------Completed---------------------------");
      }   
    })
    .catch(function(err) {
      console.log(err);
      console.log("error while saving csv file");
    });
  
} 


async function workMyCollection(arr) {

    for (let index = 0; index < arr.length; index++) {
  
      var oneRow = arr[index];
      var info = oneRow["City"];

      info = info.split(",");

      var oldCity = info[0];
      var oldState = " ";
      if (info.length > 1) {
        oldState = info[1];
      }

      csvData.push({
        oldCity: oldCity,
        oldState: oldState,
        newCity: "",
        newState: "",
        place: "",
        latitude: 0,
        longitude: 0
      });

      

      var placeString = encodeURIComponent(`${oldCity}, ${oldState}, Canada`);
      var requestUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${placeString}.json?access_token=${mapboxToken}&cachebuster=1563459992445&autocomplete=true&type=region`;

    
      promiseIndex++;

      var result = await axios(requestUrl);

  

      var oldCity = csvData[promiseIndex]["oldCity"];
      var oldState = csvData[promiseIndex]["oldState"];
      var data = result.data;

      if (
        data["features"] != undefined &&
        data["features"][0] != undefined &&
        data["features"][0]["place_name"] != undefined
      ) {
        var full_place = data["features"][0]["place_name"];

        var place_name = full_place;

        place_name = place_name.split(",");
        var len = place_name.length;

        // oldCity = oldCity.replace(/^\s+/g, "");
        // oldState = oldState.replace(/^\s+/g, "");
        place_name[len - 2] = place_name[len - 2];
        place_name[len - 3] = place_name[len - 3];

        var geometry = data["features"][0]["center"];

        csvData[promiseIndex]["newCity"] = place_name[len - 3];
        csvData[promiseIndex]["newState"] = place_name[len - 2];
        csvData[promiseIndex]["place"] = full_place;
        csvData[promiseIndex]["latitude"] = geometry[1];
        csvData[promiseIndex]["longitude"] = geometry[0];        
        //console.log(promiseIndex);
      }
    
    }

}


const csvWriter = createCsvWriter({
  path: outputPath,
  header: [
    { id: "oldCity", title: "Old City" },
    { id: "oldState", title: "Old State" },
    { id: "newCity", title: "New City" },
    { id: "newState", title: "New State" },
    { id: "place", title: "Place" },
    { id: "latitude", title: "Latitude" },
    { id: "longitude", title: "Longitude" }
  ]
});
