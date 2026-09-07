"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { registerUser } from "@/lib/api";
import { registerSchema } from "@/lib/validation";
import { detectTimezone } from "@/lib/date";
import { AuthBrandPanel, MobileAuthBrand } from "@/components/AuthBrand";
import styles from "../auth.module.css";

export default function RegisterPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const result = registerSchema.safeParse({
      username,
      email,
      password,
      confirmPassword,
      timezone: detectTimezone(),
    });

    if (!result.success) {
      const errors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        errors[issue.path[0] as string] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }
    setFieldErrors({});

    setSubmitting(true);
    try {
      await registerUser(result.data);
      router.push("/login?registered=1");
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={styles.screen}>
      <AuthBrandPanel />
      <div className={styles.formPanel}>
        <div className={styles.card}>
          <MobileAuthBrand />
          <Card title="Create your account" subTitle="Start planning your days better.">
            <form onSubmit={handleSubmit} className={styles.form}>
              {formError && <Message severity="error" text={formError} />}

              <div className={styles.field}>
                <label htmlFor="username">Username</label>
                <InputText
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={fieldErrors.username ? "p-invalid" : ""}
                />
                {fieldErrors.username && (
                  <small className={styles.errorText}>{fieldErrors.username}</small>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="email">Email</label>
                <InputText
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={fieldErrors.email ? "p-invalid" : ""}
                />
                {fieldErrors.email && (
                  <small className={styles.errorText}>{fieldErrors.email}</small>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="password">Password</label>
                <Password
                  inputId="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  toggleMask
                  feedback={false}
                  className={fieldErrors.password ? "p-invalid" : ""}
                />
                {fieldErrors.password && (
                  <small className={styles.errorText}>{fieldErrors.password}</small>
                )}
              </div>

              <div className={styles.field}>
                <label htmlFor="confirmPassword">Confirm password</label>
                <Password
                  inputId="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  toggleMask
                  feedback={false}
                  className={fieldErrors.confirmPassword ? "p-invalid" : ""}
                />
                {fieldErrors.confirmPassword && (
                  <small className={styles.errorText}>{fieldErrors.confirmPassword}</small>
                )}
              </div>

              <Button label="Create account" loading={submitting} type="submit" />
            </form>

            <p className={styles.footerLink}>
              Already have an account? <Link href="/login">Log in</Link>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
