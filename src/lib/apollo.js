import { ApolloClient, InMemoryCache, createHttpLink } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';
import { getAuth } from 'firebase/auth';

const productionApiUri = 'https://food-delivery-api-indol.vercel.app/graphql';
const developmentApiUri = 'http://localhost:4000/graphql';

const apiUri = process.env.NEXT_PUBLIC_GRAPHQL_URI || (process.env.NODE_ENV === 'production' ? productionApiUri : developmentApiUri);

const httpLink = createHttpLink({ uri: apiUri, credentials: 'include' });

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

export const apolloClient = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
  devtools: { enabled: process.env.NODE_ENV !== 'production' },
});

export default apolloClient;
