'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function DialogsPage() {
  const [open, setOpen] = useState(false);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 text-foreground">Dialogs</h1>
        <p className="text-muted-foreground text-lg">
          Modais e diálogos para interações do usuário
        </p>
      </div>

      {/* Basic Dialog */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Dialog Básico</h2>
        <Card>
          <CardHeader>
            <CardTitle>Exemplo</CardTitle>
            <CardDescription>Dialog com trigger button</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Dialog>
              <DialogTrigger asChild>
                <Button>Open Dialog</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Are you sure?</DialogTitle>
                  <DialogDescription>
                    This action cannot be undone. This will permanently delete your account.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline">Cancel</Button>
                  <Button variant="destructive">Delete</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <div className="bg-foreground text-background p-4 rounded-lg">
              <code className="text-sm whitespace-pre">
{`<Dialog>
  <DialogTrigger asChild>
    <Button>Open Dialog</Button>
  </DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>Title</DialogTitle>
      <DialogDescription>Description</DialogDescription>
    </DialogHeader>
    <DialogFooter>
      <Button>Action</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>`}
              </code>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Controlled Dialog */}
      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4 text-foreground">Dialog Controlado</h2>
        <Card>
          <CardHeader>
            <CardTitle>Exemplo</CardTitle>
            <CardDescription>Dialog com estado controlado</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button onClick={() => setOpen(true)}>Open Controlled Dialog</Button>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Controlled Dialog</DialogTitle>
                  <DialogDescription>
                    This dialog is controlled by React state.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Close
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}

