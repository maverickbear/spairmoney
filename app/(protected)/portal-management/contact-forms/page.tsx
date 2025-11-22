"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ContactFormsTable, ContactForm } from "@/components/admin/contact-forms-table";

export default function ContactFormsPage() {
  const [contactForms, setContactForms] = useState<ContactForm[]>([]);
  const [loadingContactForms, setLoadingContactForms] = useState(false);

  useEffect(() => {
    loadContactForms();
  }, []);

  async function loadContactForms() {
    try {
      setLoadingContactForms(true);
      const response = await fetch("/api/admin/contact-forms");
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || "Failed to load contact forms";
        console.error("Error loading contact forms:", errorMessage);
        setContactForms([]);
        return;
      }
      const data = await response.json();
      setContactForms(Array.isArray(data.contactForms) ? data.contactForms : []);
    } catch (error) {
      console.error("Error loading contact forms:", error);
      setContactForms([]);
    } finally {
      setLoadingContactForms(false);
    }
  }

  return (
    <div className="w-full p-4 lg:p-8">
      <Card>
        <CardHeader>
          <CardTitle>Contact Forms</CardTitle>
          <CardDescription>
            View and manage contact form submissions from users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ContactFormsTable
            contactForms={contactForms}
            loading={loadingContactForms}
            onUpdate={loadContactForms}
          />
        </CardContent>
      </Card>
    </div>
  );
}

