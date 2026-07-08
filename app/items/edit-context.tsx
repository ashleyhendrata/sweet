"use client";

import { createContext, useContext, useState } from "react";

// Tracks which item's edit form is open on the Manage screen. Lifting this out
// of each row means only one edit can be open at a time — opening a second
// closes the first.
const EditContext = createContext<{
  editingId: string | null;
  setEditingId: (id: string | null) => void;
}>({ editingId: null, setEditingId: () => {} });

export function EditProvider({ children }: { children: React.ReactNode }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  return (
    <EditContext.Provider value={{ editingId, setEditingId }}>
      {children}
    </EditContext.Provider>
  );
}

export function useEdit() {
  return useContext(EditContext);
}
