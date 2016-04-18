//this controller: 
// 1) gets the data from database (based on query?)
// 2) puts it on the map

//uses angular-google-maps in order to allow functionality like data layers
var app = angular.module('prototypeApp', ['uiGmapgoogle-maps']);

app.config(function($httpProvider){
	delete $httpProvider.defaults.headers.common['X-Requested-With'];
});

app.controller('MapCtrl', function($scope, $http, odlREST, uiGmapIsReady, subsetQuery){

	//polylines for links
	$scope.linkPaths = []; 

	//at what zoom level do you want to show the links? (default 7)
	$scope.linkConfig = {
		zoomShow: 5
	}

	function MockDataLayer(dataLayer) {

		//possibly move this somewhere else? -- do it? 
		$http.post('/links/update', {}, function(data){
			console.log("updated table?");
		}); 

		// samples/badTree.json also works
  		$http.get('/links').success(function(data) {
  			console.log("here"); 
    		dataLayer.addGeoJson(data); 
    		dataLayer.setStyle(styleFeature);

    		console.log(dataLayer);
  		});
	}

	//set the map controls (zoom, center) here
	$scope.loadMap = function () {

		console.log("resetting the map?"); 

		$scope.map = {
	      zoom: 5,
	      center: {latitude: 40.00, longitude: -100.644},
      	  showData: true,
      	  options: {
      	  	mapTypeId: google.maps.MapTypeId.SATELLITE
      	  },
      	  control: {}//,
  		};
	};

	$scope.$watch('map.zoom', function(newVal, oldVal){
		if(oldVal != newVal){ //want to check that we've moved from show->no show or vice versa (otherwise do nothing)
       		//alert("Zoom Changed from: " + $scope.map.zoom);
       		console.log("zoom changed to: " + $scope.map.zoom)
       		console.log($scope.linkPaths); 

       		if (newVal >= $scope.linkConfig.zoomShow && oldVal < $scope.linkConfig.zoomShow) {
       			//$scope.linkPaths.setMap($scope.map); 
       			console.log("changing visibility");

       			for (var a = 0; a < $scope.linkPaths.length; a++) {
       				$scope.linkPaths[a].visible = true; 
       			}
       			
       		}
       		else if (newVal < $scope.linkConfig.zoomShow && oldVal >= $scope.linkConfig.zoomShow) {
       			console.log("now rehide the visibility"); 

       			for (var b = 0; b < $scope.linkPaths.length; b++) {
       				if($scope.linkPaths[b]) 
       					$scope.linkPaths[b].visible = false; 
       			}
       		}
       		else {
       			//do nothing if don't need to change it 
       		}
      	}
    }, true);

  	var alternate = true; //for drawing geodesic

	function interpolateHsl(lowHsl, highHsl, fraction) {
	  var color = [];
	  for (var i = 0; i < 3; i++) {
	    // Calculate color based on the fraction.
	    color[i] = (highHsl[i] - lowHsl[i]) * fraction + lowHsl[i];
	  }

	  return 'hsl(' + color[0] + ',' + color[1] + '%,' + color[2] + '%)';
	}


	function styleFeature(feature) {
	  var low = [151, 83, 34];   // color of low intensity (green) 
	  var high = [5, 69, 54];  // color of high intensity (red)

	  //change these to reflect scale
	  var minIntensity = 0;
	  var maxIntensity = 0.03; //or 1, really? 

	  // fraction represents where the value sits between the min and max
	  var fraction = (Math.min(feature.properties['intensity'], maxIntensity) - minIntensity) /
	      (maxIntensity - minIntensity); 

	  var color = interpolateHsl(low, high, fraction);

	  alternate = !alternate; 
	  //console.log(alternate); 

	  return {
	    strokeWeight: 4,
	    strokeColor: color,
	    geodesic: alternate, //to show parallel links, make one link geodesic (slight curve), other straight
	    strokeOpacity: 0.7,
	    zIndex: Math.floor(feature.properties['intensity']) // and we put links with higher intensity on top
	    //zIndex changed from feature.getProperty('intensity')
	  }; 
	}

	$scope.polylineRef = []; //temp testing for data
	$scope.clickedLinkHTML = ""; //info about clicked link

	$scope.loadPolylines = function (queryString) {

		$scope.linkPaths = []; // reset

		//update the link table if need be
		//possibly move this somewhere else? -- do it? 
		$http.post('/links/update', {}, function(data){
			console.log("updated table?");
		}); 

		if (!queryString) {
			queryString = 'SELECT * FROM Links'; 
		}
		// get all of the links from the link table in geoJSON format
		// samples/badTree.json also works
  		//$http.get('/links').success(function(data) {
  		$http({
  			method: 'POST',
  			url: '/links',
  			data: {LinkQuery: queryString}
  		}).success(function (data) {

    		console.log("data from table is: ");
    		console.log(data); 

    		var links = data.features;

    		for (var i = 0; i < links.length; i++) {

    			var id = i; 

    			var linePath = links[i]; //?

    			//console.log(links[i]); 
    			$scope.polylineRef[i] = links[i]; 

    			var lineStyle = styleFeature(links[i]); 

    			var currPolyline = {
    				id: i, 
    				path: linePath.geometry,
    				stroke: {
    					weight: lineStyle.strokeWeight,
    					color: lineStyle.strokeColor,
    					opacity: lineStyle.strokeOpacity
    				}, 
    				geodesic: lineStyle.geodesic,
    				clickable: true,
    				//model: $scope.linkPaths,
    				visible: true//, //set false if not want to show at outset
    				//title: "TESTING",
    				//show: false
    			}


    			currPolyline['events'] = {

    				
    				click: function(line, eventName, model, args) {
    					//console.log("line clicked: ");
    					//console.log(line); 
    					//line.strokeOpacity = 1; 

    					//must do $parent.p.id to get reference b/c of using ng-repeat instead of polylines model
    					var temp = $scope.polylineRef[model.$parent.p.id]['properties']

    					/*
    					$scope.clickedLinkHTML = "<b> Link ID: " + temp.Link_id + "</b> \
    					 <br/> Source Node: " + temp.source_node + "<br/> \
    					 Destination Node: " + temp.dest_node + "<br/> \
    					 intensity: " + temp.intensity; */


    					//model.show = !model.show; 
    					//$scope.clickedLink = line; 
    					//console.log("id is: " + line.id)
    					//alert("clickeddddd"); 
    					$scope.clickedLinkHTML = temp; 
    					console.log($scope.clickedLinkHTML);  //so can have div w/ $scope.clickedLinkHTML in it
    				}
    			}; 

    			$scope.linkPaths.push(currPolyline); 
    		}

    		console.log($scope.linkPaths); 
  		});

	}; 

	//markers for nodes
	$scope.nodeMarkers = [];
  
  	var infoWindow = new google.maps.InfoWindow();
  
  	var createMarker = function (i, html, lat, lng, name, type, idKey){

  		if (idKey == null) {
        	idKey = "id";
      	}	
      
      	//point can be geoJSON <-- instead of "latitude" and "longitude"
      	var ret = {
      		latitude: lat,
      		longitude: lng, 
      		title: html,
      		show: false,
      		name: name,
      		type: type,
      		selectedSrc: true,
      		selectedDest: true
      	}; 

      	ret[idKey] = i; 

      	return ret; 
      
  	}; 

  	$scope.onClick = function(marker, eventName, model) {
        console.log("Clicked!");
        model.show = !model.show;
    };

	//THIS WORKS
	$scope.loadMarkers = function (queryString) {

		console.log("getting new markers? "); 
		console.log("queryString is: " + queryString);

		if (!queryString) {
			queryString = 'SELECT * FROM Nodes'; 
		}

		$scope.nodeMarkers = []; //reset on new load

		$http({
			method: 'POST', 
			url: '/nodes', 
			data: {NodeQuery: queryString}
		}).success(function(data){

			var nodes = data.features; 

			for (var i = 0; i < nodes.length; i++) {
				var name = nodes[i].properties.Node_name; 
				var type = nodes[i].properties.type; 
				var point = new google.maps.LatLng(
					parseFloat(nodes[i].geometry.coordinates[1]),
					parseFloat(nodes[i].geometry.coordinates[0])); 
				var lat = parseFloat(nodes[i].geometry.coordinates[1]); 
				var lng = parseFloat(nodes[i].geometry.coordinates[0]); 
				var html = "<b> Node: " + name + "</b> <br/>" + point + "<br/>" + type;

				//console.log("html is: " + html); 
				//console.log("point is: " + point); 

				var ret = createMarker(i, html, lat, lng, name, type)

				$scope.nodeMarkers.push(ret); 
				console.log("pushed node marker"); 
			}

			//console.log($scope.nodeMarkers[0]); 
			console.log($scope.nodeMarkers); 

		}).error(function(data, status){
			console.log("error getting the nodes"); 
		}); 

		//var markerCluster = new MarkerClusterer(map, nodeMarkers);

	};

	$scope.checkAll = function(key, model) {

		console.log(key); 
		console.log(model);

		if ($scope[model]) {
            $scope[model] = true;
        } else {
            $scope[model] = false;
        }
        angular.forEach($scope.allMarkers, function (item) {
        	//console.log(item[key]); 
        	//console.log(item)
            item[key] = $scope[model];
        });
    };

	/*---------------------- 
	/
	/ Custom Queries Section 
	/
	-----------------------*/

	$scope.userNodeQuery = {
		table: "Nodes",
		string: ""
	};
	$scope.userLinkQuery = {
		table: "Links",
		string: ""
	}; 

	//$scope.selectedSrc = {}
	$scope.mapQuery = function() {
		

		//for queries, firs check if all selected; then add to dest / source lists if not

		//DESTINATIONS
		var selectedDestinations = $scope.allMarkers.filter(function(node){
			return node.selectedDest; 
		}); 

		console.log(selectedDestinations); 

		destList = []; 

		angular.forEach(selectedDestinations, function(obj){

			destList.push(obj.name); 

		}); 
		console.log(destList); 


		//NOW SOURCES
		var selectedSources = $scope.allMarkers.filter(function(node){
			return node.selectedSrc; 
		}); 
		sourceList = []; 
		angular.forEach(selectedSources, function(obj){
			sourceList.push(obj.name); 
		});

		var userQueries = [];
		userQueries.push($scope.userNodeQuery);
		userQueries.push($scope.userLinkQuery); 
		//console.log(userQueries);

		//BUILD THE QUERY
		var queries = new subsetQuery({
							sourceNodes: sourceList, 
							destNodes: destList, 
							additionalQuery: userQueries}); 

		var queryStrings = queries.createQuery(); 
		//console.log(queryStrings); 

		//console.log(queryStrings.NodeQuery); 
		$scope.loadMarkers(queryStrings.NodeQuery); 
		$scope.loadPolylines(queryStrings.LinkQuery); 
	}; 

	/*--------------------------- 
	/
	/ End Custom Queries Section 
	/
	----------------------------*/

	
	$scope.reloadAll = function () {
		console.log("reload clicked"); 

		$scope.loadMap(); 
		$scope.loadMarkers();
		$scope.allMarkers = $scope.nodeMarkers; 
		$scope.loadPolylines(); 

		$scope.selectedAllSrc = true; 
		$scope.selectedAllDest = true; 

		console.log("getting here?"); 

	}; 

	//On initial load: 
	$scope.selectedAllSrc = true; 
	$scope.selectedAllDest = true; 

	$scope.loadMap(); 
	$scope.loadMarkers(); 
	$scope.allMarkers = $scope.nodeMarkers; //on init, keep track of all nodes (gotten from database)
	$scope.loadPolylines(); 

	//console.log($scope.linkPaths); 

}); 