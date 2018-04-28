'use strict';

const request = require('request-promise-native');

const functions = require('firebase-functions');
const { WebhookClient } = require('dialogflow-fulfillment');
const { Card, Suggestion } = require('dialogflow-fulfillment');

process.env.DEBUG = 'dialogflow:debug'; // enables lib debugging statements

// Intents

function fallback(agent) {

  agent.add(`Sorry, ich weiß gerade nicht was genau du suchst. Könntest du das noch mal anders formulieren?`);

}

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
      agent.add(`Sorry, ich finde die Liste der Challenges gerade nicht... probier es doch später noch mal, okay?`);
    });
}

function leaderboard(agent) {

  var options = {
    method: 'GET',
    url: 'http://52.57.63.176/leaderboard',
    headers: { 'Cache-Control': 'no-cache', 'Content-Type': 'application/json' }
  };

  return request(options)
    .then(function (body) {

      var leaders = JSON.parse(body);

      var text = leaders.slice(0, 2).map(function (leader, index) {
        return `${ ['🥇', '🥈', '🥉'][index]} — ${leader.firstName} ${leader.lastName.charAt(0)}.\nhat ${leader.wonChallenges.length} Badge(s) und nimmt an ${leader.participatingChallenges.length} Challenge(s) teil!`;
      }).join('\n\n');

      agent.add(text);

    })
    .catch(function (err) {
      console.log(err);
      agent.add(`Sorry, ich finde die Bestenliste gerade nicht... probier es doch später noch mal, okay?`);
    });
}

// Export

exports.dialogflowFirebaseFulfillment = functions.https.onRequest((request, response) => {
  const agent = new WebhookClient({ request, response });

  // console.log('Dialogflow Request headers: ' + JSON.stringify(request.headers));
  // console.log('Dialogflow Request body: ' + JSON.stringify(request.body));

  var handler = fallback;
  if (request.body.queryResult.intent.displayName === 'Challenges') handler = challenges;
  if (request.body.queryResult.intent.displayName === 'Leaderboard') handler = leaderboard;

  agent.handleRequest(handler);
});
