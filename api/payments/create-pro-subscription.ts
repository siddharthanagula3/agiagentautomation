import { adaptHandler } from '../../lib/netlify-compat';
import { handler } from '../../netlify/functions/payments/create-pro-subscription';
export default adaptHandler(handler);
