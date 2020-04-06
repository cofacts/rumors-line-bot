import Client from '../mongoClient';

describe('MongoClient', () => {
  it('should connect', async () => {
    const client = await Client.getInstance();
    expect(client.mongoClient.isConnected()).toMatchSnapshot();
    expect(client.db.databaseName).toMatchSnapshot();
  });
});
