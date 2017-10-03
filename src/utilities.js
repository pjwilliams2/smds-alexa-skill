'use strict';

const request = require('request-promise');
const utf8 = require('utf8');
const base64 = require('base-64');
const twitter = require('twitter');
const keys = {
    consumer_key: process.env.TWTR_API_CONSUMER_KEY,
    consumer_secret: process.env.TWTR_API_CONSUMER_SECRET,
    bearer_token: ''
};

function createTwitterClient(){
    return getBearerToken()
        .then((token) => {
            console.log('Got token: ' + token);
            keys.bearer_token = token;

            return new twitter(keys);
        });
}

function getBearerToken(){
    // request a bearer token from the twtr API
    return request(getTokenRequestOptions())
        .then((res) => {
            console.log('Token res: ' + JSON.stringify(res));
            let token = JSON.parse(res);
            
            if(token.token_type !== 'bearer') throw new Error('Non-bearer token type returned');
        
            return Promise.resolve(token.access_token);
        });
}

function getTokenRequestOptions(){
    // this should be encoded to RFC 1738 per Twitter docs
    const concatStr = `${keys.consumer_key}:${keys.consumer_secret}`;
    const encodedStr = base64.encode(utf8.encode(concatStr));
    console.log(encodedStr);

    return {
        url: 'https://api.twitter.com/oauth2/token',
        method: 'POST',
        headers: {
            'Authorization': 'Basic ' + encodedStr,
            'User-Agent': 'SMDS for Alexa v1.0',
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cache-Control': 'no-cache'
        },
        form: {
            grant_type: 'client_credentials'
        }
    };
}

module.exports = {
    createTwitterClient: createTwitterClient
}