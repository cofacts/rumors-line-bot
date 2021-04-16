import { print } from 'graphql';
import gql from '../lib/gql';

const executor = ({ document, variables }) =>
  gql`
    ${print(document)}
  `(variables);

export default executor;
