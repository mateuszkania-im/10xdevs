import React, { useState } from "react";
import { Modal, ModalBody, ModalContent } from "./ui/animated-modal";
import { Button } from "./ui/button";

export function TestDialog() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="p-4">
      <Button onClick={() => setIsOpen(true)}>Otwórz testowy dialog</Button>

      <Modal open={isOpen} onOpenChange={setIsOpen}>
        <ModalBody className="max-w-md">
          <ModalContent>
            <div className="mb-6">
              <h2 className="text-2xl font-semibold">Test Dialog</h2>
            </div>

            <div className="p-4">
              <p>To jest testowy dialog bez użycia portalu. Jeśli go widzisz, to Modal działa prawidłowo.</p>

              <div className="mt-4">
                <Button onClick={() => setIsOpen(false)}>Zamknij</Button>
              </div>
            </div>
          </ModalContent>
        </ModalBody>
      </Modal>
    </div>
  );
}
