app.controller('MyBallparksController', function($scope, $window, $uibModal, $sce, UserService, BallparkService, AuthService, FacebookService) {
	// Authenticate the user
	if(!AuthService.isTokenValid()) {
		AuthService.clearToken();
		// redirect to login
		$window.location.href = '/?invalid_token';
	}

	// Make moment library available in templates
	$scope.moment = moment;

	// load the user
	function loadUser() {
		return UserService.getUserById(AuthService.getUserId())
		.then(function(response) {
			$scope.userBallparks = response.data.ballparks;
			$scope.user = response.data;
			calculateBallparkMatches();
		});
	};
	loadUser();

	// load ballparks
	var ballparks;
	BallparkService.loadBallparks()
	.then(function(response) {
		ballparks = response.data;
		$scope.ballparks = response.data;
	});

	// load user friends
	FacebookService.getFriends()
	.then(function(response) {

		$scope.friends = response.data;

		return response.data.map(function(el) {
			return el.id
		}).join(',');
	})
	.then(function(friendIds) {
		return UserService.getFriendData(friendIds);
	})
	.then(function(friendBallparkData) {
		// update friend data with ballparks
		for (var i = 0; i < friendBallparkData.data.length; i++) {
			var ballparkData = friendBallparkData.data[i];
			for (var j = 0; j < $scope.friends.length; j++) {
				if($scope.friends[j].id === ballparkData.fb_id) {
					$scope.friends[j].numBallparks = ballparkData.ballparks.length;
					$scope.friends[j].ballparks = ballparkData.ballparks.map(function(el) { return el.data });
					break;
				}
			}
		}
		calculateBallparkMatches();
	});


	function calculateBallparkMatches() {
		if(typeof $scope.user !== 'undefined' && typeof $scope.friends !== 'undefined') {
			// map user ballparks to array of ids
			var userBallparkIds = $scope.userBallparks.map(function(el) {
				return el.data._id
			})

			// calculate ballpark matches for user and friends
			for (var i = 0; i < $scope.friends.length; i++) {
				var matches = 0;
				if(typeof $scope.friends[i].ballparks !== 'undefined') {
					for (var j = 0; j < $scope.friends[i].ballparks.length; j++) {
						var ballparkId = $scope.friends[i].ballparks[j];
						if(userBallparkIds.indexOf(ballparkId) !== -1) {
							// we found a match
							matches++;
						}
					}
					
				}
				$scope.friends[i].matches = matches;
			}
		}
	}

	$scope.searchBallpark = function(searchKey) {
		$scope.selectedBallpark = null;
		$scope.searchResults = null;

		var results = [];
		for(var i = 0; i < ballparks.length; i++) {
			if( searchKey.length > 2 && (ballparks[i].primary_name.toLowerCase().indexOf(searchKey.toLowerCase()) !== -1
				|| ( ballparks[i].home_team !== null && ballparks[i].home_team.toLowerCase().indexOf(searchKey.toLowerCase()) !== -1) )
			) {
				results.push(ballparks[i]);
			}
		}

		if(results.length === 1) {
			$scope.searchBallparkById(results[0]._id);
		}
		else if (results.length > 0) {
			$scope.searchResults = results;
		}
	}

	$scope.searchBallparkById = function(id) {
		$scope.searchResults = null;
		for(var i = 0; i < ballparks.length; i++) {
			if(ballparks[i]._id === id) {
				var userMatches = $scope.userBallparks.filter(function(el) {
					return el.data._id === ballparks[i]._id;
				});
				$scope.selectedBallpark = ballparks[i];
				$scope.searchName = "";
				$scope.addMode = userMatches.length === 0;
				break;
			}
		}
	}
	
	$scope.hideSelection = function(){
		$scope.selectedBallpark = null;
	}

	// add a ballpark
	$scope.addBallpark = function(ballparkId, dateVisited) {
		if(typeof dateVisited === 'undefined') {
			dateVisited = new Date();
		}

		UserService.addBallpark(AuthService.getUserId(), ballparkId, dateVisited)
		.then(function() {
			// reload the user after the ballpark is added
			return loadUser();
		})
		.then(function() {
			$scope.selectedBallpark = null;
		});
	};

	// remove a ballpark
	$scope.removeBallpark = function(ballparkId, closeSearch) {
		var remove = confirm('Are You Sure?');

		if(remove) {
			UserService.removeBallpark(AuthService.getUserId(), ballparkId)
			.then(function() {
				// reload the user after the ballpark is removed
				return loadUser();
			})
			.then(function() {
				if(closeSearch) {
					$scope.selectedBallpark = null;
				}
			});
		}
	};

	// share stadiums
	$scope.shareBallparks = function() {
		var modalInstance = $uibModal.open({
			animation: true,
			ariaLabelledBy: 'modal-title',
			ariaDescribedBy: 'modal-body',
			templateUrl: 'myModalContent.html',
			size: 'md',
			controller: 'ModalInstanceCtrl',
			controllerAs: '$ctrl',
			resolve: {
			}
		});

		modalInstance.result.then(function (data) {
			UserService.shareLink(AuthService.getUserId(), data.messageText, data.messageLink);
		});
	};
	
	// Render HTML from string instead of displaying as text
	$scope.trust = $sce.trustAsHtml;
	
	// Delete User - Moved to FooterController
	/* $scope.deleteUser = function() {
		var remove = confirm('Are You Sure?');
		if(remove) {
			UserService.deleteUser(AuthService.getUserId())
			.then(function() {
				// reload the user after the ballpark is removed
				return loadUser();
			});
		}
	}; */

});


app.controller('ModalInstanceCtrl', function ($scope, $uibModalInstance, AuthService) {
	var $ctrl = this;

	$scope.messageLink = "https://stadiums-visited.herokuapp.com/user/" + AuthService.getUserId();
	$scope.messageText = "";

	$ctrl.ok = function(text, link) {
		$uibModalInstance.close({messageText: text, messageLink: link});
	};

	$ctrl.cancel = function () {
		$uibModalInstance.dismiss();
	};
});
