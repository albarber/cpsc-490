//this is the main controller for the map

//uses angular-google-maps in order to allow functionality like data layers
var app = angular.module('prototypeApp', ['uiGmapgoogle-maps']);

app.config(function($httpProvider){
	delete $httpProvider.defaults.headers.common['X-Requested-With'];
});

app.controller('MapCtrl', function($scope, $http, odlREST, uiGmapIsReady, subsetQuery){

	//polylines for links
	$scope.linkPaths = []; 

	//set at what zoom level to show the links? (default 5)
	$scope.linkConfig = {
		zoomShow: 5
	}

	//set the map controls (zoom, center) here
	$scope.loadMap = function () {

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

	//changes the link visibility 
	$scope.$watch('map.zoom', function(newVal, oldVal){
		if(oldVal != newVal){ //want to check that we've moved from show->no-show or vice versa (otherwise do nothing)

			//if we've moved from no-show->show
       		if (newVal >= $scope.linkConfig.zoomShow && oldVal < $scope.linkConfig.zoomShow) {

       			for (var a = 0; a < $scope.linkPaths.length; a++) {
       				$scope.linkPaths[a].visible = true; 
       			}
       			
       		} //if we've moved from show->no-show
       		else if (newVal < $scope.linkConfig.zoomShow && oldVal >= $scope.linkConfig.zoomShow) {

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

	//style feature sets the correct appearance of all links
	function styleFeature(feature) {
	  var low = [151, 83, 34];   // color of low intensity (green) 
	  var high = [5, 69, 54];  // color of high intensity (red)

	  //user should change these to reflect scale
	  var minIntensity = 0;
	  var maxIntensity = 0.001; //or 1, really? 

	  // fraction represents where the value sits between the min and max
	  var fraction = (Math.min(feature.properties['intensity'], maxIntensity) - minIntensity) /
	      (maxIntensity - minIntensity); 

	  var color = interpolateHsl(low, high, fraction);

	  alternate = !alternate; 

	  return {
	    strokeWeight: 4,
	    strokeColor: color,
	    geodesic: alternate, //to show parallel links, make one link geodesic (slight curve), other straight
	    strokeOpacity: 0.7,
	    //zIndex: Math.floor(feature.properties['intensity']) // and we put links with higher intensity on top
	  }; 
	}

	$scope.polylineRef = []; //temp testing for data
	$scope.clickedLinkHTML = ""; //info about clicked link

	$scope.loadPolylines = function (queryString) {

		$scope.linkPaths = []; // reset

		//update the link table if need be
		$http.post('/links/update', {}, function(data){
			console.log("updated table?");
		}); 

		if (!queryString) {
			queryString = 'SELECT * FROM Links'; 
		}
		// get all of the links from the link table in geoJSON format
  		$http({
  			method: 'POST',
  			url: '/links',
  			data: {LinkQuery: queryString}
  		}).success(function (data) {

    		var links = data.features;

    		for (var i = 0; i < links.length; i++) {

    			var id = i; 

    			var linePath = links[i]; //?

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
    				visible: true//, //set false if not want to show link at outset
    			}


    			currPolyline['events'] = {

    				
    				click: function(line, eventName, model, args) {

    					//must do $parent.p.id to get reference b/c of using ng-repeat instead of polylines model
    					var temp = $scope.polylineRef[model.$parent.p.id]['properties']

    					//set variable so can have div w/ $scope.clickedLinkHTML in it
    					$scope.clickedLinkHTML = temp; 
    				}
    			}; 

    			$scope.linkPaths.push(currPolyline); 
    		}

  		});

	}; 

	//markers for nodes
	$scope.nodeMarkers = [];
  
  	var infoWindow = new google.maps.InfoWindow();
  
  	var createMarker = function (i, html, lat, lng, name, type, idKey){

  		if (idKey == null) {
        	idKey = "id";
      	}	
      
      	//point can be geoJSON instead of "latitude" and "longitude"
      	var ret = {
      		latitude: lat,
      		longitude: lng, 
      		title: html,
      		show: false,
      		name: name,
      		type: type,
      		selectedSrc: true, //for checkbox queries, start as true
      		selectedDest: true //for checkbox, start as true
      	}; 

      	ret[idKey] = i; 

      	return ret; 
      
  	}; 

  	$scope.onClick = function(marker, eventName, model) {
        console.log("Clicked!");
        model.show = !model.show;
    };

	$scope.loadMarkers = function (queryString) {

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

				var ret = createMarker(i, html, lat, lng, name, type)

				$scope.nodeMarkers.push(ret); 
			}
		}).error(function(data, status){
			console.log("error getting the nodes"); 
		}); 

	};

	/*---------------------- 
	/
	/ Custom Queries Section 
	/
	-----------------------*/

	//for the checkboxes in the query section, select all
	$scope.checkAll = function(key, model) {

		if ($scope[model]) {
            $scope[model] = true;
        } else {
            $scope[model] = false;
        }
        angular.forEach($scope.allMarkers, function (item) {
            item[key] = $scope[model];
        });
    };

	$scope.userNodeQuery = {
		table: "Nodes",
		string: ""
	};
	$scope.userLinkQuery = {
		table: "Links",
		string: ""
	}; 

	$scope.mapQuery = function() {
		
		//for queries, first check if all selected; then add to dest / source lists if not

		//DESTINATIONS
		var selectedDestinations = $scope.allMarkers.filter(function(node){
			return node.selectedDest; 
		}); 

		destList = []; 
		angular.forEach(selectedDestinations, function(obj){
			destList.push(obj.name); 
		}); 


		//SOURCES
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

		//BUILD THE QUERY
		var queries = new subsetQuery({
							sourceNodes: sourceList, 
							destNodes: destList, 
							additionalQuery: userQueries}); 

		var queryStrings = queries.createQuery(); 

		//reload markers and polylines based on queries
		$scope.loadMarkers(queryStrings.NodeQuery); 
		$scope.loadPolylines(queryStrings.LinkQuery); 
	}; 

	/*--------------------------- 
	/
	/ End Custom Queries Section 
	/
	----------------------------*/

	//reload / reset the map
	$scope.reloadAll = function () {
		window.location.reload(); 
	}; 

	//On initial load: 
	$scope.selectedAllSrc = true; 
	$scope.selectedAllDest = true; 

	$scope.loadMap(); 
	$scope.loadMarkers(); 
	$scope.allMarkers = $scope.nodeMarkers; //on init, keep track of all nodes (gotten from database)
	$scope.loadPolylines(); 

}); 