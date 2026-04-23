export class CLIError extends Error {
  constructor({ code, message, input = undefined, retryable = false, suggestion = undefined }) {
    super(message);
    this.name = "CLIError";
    this.code = code;
    this.input = input;
    this.retryable = retryable;
    this.suggestion = suggestion;
  }

  toJSON() {
    return {
      error: {
        code: this.code,
        message: this.message,
        input: this.input,
        retryable: this.retryable,
        suggestion: this.suggestion,
      },
    };
  }
}

export function getExitCode(error) {
  if (error instanceof CLIError) {
    return error.retryable ? 2 : 1;
  }

  return 1;
}
