import { Client, Account, Databases, Storage, ID, Query, Permission, Role } from "appwrite";

const client = new Client();
client
  .setEndpoint(process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT)
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID);

const account = new Account(client);
const databases = new Databases(client);
const storage = new Storage(client);

// Export all the initialized instances and classes
export { 
  client,
  account, 
  databases, 
  storage, 
  ID, 
  Query, 
  Permission, 
  Role 
};