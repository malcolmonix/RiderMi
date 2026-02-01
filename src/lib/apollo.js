import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { onError } from '@apollo/client/link/error';
import { getAuth } from 'firebase/auth';

const productionApiUri = 'https://food-delivery-api-indol.vercel.app/graphql';
const developmentApiUri = 'http://localhost:4000/graphql';

const apiUri = process.env.NEXT_PUBLIC_GRAPHQL_URI || (process.env.NODE_ENV === 'production' ? productionApiUri : developmentApiUri);

console.log('🌐 Apollo Client API URI:', apiUri);

// Don't use credentials: 'include' with CORS wildcard - API will send specific origin instead
const httpLink = createHttpLink({ uri: apiUri });

const authLink = setContext(async (_, { headers }) => {
  try {
    if (typeof window === 'undefined') return { headers: { ...headers } };
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) {
      console.warn('🔐 Apollo authLink: No current user');
      return { headers: { ...headers } };
    }
    const token = await user.getIdToken();
    if (token) {
      console.log('🔐 Apollo authLink: Token obtained, length:', token.length);
    }
    return { headers: { ...headers, authorization: token ? `Bearer ${token}` : '' } };
  } catch (e) {
    console.warn('Apollo authLink token retrieval failed', e.message || e);
    return { headers: { ...headers } };
  }
});

// Error handling link
const errorLink = onError(({ graphQLErrors, networkError, operation }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path, extensions }) => {
      console.error(
        `[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`,
        extensions
      );
    });
  }

  if (networkError) {
    console.error(`[Network error]: ${networkError.message}`, {
      operation: operation.operationName,
      variables: operation.variables,
      apiUri
    });
    
    // Check if it's a localhost connection issue
    if (apiUri.includes('localhost') && typeof window !== 'undefined') {
      console.error('❌ LOCALHOST CONNECTION ERROR: Cannot connect to localhost from mobile device!');
      console.error('💡 Solution: Update NEXT_PUBLIC_GRAPHQL_URI to use production API');
    }
  }
});

export const apolloClient = new ApolloClient({
  link: errorLink.concat(authLink.concat(httpLink)),
  cache: new InMemoryCache(),
  devtools: { enabled: process.env.NODE_ENV !== 'production' },
  defaultOptions: {
    watchQuery: {
      errorPolicy: 'all',
    },
    query: {
      errorPolicy: 'all',
    },
    mutate: {
      errorPolicy: 'all',
    },
  },
});

export default apolloClient;
