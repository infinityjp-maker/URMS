export interface StoredUser {
  id: string;
  externalId: string;
  email: string;
  roles: string[];
  passwordHash: string | null;
}

export interface UserRepository {
  findByLogin(login: string): Promise<StoredUser | null>;
}
