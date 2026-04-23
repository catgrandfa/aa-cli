export const listUsersCommand = {
  command: "aa list users",
  summary: "List users in a structured format",
  options: [],
  async run() {
    return [
      { name: "Alice", email: "alice@co.com", role: "admin" },
      { name: "Bob", email: "bob@co.com", role: "member" },
    ];
  },
};
