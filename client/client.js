var friends; // declares variable to cache list of current user's twitter follows/friends
var userID;  // declares variable  to hold current user's Twitter id
var mongoID; // declares variable to hold databse id of current user's high score
var answer;  // declares variable to hold correct answer, to be determined each getPost call
var level;  // how many multiple choice options the player has
var screenName;
var profilePic;
var correctName = "none";
var oldCorrect = "none";
var nameArr = [];
var first = true
var oldPost;
var randPost;
var status;
Session.set("highScore",0) // new 0 highScore for thie window session
Session.set("totalRight", 0); //sets total correct responses to 0 for session start
Session.set("totalWrong", 0); //sets total incorrect responses to 0 for session start


Deps.autorun(function () {   // Enclosed code only runs after HTML has loaded, and every time HTML is changed
    if(Meteor.user()) {
    	userID = Meteor.user().services.twitter.id;  // assigns current User's Twitter id
    	screenName = (Meteor.user().services.twitter.screenName);
    	profilePic = Meteor.user().services.twitter.profile_image_url_https
    	//$('#screenName').html('<br/>' + screenName + ' <img src=https://abs.twimg.com/sticky/default_profile_images/default_profile_5_normal.png </img>');
    	try {
	    	mongoID = Scores.find({id: userID}).fetch()[0]._id; // assigns ID for database file of current user's all time high score
    	} catch(err) {
	    	Scores.insert({id: userID, score: 0}); // if current user is new, assigns all time high of 0
    	}
    	var displayScore = Scores.findOne({id: userID}).score; // declares variable for user's all time high, from database
    	$("#highScore").html('<h4>Your All Time High Score: ' + displayScore + '%</h4><button id="reset" class="btn btn-default">Reset All Time High Score</button>'); // places all time high message and reset button on DOM
		if ( Session.get("highScore") === 0){ // starts first session
			level = 4;
			getFriendList();
		}
	}
});

function getFriendList(){ // retrieves user friend list from Twitter and caches it locally
	Meteor.call('getFriends', userID, function(err, result){
	    if(!err){
	        if (result.statusCode === 200) {
	        	friends = result;
	        	newSession();
	        }
	    }
	});
}

function newSession(){ // begins new quiz session without page load
	$('#postScore').hide()
	$("#thePost").show();
	$("#playAgain").html('');
	Session.set("totalRight", 0); //sets total correct responses to 0 for session start
	Session.set("totalWrong", 0); //sets total incorrect responses to 0 for session start
	$("#thePost").html("<br/><img src='http://www.evantravels.com/preloader.gif'</img><br/><br/>"); // clears post area
	$("#multiple-choice").html(""); // clears buttons
	first = true;
	getPost();
}

function getPost() { // begins new question in session
	nameArr = []; // declares empty array for multiple choices
	correctPerson = randomName(friends); // info for correct answer 
	correctID = correctPerson.id; // twitter id for correct answer
	if (correctName !== "none") { oldCorrect = correctName; } // if not new session, set correct answer
	correctName = correctPerson.name; // twitter full name for correct answer
	if (oldCorrect ==="none") { oldCorrect = correctName; } // iff new session, set correct answer
	correctScreenName = '@'+ correctPerson.screen_name; // twitter handle for correct answer
	correctImage = correctPerson.profile_image_url_https;
	answer = '<img src=' + correctImage + '></img><br/>' + correctName + '<br/>' + correctScreenName; // globally available twitter handle for correct answer
	nameArr.push(answer); // adds correct answer to multiple choice options

	for (var i=0;i<level-1;i++){ // chooses "level-1" more random names for multiple choices
		var randName;
		chooseName(randName, friends, nameArr);
	}

	nameArr = shuffle(nameArr) // shuffles multiple choices so correct answer will change position

    var id = correctID; // declares twitter user id for use in choosing random tweet (question)

    Meteor.call('getRandomStatus', id, function(err, result){ // function to retrieve random tweet from correct twitter user
        if(!err){
            if (result.statusCode === 200) { // checks if twitter api is successfully reached
            	oldPost = randPost;
            	randPost = result.data[Math.floor(Math.random()*result.data.length)] // assigns post to variable randPost
            	if (first) {
            		postQuestion();
            		first = false;
            	}
            }    
        }
    }); 
}

function postQuestion() {
	$("#thePost").html(randPost.text); // displays post (question)
	$("#multiple-choice").html('');
	for (var j=0;j<level;j++){
		$("#multiple-choice").append('<button class="choice btn btn-primary">' + nameArr[j] + '</button>');
	}
	getPost();
}

function gameEnd(){  
	$("#multiple-choice").html("");
	if(Session.get("totalRight") >= 5){  //  when total correct reaches 5, current session ends 
		$("#thePost").hide();
		var score = Math.round(Session.get("totalRight")/(Session.get("totalRight")+Session.get("totalWrong"))*100); // session high score
		if (score > Session.get("highScore")) { // checks if score of this game beats session high score
			Session.set("highScore", score); // sets session high score if necessary
			if (Scores.findOne({_id: mongoID}).score < Session.get("highScore")) { // checks if score beats all time high
				Scores.update({'_id':mongoID}, {$set:{"score": Session.get("highScore")}}); // sets all time high if necessary
			}
		}
		status = "I got " + score +"% on FriendGuessr! It's Kickass. Try it at http://friendguessr.meteor.com"; // twitter status update text
		$("#postScore").html('<button id="postScore" class = "btn btn-success postScore">'+score+'%!  Click to Post on Twitter</button>').show(); //shows post score button
		$("#playAnother").html('<button id="playAgain" class = "btn btn-primary">Play Again?</button>'); // shows "play again" button
	}
	else postQuestion(); // if game is not over, begins next question
}



function shuffle(array) {              //standard algorithm for shuffling array value positions
  var currentIndex = array.length
    , temporaryValue
    , randomIndex
    ;
  while (0 !== currentIndex) {

    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex -= 1;

    temporaryValue = array[currentIndex];
    array[currentIndex] = array[randomIndex];
    array[randomIndex] = temporaryValue;
  }

  return array;
}

function randomPost(result){    //chooses a random post from chosen friend of user
	return result.data[Math.floor(Math.random()*result.data.length)];
}

function randomName(friends){  // chooses a random twitter handle from user's friends
	return friends.data.users[Math.floor(Math.random()*friends.data.users.length)];
}

function chooseName(randName, friends, nameArr){ // chooses a random twitter handle from shuffled array of user's friends, no duplicates allowed
	do{
    	randName = randomName(friends);
    	randInfo = '<img src=' + randName.profile_image_url_https + '></img><br/>' + randName.name + '<br/>@'+ randName.screen_name;
    } while (nameArr.indexOf(randInfo) !== -1);
	nameArr.push(randInfo);
}


Template.total.totalRight = function() { // displays "Right:" value
	return "Right: " + Session.get("totalRight");
}

Template.total.totalWrong = function() { // displays "Wrong:" value
	return "Wrong: " + Session.get("totalWrong");
}

Template.score.highScore = function() { // displays session high score
	return "Your High Score: " + Session.get("highScore") + "%";
}


Template.friendPost.events({
	
	'click button.choice': function(event) {
		$(".choice").click(function(e) { //disables button click until next round
		    e.preventDefault();
		    return false;
		});
		if ($(event.currentTarget).text().search(oldCorrect) !== -1){
			Session.set("totalRight", Session.get("totalRight")+1);
			$(event.currentTarget).addClass('btn-success');
		}
		else {
			Session.set("totalWrong", Session.get("totalWrong")+1);
			$(event.currentTarget).addClass('btn-danger');
			var choiceList = $(event.currentTarget).parent().children();
			for (var k=0;k<choiceList.length;k++) {
				if (choiceList[k].innerText.search(oldCorrect) !== -1) {
					$(choiceList[k]).addClass('btn-success');
				}
				else $(choiceList[k]).addClass('btn-danger');
			}
		}
		setTimeout(gameEnd, 900);
	},

	'click #playAgain': function() {
		$('#playAgain').hide()
		newSession();
	},

	'click .postScore': function() {
		Meteor.call('postScore',status, function(err, result){ // function to retrieve random tweet from correct twitter user
	        if(!err){
	            if (result.statusCode === 200) {
					$('#postScore').html('<button id="postScore" class = "btn btn-success postScore">Successfully Posted!</button>');
					$('.postScore').attr("disabled","disabled");
				}
			}
		});
	}
});

Template.scoreDB.events({ //tells reset button to rest database value for current user's all time high score
	'click #reset': function() {
		Scores.update({'_id':mongoID}, {$set:{"score": 0}});
	}
});


Template.difficulty.events({
	'click #hard': function() {
		$('#hard').addClass('active');
		$('#medium').removeClass('active');
		$('#easy').removeClass('active');
		level = 6;
		newSession();
	},
	'click #medium': function() {
		$('#medium').addClass('active');
		$('#easy').removeClass('active');
		$('#hard').removeClass('active');
		level = 4;
		debugger;
		newSession();
	},
	'click #easy': function() {
		$('#easy').addClass('active');
		$('#medium').removeClass('active');
		$('#hard').removeClass('active');
		level = 3;
		debugger;
		newSession();
	}
});

Template.logIn.events({
    'click #login-buttons-logout': function() {
        $('#thePost').html('<h3>5 Right to Win! </h3><h5> Sign in with Twitter to Play</h5>');
        $('#multiple-choice').html('');
        $('#highScore').html('');
    },
});


	





