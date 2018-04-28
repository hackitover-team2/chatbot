'use strict';

const request = require('request-promise-native');

const functions = require('firebase-functions');
const { WebhookClient } = require('dialogflow-fulfillment');
const { Card, Suggestion } = require('dialogflow-fulfillment');

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

// Intents

function challenges(agent) {

  var options = {
    method: 'GET',
    url: 'http://52.57.63.176/challenge',
    headers: { 'Cache-Control': 'no-cache', 'Content-Type': 'application/json' }
  };

  return request(options)
    .then(function (body) {

      var challenges = JSON.parse(body);

      challenges.forEach(function (challenge) {
        agent.add(
          new Card({
            title: challenge.name + ' (' + challenge.city + ')',
            imageUrl: challenge.image,
            text: challenge.description + ' \n\n' + 'Preisgeld: ' + challenge.price,
            buttonText: 'Teilnehmen',
            buttonUrl: 'https://assistant.google.com/'
          })
        );
      })

    })
    .catch(function (err) {
      console.log(err);
      agent.add(`Sorry, ich finde die Liste gerade nicht... probier es doch später noch mal, okay?`);
    });
}

// Export

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });

  // console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  // console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

  agent.handleRequest(challenges);
});
