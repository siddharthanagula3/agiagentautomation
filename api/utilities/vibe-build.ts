import { adaptHandler } from '../../lib/netlify-compat';
import { handler } from '../../netlify/functions/utilities/vibe-build';
export default adaptHandler(handler);
