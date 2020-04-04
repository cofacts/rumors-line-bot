import { AuthenticationError } from 'apollo-server-koa';
import { SchemaDirectiveVisitor } from 'graphql-tools';

/**
 * When field with @auth is accessed, make sure the user is logged in (i.e. `userContext` in context).
 */
class AuthDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field) {
    const { resolve } = field;

    field.resolve = (...args) => {
      const [, , context] = args;

      if (!context.userId || !context.userContext) {
        throw new AuthenticationError('Invalid authentication header');
      }

      return resolve(...args);
    };
  }
}

export default AuthDirective;
