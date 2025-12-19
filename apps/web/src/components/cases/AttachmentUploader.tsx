"use client";
import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { useUploadAttachment } from "@/lib/hooks";

export default function AttachmentUploader({ caseId }:{ caseId:number }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const up = useUploadAttachment(caseId);

  const onPick = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try { await up.mutateAsync(file); }
    finally { setBusy(false); if (inputRef.current) inputRef.current.value = ""; }
  };

  return (
    <div className="flex items-center gap-2">
      <input ref={inputRef} type="file" className="hidden" onChange={onPick} />
      <Button variant="outline" onClick={()=>inputRef.current?.click()} disabled={busy}>
        {busy ? "Enviando..." : "Anexar Documento"}
      </Button>
    </div>
  );
}