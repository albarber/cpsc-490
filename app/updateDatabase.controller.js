app.controller('databaseCtrl', function($scope, $http, odlREST, parser) {

	$scope.userConfig = {
		'ctrlHost': 'localhost', //ip here
		'ctrlPort': 8181, //8181 by default
		'odlUsername': 'admin', //admin by default
		'odlPassword': 'admin', //admin by default
	}

	var odlrest = new odlREST($scope.userConfig); 

	//inserts the topology (nodes and links) into the database
	$scope.insertNewTopology = function () {
		odlrest.loadTopology(
			function(data) {

				$scope.topoData = data; 

				odlrest.loadNetworkInventory(
					function(data) {
 
						$scope.inventoryData = data; 

						var parseFlow = new parser($scope.topoData, $scope.inventoryData); 

						parseFlow.parseTopology(); 
						parseFlow.parseNodeInventory(); 

						for(var i = 0; i < parseFlow.nodes.length; i++) {

						    var nodeData = {
						      Node_id: parseFlow.nodes[i].id,
						      Node_name: parseFlow.nodes[i].name,
						      location_lat: parseFlow.nodes[i].latitude, 
						      location_lng: parseFlow.nodes[i].longitude, 
						      type: parseFlow.nodes[i].type 
						    }; 

						    $http.post('/nodes/insert', {nodeData: nodeData}).success(function(data){
						    	console.log("success! " + data);
						    }).error(function(data, status){
						    	console.log("error connecting")
						    });

						}

						//insert each link 
					    for (var i = 0; i < parseFlow.links.length; i++) {

						    var linkData = {
						      Link_id: parseFlow.links[i].id, 
						      source_node: parseFlow.links[i].source, 
						      dest_node: parseFlow.links[i].target, 
						      intensity: parseFlow.links[i].intensity
						    }; 

						    $http.post('/links/insert', {linkData: linkData}).success(function(data){
						    	console.log("success! " + data);
						    }).error(function(data, status){
						    	console.log("error connecting")
						    });	
					    }

					},
					function(err) {
						console.log(err); 
					}
				);  


			},
			function(err) {
				console.log(err);
			}
		); 
	}; 

	//call a reset before loading new topologies
	$scope.resetDatabases = function () {
		$http.delete('/all').success(function(data){
			console.log("cleared the databases"); 
		}).error(function(data){
			console.log("error clearing the databases"); 
		});
	}; 

}); 