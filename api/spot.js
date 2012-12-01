var restify = require('restify');
    
var DEFAULT_PORT = 8080;
var Settings = require('./Settings');
/* Parse Setup */
var Parse = require('parse-api').Parse;
var app = new Parse(Settings.Parse.appId, Settings.Parse.master);


function respond(req, res, next) {
  res.send('hello ' + req.params.name);
}

var server = restify.createServer();
server.get('/hello/:name', respond);
server.head('/hello/:name', respond);





var restPort = DEFAULT_PORT;

process.argv.forEach(function (val, index, array) {
  console.log(index + ': ' + val);
  if (val === '-p')
   {
      restPort = array[index+1];
   }
});

server.listen(restPort, function() {
  console.log('%s listening at %s', server.name, server.url);
});

/**
   SPOT API
**/

server.get('/spot', function(req, res) {
   res.send('list all spots API'); 
});

server.get('/spot/:id', function(req, res) {
   res.send('get spot id API: ' + req.params.id);
});

server.post('/spot', function(req, res) {
   res.send('add spot API');
});

server.put('/spot/:id', function(req, res){
   res.send('update spot id: ' + req.params.id);
});
