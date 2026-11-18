import { createGateway } from './gateway.js';
// The deployment builder injects the compiled public assets into this gateway.
// Importing this source entry without a build keeps private routes protected.
export default createGateway({});
