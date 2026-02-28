import { adaptHandler } from '../../lib/netlify-compat';
import { handler } from '../../netlify/functions/payments/stripe-webhook';
export default adaptHandler(handler);
