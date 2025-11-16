/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Button } from "@/components/ui/button";

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
        <div className="fixed inset-0 bg-black/70 backdrop-blur-lg" />

        <div className="fixed right-0 top-0 h-full w-[420px] bg-[#0F0F11] border-l border-white/10 p-6 overflow-y-auto">
          <h2 className="text-xl font-semibold mb-6">Your Templates</h2>

          {templates.length === 0 && (
            <p className="text-gray-400">No templates yet.</p>
          )}

          {templates.map((tpl) => (
            <div
              key={tpl.id}
              onClick={() => onSelect(tpl)}
              className="p-4 mb-4 bg-white/5 border border-white/10 rounded-xl cursor-pointer hover:bg-white/10 transition"
            >
              <h3 className="text-purple-300 font-semibold">{tpl.title}</h3>
              <p className="text-gray-300 text-sm mt-1 line-clamp-2">
                {tpl.body}
              </p>
            </div>
          ))}

          <Button className="w-full mt-4" onClick={onClose}>
            Close
          </Button>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
