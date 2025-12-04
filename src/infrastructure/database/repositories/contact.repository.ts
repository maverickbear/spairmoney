/**
 * Contact Repository
 * Data access layer for contact forms - only handles database operations
 */

import { createServerClient } from "../supabase-server";
import { logger } from "@/src/infrastructure/utils/logger";
import { formatTimestamp } from "@/src/infrastructure/utils/timestamp";
import { BaseContact } from "@/src/domain/contact/contact.types";

export interface ContactRow {
  id: string;
  userId: string | null;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: "pending" | "read" | "replied" | "resolved";
  createdAt: string;
  updatedAt: string;
}

export class ContactRepository {
  /**
   * Create a new contact form submission
   */
  async create(
    userId: string | null,
    data: {
      name: string;
      email: string;
      subject: string;
      message: string;
    }
  ): Promise<ContactRow> {
    const supabase = await createServerClient();
    const now = formatTimestamp(new Date());

    const { data: contact, error } = await supabase
      .from("ContactForm")
      .insert({
        userId: userId || null,
        name: data.name,
        email: data.email,
        subject: data.subject,
        message: data.message,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      })
      .select()
      .single();

    if (error) {
      logger.error("[ContactRepository] Error creating contact form:", error);
      throw new Error(`Failed to create contact form: ${error.message}`);
    }

    if (!contact) {
      throw new Error("Failed to create contact form: No data returned");
    }

    return contact as ContactRow;
  }
}

