import { ReactNode } from "react";
import { AuthLayout } from "./AuthLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { User, Mail, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface AuthFormProps {
  formData: Record<string, string>;
  setFormData: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  fields: {
    name: string;
    label: string;
    type: string;
    icon: string;
  }[];
  onSubmit: (e: React.FormEvent) => void;
}

interface FormFieldProps {
  type: "text" | "email" | "password";
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  icon: "user" | "email" | "lock";
}

const iconMap = {
  user: User,
  email: Mail,
  lock: Lock,
};

export function FormField({
  type,
  placeholder,
  value,
  onChange,
  icon,
}: FormFieldProps) {
  const IconComponent = iconMap[icon];

  return (
    <div className="relative">
      <div
        className="flex items-center rounded-3xl px-6 py-5 shadow-sm"
        style={{ backgroundColor: "#FDF6F6" }}
      >
        {IconComponent ? (
          <IconComponent
            className="mr-4 h-7 w-7 flex-shrink-0"
            style={{ color: "#5442A2" }}
          />
        ) : null}
        <Input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="border-0 bg-transparent p-0 text-base placeholder:text-gray-500 focus-visible:ring-0 focus-visible:ring-offset-0"
          style={{
            fontFamily: "Inter, -apple-system, Roboto, Helvetica, sans-serif",
          }}
        />
      </div>
    </div>
  );
}

export function AuthForm({
  formData,
  setFormData,
  fields,
}: AuthFormProps) {
  return (
    <div className="space-y-4">
      {fields.map((field) => (
        <FormField
          key={field.name}
          type={field.type as "text" | "email" | "password"}
          placeholder={field.label}
          value={formData[field.name]}
          onChange={(value) => setFormData(prev => ({ ...prev, [field.name]: value }))}
          icon={field.icon as "user" | "email" | "lock"}
        />
      ))}
    </div>
  );
}
