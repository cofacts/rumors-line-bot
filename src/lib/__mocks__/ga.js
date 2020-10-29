const eventMock = jest.fn();
const sendMock = jest.fn();
const ga = jest.fn();

ga.mockImplementation(() => ({
  event: eventMock,
  send: sendMock,
  screenview: () => {},
}));

ga.clearAllMocks = () => {
  eventMock.mockClear();
  sendMock.mockClear();
  ga.mockClear();
};

ga.eventMock = eventMock;
ga.sendMock = sendMock;

export default ga;
