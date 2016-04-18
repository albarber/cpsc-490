//parses topologies

app.factory('parser', function($http, $filter) {

	var parser = function(topologyData, inventoryData) {
		this.topoData = topologyData; 
		this.inventoryData = inventoryData; 
	}

	//This is to make up some locations while fixing the geolocation aspect given IP addresses
	parser.prototype.getRandomInRange = function(from, to, fixed) {
		return (Math.random() * (to - from) + from).toFixed(fixed) * 1;
		// .toFixed() returns string, so ' * 1' is a trick to convert to number
	};

	parser.prototype.parseTopology = function() {

	  console.log("in the parse Topo part"); 

	  var self = this; 

	  var data = self.topoData; 

	  console.log("getting self things")
	  console.log(self.topoData);
	  console.log(self.inventoryData);  
	  
		// create alias
	  var topology = data['network-topology'].topology[0];

	  // prepare stub for results
	  var topologyResult = {nodes: [], links: []};
	  // process nodes
	  for (var i = 0; i < topology.node.length; i++) {
	    var node = {};

	    // node name
	    if (topology.node[i].hasOwnProperty('node-id')) {
	      node.name = topology.node[i]['node-id'];
	    } else {
	      continue; //Skip if no node id / name
	    }

	    if (node.name.indexOf("host:") != -1) {
	      node.type = "host"; 
	    } else {
	      node.type = "switch"; 
	    }

	    //this means it is a host
	    if (topology.node[i].hasOwnProperty('host-tracker-service:addresses')) {
	      node.id = topology.node[i]['host-tracker-service:addresses'][0]['id']; 
	      node.ip_address = topology.node[i]['host-tracker-service:addresses'][0]['ip']; 
	    } else {
	      node.id = i; //assign next number in list to switch
	    }

	    //HARD CODE -- lat is -90 to +90, lng is -180 to +180
	    // right now: focused on continental United States 
	    // (mostly - though occasionally nodes end up in the ocean)
	    node.longitude = self.getRandomInRange(-120, -75, 3);
	    node.latitude = self.getRandomInRange(27, 44, 3); 

	    // add the node to the result object
	    topologyResult.nodes.push(node);
	  }
	  // processing links
	  for (i = 0; i < topology.link.length; i++) {
	    var link = {
	      id: i, 
	      given_id: topology.link[i]['link-id'], 
	      source: topology.link[i].source['source-node'],
	      target: topology.link[i].destination['dest-node']
	    };
	    // add the link to the result object
	    topologyResult.links.push(link);
	  }
	  console.log("number of nodes is: " + topologyResult.nodes.length);
	  console.log("number links: " + topologyResult.links.length); 

	  console.log(topologyResult); 

	  self.nodes = topologyResult.nodes; 
	  self.links = topologyResult.links; 

	  return topologyResult;
	}; 

	parser.prototype.parseNodeInventory = function() {

	  var self = this; 

	  var data = self.inventoryData; 
	  var topoLinks = self.links; //WRONG, FIX
		// create alias
	  var nodeInfo = data['nodes'];

	  var Result = {links: []}; 

	  var linkID = 0; //MUST FIX THIS WHEN HAVE MULTIPLE FLOWS

	  // process nodes
	  for (var i = 0; i < nodeInfo.node.length; i++) {
	    
	    var currentNode = nodeInfo.node[i]; 

	    //for each node connector get the information to update the database
	    for (var j = 0; j < currentNode['node-connector'].length; j++) {

	      var linkOne = {}; //this is from the current node to the dest
	      var linkTwo = {}; // this is from the dest to the current

	      linkOne.id = linkID; 
	      linkTwo.id = linkID + 1; 
	      linkID = linkID + 2; 

	      //IS THIS HOW TO IDENTIFY THEM??
	      linkOne.source = currentNode.id; 
	      linkTwo.target = currentNode.id; 

	      if (currentNode['node-connector'][j].hasOwnProperty('address-tracker:addresses')) {
	        var addresses = currentNode['node-connector'][j]['address-tracker:addresses'][0]; 

	        linkOne.target = 'host:' + addresses['mac']; //follows naming conventions parsed through Mininet
	        linkTwo.source = 'host:' + addresses['mac']; 
	      } else { //this is a switch-switch link 

	        //options: switch to itself (ignore)
	        if (currentNode['node-connector'][j].id == currentNode.id + ':LOCAL') {
	          continue; 
	        } 

	        //or switch to another switch (don't ignore)
	        else {

	          //get the node connector id. find the link in the results from topoResults. get the connection
	          var connectorId = currentNode['node-connector'][j].id 

	          //console.log(connectorId); 

	          //console.log("topoLinks is " + JSON.stringify(topoLinks)); 
	          var arrayFound = $filter('filter')(topoLinks, {given_id: connectorId}); 

	          console.log("arrayFound is " + arrayFound); 

	          if (arrayFound.length > 0) {
	          	linkOne.target = arrayFound[0].target;
	          	linkTwo.source = linkOne.target; 
	          }; 

	          //console.log(arrayFound); 

	        }
	      }

	      console.log(currentNode['node-connector'][j]); 

	      var currentSpeed = currentNode['node-connector'][j]['flow-node-inventory:current-speed']; //this is the link capacity
	      if (!currentSpeed) {
	      	currentSpeed = 10000000; //set default number in case none specified
	      }

	      var portStats = currentNode['node-connector'][j]['opendaylight-port-statistics:flow-capable-node-connector-statistics']; 

	      //to calculate the intensity, calculate link utilization
	      // utilization = traffic over capacity
	      // traffic = bits / second -- found by getting bytes * 8 / duration
	      // capacity is in bits/second (that is denoted by var currentSpeed)
	      var bitsOne = portStats['bytes']['transmitted'] * 8; 
	      var bitsTwo = portStats['bytes']['received'] * 8; 

	      var duration = portStats['duration']['second'] + (portStats['duration']['nanosecond'] / 1000000000.0); 

		  var intensityOne = (bitsOne / duration) / currentSpeed; 
		  var intensityTwo = (bitsTwo / duration) / currentSpeed; 

		  //console.log(intensityOne); 
		  //console.log(intensityTwo); 

	      linkOne.intensity = intensityOne; 
	      linkTwo.intensity = intensityTwo; 

	      Result.links.push(linkOne); 
	      Result.links.push(linkTwo); 
	    }
	  }

	  self.links = Result.links; 
	  //console.log(Result.links); 

	  //console.log("count of links: " + Result.links.length); 

	  return Result;

	}; 

	return parser; 

}); 