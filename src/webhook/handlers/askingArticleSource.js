import { t, msgid, ngettext } from 'ttag';
import ga from 'src/lib/ga';

import {
  POSTBACK_IS_FORWARDED,
  POSTBACK_IS_NOT_FORWARDED,
  ManipulationError,
} from './utils';

export default async function askingArticleSource(params) {
  let { data, state, event, issuedAt, userId, replies, isSkipUser } = params;

  const visitor = ga(userId, state, data.searchedText);

  switch (event.input) {
    default:
      throw new ManipulationError(t`Please choose from provided options.`);

    case POSTBACK_IS_FORWARDED:
    case POSTBACK_IS_NOT_FORWARDED:
  }

  visitor.send();

  return { data, event, userId, replies, isSkipUser };
}
