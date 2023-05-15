const eventMock = jest.fn();
const sendMock = jest.fn();
const setMock = jest.fn();

const ga = Object.assign(
  jest.fn().mockImplementation(() => ({
    event: eventMock,
    send: sendMock,
    set: setMock,
    screenview: () => undefined,
  })),
  {
    clearAllMocks: () => {
      eventMock.mockClear();
      sendMock.mockClear();
      setMock.mockClear();
      ga.mockClear();
    },
    eventMock,
    sendMock,
    setMock,
  }
);

export default ga;
