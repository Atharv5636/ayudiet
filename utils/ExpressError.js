class ExpressError extends Error {
  constructor(message, statusCode = 500) {
    if (Array.isArray(message)) {
      super(message.join(", "));    // fallback as single string
      this.messages = message;      // keep array of messages
    } else {
      super(message);
      this.messages = [message];    // always normalize into array
    }
    this.statusCode = statusCode;
  }
}

module.exports = ExpressError;
