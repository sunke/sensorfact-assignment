import { SchemaComposer } from 'graphql-compose';

const schemaComposer = new SchemaComposer();

// Define the TransactionEnergy type
schemaComposer.createObjectTC({
  name: 'TransactionEnergy',
  fields: {
    transactionHash: 'String!',
    energyKwh: 'Float!',
    sizeBytes: 'Int!',
  },
});

// Define the DailyEnergy type
schemaComposer.createObjectTC({
  name: 'DailyEnergy',
  fields: {
    date: 'String!',
    totalEnergyKwh: 'Float!',
    transactionCount: 'Int!',
  },
});

// Define the WalletEnergy type
schemaComposer.createObjectTC({
  name: 'WalletEnergy',
  fields: {
    address: 'String!',
    totalEnergyKwh: 'Float!',
    transactionCount: 'Int!',
  },
});

export { schemaComposer };