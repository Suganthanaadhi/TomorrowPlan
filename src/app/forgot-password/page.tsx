"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "primereact/card";
import { InputText } from "primereact/inputtext";
import { Button } from "primereact/button";
import { Message } from "primereact/message";
import { requestPasswordReset } from "@/lib/api";
import { forgotPasswordSchema } from "@/lib/validation";
import { AuthBrandPanel, MobileAuthBrand } from "@/components/AuthBrand";
import styles from "../auth.module.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = forgotPasswordSchema.safeParse({ email });
    if (!result.success) {
      setFieldError(result.error.issues[0]?.message ?? "Invalid email");
      return;
    }
    setFieldError(null);
    setSubmitting(true);
    try {
      await requestPasswordReset(result.data.email);
    } finally {
      setSubmitting(false);
      setSubmitted(true);
    }
  };

  return (
    <div className={styles.screen}>
      <AuthBrandPanel />
      <div className={styles.formPanel}>
        <div className={styles.card}>
          <MobileAuthBrand />
          <Card
            title="Forgot password"
            subTitle="We'll email you a link to reset it."
          >
            {submitted ? (
              <Message
                severity="info"
                text="If an account exists for that email, a reset link is on its way."
              />
            ) : (
              <form onSubmit={handleSubmit} className={styles.form}>
                <div className={styles.field}>
                  <label htmlFor="email">Email</label>
                  <InputText
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={fieldError ? "p-invalid" : ""}
                  />
                  {fieldError && <small className={styles.errorText}>{fieldError}</small>}
                </div>
                <Button label="Send reset link" loading={submitting} type="submit" />
              </form>
            )}

            <p className={styles.footerLink}>
              <Link href="/login">Back to login</Link>
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
