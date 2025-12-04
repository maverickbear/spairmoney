/**
 * Contact Factory
 * Dependency injection factory for ContactService
 */

import { ContactService } from "./contact.service";
import { ContactRepository } from "@/src/infrastructure/database/repositories/contact.repository";

/**
 * Create a ContactService instance with all dependencies
 */
export function makeContactService(): ContactService {
  const repository = new ContactRepository();
  return new ContactService(repository);
}

