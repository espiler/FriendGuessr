var twitter = new TwitterApi();



Meteor.methods({
    searchTwitter: function(term) {
        return twitter.search(term);
    },

    getFriends: function(userID) {
        return twitter.callAsApp('GET', 'friends/list.json', {
        	user_id: userID,
        	count: 100,
        	skip_status: true
        });

    },

    getRandomStatus: function(id) {
        return twitter.callAsApp('GET', 'statuses/user_timeline.json', {
        	user_id: id,
        	count: 80,
        	include_rts: false
        });

    },

    postScore: function(status) {
    	return twitter.postTweet(status);
    }

});

