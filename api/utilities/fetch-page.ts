import { adaptHandler } from '../../lib/netlify-compat';
import { handler } from '../../netlify/functions/utilities/fetch-page';
export default adaptHandler(handler);
