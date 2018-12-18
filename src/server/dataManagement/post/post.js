const encription = require('../src/encription');

//user = rsaPrivateKey
exports.post = function(data){
  //Check the signiture
  this.data = data;

  this.getMeta = function(key){
    return this.data.meta;
  }

  this.getID = function(key){
    return this.data.meta.id.hash;
  }

  this.getPoster = function(key){
    //TODO:
    let signitures = this.data.body.poster;
    if(signitures.length == 0){
      //No one signed the post meaning it was anonymous
      return undefined;
    }
    else if(signitures.length == 1 && signitures[0].substring(0, 26) == '-----BEGIN PUBLIC KEY-----'){
      //One person signed it and the key is public
      return signitures[0];
    }
    else if(signitures.length == 1){
      //One person signed it and the key is hidden
      let postKey = this.getReadKey(key);
      if(postKey){
        return postKey.decript(signitures[0]);
      }
    }
    else if(signitures[0].substring(0, 26) == '-----BEGIN PUBLIC KEY-----'){
      //There is a ring signature and everyone in the ring is public
      let ring = new encription.ring(signitures);
      return ring;
    }
    else{
      //There is a ring Signaturer but the contents are hidden
      let postKey = this.getReadKey(key);
      let decriptedSignitures = [];
      //Decript the signers
      for(let i in signitures){
        decriptedSignitures.push(postKey.decript(signitures[i]));
      }
      //Create the ring
      let ring = new encription.ring(decriptedSignitures);
      return ring;
    }
  }

  this.getRecipients = function(key){
    //TODO:
  }

  this.getContent = function(key){
    //TODO:
  }

  this.getTitle = function(key){
    //TODO:
  }

  this.getData = function(key){
    //TODO:
  }

  this.getTags = function(key){
    //TODO:
  }

  this.getComments = function(key, opts){
    //TODO:
  }

  this.getReadKey = function(key){
    let security = this.data.body.security;
    //TODO: loop through and check the cases public hiddent anon instead of all at once
    for(var i in security.recipients){
      let recipient = security.recipients[i];
      switch (recipient.type) {
        //resipient in anonymous
        case 'anon':
          //Decript the secondary key with the given private key
          let secondaryKey = new encription.aes(key.decript(recipient.key.secondary));
          //Use the secondary to decript the primary
          let primaryKey = new encription.rsa(secondaryKey.decript(recipient.key.primary));
          //If the primary's public key matches the given one then we are all good
          if(primaryKey.exportKey('public') == security.key){
            return primaryKey;
          }
          break;
        //resipient is hidden from not resipients
        case 'hidden':
          //Decript the primary key
          let primaryKey = new encription.rsa(key.decript(recipient.key));
          //If the primary key matches then we are all good
          if(primaryKey.exportKey('public') == security.key){
            return primaryKey;
          }
          break;
        //resipient is public
        case 'public':
          //If we arnt the target just skip
          if(target != key.exportKey('public')){
            continue
          }
          //Check to make sure that the key actualy works because they could be lying
          let primaryKey = new encription.rsa(key.decript(recipient.key));
          //If the primary key matches then we are all good
          if(primaryKey.exportKey('public') == security.key){
            return primaryKey;
          }
          break;
        default:
          continue
      }
    }
    return undefined;
  }

  this.verifyPost = function(key, opts = {highSpeed: false}){
    //Verify post version
    if(this.data.meta.version != 1){
      return false;
    }
    //Set the id (We never want to trust what is stored if we can help it)
    if(!opts.highSpeed){
      this.data.meta.id.hash = encription.hash(JSON.stringify(this.data.body), this.data.meta.id.size, this.data.meta.id.alg);
    }

    //Get the publicKey of the poster
    let posterKey = this.getPoster(key);

    if(posterKey){
      posterKey = new encription.rsa(posterKey);
      //If we can see the key of the poster then we want to check if the signature on the posts matches
      let bodyCopy = JSON.parse(JSON.stringify(this.data.body));
      delete bodyCopy.signature;
      //If the signature dosn't match then this post is a fake
      if(!posterKey.verify(JSON.stringify(bodyCopy), this.data.body.signature)){
        return false;
      }
    }
  }

  this.comment = function(key, text, opts){
    //TODO:
  }
}

var Comment = function(data){
  //TODO comment object
  this.data = data;
}

/*
post = {
  meta: {                                           -Anything that is not user genorated
    version: 1,                                     -Version number of post data
    distance: 0,                                    -Number of times this post has been relayed

    id: {                                           -To get the data hash the body
      alg: "sha512",                                -The hash to use to get the id
      size: 512,                                    -Length of the hash
      hash: "adsgnngklagnlagsnklgsnkl"              -Hash that is stored with this (note: this will not be sent or reseaved with a post)
    }
  },
  body: {
    signature: "signature",                         -All of the posts body data other then this and the id signed (won't exist for anon)

    timestamp: 1234567890,                          -Timestamp for creation

    poster: [],                                     -Array of signers, If 0 post is anon, if not a valid rsa key then poster is hidden, if a rsa key then poster is public, if several none valid rsa keys then poster is hidden from everyone but still trustable

    comments: "public"/"restricted"/"hidden"/"none",-Who can read and write comments everyone, only people with the post directed at them, only visable to people with the post directed at them, or no one

    security: {
      key: "--publicKey--"                          -public key for the master key,
      recipients: [
        {
          type: "anon",                             -This is a key for an anonymous user
          key: {
            primary: "--privateKey--",              -This is the master key for reading the post encripted with the secondary key
            secondary:  "--privateKey--"            -One time use symetric key genorated and encripted with recipients public key to hide their identity
          }
        },
        {
          type: "hidden",                           -The master key encripted with recipients publicKey (this only hides their identity from outsider)
          key: "--privateKey--"                     -Key encripted so only the resipient can read it
          target: "--publicKey--"                   -This is the key of the recipient encripted with the master key (this just lowers the prossesing requerments on the end user. It WONT make it more secure to remove this)
        },
        {
          type: "public",                           -This is a key for a public user
          target: "--publicKey--",                  -Public key of resipient
          key: "--privateKey--"                     -Key encripted so only the resipient can read it
        }
      ]
    },
    content: {                                      -If post content is private then this will be stringfyed and encripted
      type: "text",                                 -If this is text image or some other thing
      title: "title here",                          -Title of the post
      data: "post contnet here",                    -Text content of the post
      tags: ["tag1", "tag2", "tag3"]                -Tags on the post
    }
  },
  comments: [
    {
      signature: {                                  -Signatures for the valididy of the post
        personal: 'signature',                      -Signaturer to verify the person who posted this
        master: 'signature'                         -Signaturer to verify if they can post on this
      },
      timestamp: 1234567890,
      type: {
        poster: "public"/"restricted"/"poster",    -Who can see the comment poster: everyone, recipients, or OP
        content: "public"/"restricted"/"poster"    -Who can see this comment: everyone, recipients, or OP
      },
      poster: "--publicKey--",
      content: "comment post here"
    }
  ]
}
*/
