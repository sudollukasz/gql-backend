import { gql, ApolloServer } from "apollo-server";
import { MongoClient } from "mongodb";

const mongoUri =
  "mongodb+srv://admin:admin@cluster0.nv2yt.mongodb.net/sample_training?retryWrites=true&w=majority";

const mongoClient = new MongoClient(mongoUri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  connectTimeoutMS: 45000,
  keepAlive: true,
});

async function connectDB() {
  try {
    await mongoClient.connect();
  } catch (e) {
    console.error(e);
  }
}

const typeDefs = gql`
  type Book {
    title: String
    author: String
  }

  type Query {
    books(author: String): [Book]
  }

  input AddBook {
    title: String!
    author: String!
  }

  type Mutation {
    addBook(input: AddBook!): Book
  }
`;

// const books = [
//   {
//     title: "Ksiazka 1",
//     author: "Anonim",
//   },
//   {
//     title: "Ksiazka 2",
//     author: "Anonim 1",
//   },
// ];

const resolvers = {
  Query: {
    books: (_: any, args: any) => {
      return mongoClient
        .db("gql")
        .collection("books")
        .find(args?.author ? { author: args.author } : undefined)
        .toArray();
      // return args.author
      //   ? books.filter(({ author }) => author === args.author)
      //   : books;
    },
  },
  Mutation: {
    addBook: async (_: any, args: any) => {
      const inserted = await mongoClient
        .db("gql")
        .collection("books")
        .insertOne(args.input);
      return mongoClient
        .db("gql")
        .collection("books")
        .findOne({ _id: inserted.insertedId });
    },
  },
};

const server = new ApolloServer({
  typeDefs,
  resolvers,
  context: ({ req }) => ({ ctx: req.headers }),
});

connectDB().then(() => {
  server.listen().then(({ url }) => {
    console.log(`server started at ${url}`);
  });
});
