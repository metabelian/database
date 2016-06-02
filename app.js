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

//function to add row to table
function addRow(data, tableID)
{
	var table = document.getElementById(tableID);
	newRow = table.insertRow(table.length);
	
	newRow.insertCell(0).textContent = data.name;
	newRow.insertCell(1).textContent = data.reps;
	newRow.insertCell(2).textContent = data.weight;
	newRow.insertCell(3).textContent = data.date;
	newRow.insertCell(4).textContent = data.lbs;
}

//function to remove row from table
function removeRow(data, tableID)
{
	var table = document.getElementById(tableID);
	for (var i = 0; i < table.length; i++)
	{
		if (table[i].id = data.id)
		{
			table.deleteRow(i);
			return;
		}
	}
}


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

//clicking on homepage
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