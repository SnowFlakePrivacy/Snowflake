//TODO: fix async function stuff

const fs = require('../src/dataManagement/fs');
const encription = require('../src/encription');
const Post = require('../src/dataManagement/post/post').Post;

exports.postContainer = async function(path, username, key){
  this.path = path;

  //Load the settings for the container
  this.settings = json.parse(await fs.readFile([path, '/settings.json']));

  this.key = new encription.rsa(key);

  //Load all lookup tables
  this.lookupTables = function(){
    let tables = {};
    //Get a list of all tables that we are using
    let tableList = fs.listDir([path, '/tables/', username]);
    //Go through each table and parse it
    for(var i in tableList){
      let table = tableList[i];
      //Get the encripted file key
      let fileData = await fs.readFile([path, '/tables/', username, table]);
      //Decript the data and parse it
      tables[table.substring(0, table.length - 5)] = json.parse(this.key.decript(fileData));
    }
    return tables;
  }();

  //Function to get a post by its id
  this.post = function(id){
    return new Promise((resolve, reject) => {
      if(id.substring(id.length - 5) != '.json'){
        let file = id;
      }
      else{
        let file = this.lookupTables.all[id];
      }

      fs.readFile([path, '/posts/', file])
      .then((data) => {
        let post = JSON.parse(data);
        resolve(post);
      })
      .catch((err) => {
        reject(err);
      })
    });
  }

  this.updateTable = async function(table = undefined){
    if(table){
      let postFiles = await fs.listDir([path, '/posts/']);
      for(let i in postFiles){
        let post = this.post(postFiles[i]);
        //TODO: take post data and add it to tables
      }
    }
    else{
      //If we didn't defined a lookup table update all of them
      for(let table in this.lookupTables){
        this.updateTable(table[i]);
      }
    }
  }

  //This key is for encripting and decripting the lookup tables because they contain sensitive infromation
  this.encriptionKey = new encription.aes(encriptionKey);

  //Internal function to load lookupTables from file
  this.getLookupTable = function(table){
    //Create a promise
    return new Promise((resolve, reject) => {
      //Get the file that we targeted
      fs.readFile([this.path, table + '.json'])
      .then((data) => {
        //If we found it then parse it
        try{
          data = this.encriptionKey.decript(data);
          data = JSON.parse(data);
        }
        catch(err){
          console.log(err);
          data = {};
        }
        resolve(data);
      })
      .catch((err) => {
        //If we didnt find it then the table is empty
        resolve({});
      });
    });
  };

  this.saveLookupTable = function(table, data){
    if(!data){
      data = this.lookupTables[table];
    }
    //Encript the data before we save it
    data = this.encriptionKey.encript(JSON.stringify(data));
    fs.writeFile([this.path, table + '.json'], data)
    .catch((err) => {
      console.log(err);
    })
  }

  function getPostList() {
    return new Promise((resolve, reject) => {
      fs.listDir()
      .then((files) => {
        for(var i in files){
          files[i] = files[i].split('.')[0];
        }
        resolve(files);
      })
      .catch((err) => {
        reject(err);
      });
    });
  }

  //Load all of the this.lookupTables from file
  this.lookupTables = {
    //This is just a list of all post ids
    all: await this.getPostList(),
    time: await this.getLookupTable('times'),
    poster: await this.getLookupTable('poster'),
    commenter: await this.getLookupTable('commenter'),
    tags: await this.getLookupTable('tags')
  };

  //All data for caching posts
  //A chache for resent posts
  this.postCache = [];
  //A count of how many posts we want to cache
  this.cacheCount = cacheCount;
  //get post by id
  this._getPost = function(id){
    return new Promise((resolve, reject) => {
      //Go through the cache and see if the post was saved
      for(var i in this.postCache){
        if(this.postCache[i].id.hash == id){
          return resolve(this.postCache[i]);
        };
      };
      //Read the file based on its id
      fs.readFile([this.path, 'posts', id + ".json"])
      .then((data) => {
        //If the file was empty then reject an error
        if(data == ""){
          return reject(new Error("no data in post " + id));
        }
        //If their is data use it
        else{
          //Parse the json then resolve it
          try{
            data = JSON.parse(data);
            //Add this post to the cache
            this.postCache.push(data);
            //If we go over the cache limit then remove the bottom of the cache
            if(this.postCache.length > this.cacheCount){
              this.postCache.shift();
            }
            return resolve(data);
          }
          //Reject any error that we find
          catch(e){
            return reject(e);
          }
        }
      })
      //If we had a file read error reject it
      .catch((err) => {
        return reject(err);
      })
    });
  };
  //get array of posts by criteria
  this.getPost = function(opts, data = true){
    return new Promise((resolve, reject) => {
      //If we where passed an array we want to search by several differnt criteria
      if(Array.isArray(opts)){
        //Make a list for storing posts
        var posts = [];
        //Go through each query and get the matches
        for(var i in opts){
          //Handle errors
          try{
            posts = posts.concat(await this.getPost(opts[i]));
          }
          catch(e){
            return reject(e);
          }
        };

        //Function for testing post against array
        function uniq(value, array, sameComp){
          for(var i in array){
            if(sameComp(value, array[i])){
              return false;
            }
          }
          return true;
        }
        //Function for testing post against post
        function compareIDs(post1, post2){
          return post1.id == post2.id;
        }

        //Filter out all duplicates
        var uniqPosts = [];
        for(var i in posts){
          var post = posts[i];
          if(uniq(post, uniqPosts, compareIDs)){
            uniqPosts.push(post)
          }
        }
        //return all found posts
        return resolve(uniqPosts);
      }

      //Make a copy of the posts that we will filter
      var posts = this.lookupTables.all.slice();

      //Normalize all inputs
      if(typeof opts == 'string'){
        opts = {
          id: opts
        };
      }
      if(typeof opts.time == 'number'){
        opts.time = {
          min: opts.time,
          max: opts.now
        }
      }
      if(typeof opts.poster == 'string'){
        opts.poster = [opts.poster];
      }
      if(typeof opts.tags == 'string'){
        opts.tags = [opts.tags];
      }
      if(typeof opts.commenter == 'string'){
        opts.commenter = [opts.commenter];
      }

      //Filter so the id matches
      if(opts.id){
        posts = posts.filter((post) => {return post.id == opts.id});
      }
      //Filter so the time is between the target range
      if(opts.time){
        posts = post.filter((post) => {return this.lookupTables.time[post.id] > opts.time.min && this.lookupTables.time[post.id] < opts.time.max});
      }
      //Filter so the poster matches
      if(opts.poster){
        posts = post.filter((post) => {return this.lookupTables.poster[post.id] == post.poster});
      }
      //Filter so that commenters match
      if(opts.commenter){
        posts = post.filter((post) => {
          commenters = this.lookupTables.commenter[post.id]
          for(var i in opts.commenter){
            for(var j in commenters){
              if(commenters[j] = opts.commenter[i]){
                return true;
              }
            }
          }
          return false;
        });
      }
      //Filter so that tags match
      if(opts.tags){
        posts = post.filter((post) => {
          tags = this.lookupTables.tags[post.id]
          for(var i in opts.tags){
            for(var j in tags){
              if(tags[j] = opts.tags[i]){
                return true;
              }
            }
          }
          return false;
        });
      }

      //Get the info for all of the posts
      for(var i in posts){
        posts[i] = async this._getPost(posts[i]);
      }
      //Filter out undefined posts
      posts = posts.filter((post) => {return post != undefined});
      //return the remaining posts
      resolve(posts);
    });
  };

  //Add a new post to the save file
  this.addPost = function(post){
    //Check to make sure the post is valid
    fingerPrintCopy = JSON.parse(JSON.stringify(post.body));
    delete fingerPrintCopy.id

    //Get the id of the post
    var postID = encription.hash(JSON.stringify(fingerPrintCopy), post.body.id.size, post.body.id.alg);

    //If the poster is public check to see if it is from them
    if(post.body.type.poster == 'public'){
      delete fingerPrintCopy.signature

      if(!(new encription.rsa(post.body.poster)).verify(JSON.stringify(fingerPrintCopy), post.body.signature)){
        //if the signature doesn't match what is stored then don't save it
        return;
      };
    };
    delete fingerPrintCopy

    //Navigate down the comments removing the ones that don't fit
    for(var i = post.comments.length - 1; i >= 0; i--){
      var comment = post.comments[i];

      //Create a copy without the signatures
      fingerPrintCopy = JSON.parse(JSON.stringify(comment));
      delete fingerPrintCopy.signature;
      fingerPrintCopy = JSON.stringify(fingerPrintCopy);

      //Check to make sure that the person who posted this is who they say they are
      if(comment.type.poster == 'public'){
        if(!(new encription.rsa(comment.poster)).verify(fingerPrintCopy, comment.signature.personal)){
          //Remove comment and skip to the next comment
          post.comment.splice(i, 1);
          continue;
        }
      }

      //If the comments are restricted only alow targets to respond
      if(post.body.type.comments == "restricted"){
        if(!(new encription.rsa(post.body.security.key)).verify(fingerPrintCopy, comment.signature.master)){
          //Remove comment and skip to the next comment
          post.comment.splice(i, 1);
          continue;
        }
      }
    }

    //TODO: update tables
    lookupTables.all.push(postID);
    lookupTables.time[postID] = post.body.timestamp
    lookupTables.poster[postID] = post.body.poster
    lookupTables.commenter[postID] =
    //TODO: fix this
    lookupTables.tags[postID] = post.body.content.tags

    //Save the post in a file
    fs.writeFile([this.path, postID + '.json'], JSON.stringify(post));
  };

  //Remove a post by index
  this.removePost = function(id){

  };

  //Add a comment to a post
  this.addComment = function(id, comment){

  }
}
