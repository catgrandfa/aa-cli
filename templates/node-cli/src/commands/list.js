export const listUsersCommand = {
  command: "aa list users",
  summary: "List users in a structured format",
  options: [],
  async run(context) {
    const users = [
      { name: "Alice", email: "alice@co.com", role: "admin" },
      { name: "Bob", email: "bob@co.com", role: "member" },
    ];
    const input = context.resolveInput({});

    if (input?.role) {
      return users.filter((user) => user.role === input.role);
    }

    return users;
  },
};
