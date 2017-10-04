'use strict';

// designed to run on AWS Lambda - Node 6.10
const path = require('path');
const result = require('dotenv').config({ path: path.join(__dirname, '.env')});

if(result.error) throw result.error;

var Promise = require('bluebird');
const Alexa = require('alexa-sdk');
const _ = require('lodash');
const utilities = require('./utilities');
const APP_ID = process.env.ALEXA_APP_ID;
const q = { screen_name: process.env.TWTR_HANDLE, count: 200 };

 // define messages to be used as responses to the user
const languageStrings = {
    'en-US': {
        'translation': {
            'tweets': [],
            'TWEET_MESSAGE': "Here's some shit my dad said: ",
            'HELP_MESSAGE': 'You can say tell me shit my dad says or you can say exit... ',
            'STOP_MESSAGE': 'Until next time!',
            'ERROR_MESSAGE': "<say-as interpret-as='interjection'>Uh oh!</say-as> Something went wrong.",
        }
    }
};

// define the dialog handlers
const handlers = {
    'LaunchRequest': function(){
        this.emit('ReadQuote');
    },
    'WelcomeIntent': function(){
        this.emit('ReadQuote');
    },
    'AMAZON.YesIntent': function(){
        this.emit('ReadQuote');
    },
    'AMAZON.MoreIntent': function(){
        this.emit('ReadQuote');
    },
    'ReadQuote': function(){
        const tweets = this.t('tweets');
        const tweetIndex = Math.round(Math.random() * tweets.length);
        const quote = tweets[tweetIndex];
        const outputSpeech = this.t('TWEET_MESSAGE') + quote + '. Would you like to hear another?';
        const repromptSpeech = 'Say yes for another quote, say no to exit';

        this.emit(':ask', outputSpeech, repromptSpeech);
    },
    'AMAZON.HelpIntent': function(){
        const output = this.t('HELP_MESSAGE');
        const reprompt = this.t('HELP_MESSAGE');
        this.emit(':ask', output, reprompt);
    },
    'AMAZON.CancelIntent': function(){
        this.emit('Exit');
    },
    'AMAZON.StopIntent': function(){
        this.emit('Exit');
    },
    'SessionEndedRequest': function(){
        this.emit('Exit');
    },
    'AMAZON.NoIntent': function(){
        this.emit('Exit');
    },
    'Exit': function(){
        this.emit(':tell', this.t('STOP_MESSAGE'));
    },
    'Unhandled': function(){
        this.emit(':tell', this.t('ERROR_MESSAGE'));
    }
}

function loadTweets(){
    return utilities.createTwitterClient()
        .then((client) => {
            let getAsync = Promise.promisify(client.get);
            return getAsync.call(client, 'statuses/user_timeline', q)
                .then((tweets) => {
                    console.log('Number of tweets: ' + tweets.length);
                    //console.log('Tweet text: ' + tweets[Math.round(tweets.length * Math.random())].text);
        
                    _.forEach(tweets, (tweet) => {
                        languageStrings['en-US'].translation.tweets.push(tweet.text);
                    });
        
                    if(process.env.NODE_ENV !== 'prod'){
                        console.log('Tweets length: ' + languageStrings['en-US'].translation.tweets.length);
                        console.log('Random tweet: ' + languageStrings['en-US'].translation.tweets[33]);
                    }
                });
        });
}


let tweetsAreLoaded = false;
exports.handler = function(event, context, callback) {
    function executeAlexa(){
        let alexa = Alexa.handler(event, context);
        alexa.APP_ID = APP_ID;
        alexa.resources = languageStrings;
        alexa.registerHandlers(handlers);
        alexa.execute();
    }

    // load the tweets if they are not already
    if(tweetsAreLoaded){
        executeAlexa();
    } else {
        loadTweets()
        .then(() => {
            tweetsAreLoaded = true;
            executeAlexa();
        })
        .catch((err) => {
            console.log(`Error retrieving tweets: ${err.message}`);
        });
    }
};



