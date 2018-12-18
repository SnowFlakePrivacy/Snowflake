const encription = require('../src/encription');
var DDON = require('../src/networking/DDON')(9050);

//TODO: save and forword posts
//TODO: save and forword accounts

function getEntryPoint(){
  //Pick a random node an return that
  return DDON.endpoints[encription.randomNumber(DDON.endpoints.length)];
}

function connectToEntryPoint(point){
  DDON.addEndpoint(point);
}

DDON.on('newPost', (req, res) => {
  var post = post.body;

  //Create a copy of the post to do verifcation on
  var verificationCopy = JSON.parce(JSON.stringfy(post));
  delete verificationCopy.id;
  //Check if the id matches the post
  if(post.id.hash != encription.hash(JSON.stringfy(verificationCopy), post.id.hash.length, post.id.alg)){
    return;
  }
  //If this post isnt anonymus then check if it was actualy from them
  if(post.type.poster == "public"){
    delete verificationCopy.signature;
    //Check if the signature matches the content of the post
    if((new encription.rsa(post.poster)).verify(verificationCopy, post.signature)){
      return;
    }
  }

  //TODO: save post if it is relivent to us
});

/*
  body = {
    comments: [
      {
        poster: "--publicKey--",
        timestamp: 1234567890,
        content:"comment post here"
        signature: "signature",
      }
    ]
  }
*/
DDOC.on('newComment', (req, res) => {
  var comments = post.body.comments
});
