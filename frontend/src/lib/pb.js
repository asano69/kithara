import PocketBase from "pocketbase";

// Single shared PocketBase client, used to call Cithara' custom API routes
// (e.g. POST /api/rescan) from the frontend.
const pb = new PocketBase("/");

export default pb;
