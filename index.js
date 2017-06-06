const { makeExecutableSchema } = require('graphql-tools');
const { PubSub } = require('graphql-subscriptions');

const pubsub = new PubSub();

const schema = makeExecutableSchema({
  typeDefs: `
    type Query {
      now: String
    }
    type Subscription {
      now: String
    }

    schema {
      query: Query
      subscription: Subscription
    }
  `,
  resolvers: {
    Query: {
      now: () => (new Date()).toString(),
    },
    Subscription: {
      now: {
        subscribe: () => pubsub.asyncIterator('now'),
      }
    }
  }
});

const timer = setInterval(() => {
  const now = (new Date()).toString();
  console.log(now);
  pubsub.publish('now', {now});
}, 1000);

const express = require('express');
const bodyParser = require('body-parser');
const { graphqlExpress, graphiqlExpress } = require('graphql-server-express');
const { createServer } = require('http');
const { execute, subscribe } = require('graphql');
const { SubscriptionServer } = require('subscriptions-transport-ws');

const PORT = 5000;
const app = express();
app.use('/graphql', bodyParser.json(), graphqlExpress({ schema }));
app.use('/graphiql', bodyParser.json(), graphiqlExpress({
  endpointURL: '/graphql',
  subscriptionsEndpoint: `ws://localhost:${PORT}/subscriptions`,
}));

const server = createServer(app);
server.listen(PORT, () => {
    new SubscriptionServer({
      execute,
      subscribe,
      schema,
    }, {
      server: server,
      path: '/subscriptions',
    });
});