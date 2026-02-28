import { adaptHandler } from '../../lib/netlify-compat';
import { handler } from '../../netlify/functions/payments/get-billing-portal';
export default adaptHandler(handler);
