import styles from "@/app/auth.module.css";

const FEATURES = [
  { icon: "pi pi-calendar-plus", text: "Plan tomorrow's tasks tonight" },
  { icon: "pi pi-bell", text: "Get reminded when it's time to work" },
  { icon: "pi pi-chart-line", text: "See your completion history on a calendar" },
];

export function AuthBrandPanel() {
  return (
    <div className={styles.brandPanel}>
      <div className={styles.brandLogo}>
        <span className="pi pi-verified" />
        <span>TomorrowPlan</span>
      </div>
      <h1 className={styles.brandTitle}>Plan tomorrow tonight. Work through it today.</h1>
      <p className={styles.brandText}>
        A daily planning ritual: commit to tomorrow&apos;s tasks, get reminded when it
        arrives, then tick, delete, or carry them forward.
      </p>
      <ul className={styles.brandList}>
        {FEATURES.map((f) => (
          <li key={f.text} className={styles.brandListItem}>
            <span className={f.icon} />
            <span>{f.text}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function MobileAuthBrand() {
  return (
    <div className={styles.mobileBrand}>
      <span className="pi pi-verified" />
      <span>TomorrowPlan</span>
    </div>
  );
}
