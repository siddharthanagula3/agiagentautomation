import { adaptHandler } from '../../lib/netlify-compat';
import { handler } from '../../netlify/functions/agents/agents-execute';
export default adaptHandler(handler);
