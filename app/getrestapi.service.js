//This is an angular service to get the network topology and the traffic data

app.factory('odlREST', function($http){

	delete $http.defaults.headers.common['X-Requested-With'];

	var odlREST = function(userConfig){
		this.userConfig = userConfig;
	};

	// Shortcut for controller's host + port
	odlREST.prototype.getbaseURL = function(){
		return 'http://' + this.userConfig.ctrlHost + ':' + this.userConfig.ctrlPort;
	};

	odlREST.prototype.loadTopology = function(successCbk, errorCbk) {

		console.log("starting topo load"); 

		// body...
		var self = this; 

		var url = self.getbaseURL() + '/restconf/operational/network-topology:network-topology/'; 

		//FIX THIS BASED ON USER CONFIG
		var options = {
   			headers: {
     			'Authorization': 'Basic YWRtaW46YWRtaW4=' //+ new Buffer('admin' + ':' + 'admin').toString('base64')
   			}         
		};

		/* TESTING GET FROM FILE 4/18 */
		url = 'samples/tree-depth5-fanout2_topology.json';

		console.log("url is " + url); 

		$http.get(url, options).then(

			//now that we've loaded, check to make sure we got data
			function (res) {

				if (res.statusText == 'OK') {
					res = res.data; 
					//console.log("got data ok"); 
					successCbk(res); 
				}
				else{
					//console.log("not ok?")
					//console.log(res); 
					errorCbk("failure to get topo data"); 
				}
			},
			function (err) {
				var errMsg = "failure to get topo data"; 
				errorCbk(errMsg); 
			}); 
	};

	odlREST.prototype.loadNetworkInventory = function (successCbk, errorCbk) {

		var self = this; 

		var url = self.getbaseURL() + '/restconf/operational/opendaylight-inventory:nodes/'; 

		var options = {
			headers: {
	 			'Authorization': 'Basic YWRtaW46YWRtaW4=' //+ new Buffer('admin' + ':' + 'admin').toString('base64')
				} 
		}; 

		url = 'samples/tree-depth5-fanout2_inventory.json'; 
		//options = {}; 

		$http.get(url, options).then(
			function (res) {
				if (res.statusText == 'OK') {
					res = res.data; 
					successCbk(res); 
				}
				else{
					//console.log(res); 
					errorCbk("failure to get node inventory data"); 
				}
			},
			function (err) {
				var errMsg = "failure to get node inventory data"; 
				errorCbk(errMsg); 
			}); 
	};


	return odlREST; 
}); 
