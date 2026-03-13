"use client";

import { useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { CheckCircle2, XCircle, Link } from "lucide-react";

interface URLInputProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export default function URLInput({ value, onChange, disabled }: URLInputProps) {
  const [touched, setTouched] = useState(false);

  const isValid = useCallback((url: string) => {
    if (!url) return null;
    return /^https?:\/\/(www\.)?linkedin\.com\/in\/[\w-]+\/?/.test(url);
  }, []);

  const valid = isValid(value);

  return (
    <div className="space-y-1.5">
      <div className="relative">
        <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
        <Input
          type="url"
          placeholder="https://linkedin.com/in/johndoe"
          value={value}
          onChange={(e) => {
            onChange(e.target.value);
            if (!touched) setTouched(true);
          }}
          onBlur={() => setTouched(true)}
          disabled={disabled}
          className="pl-10 pr-10 h-12 text-base"
        />
        {touched && value && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {valid ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
          </div>
        )}
      </div>
      {touched && value && !valid && (
        <p className="text-sm text-red-500">
          Enter a valid LinkedIn profile URL (linkedin.com/in/...)
        </p>
      )}
    </div>
  );
}
