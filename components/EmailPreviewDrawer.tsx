"use client";

import { Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import { Button } from "@/components/ui/button";
import { Copy, Download, Mail } from "lucide-react";

export default function EmailPreviewDrawer({
  open,
  onClose,
  subject,
  body,
  followUp,
}: {
  open: boolean;
  onClose: () => void;
  subject?: string;
  body?: string;
  followUp?: string;
}) {
  const downloadTxt = (filename: string, content: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    link.click();
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      // optional toast if you use toast helper
      // toast.success("Copied to clipboard");
    } catch (e) {
      console.error("Clipboard failed", e);
    }
  };

  const mailto = () => {
    const bodySafe = encodeURIComponent(body || "");
    const subjectSafe = encodeURIComponent(subject || "");
    window.open(`mailto:?subject=${subjectSafe}&body=${bodySafe}`, "_blank");
  };

  return (
    <Transition.Root show={open} as={Fragment}>
      <Dialog as="div" className="fixed inset-0 overflow-hidden z-50" onClose={onClose}>
        <div className="absolute inset-0 overflow-hidden">
          {/* Backdrop */}
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-40"
            leave="ease-in duration-200"
            leaveFrom="opacity-40"
            leaveTo="opacity-0"
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          </Transition.Child>

          <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
            <Transition.Child
              as={Fragment}
              enter="transform transition ease-in-out duration-300"
              enterFrom="translate-x-full"
              enterTo="translate-x-0"
              leave="transform transition ease-in-out duration-300"
              leaveFrom="translate-x-0"
              leaveTo="translate-x-full"
            >
              <div className="w-screen max-w-xl">
                <div className="h-full flex flex-col bg-[#0F1115] border-l border-white/6 shadow-2xl">
                  {/* Header */}
                  <div className="px-6 py-4 flex items-center justify-between border-b border-white/6">
                    <div>
                      <h3 className="text-lg font-semibold">{subject || "No subject"}</h3>
                      <p className="text-sm text-gray-400">{/* small subtitle if needed */}</p>
                    </div>

                    <div className="flex items-center gap-3">
                      <Button
                        variant="ghost"
                        className="rounded-md"
                        onClick={() => copyToClipboard(subject || "")}
                      >
                        <Copy size={16} />
                      </Button>

                      <Button
                        variant="ghost"
                        className="rounded-md"
                        onClick={() => downloadTxt("subject.txt", subject || "")}
                      >
                        <Download size={16} />
                      </Button>

                      <Button variant="secondary" onClick={mailto}>
                        <Mail size={14} className="mr-2" /> Send
                      </Button>

                      <Button variant="ghost" onClick={onClose}>
                        Close
                      </Button>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-6 overflow-y-auto">
                    <section className="mb-6">
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Email body</h4>
                      <div className="whitespace-pre-wrap text-sm text-gray-100 leading-6 bg-white/3 p-4 rounded-xl">
                        {body || "No body generated yet."}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => copyToClipboard(body || "")}
                        >
                          <Copy size={14} className="mr-2" /> Copy Body
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => downloadTxt("email_body.txt", body || "")}
                        >
                          <Download size={14} className="mr-2" /> Download
                        </Button>
                      </div>
                    </section>

                    <section>
                      <h4 className="text-sm font-medium text-gray-300 mb-2">Follow up</h4>
                      <div className="whitespace-pre-wrap text-sm text-gray-100 leading-6 bg-white/3 p-4 rounded-xl">
                        {followUp || "No follow-up generated yet."}
                      </div>
                      <div className="mt-3 flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => copyToClipboard(followUp || "")}
                        >
                          <Copy size={14} className="mr-2" /> Copy Follow-up
                        </Button>

                        <Button
                          variant="outline"
                          onClick={() => downloadTxt("followup.txt", followUp || "")}
                        >
                          <Download size={14} className="mr-2" /> Download
                        </Button>
                      </div>
                    </section>
                  </div>

                  {/* Footer actions */}
                  <div className="px-6 py-4 border-t border-white/6 flex items-center justify-between">
                    <div className="text-sm text-gray-400">Actions</div>

                    <div className="flex gap-3">
                      <Button
                        onClick={() => {
                          copyToClipboard(`${subject}\n\n${body}`);
                        }}
                      >
                        Copy All
                      </Button>

                      <Button
                        onClick={() => {
                          downloadTxt("email_full.txt", `${subject}\n\n${body}\n\nFollow-up:\n${followUp}`);
                        }}
                      >
                        Download All
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition.Root>
  );
}
