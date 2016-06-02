var express = require('express');

var app = express();
var handlebars = require('express-handlebars').create({defaultLayout:'main'});
var request = require('request');
//post stuff

var bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static('public'));

//sessions stuff
var session = require('express-session');
app.use(session({secret: 'donttell'}));

//handlebar stuff
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');
app.set('port', 3000);

var url = "https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/photos?sol=1000&page=2&api_key=ppI8P43zk3TFvmZqTVgwSL1kQHQoqLzTcf0mxv9l";

//database stuff
var mysql = require('mysql');
//setting up database pool
var pool = mysql.createPool({
  host  : 'localhost',
  user  : 'student',
  password: 'default',
  database: 'student'
});

/*
app.get('/',function(req,res,next){
	var context = {};
	console.log(req.body);
	
  	if(req.body.name = 'reset')
	{
		req.session.name = null;
		res.render('newSession', context);
		return;
	}
	
	
  //If there is no session, go to the main page.
	if(!req.session.name)
	{
		res.render('newSession', context);
		return;
	}
});
*/


app.post('/',function(req,res, next){
  var context = {};
  console.log(req.body);
  
  //if user hits delete
  if(req.body["delete"])
  {
		var index = req.body.delete[1];
		
		pool.query("DELETE FROM workouts WHERE id= ?", [index], function(err, result)
		{
			if(err)
			{
				console.log("ERROR");
				next(err);
				return;
			}
		});
  }
  
  //if user hits edit
  else if (req.body["edit"])
  {
	  var index = req.body.edit[1];
	  
	  //get the value in the edit rows
	  pool.query('SELECT * FROM workouts WHERE id=?',[index], function(err, rows, fields){
		if(err){
			console.log("error");
			next(err);
			return;
		}
	
		context.edit = rows[0];
		//trim date
		if (context.edit.date)
		{
			context.edit.trimDate = JSON.stringify(context.edit.date).substring(1, 11);
		}
	 });
  }
  
  //if user submits a new edit
  else if (req.body["editWorkout"])
  {
	  pool.query("UPDATE workouts SET name=?, reps=?, weight=?, date=?, lbs=? WHERE id=?",
				[req.body.name, req.body.reps, req.body.weight, req.body.date, req.body.lbskg, req.body.index], function(err, result)
				{
					if(err)
					{
						console.log("error");
						next(err);
						return;
					}
				});
  }
  
  //if user adds new workout
  else if(req.body["newWorkout"])
  {
	  //if user entered new data
	  if(req.body.name != "")
	  {
		  /*
		  var lbskg;
		  if (req.body.lbskg)
			  lbskg = true;
		  else
			  lbskg = false;
		  */
		  pool.query("INSERT INTO workouts (`name`, `reps`, `weight`, `date`, `lbs`) VALUES (?, ?, ?, ?, ?)",
					[req.body.name, req.body.reps, req.body.weight, req.body.date, req.body.lbskg], function(err, result)
					{
						if(err)
						{
							console.log("error");
							next(err);
							return;
						}
						
						
					});
	  }
  }
  
	//make page w/ new table data
	 pool.query('SELECT * FROM workouts', function(err, rows, fields){
		if(err){
			console.log("error");
			next(err);
			return;
		}
	
		context.rows = rows;
		console.log(JSON.stringify(context.rows));
		res.render('newSession', context);
	 });
	 
	 
});


//reset database copy
app.get('/reset-table',function(req,res,next){
	console.log("reset-table");
  var context = {};
  pool.query("DROP TABLE IF EXISTS workouts", function(err){
    var createString = "CREATE TABLE workouts("+
    "id INT PRIMARY KEY AUTO_INCREMENT,"+
    "name VARCHAR(255) NOT NULL,"+
    "reps INT,"+
    "weight INT,"+
    "date DATE,"+
    "lbs BOOLEAN)";
    pool.query(createString, function(err){
      context.results = "Table reset";
      res.render('newSession',context);
    })
  });
});

//get and display rows
app.get('/',function(req,res,next){
	console.log("Main-page");
  var context = {};
  pool.query('SELECT * FROM workouts', function(err, rows, fields){
    if(err){
      next(err);
      return;
    }
    context.rows = rows;
	console.log(JSON.stringify(context.rows));
    res.render('newSession', context);
  });
});


app.get('/count', function(req, res)
{
	var context = {};
	context.count = req.session.count || 0;
	req.session.count = context.count + 1;
	res.render('count', context);
});

function getRand()
{
	var rand = {};
	rand.random = Math.random();
	return rand;
}

app.get('/random', function(req,res)
{
		res.render('random', getRand());
});


app.get('/getStuff', function(req,res)
{
	var qArray = [];
	for (var p in req.query)
	{
			qArray.push({'name':p, 'value':req.query[p]});
	}
	
	var context = {};
	context.qList = qArray;
	res.render('get', context);
});

app.post('/postStuff', function(req, res)
{
	var pArray = [];
	
	for (var p in req.body)
	{
		pArray.push({'name':p, 'value':req.body[p]});
	}
	
	var context = {};
	context.pList = pArray;
	res.render('post', context);
});

app.get('/get-ex',function(req,res,next){
  var context = {};
  request('http://api.openweathermap.org/data/2.5/weather?q=corvallis&APPID=aa668dbfaaae00e93a4049f97d6755f8', function(err, response, body){
    if(!err && response.statusCode < 400){
      context.owm = JSON.parse(body);
	  //console.log(body);
      res.render('weather',context);
    } else {
      if(response){
        console.log(response.statusCode);
      }
      next(err);
    }
  });
});

app.get('/google', function(req, res, next)
{
	request("http://www.google.com", function(error, response, body)
	{
		if (!error && response.statusCode < 400)
			console.log(body);
	});
});

app.get('/space', function(req,res,next)
{
	var content = {};
	request("https://api.nasa.gov/mars-photos/api/v1/rovers/curiosity/photos?sol=1000&page=2&api_key=ppI8P43zk3TFvmZqTVgwSL1kQHQoqLzTcf0mxv9l", function(err, response, body)
	{
		if(!err && response.statusCode < 400)
		{
			console.log(body);
			content.info = JSON.parse(body);
			res.render('space', content);
		}
		else
		{
				if(response)
				{
					console.log(response.statusCode);
				}
		next(err);
		}
	});
});

//copied error messages from examples
app.use(function(req,res){
  res.type('text/plain');
  res.status(404);
  res.send('404 - Not Found');
});

app.use(function(err, req, res, next){
  console.error(err.stack);
  res.type('plain/text');
  res.status(500);
  res.send('500 - Server Error');
});

app.listen(app.get('port'), function(){
  console.log('Express started on http://localhost:' + app.get('port') + '; press Ctrl-C to terminate.');
});