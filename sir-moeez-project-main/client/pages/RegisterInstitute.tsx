import React from "react";
import Container from "@/components/layout/Container";
import SidebarPanelInner from "@/components/layout/SidebarPanelInner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { getInstitute, saveInstitute, type Institute } from "@/lib/account";

export default function RegisterInstitutePage() {
  const [inst, setInst] = React.useState<Institute | null>(() =>
    getInstitute(),
  );
  const [form, setForm] = React.useState<Institute>(
    () =>
      inst || {
        name: "",
        logo: "",
        registeredAt: Date.now(),
      },
  );

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload: Institute = {
      ...form,
      registeredAt: inst?.registeredAt || Date.now(),
    };
    saveInstitute(payload);
    setInst(payload);
    toast({
      title: inst ? "Institute updated" : "Institute registered",
      description: inst
        ? "Details updated successfully."
        : "Your institute has been registered.",
    });
  };

  return (
    <div className="min-h-svh">
      <Container className="py-6">
        <div className="grid grid-cols-1 md:grid-cols-[260px,1fr] gap-6">
          <aside className="hidden md:block">
            <div className="rounded-xl border border-input bg-white card-yellow-shadow p-4 sticky top-4">
              <SidebarPanelInner />
            </div>
          </aside>

          <div>
            <div className="rounded-xl bg-white p-6 border border-input card-yellow-shadow mt-4">
              <h2 className="text-2xl font-bold">Register Institute</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Provide institute details for licensing and billing.
              </p>

              <form onSubmit={onSubmit} className="mt-4 space-y-4 max-w-2xl">
                <div className="grid gap-2">
                  <Label htmlFor="name">Institute name</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="e.g., City Public School"
                  />
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="logo">Institute logo</Label>
                  <Input
                    id="logo"
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      const reader = new FileReader();
                      reader.onload = () => {
                        const dataUrl = String(reader.result || "");
                        setForm((f) => ({ ...f, logo: dataUrl }));
                      };
                      reader.readAsDataURL(file);
                    }}
                  />
                  {form.logo ? (
                    <div className="mt-2">
                      <img
                        src={form.logo}
                        alt="Logo preview"
                        className="h-20 w-20 object-contain rounded border"
                      />
                    </div>
                  ) : null}
                </div>

                <div className="pt-2">
                  <Button type="submit">
                    {inst ? "Update details" : "Register"}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Container>
    </div>
  );
}
