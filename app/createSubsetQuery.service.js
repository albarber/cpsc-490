app.factory('subsetQuery', function($filter) {

	//pass in list of data to create query for
	var subsetQuery = function(parameters) {
		this.parameters = parameters; 
	}

	//default queries select all values in the table
	var baseQueryLinks = "SELECT * FROM Links";
	var baseQueryNodes = "SELECT * FROM Nodes";


	//names of columns in each table that can be queried
	var linkCategories = [
		"Link_id", 
		"source_node", 
		"dest_node", 
		"intensity",
		"src_lat",
		"src_lng",
		"dest_lat",
		"dest_lng"
	];
	var nodeCategories = [
		"Node_id",
		"Node_name",
		"location_lat",
		"location_lng",
		"type"
	];

	//createQuery() takes in user input and returns a string to query MySQL
	subsetQuery.prototype.createQuery = function(){

		var queries = {}; //will return a node query and a link query

		var nodeQuery = baseQueryNodes; 
		var linkQuery = baseQueryLinks; 

		var additionalString = ""; 

		var self = this; 

		//before the first query, add "WHERE"
		//after the first query, need to add "AND" or "OR" at beginning of every new clause
		var firstNodeQuery = true; 
		var firstLinkQuery = true; 


		/*
		to parse the additional query need 3 things: 
			1. whether we are querying the "Nodes" or "Links" table
			2. What we are querying in that table (links.intensity? Nodes.type?)
			3. The condition
		*/

		if (self.parameters.hasOwnProperty('additionalQuery')){

			var userInput = self.parameters.additionalQuery; 

			for (var j = 0; j < userInput.length; j++) {

				if (userInput[j].table == 'Nodes') {
					additionalString = ""; //reset

					if (firstNodeQuery == false)
						additionalString = additionalString + " AND ";
					else {
						additionalString = additionalString + " WHERE ";
					}

					//assume separated by spaces
					var strArray = userInput[j].string.split(" "); 

					if (strArray.length == 3) { //only proceed if this
						
						//need 'feature' 'comparator' 'value'
						if (nodeCategories.indexOf(strArray[0]) !== -1) {
							//valid category
							additionalString = additionalString + "Nodes." + strArray[0] + " " + strArray[1] + " '" + strArray[2] + "'"; 

							nodeQuery = nodeQuery + additionalString; 
							firstNodeQuery = false; 
						}
					}
					else {
						console.log("error in parsing user input on nodes"); 
					}

					//error catching done by MySQL -- if input does not work

				}
				else { //links
					additionalString = ""; //reset

					if (firstLinkQuery == false)
						additionalString = additionalString + " AND ";
					else {
						additionalString = additionalString + " WHERE ";
					}

					//assume separated by spaces
					var strArray = userInput[j].string.split(" "); 

					if (strArray.length == 3) { //only proceed if 3 space delimited strings
						
						//need 'feature' 'comparator' 'value'
						if (linkCategories.indexOf(strArray[0]) !== -1) {
							//valid category
							additionalString = additionalString + "Links." + strArray[0] + " " + strArray[1] + " '" + strArray[2] + "'"; 
							linkQuery = linkQuery + additionalString; 
							firstLinkQuery = false;  
						}
					}
					else {
						console.log("error in parsing user input on links"); 
					}

					//error catching done by MySQL -- if input does not work

				}
			}

		}

		//assume for now that sourceNodes also means destNodes passed in
		if (self.parameters.hasOwnProperty('sourceNodes')) {

			//need to get the object in the form of ("val", "val2") instead of ["val", "val2"] for MySQL
			sourceString = "("; 
			for (var i = 0; i < self.parameters.sourceNodes.length; i++){
				sourceString = sourceString + "'" + self.parameters.sourceNodes[i] + "', "; 
			}

			sourceString = sourceString + "'')" //empty string to make it a passable query

			if (firstLinkQuery == false) {
				linkQuery = linkQuery + " AND ";
			} else {
				linkQuery = linkQuery + " WHERE ";
			}
			if (firstNodeQuery == false) {
				nodeQuery = nodeQuery + " AND "; 
			} else {
				nodeQuery = nodeQuery + " WHERE "
			}

			linkQuery = linkQuery + "Links.source_node IN " + sourceString + " AND "; 

			nodeQuery = nodeQuery + "( Nodes.Node_name IN " + sourceString + " OR "; 
		}

		//if there are a list of dest nodes passed in, also include a clause for that
		if (self.parameters.hasOwnProperty('destNodes')) {

			destString = "("
			for (var i = 0; i < self.parameters.destNodes.length; i++){
				destString = destString + "'" + self.parameters.destNodes[i] + "', "; 
			}

			destString = destString + "'')" //empty string to make it a passable query

			linkQuery = linkQuery + "Links.dest_node IN " + destString; 

			nodeQuery = nodeQuery + "Nodes.Node_name IN " + destString + ")"; 

		} 

		queries.NodeQuery = nodeQuery; 
		queries.LinkQuery = linkQuery; 
		return queries; 
	}

	return subsetQuery; 

}); 