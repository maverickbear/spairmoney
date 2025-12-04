/**
 * Contact Mapper
 * Maps between domain entities and infrastructure DTOs
 */

import { BaseContact } from "../../domain/contact/contact.types";
import { ContactRow } from "@/src/infrastructure/database/repositories/contact.repository";

export class ContactMapper {
  /**
   * Map repository row to domain entity
   */
  static toDomain(row: ContactRow): BaseContact {
    return {
      id: row.id,
      userId: row.userId,
      name: row.name,
      email: row.email,
      subject: row.subject,
      message: row.message,
      status: row.status,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };
  }
}

