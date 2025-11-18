/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { X } from 'lucide-react';

export default function TemplateDrawer({
  open,
  onClose,
  templates,
  onSelect,
}: {
  open: boolean;
  onClose: () => void;
  templates: any[];
  onSelect: (template: any) => void;
}) {
  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog onClose={onClose} className="fixed inset-0 z-50">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md" />

        <div className="fixed right-0 top-0 h-full w-[420px] glass border-l border-border shadow-premium flex flex-col overflow-hidden">
          <div className="sticky top-0 border-b border-border bg-background/80 backdrop-blur-sm px-6 py-4 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-foreground">Your Templates</h2>
            <button 
              onClick={onClose}
              className="p-2 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground transition-colors duration-150"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-6 py-6">
            {templates.length === 0 && (
              <p className="text-muted-foreground text-sm">No templates yet.</p>
            )}

            <div className="space-y-3">
              {templates.map((tpl) => (
                <button
                  key={tpl.id}
                  onClick={() => onSelect(tpl)}
                  className="w-full p-4 bg-secondary/40 border border-border rounded-lg hover:bg-secondary/60 hover:border-primary/30 transition-all duration-150 text-left group"
                >
                  <h3 className="text-sm font-semibold text-primary group-hover:text-primary/80 transition-colors">
                    {tpl.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                    {tpl.body}
                  </p>
                </button>
              ))}
            </div>
          </div>

          <div className="sticky bottom-0 border-t border-border bg-background/80 backdrop-blur-sm px-6 py-4">
            <button 
              onClick={onClose}
              className="w-full px-4 py-2 rounded-lg text-sm font-medium text-foreground bg-secondary/60 hover:bg-secondary border border-border transition-colors duration-150"
            >
              Close
            </button>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
