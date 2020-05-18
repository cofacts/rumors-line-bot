const eventMock = jest.fn();
const sendMock = jest.fn();

function ga() {
  return {
    event: eventMock,
    send: sendMock,
    screenview: () => {},
  };
}

ga.clearAllMocks = () => {
  eventMock.mockClear();
  sendMock.mockClear();
};

ga.eventMock = eventMock;
ga.sendMock = sendMock;

export default ga;
