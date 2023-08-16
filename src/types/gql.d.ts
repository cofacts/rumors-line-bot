/** Return structure of a GraphQL server response */
interface GqlResponse<QueryResp extends object> {
  data: QueryResp;
  errors?: object[];
}
