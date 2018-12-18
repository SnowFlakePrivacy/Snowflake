//TODO: move cache here

const postContainer = require('../src/dataManagement/post/postContainer').postContainer;

/*
  Directory Formating

  dat                                       -Folder for all saved data
    posts                                   -Default Location for post data
      index.json                            -List of the locations for all post containers
      primary                               -Default primary storge
        settings.json                       -Settings for post container such as cache size and max post count
        tables                              -Folder for holding all lookupTables
          username                          -Each user will have their own lookupTable folder
            all.json                        -List of posts id's and their respective file name
            time.json                       -List of posts by their post date
            poster.json                     -List of posts by poster
            commenter.json                  -List of posts by commenters
            tags.json                       -List of posts by tags
        posts                               -Folder for all posts
          exampleName1.json                 -Post data
          exampleName2.json                 -Post data
      secondary                             -Default secondary folder same struct as primary

*/
exports.posts = function(password){
  this.postContainers = function(){

  }();
  this.primary = new postContainer('../dat/posts/activeStorge',);

  this.secondary = new postContainer
}
