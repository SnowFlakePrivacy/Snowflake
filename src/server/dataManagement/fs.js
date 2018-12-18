const path = require('path');
const fs = require('fs');
const mkdirp = require('mkdirp');

function parcePath(path){
  if(Array.isArray(path)){
    endPath = "";
    for(var i in path){
      endPath = path.join(endPath, path[i]);
    }
    return endPath;
  }
  return path;
}

//Read a file
exports.readFile = function(file, opts = undefined){
  file = parcePath(file)

  return new Promise((resolve, reject) => {
    fs.readFile(file, encoding, (err, data) => {
      if(err){
        reject(err);
      }
      resolve(data);
    });
  });
}

//Write to a file and create its folder if it dosn't exist
exports.writeFile = function(file, data, opts){
  file = parcePath(file)

  return new Promise((resolve, reject) => {
    mkdirp(path.dirname(file), (err) => {
      if (err){
          reject(err);
      };
      fs.writeFile(file, data, opts, (err) => {
        if(err){
          reject(err);
        }
        resolve();
      });
    });
  });
}

//Function to create a dir
exports.makeDir = function(file){
  return new Promise((resolve, reject) => {
    mkdirp(path.dirname(file), (err) => {
      if(err){
        reject(err);
      }
      resolve();
    });
  });
}

//Function to get all files from a dir
exports.listDir = function(dir){
  return new Promise((resolve, reject) => {
    fs.readdir(dir, (err, files) => {
      if(err){
        reject(err);
      }
      resolve(files);
    })
  });
}
