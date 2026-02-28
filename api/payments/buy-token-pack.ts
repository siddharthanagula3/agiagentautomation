import { adaptHandler } from '../../lib/netlify-compat';
import { handler } from '../../netlify/functions/payments/buy-token-pack';
export default adaptHandler(handler);
