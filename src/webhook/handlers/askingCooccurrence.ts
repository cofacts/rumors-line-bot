import { z } from 'zod';
import { t } from 'ttag';

import ga from 'src/lib/ga';
import { ChatbotPostbackHandler } from 'src/types/chatbotState';

import { POSTBACK_YES, POSTBACK_NO, ManipulationError } from './utils';

const inputSchema = z.enum([POSTBACK_NO, POSTBACK_YES]);

/** Postback input type for ASKING_ARTICLE_SOURCE state handler */
export type Input = z.infer<typeof inputSchema>;

const askingCooccurence: ChatbotPostbackHandler = async ({
  context,
  postbackData: { state, input: postbackInput },
  userId,
}) => {
  let input: Input;
  try {
    input = inputSchema.parse(postbackInput);
  } catch (e) {
    console.error('[askingCooccurence]', e);
    throw new ManipulationError(t`Please choose from provided options.`);
  }

  return {
    context,
    replies: [],
  };
};

export default askingCooccurence;
