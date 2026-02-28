import { adaptHandler } from '../../lib/netlify-compat';
import { handler } from '../../netlify/functions/agents/agents-session';
export default adaptHandler(handler);
