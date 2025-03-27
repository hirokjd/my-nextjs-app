import { Client, Account, Databases, Storage, ID } from "appwrite";

const client = new Client();
client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT) // Ensure this is set in .env
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client); // ✅ Add Storage instance

export { account, databases, storage, ID }; // ✅ Export Storage & ID
