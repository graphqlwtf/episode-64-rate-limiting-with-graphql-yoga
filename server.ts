import { createServer, GraphQLYogaError } from "@graphql-yoga/node";
import { useRateLimiter } from "@envelop/rate-limiter";

const typeDefs = /* GraphQL */ `
  directive @rateLimit(
    max: Int
    window: String
    message: String
  ) on FIELD_DEFINITION

  type Query {
    episodes: [Episode!]!
      @rateLimit(window: "60s", max: 3, message: "Rate limit exceeded!")
  }
  type Episode {
    title: String!
  }
`;

const resolvers = {
  Query: {
    episodes: () => [
      { title: "GraphQL Live Queries" },
      { title: "GraphQL Middleware" },
      { title: "What is GraphQL?" },
    ],
  },
};

type User = {
  id: string;
  name: string;
};

const users: User[] = [
  {
    id: "1",
    name: "Jamie",
  },
  {
    id: "2",
    name: "Laurin",
  },
  {
    id: "3",
    name: "Uri",
  },
];

interface UserContext {
  user?: User;
}

const context = async ({ request }): Promise<UserContext> => {
  const userId = request.headers.get("authorization") ?? null;
  const user = users.find((user) => user.id === userId);

  return {
    user,
  };
};

const server = createServer<{}, UserContext>({
  schema: {
    typeDefs,
    resolvers,
  },
  plugins: [
    useRateLimiter({
      identifyFn: (context: any) => context?.user?.id ?? null,
      onRateLimitError(event) {
        throw new GraphQLYogaError(event.error);
      },
    }),
  ],
  context,
});

server.start();
