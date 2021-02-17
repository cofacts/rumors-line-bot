const eventMock = jest.fn();
const sendMock = jest.fn();
const setMock = jest.fn();
const ga = jest.fn();

ga.mockImplementation(() => ({
  event: eventMock,
  send: sendMock,
  set: setMock,
  screenview: () => {},
}));

ga.clearAllMocks = () => {
  eventMock.mockClear();
  sendMock.mockClear();
  setMock.mockClear();
  ga.mockClear();
};

ga.eventMock = eventMock;
ga.sendMock = sendMock;
ga.setMock = setMock;

export default ga;
