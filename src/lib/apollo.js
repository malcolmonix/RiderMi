import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { getAuth } from 'firebase/auth';

const apiUri = process.env.NEXT_PUBLIC_GRAPHQL_URI || 'http://localhost:4000/graphql';

const httpLink = createHttpLink({ uri: apiUri, credentials: 'same-origin' });

const authLink = setContext(async (_, { headers }) => {
  try {
    if (typeof window === 'undefined') return { headers: { ...headers } };
    const auth = getAuth();
    const user = auth.currentUser;
    if (!user) return { headers: { ...headers } };
    const token = await user.getIdToken();
    return { headers: { ...headers, authorization: token ? `Bearer ${token}` : '' } };
  } catch (e) {
    console.warn('Apollo authLink token retrieval failed', e.message || e);
    return { headers: { ...headers } };
  }
});

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

export default apolloClient;
