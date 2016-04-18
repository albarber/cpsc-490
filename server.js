
//based off of Bierman app
var express  = require('express');
var app      = express();

const http = require('http');
var mysql = require('mysql');

var morgan = require('morgan');             // log requests to the console (express4)
var bodyParser = require('body-parser');    // pull information from HTML POST (express4)
var methodOverride = require('method-override'); // simulate DELETE and PUT (express4)

// These variables are used for configuration settings for individual usage of the app
var userConfig = {

	'ctrlHost': 'localhost', //ip here
	'ctrlPort': 8181, //8181 by default
	'odlUsername': 'admin', //admin by default
	'odlPassword': 'admin', //admin by default

	// Proxy settings
	'proxyPort': 5555, // proxy's port
	'webServerPort': 8080, // Web server's port

	//database info settings -- MySQL for now
	'dbUsername': 'alb',
	'dbPassword': 'password',
	'database': '490maps'

}

app.use(express.static(__dirname));                 // set the static files location /public/img will be /img for users
app.use(morgan('dev'));                                         // log every request to the console
app.use(bodyParser.urlencoded({'extended':'true'}));            // parse application/x-www-form-urlencoded
app.use(bodyParser.json());                                     // parse application/json
app.use(bodyParser.json({ type: 'application/vnd.api+json' })); // parse application/vnd.api+json as json
app.use(methodOverride());


/*
* Configure MySQL parameters.
*/
//FIX THESE BASED ON USER CONFIG
var con = mysql.createConnection({
	host : "localhost", //change if needed
	user : userConfig.dbUsername,
	password : userConfig.dbPassword,
	database : userConfig.database
}); 

/*Connecting to Database*/
con.connect(function(error){
	if(error)
	{
		console.log("Problem with MySQL"+error);
	}
	else
	{
		console.log("Connected with Database");
	}
}); 


// routes ======================================================================

	// possible other functionality: pass in query parameters to query database
    // ---------------------------------------------------------------------
    
    // 1. get the nodes from the node table in geojson format
    app.post('/nodes', function(req, res) {

    	//console.log("in the get part"); 
    	console.log(req.body); 

    	var customQuery = req.body.NodeQuery; 

    	if (!customQuery) {
    		customQuery = 'SELECT * FROM Nodes'; 
    	}

    	//console.log("custom query is: " + customQuery); 

    	con.query(customQuery, function(err, rows) {
    		if (err) {
    			console.log(err);
    		} else { //ok so we got all of the nodes, now want to output into geojson
    			//console.log(rows); 

    			var geojson = {
    				type: 'FeatureCollection',
    				features: []
    			}; 

    			for (var i = 0; i < rows.length; i++) {

    				//console.log(rows[i]); 

    				var nodePoint = {
    					type: 'Feature',
    					geometry: {
    						type: 'Point',
    						coordinates: [
    							rows[i].location_lng,
    							rows[i].location_lat
    						]
    					},
    					properties: rows[i] 
    				}; 

    				geojson.features.push(nodePoint); 

    			}

    			//console.log("geoJSON is: " + JSON.stringify(geojson)); 

    			res.send(geojson); 
    		}
    	}); 

    	//con.end(); //FIX?

    }); 

    // 2. get links from the link table in geojson format
    app.post('/links', function(req, res) {

    	var customQuery = req.body.LinkQuery;  //change this to handle errors? 

    	if (!customQuery) {
    		customQuery = 'SELECT * FROM Links'; 
    	}

    	console.log("custom query is: " + customQuery); 

    	con.query(customQuery, function(err, rows) {
    		if (err) {
    			console.log(err);
    		} else {

    			var geojson = {
    				type: 'FeatureCollection',
    				features: []
    			}; 

    			var sourceNode = []; 

    			for(var i = 0; i < rows.length; i++) {

    				var link_id = rows[i].Link_id; 

    				var linkProperties = rows[i]; 

    				var newLink = {
						type: 'Feature',
						geometry: {
							type: 'LineString', 
							coordinates: [
								[rows[i].src_lng, rows[i].src_lat],
								[rows[i].dest_lng, rows[i].dest_lat]
    						]
    					},
    					properties: linkProperties
					}; 

					geojson.features.push(newLink); 

    			}

    			res.send(geojson); 
    		} 
    	}); 

    }); 

    // 3. insert nodes into node table -- pass in node data!
    app.post('/nodes/insert', function(req, res) {
    	var nodeData = req.body.nodeData; 

    	con.query('INSERT IGNORE INTO Nodes SET ?', nodeData, function(err, result) {
	      if(err) {
	        console.log(err); 
	      } else {
      	  }
    	}); 

    	res.send("nodes inserted"); 

    }); 

    // 4. insert links into links table
    app.post('/links/insert', function(req, res) {
    	var linkData = req.body.linkData; 

    	con.query('INSERT IGNORE INTO Links SET ?', linkData, function(err, result){
		    if(err) {
		        console.log(err); 
		    } else {
		    }
		});

		res.send("links inserted"); 

    }); 

    // 5. update links in links table or nodes in node table
    app.post('/links/update', function(req, res) {

    	var updateStatement1 = "UPDATE Links SET src_lat = (select location_lat from Nodes Where Nodes.Node_name = Links.source_node)"; 
    	var updateStatement2 = "UPDATE Links SET src_lng = (select location_lng from Nodes Where Nodes.Node_name = Links.source_node)"; 
    	var updateStatement3 = "UPDATE Links SET dest_lat = (select location_lat from Nodes Where Nodes.Node_name = Links.dest_node)"; 
    	var updateStatement4 = "UPDATE Links SET dest_lng = (select location_lng from Nodes Where Nodes.Node_name = Links.dest_node)"; 

    	con.query(updateStatement1, function(err, result){
    		if(err){
    			console.log(err); 
    		} else{

    		}
    	}); 
    	con.query(updateStatement2, function(err, result){
    		if(err){
    			console.log(err); 
    		} else{
    			
    		}
    	});  
    	con.query(updateStatement3, function(err, result){
    		if(err){
    			console.log(err); 
    		} else{
    			
    		}
    	}); 
    	con.query(updateStatement4, function(err, result){
    		if(err){
    			console.log(err); 
    		} else{
    			
    		}
    	}); 

    	res.send("links updated"); 

    }); 


    // 6. delete? both nodes and links for now
    app.delete('/all', function(req, res) {

    	con.query("DELETE from Links"); // add error catching

    	con.query("DELETE from Nodes"); //add error catching

    	res.send("deletion done"); 

    }); 


app.get('*', function(req, res) {
  res.sendfile('./index.html'); // load the single view file (angular will handle the page changes on the front-end)
});

// listen (start app with node server.js) ======================================
app.listen(8080);
console.log("App listening on port 8080");

