import { print } from 'graphql';
import gql from '../lib/gql';

const executor = ({ document, variables, context }) => {
  return gql`
    ${print(document)}
  `(variables, { userId: context && context.userId });
};

export default executor;
