import { AuthenticationError } from 'apollo-server-koa';
import { SchemaDirectiveVisitor } from '@graphql-tools/utils';

/**
 * When field with @auth is accessed, make sure the user is logged in.
 * Optional arg "check" specifies fields to check in GraphQL context.
 * If "check" is not given, ['userId', 'userContext'] is checked by default.
 */
class AuthDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const { resolve } = field;
    const { check = ['userId', 'userContext'] } = this.args;

    field.resolve = (...args) => {
      const [, , context] = args;

      check.forEach(checkedField => {
        if (!context[checkedField]) {
          throw new AuthenticationError('Invalid authentication header');
        }
      });

      return resolve(...args);
    };
  }
}

export default AuthDirective;
