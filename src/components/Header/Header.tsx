import { Logo } from "@/components/ui";
import styles from "./Header.module.css";

const links = [
  { href: "#coffee", label: "Кофе" },
  { href: "#about", label: "О нас" },
  { href: "#delivery", label: "Доставка" },
];

export function Header() {
  return (
    <header className={`ruled ${styles.header}`}>
      <a href="#top" className={styles.logo} aria-label="Кварта — наверх">
        <Logo />
      </a>
      <nav className={styles.nav} aria-label="Разделы">
        {links.map((link) => (
          <a key={link.href} href={link.href} className={styles.navLink}>
            {link.label}
          </a>
        ))}
      </nav>
      <a href="#order" className={styles.cta}>
        Оставить заявку
      </a>
    </header>
  );
}
