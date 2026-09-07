"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Card } from "primereact/card";
import { Password } from "primereact/password";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { resetPassword } from "@/lib/api";
import { resetPasswordSchema } from "@/lib/validation";
import { AuthBrandPanel, MobileAuthBrand } from "@/components/AuthBrand";
import styles from "../auth.module.css";

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={null}>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const result = resetPasswordSchema.safeParse({ token, password, confirmPassword });
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
      await resetPassword(result.data);
      setDone(true);
      setTimeout(() => router.push("/login"), 1500);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Reset failed");
    } finally {
      setSubmitting(false);
    }
  };

  if (!token) {
    return (
      <div className={styles.screen}>
        <AuthBrandPanel />
        <div className={styles.formPanel}>
          <div className={styles.card}>
            <MobileAuthBrand />
            <Card title="Reset password">
              <Message severity="error" text="This reset link is missing its token." />
              <p className={styles.footerLink}>
                <Link href="/forgot-password">Request a new link</Link>
              </p>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.screen}>
      <AuthBrandPanel />
      <div className={styles.formPanel}>
        <div className={styles.card}>
          <MobileAuthBrand />
          <Card title="Reset password" subTitle="Choose a new password below.">
            {done ? (
              <Message severity="success" text="Password updated — redirecting to login." />
            ) : (
              <form onSubmit={handleSubmit} className={styles.form}>
                {formError && <Message severity="error" text={formError} />}

                <div className={styles.field}>
                  <label htmlFor="password">New password</label>
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
                    <small className={styles.errorText}>
                      {fieldErrors.confirmPassword}
                    </small>
                  )}
                </div>

                <Button label="Update password" loading={submitting} type="submit" />
              </form>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
