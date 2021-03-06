var passport = require('passport');
var userController = require('./controller/userController');
var ballparkController = require('./controller/ballparkController');
var authController = require('./controller/authController');

module.exports = function(app) {

	// server routes ===========================================================
	// handle things like api calls
	// authentication routes

	app.get('/api/v1/users/:userId', function(req, res) {
		userController.getUserById(req.params.userId)
		.then(function(userResult) {
			res.send(userResult);
			res.end();
		},
		function(err) {
			console.error(err);
			res.send(err);
			res.end();
		});
	});

	app.post('/api/v1/users/:userId/ballparks', passport.authenticate('jwt', { session: false}), function(req, res) {
		if(req.params.userId !== req.user.fb_id) {
			// unauthenticated user
			res.status(401);
			res.end();
		}
		else {
			userController.addUserBallpark(req.params.userId, req.body)
			.then(function(userResult) {
				res.send(userResult);
				res.end();
			},
			function(err) {
				console.error(err);
				res.send(err);
				res.end();
			});
		}
	});

	app.delete('/api/v1/users/:userId/ballparks/:ballparkId', passport.authenticate('jwt', { session: false}), function(req, res) {
		if(req.params.userId !== req.user.fb_id) {
			// unauthenticated user
			res.status(401);
			res.end();
		}
		else {
			userController.removeUserBallpark(req.params.userId, req.params.ballparkId)
			.then(function(userResult) {
				res.send(userResult);
				res.end();
			},
			function(err) {
				console.error(err);
				res.send(err);
				res.end();
			});
		}
	});
	
	app.delete('/api/v1/users/:userId', passport.authenticate('jwt', { session: false}), function(req, res) {
		userController.deleteUser(req.params.userId, req.user.access_token)
		.then(function(response) {
			res.send(response);
			res.end();
		},
		function(err) {
			console.error(err);
			res.send(err);
			res.end();
		});
	});

	app.post('/api/v1/users/:userId/share-link', passport.authenticate('jwt', { session: false}), function(req, res) {
		if(req.params.userId !== req.user.fb_id) {
			// unauthenticated user
			res.status(401);
			res.end();
		}
		else {
			userController.shareFacebookLink(req.params.userId, req.user.access_token, req.body)
			.then(function(response) {
				res.send(response);
				res.end();
			},
			function(err) {
				console.error(err);
				res.send(err);
				res.end();
			});
		}
	});

	app.get('/api/v1/users', function(req, res) {
		userController.getUsers(req.query.userId)
		.then(function(userResult) {
			res.send(userResult);
			res.end();
		},
		function(err) {
			console.error(err);
			res.send(err);
			res.end();
		});
	});

	app.post('/api/v1/users', function(req, res) {
		userController.addNewUser(req.body)
		.then(function(result) {
			console.log("success");
			res.send(result.generateJwt());
			res.end();
		},
		function(err) {
			console.log(err);
			res.json(err);
			res.end();
		});
	});

	app.get('/api/v1/users/testpost', function(req, res) {
		userController.testFBpost(req.body)
		.then(function(result) {
			console.log("success");
			res.send(result);
			res.end();
		},
		function(err) {
			console.log(err);
			res.json(err);
			res.end();
		});
	});

	app.get('/api/v1/ballparks', function(req, res) {
		ballparkController.getBallparks()
		.then(function(result) {
			res.send(result);
			res.end();
		},
		function(err) {
			console.error(err);
			res.send(err);
			res.end();
		});
	});
	
	// route to handle Facebook page request
	app.post('/*', function(req, res) {
		res.redirect('/');
	});

	// frontend routes =========================================================
	// route to handle all angular requests
	app.get('*', function(req, res) {
		res.sendfile('./public/index.html');
	});

};