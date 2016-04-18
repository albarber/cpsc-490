app.factory('subsetQuery', function($filter) {

	//pass in list of data to create query for
	var subsetQuery = function(parameters) {
		this.parameters = parameters; 
	}

	var baseQueryLinks = "SELECT * FROM Links";
	var baseQueryNodes = "SELECT * FROM Nodes";

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
	
	/*
	var validComparators = [
		">",
		"<",
		">=",
		"<=",
		"!=",
		"="
	]
	*/

	subsetQuery.prototype.createQuery = function(){

		var queries = {}; //will return a node query and a link query

		var nodeQuery = baseQueryNodes; 
		var linkQuery = baseQueryLinks; 

		var additionalString = ""; 

		console.log("creating the query"); 

		var self = this; 

		console.log(self.parameters); 

		//before the first query, add "WHERE"
		//after the first query, need to add "AND" or "OR" at beginning of every new clause
		var firstNodeQuery = true; 
		var firstLinkQuery = true; 

		//FOR NODES: And before Or -- so must do WHERE Nodes.type = X AND (Nodes.node_name IN Y OR ... IN Z)


		/*
		to parse the additional query need X things: 
			1. whether we are querying the "Nodes" or "Links" table
			2. What we are querying in that table (links.intensity? Nodes.type?)
			3. The condition
		*/

		//FIRST, WHERE statement for the additional query
		if (self.parameters.hasOwnProperty('additionalQuery')){
			//var additionalString = "WHERE "; //will add on to this

			var userInput = self.parameters.additionalQuery; 

			for (var j = 0; j < userInput.length; j++) {

				if (userInput[j].table == 'Nodes') {
					additionalString = ""; //reset

					if (firstNodeQuery == false)
						additionalString = additionalString + " AND ";
					else {
						additionalString = additionalString + " WHERE ";
						//firstNodeQuery = false; 
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
						//firstLinkQuery = false; 
					}

					//assume separated by spaces
					var strArray = userInput[j].string.split(" "); 
					console.log(strArray);

					if (strArray.length == 3) { //only proceed if this
						
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





		//do something else if all nodes selected?? for performance?? YES???? 

		//if there are a list of source nodes -- actually, assume for now that sourceNodes means destNodes passed in
		if (self.parameters.hasOwnProperty('sourceNodes')) {

			//need to get the obj in the form of ("val", "val2") instead of ["val", "val2"]
			sourceString = "("; 
			for (var i = 0; i < self.parameters.sourceNodes.length; i++){
				sourceString = sourceString + "'" + self.parameters.sourceNodes[i] + "', "; 
			}

			sourceString = sourceString + "'')" //empty string to make it a passable query

			//console.log(sourceString); 

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

		//if there are a list of dest nodes passed in
		if (self.parameters.hasOwnProperty('destNodes')) {

			destString = "("
			for (var i = 0; i < self.parameters.destNodes.length; i++){
				destString = destString + "'" + self.parameters.destNodes[i] + "', "; 
			}

			destString = destString + "'')" //empty string to make it a passable query

			//console.log(destString); 

			linkQuery = linkQuery + "Links.dest_node IN " + destString; 

			nodeQuery = nodeQuery + "Nodes.Node_name IN " + destString + ")"; 

		} 

		console.log("LINK QUERY IS: "+ linkQuery); 

		queries.NodeQuery = nodeQuery; 
		queries.LinkQuery = linkQuery; 
		return queries; 
	}

	return subsetQuery; 

}); 