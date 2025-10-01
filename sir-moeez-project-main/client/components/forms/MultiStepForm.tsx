import React from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, ArrowRight, ArrowLeft } from "lucide-react";
import {
  getInstitute,
  saveInstitute,
  getProfile,
  saveProfile,
  type Institute,
  type UserProfile,
} from "@/lib/account";
import { auth } from "@/lib/firebase";

// Schemas
const personalInfoSchema = z.object({
  fullName: z.string().min(2, "Full name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(7, "Phone must be at least 7 characters"),
});

const instituteSchema = z.object({
  instituteName: z.string().min(2, "Institute name is required"),
  logo: z.string().optional(), // holds URL/dataURL after upload
});

const accountSchema = z
  .object({
    username: z.string().min(3, "Username must be at least 3 characters"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
      .regex(/[0-9]/, "Password must contain at least one number"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

const stepsDef = [
  {
    id: "personal",
    title: "Personal Information",
    description: "Tell us about yourself",
    schema: personalInfoSchema,
    fields: [
      {
        name: "fullName",
        label: "Full Name",
        type: "text",
        placeholder: "John Doe",
      },
      {
        name: "email",
        label: "Email",
        type: "email",
        placeholder: "john.doe@example.com",
      },
      {
        name: "phone",
        label: "Phone No.",
        type: "text",
        placeholder: "+1 555 555 5555",
      },
    ],
  },
  {
    id: "institute",
    title: "Institute Information",
    description: "Add your institute details",
    schema: instituteSchema,
    fields: [
      {
        name: "instituteName",
        label: "Institute Name",
        type: "text",
        placeholder: "City Public School",
      },
    ],
  },
  {
    id: "account",
    title: "Account Setup",
    description: "Create your account",
    schema: accountSchema,
    fields: [
      {
        name: "username",
        label: "Username",
        type: "text",
        placeholder: "johndoe",
      },
      {
        name: "password",
        label: "Password",
        type: "password",
        placeholder: "••••••••",
      },
      {
        name: "confirmPassword",
        label: "Confirm Password",
        type: "password",
        placeholder: "••••••••",
      },
    ],
  },
] as const;

type StepId = (typeof stepsDef)[number]["id"];

type MultiStepData = z.infer<typeof personalInfoSchema> &
  z.infer<typeof instituteSchema> &
  z.infer<typeof accountSchema>;

type Props = {
  className?: string;
  onSubmit?: (data: MultiStepData) => void;
};

export default function MultiStepForm({ className, onSubmit }: Props) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<Partial<MultiStepData>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Prefill from existing profile/institute
  useEffect(() => {
    const prof = getProfile();
    const inst = getInstitute();
    setData((d) => ({
      ...d,
      fullName: prof.name || "",
      email: prof.email || auth.currentUser?.email || "",
      phone: prof.phone || "",
      instituteName: inst?.name || "",
      logo: inst?.logo || undefined,
    }));
    if (inst?.logo) setLogoPreview(inst.logo);
  }, []);

  const currentSchema = stepsDef[step].schema as z.ZodTypeAny;
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<any>({
    resolver: zodResolver(currentSchema),
    defaultValues: data,
  });

  useEffect(() => {
    reset(data);
  }, [data, reset]);

  const progress = ((step + 1) / stepsDef.length) * 100;

  const uploadLogo = async (file: File) => {
    const instName =
      (watch("instituteName") as string) || data.instituteName || "";
    const email =
      (watch("email") as string) || data.email || auth.currentUser?.email || "";
    if (!instName || !email) return;
    const fd = new FormData();
    fd.append("logo", file);
    fd.append("instituteName", instName);
    fd.append("email", email);
    const res = await fetch("/api/upload-logo", { method: "POST", body: fd });
    if (!res.ok) throw new Error(await res.text());
    const json = await res.json();
    const url: string = json.url;
    setLogoPreview(url);
    setData((d) => ({ ...d, logo: url }));
    setValue("logo", url, { shouldValidate: true });
    // persist partial institute
    const institute: Institute = {
      name: instName,
      logo: url,
      registeredAt: Date.now(),
    };
    saveInstitute(institute);
  };

  const onNext = (partial: any) => {
    const updated = { ...data, ...partial };
    setData(updated);
    if (step < stepsDef.length - 1) {
      setStep(step + 1);
      reset(updated);
    } else {
      setIsSubmitting(true);
      setTimeout(() => {
        // save profile and institute
        const fullName = String(updated.fullName || "").trim();
        const profile: UserProfile = {
          name: fullName,
          email: String(updated.email || auth.currentUser?.email || ""),
          phone: String(updated.phone || ""),
          updatedAt: Date.now(),
          notify: false,
        };
        saveProfile(profile);
        const inst: Institute = {
          name: String(updated.instituteName || ""),
          logo: updated.logo ? String(updated.logo) : undefined,
          registeredAt: getInstitute()?.registeredAt || Date.now(),
        };
        saveInstitute(inst);
        onSubmit?.(updated as MultiStepData);
        setIsComplete(true);
        setIsSubmitting(false);
      }, 800);
    }
  };

  const onPrev = () => {
    if (step > 0) setStep(step - 1);
  };

  const variants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  } as const;

  return (
    <div
      className={cn(
        "bg-card/40 mx-auto w-full max-w-md rounded-lg p-6 shadow-lg",
        className,
      )}
    >
      {!isComplete ? (
        <>
          <div className="mb-8">
            <div className="mb-2 flex justify-between">
              <span className="text-sm font-medium">
                Step {step + 1} of {stepsDef.length}
              </span>
              <span className="text-sm font-medium">
                {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <div className="mb-8 flex justify-between">
            {stepsDef.map((s, i) => (
              <div key={s.id} className="flex flex-col items-center">
                <div
                  className={cn(
                    "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold",
                    i < step
                      ? "bg-primary text-primary-foreground"
                      : i === step
                        ? "bg-primary text-primary-foreground ring-primary/30 ring-2"
                        : "bg-secondary text-secondary-foreground",
                  )}
                >
                  {i < step ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
                </div>
                <span className="mt-1 hidden text-xs sm:block">{s.title}</span>
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial="hidden"
              animate="visible"
              exit="exit"
              variants={variants}
              transition={{ duration: 0.3 }}
            >
              <div className="mb-6">
                <h2 className="text-xl font-bold">{stepsDef[step].title}</h2>
                <p className="text-muted-foreground text-sm">
                  {stepsDef[step].description}
                </p>
              </div>

              <form onSubmit={handleSubmit(onNext)} className="space-y-4">
                {stepsDef[step].fields.map((field) => (
                  <div key={field.name} className="space-y-2">
                    <Label htmlFor={field.name}>{field.label}</Label>
                    <Input
                      id={field.name}
                      type={(field as any).type}
                      placeholder={(field as any).placeholder}
                      {...register(field.name as any)}
                      className={cn(
                        errors[field.name as string] && "border-destructive",
                      )}
                    />
                    {errors[field.name as string] && (
                      <p className="text-destructive text-sm">
                        {String(
                          (errors as any)[field.name]?.message ?? "Invalid",
                        )}
                      </p>
                    )}
                  </div>
                ))}

                {stepsDef[step].id === "institute" && (
                  <div className="space-y-2">
                    <Label htmlFor="logoFile">Logo Upload</Label>
                    <Input
                      id="logoFile"
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        try {
                          await uploadLogo(file);
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                    />
                    {logoPreview ? (
                      <div className="mt-2">
                        <img
                          src={logoPreview}
                          alt="Logo preview"
                          className="h-20 w-20 object-contain rounded border"
                        />
                      </div>
                    ) : null}
                  </div>
                )}

                <div className="flex justify-between pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onPrev}
                    disabled={step === 0}
                    className={cn(step === 0 && "invisible")}
                  >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {step === stepsDef.length - 1 ? (
                      isSubmitting ? (
                        "Submitting..."
                      ) : (
                        "Submit"
                      )
                    ) : (
                      <>
                        Next <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            </motion.div>
          </AnimatePresence>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="py-10 text-center"
        >
          <div className="bg-primary/10 mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full">
            <CheckCircle2 className="text-primary h-8 w-8" />
          </div>
          <h2 className="mb-2 text-2xl font-bold">Form Submitted!</h2>
          <p className="text-muted-foreground mb-6">
            Thank you for completing the form. We'll be in touch soon.
          </p>
          <Button
            onClick={() => {
              setStep(0);
              setData({});
              setLogoPreview(null);
              setIsComplete(false);
              reset({});
            }}
          >
            Start Over
          </Button>
        </motion.div>
      )}
    </div>
  );
}
