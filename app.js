
var express           = require('express');
var path              = require('path');
var favicon           = require('serve-favicon');
var logger            = require('morgan');
//var cookieParser      = require('cookie-parser');
var bodyParser        = require('body-parser');
var mustacheExpress   = require('mustache-express');
var rest   		 	  = require('restling');
var request   		  = require('request');

const lang = 'en';
const api_server = "pitagoras.keler.org";

const collections = {
	club: 'basketballclub',
	player: 'basketballbiography'
}

const preffixes = {
	club: 	'basketball-team',
	clubs: 	'basketball-teams',
	player: 'basketball-player',
	players: 'basketball-players'
}

const views = {
	club: 	'klub',
	clubs: 	'kluby',
	player: 'koszykarz',
	players: 'koszykarze'
}

var app = express();

app.engine('mustache', mustacheExpress());
app.set('view engine', 'mustache');
app.set('views', path.join(__dirname, 'views'));

app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger(':status :method :url :response-time ms - :res[content-length] (:user-agent)'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
//app.use(cookieParser());
//app.use(require('express-session')({ secret: 'makeme$$$', resave: true, saveUninitialized: true }));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/'+preffixes.players, function(req, res){
	res.redirect('/'+preffixes.players+'/1');
});

app.get('/'+preffixes.clubs, function(req, res){
	res.redirect('/'+preffixes.clubs+'/1');
});

app.get('/'+preffixes.club, function(req, res){
	res.redirect('/');
});

app.get('/'+preffixes.player, function(req, res){
	res.redirect('/');
});

app.get('/', function(req, res){
	var resources = {
		players: 	{url: 'http://'+api_server+':9902/'+lang+'/collection/'+collections.player+'?offset='+Math.floor(Math.random() * 1000)+';&limit=40', options: {username: 't', password: 't'} },
		clubs: 		{url: 'http://'+api_server+':9902/'+lang+'/collection/'+collections.club+'?offset='+Math.floor(Math.random() * 100)+';&limit=40', options: {username: 't', password: 't'} },
	};

console.log(resources);

	rest.settleAsync(resources).then(function(results) {
		res.render('index', {players: results.players.data.nodes, clubs: results.clubs.data.nodes, preffixes: preffixes});
	}, function(error){
		console.log(error.message);
		res.render('error', {preffixes: preffixes});
	}); 

});

var https = require('https');

app.get('/img/:slug', function(req, res){

try {

	var resources = {
		node: 		{url: 'http://'+api_server+':9902/'+lang+'/node/'+req.params.slug, options: {username: 't', password: 't'} }
	};

console.log(resources);

	rest.settleAsync(resources).then(function(results) {

		if (!results.node.data.image) return res.status(404).send('No such image!'); 

		try {

			//request(results.node.data.image).pipe(res);

		  	var fwdrq = https.request(results.node.data.image);
		    fwdrq.on('response', function(response) {

		    	res.set({
				  'Content-Type': response.headers['content-type'],
				  'Content-Length': response.headers['content-length'],
				  'Last-Modified': response.headers['last-modified']
				})
		        response.pipe(res);
		    });

		    fwdrq.on('error', function(error) {
		        return res.status(500).send('Something broke!');
		    });

		    fwdrq.end();


		} catch(err) { return res.status(500).send('Something broke!'); }

	}, function(error){
		console.log(error.message);
		res.status(500).send('Something broke!');
	}); 


} catch(err) { res.status(500).send('Something broke!'); }

});

app.get('/'+preffixes.players+'/:page', function(req, res){

	var size = 40;
	var page = parseInt(req.params.page);

	if (isNaN(page)) return   res.render('error', {preffixes: preffixes});;

	var resources = {
		players: 	{url: 'http://'+api_server+':9902/'+lang+'/collection/'+collections.player+'?offset='+(page*size)+'&limit=40', options: {username: 't', password: 't'} }
	};

	rest.settleAsync(resources).then(function(results) {
		res.render( views.players, {
			players: results.players.data.nodes,
			prev: page > 1 ? page - 1 : null,
			next: page + 1,
			preffixes: preffixes
		});
	}, function(error){
		console.log(error.message);
		res.status(500).send('Something broke!');
	}); 

});

app.get('/'+preffixes.clubs+'/:page', function(req, res){

	var size = 40;
	var page = parseInt(req.params.page);

	if (isNaN(page)) return res.render('error', {preffixes: preffixes});;

	var resources = {
		players: 	{url: 'http://'+api_server+':9902/'+lang+'/collection/'+collections.club+'?offset='+(page*size)+'&limit=40', options: {username: 't', password: 't'} }
	};

console.log(resources);

	rest.settleAsync(resources).then(function(results) {
		res.render( views.clubs, {
			clubs: results.players.data.nodes,
			prev: page > 1 ? page - 1 : null,
			next: page + 1,
			preffixes: preffixes
		});
	}, function(error){
		console.log(error.message);
		res.status(500).send('Something broke!');
	}); 

});

app.get('/'+preffixes.club+'/:slug', function(req, res){


	var resources = {		
		players: 	{url: 'http://'+api_server+':9902/'+lang+'/collection/'+collections.player+'/hascontract/'+req.params.slug+'?offset=0&limit=100', options: {username: 't', password: 't'} },
		club: 		{url: 'http://'+api_server+':9902/'+lang+'/node/'+req.params.slug, options: {username: 't', password: 't'} },
	};

console.log(resources);

	rest.settleAsync(resources).then(function(results) {

		res.render( views.club, {
			players: results.players.data.nodes, 
			club:  results.club.data,
			slug:  req.params.slug,
			preffixes: preffixes
		});

	}, function(error){
		console.log(error.message);
		res.status(500).send('Something broke!');
	}); 

});

app.get('/'+preffixes.player+'/:slug', function(req, res){

	var view = views.player;

	var resources = {		
		player:     { url: 'http://'+api_server+':9902/'+lang+'/node/'+req.params.slug, options: {username: 't', password: 't'} }
	};

console.log(resources);

	rest.settleAsync(resources).then(function(result) {
		var urls = [];

		if (result.player.statusCode == 404) res.render('error', {preffixes: preffixes});

		if (result.player.data.sportContract) {
			result.player.data.sportContract.forEach( (contract,i) => {
				urls.push({url:contract.details,options: {username: 't', password: 't'}});
			});
		}


console.log(urls);

		rest.settleAsync(urls).then(function(contracts) {

			var data = {
				name: result.player.data["name:en"],
				senior: [],
				youth: [],
				national: [],
				manager: [],
				goalsTotal: {},
				matchesTotal: {},
				preffixes: preffixes
			};

			Object.keys(result.player.data).forEach( (key,i) => {
				if (!Array.isArray(result.player.data[key])) {
					data[key] = result.player.data[key];
					return;
				}

				var a = [];

				result.player.data[key].forEach( (entry,j) => {
					a.push( entry["name:en"] );			
				}); 

				data[key] = a.join(", ");

			});

			contracts.forEach( (contract,i) => {
				data[contract.data.stage].push(contract.data);
			} );


			data.slug = req.params.slug;

			res.render(view, data );

		}, function(error){
			console.log(error.message);
			res.status(500).send('Something broke!');
		}); 


	}, function(error){
		console.log(error.message);
		res.status(500).send('Something broke!');
	}); 

});


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error', {preffixes: preffixes});
});

module.exports = app;
