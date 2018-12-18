const http = require('http');
const express = require('express');

//TODO: use custom onion routing with online friends as nodes and tor as a fallback

//All tor things
//Hosting a tor service
const granax = require('granax');
//Making request over tor
const request = require('tor-request');

module.exports = function(port){
  //List of all other users using this that we know of
  this.endpoints = [];

  //Set up tor
  this.tor = granax();
  this.serviceID = tor.createHiddenService('127.0.0.1:' + port, (err, data) => {
    if(err) {
      console.error(err);
    }
    else {
      this.address = data.serviceId;
      this.endpoints.push(this.address);
    }
  });

  //Setting up the server
  this.server = express();
  this.server.listen(port);

  //Functions for IO
  /*
  this.on('route', (req, res)=> {

  })
  */
  this.on = function(route, callback){
    this.server.post(route, callback);
  };
  /*
  opts = {
    host: "example.com",
    path: "/pathHere/"
    headers: {}
  }
  */
  this.send = function(opts, data){
    request.post(opts, data, function(){})
  };
  //callback(err, res, body)
  this.request = function(opts, data, callback){
    request.post(opts, data, callback);
  };

  //When we get pinged send nothing back
  this.on('ping', (req, res) => {
    res.end();
  });

  //adding new addresses to the Dynamicly Distributed Overlay Network
  this.addEndpoint = function(address, force = false){
    function add(address){
      //Forword this address to all endpoints that we know of
      for(var i = 0; i < this.endpoints.length; i++){
        this.send({
          host: this.endpoints[i],
          path: 'addAddress'
        }, {address: address})
      };
      //add this endpoint to the list of endpoints
      this.endpoints.push(address);
    }
    //This is for duck typeing :)
    if(force == true){
      add(address)
    }
    //See if we can ping them
    //If we can then they actualy exist
    this.request({
      host: this.endpoints[i],
      path: 'ping'
    }, {}, (err, res, body) => {
      //If we dont get an error on the ping then they actualy exist
      if(!err){
        add(address)
      }
    })
  };
  //add on request from the server
  this.on('addAddress', (req, res) => {
    var body = req.body;
    var endpoint = body.address;
    if(endpoints.indexof(endpoint) != -1){
      this.addEndpoint(endpoint);
    }
    //Close the connection
    res.end();
  });

  //removing addresses from the Dynamicly Distributed Overlay Network
  this.removeEndpoint = function(address, force = false){
    function remove(address){
      var index = this.endpoints.indexof(address);
      if(index != -1){
        this.endpoints = this.endpoints.splice(index, 1);
      }
    }
    if(force == true){
      remove(address);
    }
    //Test to see if they actualy dont exist anymore
    this.request({
      host: this.endpoints[i],
      path: 'ping'
    }, {}, (err, res, body) => {
      if(err){
        remove(address);
      }
    });
  };
  //on remove notifiction remove the address
  this.on('removeAddress', (req, res) => {
    var body = req.body;
    var endpoint = body.address;
    res.end();
  });

  //Function to reset all endpoints so that no none can track us
  this.anonymize = function(){
    request.newTorSession(function(err){
      console.log(err);
    });

    tor.destroyHiddenService(this.serviceID, function(){});
    this.removeEndpoint(this.address, true);

    this.address = undefined;
    this.serviceID = tor.createHiddenService('127.0.0.1:' + port, (err, data) => {
      if(err) {
        console.error(err);
      }
      else {
        this.address = data.serviceId;
        this.addEndpoint(this.address, true)
      }
    });
  }
}
