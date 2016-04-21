app.controller('databaseCtrl', function($scope, $http, odlREST, parser) {

	//CLEAN UP
	$scope.userConfig = {
		'ctrlHost': 'localhost', //ip here
		'ctrlPort': 8181, //8181 by default
		'odlUsername': 'admin', //admin by default
		'odlPassword': 'admin', //admin by default
	}

	var odlrest = new odlREST($scope.userConfig); 

	$scope.insertNewTopology = function () {
		odlrest.loadTopology(
			function(data) {

				$scope.topoData = data; 

				odlrest.loadNetworkInventory(
					function(data) {
						//console.log(data); 
						$scope.inventoryData = data; 
						console.log($scope.topoData); 
						console.log($scope.inventoryData); 
						console.log(JSON.stringify($scope.inventoryData, undefined, 2));
						console.log(JSON.stringify($scope.topoData, undefined, 2));  

						var parseFlow = new parser($scope.topoData, $scope.inventoryData); 

						parseFlow.parseTopology(); 
						parseFlow.parseNodeInventory(); 

						for(var i = 0; i < parseFlow.nodes.length; i++) {

						    var nodeData = {
						      Node_id: parseFlow.nodes[i].id, //i, //nodes[i].id, <-- fix
						      Node_name: parseFlow.nodes[i].name,
						      location_lat: parseFlow.nodes[i].latitude, 
						      location_lng: parseFlow.nodes[i].longitude, 
						      type: parseFlow.nodes[i].type 
						    }; 

						    console.log(nodeData); 

						    $http.post('/nodes/insert', {nodeData: nodeData}).success(function(data){
						    	console.log("success! " + data);
						    }).error(function(data, status){
						    	console.log("error connecting")
						    });

						}

						console.log(parseFlow.links); 

						//insert each link 
					    for (var i = 0; i < parseFlow.links.length; i++) {

						    var linkData = {
						      Link_id: parseFlow.links[i].id, 
						      source_node: parseFlow.links[i].source, 
						      dest_node: parseFlow.links[i].target, 
						      intensity: parseFlow.links[i].intensity
						    }; 

						    console.log(linkData); 

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

	//call before loading new topologies
	$scope.resetDatabases = function () {
		$http.delete('/all').success(function(data){
			console.log("cleared the databases"); 
		}).error(function(data){
			console.log("error clearing the databases"); 
		});
	}; 

}); 