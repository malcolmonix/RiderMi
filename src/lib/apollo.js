import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { getAuth } from 'firebase/auth';

const isProduction = process.env.NODE_ENV === 'production';
const apiUri = process.env.NEXT_PUBLIC_GRAPHQL_URI ||
  (isProduction
    ? 'https://food-delivery-api-opal.vercel.app/graphql'
    : 'http://localhost:4000/graphql');

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
  connectToDevTools: !isProduction,
});

export default apolloClient;
