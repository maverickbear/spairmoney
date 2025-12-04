/**
 * Contact Service
 * Business logic for contact form management
 */

import { ContactRepository } from "@/src/infrastructure/database/repositories/contact.repository";
import { ContactMapper } from "./contact.mapper";
import { ContactFormData } from "../../domain/contact/contact.validations";
import { BaseContact } from "../../domain/contact/contact.types";
import { getCurrentUserId } from "@/src/application/shared/feature-guard";

export class ContactService {
  constructor(private repository: ContactRepository) {}

  /**
   * Create a new contact form submission
   */
  async createContact(data: ContactFormData): Promise<BaseContact> {
    // User is optional for contact forms (can be submitted by non-authenticated users)
    const userId = await getCurrentUserId().catch(() => null);

    const row = await this.repository.create(userId, {
      name: data.name,
      email: data.email,
      subject: data.subject,
      message: data.message,
    });

    return ContactMapper.toDomain(row);
  }
}

